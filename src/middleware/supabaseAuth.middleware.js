const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const redisConfig = require('../config/redis.config');
const CircuitBreaker = require('../utils/circuit-breaker');

if (!process.env.SUPABASE_JWT_SECRET) {
  logger.error('BŁĄD: Brak zmiennej środowiskowej SUPABASE_JWT_SECRET');
  process.exit(1);
}

/**
 * Production-ready Authentication Service with Redis Session Cache
 * Handles multiple instances with consistent session management
 */
class AuthenticationService {
  constructor() {
    this.redis = null;
    this.cacheEnabled = false;
    this.instanceId = process.env.INSTANCE_ID || require('crypto').randomBytes(4).toString('hex');
    this.metrics = {
      authSuccesses: 0,
      authFailures: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      circuitBreakerTrips: 0
    };
    
    // Initialize circuit breaker for Redis operations
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      monitoringInterval: 60000, // 1 minute
      name: `Redis-Auth-${this.instanceId}`
    });

    // Monitor circuit breaker state changes
    this.setupCircuitBreakerMonitoring();
    
    this.initializeCache();
  }

  async initializeCache() {
    try {
      this.redis = redisConfig.getClient();
      if (this.redis) {
        this.cacheEnabled = true;
        logger.info(`Authentication cache enabled with Redis - Instance: ${this.instanceId}`);
      } else {
        logger.warn(`Redis unavailable, using stateless auth - Instance: ${this.instanceId}`);
      }
    } catch (error) {
      logger.warn(`Redis initialization failed, falling back to stateless auth - Instance: ${this.instanceId}:`, error.message);
      this.cacheEnabled = false;
    }
  }

  /**
   * Setup circuit breaker monitoring for metrics
   */
  setupCircuitBreakerMonitoring() {
    // Track circuit breaker state changes for metrics
    const originalOnFailure = this.circuitBreaker.onFailure.bind(this.circuitBreaker);
    this.circuitBreaker.onFailure = (error) => {
      originalOnFailure(error);
      if (this.circuitBreaker.state === 'OPEN') {
        this.metrics.circuitBreakerTrips++;
      }
    };
  }

  /**
   * Generate cache key for token
   */
  generateCacheKey(tokenHash) {
    return `auth:session:${tokenHash}`;
  }

  /**
   * Hash token for cache key (security & length optimization)
   */
  hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * Get cached session data with circuit breaker protection
   */
  async getCachedSession(token) {
    if (!this.cacheEnabled) return null;

    const tokenHash = this.hashToken(token);
    const cacheKey = this.generateCacheKey(tokenHash);

    const redisOperation = async () => {
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const session = JSON.parse(cached);
        this.metrics.cacheHits++;
        logger.debug(`Cache hit for token ${tokenHash} - Instance: ${this.instanceId}`);
        return session;
      }
      
      this.metrics.cacheMisses++;
      logger.debug(`Cache miss for token ${tokenHash} - Instance: ${this.instanceId}`);
      return null;
    };

    const fallback = () => {
      this.metrics.cacheMisses++;
      logger.debug(`Cache fallback (circuit open) for token ${tokenHash} - Instance: ${this.instanceId}`);
      return null;
    };

    try {
      return await this.circuitBreaker.execute(redisOperation, fallback);
    } catch (error) {
      logger.warn(`Cache read error - Instance: ${this.instanceId}:`, error.message);
      return null;
    }
  }

  /**
   * Cache session data with TTL and circuit breaker protection
   */
  async setCachedSession(token, sessionData, ttlSeconds = 3600) {
    if (!this.cacheEnabled) return;

    const tokenHash = this.hashToken(token);
    const cacheKey = this.generateCacheKey(tokenHash);

    // Add cache metadata
    const cacheData = {
      ...sessionData,
      _cache: {
        instanceId: this.instanceId,
        cachedAt: Date.now(),
        ttl: ttlSeconds
      }
    };

    const redisOperation = async () => {
      await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(cacheData));
      logger.debug(`Cached session for token ${tokenHash}, TTL: ${ttlSeconds}s - Instance: ${this.instanceId}`);
    };

    const fallback = () => {
      logger.debug(`Cache write fallback (circuit open) for token ${tokenHash} - Instance: ${this.instanceId}`);
      // No need to throw error - gracefully continue without caching
    };

    try {
      await this.circuitBreaker.execute(redisOperation, fallback);
    } catch (error) {
      logger.warn(`Cache write error - Instance: ${this.instanceId}:`, error.message);
    }
  }

  /**
   * Invalidate cached session with circuit breaker protection
   */
  async invalidateCachedSession(token) {
    if (!this.cacheEnabled) return;

    const tokenHash = this.hashToken(token);
    const cacheKey = this.generateCacheKey(tokenHash);

    const redisOperation = async () => {
      await this.redis.del(cacheKey);
      logger.debug(`Invalidated cache for token ${tokenHash} - Instance: ${this.instanceId}`);
    };

    const fallback = () => {
      logger.debug(`Cache invalidation fallback (circuit open) for token ${tokenHash} - Instance: ${this.instanceId}`);
      // Gracefully continue - if Redis is down, cache will expire naturally
    };

    try {
      await this.circuitBreaker.execute(redisOperation, fallback);
    } catch (error) {
      logger.warn(`Cache invalidation error - Instance: ${this.instanceId}:`, error.message);
    }
  }

  /**
   * Main authentication method with caching
   */
  async verifyAndCacheToken(token) {
    this.metrics.totalRequests++;

    // 1. Try cache first
    const cached = await this.getCachedSession(token);
    if (cached) {
      // Remove cache metadata from returned data
      const { _cache, ...sessionData } = cached;
      return sessionData;
    }

    // 2. Verify token (cache miss)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
        algorithms: ['HS256']
      });
    } catch (jwtError) {
      // Invalid token - don't cache
      this.metrics.authFailures++;
      throw jwtError;
    }

    // 3. Get or create MongoDB user
    let user;
    try {
      user = await User.findOne({ supabaseId: decoded.sub });

      if (!user) {
        logger.info(`Creating new MongoDB user for Supabase ID: ${decoded.sub} - Instance: ${this.instanceId}`);
        
        const userData = {
          supabaseId: decoded.sub,
          email: decoded.email,
          name: decoded.user_metadata?.full_name || decoded.email.split('@')[0],
          notificationPreferences: {
            channels: {
              email: {
                enabled: true,
                verified: decoded.email_verified || false
              },
              push: {
                enabled: true,
                subscriptions: []
              }
            }
          }
        };

        user = await User.create(userData);
        logger.info(`Created new MongoDB user: ${user._id} - Instance: ${this.instanceId}`);
      }
    } catch (dbError) {
      this.metrics.authFailures++;
      logger.error(`Database error during user lookup/creation - Instance: ${this.instanceId}:`, dbError);
      throw new Error('Database error during authentication');
    }

    // 4. Prepare session data (minimize cached data size)
    const sessionData = {
      ...decoded,
      _id: user._id,
      mongoUser: {
        _id: user._id,
        supabaseId: user.supabaseId,
        email: user.email,
        name: user.name,
        hasFilledRunningForm: user.hasFilledRunningForm || false
        // Only essential data - not full user object
      }
    };

    // 5. Calculate TTL based on token expiration
    const now = Math.floor(Date.now() / 1000);
    const tokenTtl = decoded.exp - now;
    const cacheTtl = Math.min(Math.max(tokenTtl, 300), 3600); // Min 5min, Max 1h

    // 6. Cache session
    await this.setCachedSession(token, sessionData, cacheTtl);

    this.metrics.authSuccesses++;
    return sessionData;
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.authSuccesses / this.metrics.totalRequests * 100).toFixed(2)
      : '0.00';
    
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2)
      : '0.00';

    return {
      instanceId: this.instanceId,
      cacheEnabled: this.cacheEnabled,
      successRate: `${successRate}%`,
      cacheHitRate: `${cacheHitRate}%`,
      circuitBreaker: this.circuitBreaker.getStatus(),
      ...this.metrics
    };
  }

  /**
   * Reset metrics (called periodically)
   */
  resetMetrics() {
    this.metrics = {
      authSuccesses: 0,
      authFailures: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      circuitBreakerTrips: 0
    };
  }
}

// Singleton instance
const authService = new AuthenticationService();

// Report metrics every 5 minutes
setInterval(() => {
  const metrics = authService.getMetrics();
  logger.info('Authentication Metrics', metrics);
  authService.resetMetrics();
}, 300000);

/**
 * Express middleware for authentication with Redis caching
 */
module.exports = async (req, res, next) => {
  // Add instance ID to response headers for debugging
  res.setHeader('X-Instance-ID', authService.instanceId);
  res.setHeader('X-Cache-Enabled', authService.cacheEnabled ? '1' : '0');

  // Skip authorization for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.debug(`Missing authorization header - Instance: ${authService.instanceId}`);
    return res.status(401).json({ error: 'Brak tokena autoryzacyjnego' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const sessionData = await authService.verifyAndCacheToken(token);
    req.user = sessionData;
    
    logger.debug(`Authenticated user: ${sessionData.sub} - Instance: ${authService.instanceId}`);
    next();
  } catch (err) {
    logger.error(`Token verification failed - Instance: ${authService.instanceId}:`, {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt
    });

    // Invalidate cache on error
    await authService.invalidateCachedSession(token).catch(() => {});

    return res.status(401).json({ 
      error: 'Nieprawidłowy lub wygasły token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Export auth service for testing and metrics
module.exports.authService = authService;
