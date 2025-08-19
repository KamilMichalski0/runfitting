const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisConfig {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.isReconnecting = false;
  }

  async connect() {
    try {
      // Skip Redis connection if no configuration is provided
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        logger.info('No Redis configuration found, skipping Redis connection');
        return null;
      }

      this.connectionAttempts++;
      
      let redisConfig;

      if (process.env.REDIS_URL) {
        // Use REDIS_URL as single source of truth
        redisConfig = process.env.REDIS_URL;
        logger.info(`Connecting to Redis using REDIS_URL (attempt ${this.connectionAttempts})`);
      } else {
        // Fallback to individual environment variables for backwards compatibility
        redisConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB) || 0,
        };
        logger.info(`Connecting to Redis at ${redisConfig.host}:${redisConfig.port} (attempt ${this.connectionAttempts})`);
      }

      // Production-optimized Redis options
      const redisOptions = {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        
        // Connection settings optimized for multiple instances
        family: 4,
        keepAlive: true,
        connectTimeout: 5000,        // Faster connection timeout
        commandTimeout: 3000,        // Faster command timeout
        
        // Retry settings with exponential backoff
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        
        // Memory usage optimization for high throughput
        enableOfflineQueue: false,   // Fail fast when disconnected
        
        // Connection pooling for production
        enableReadyCheck: true,
        maxRetriesPerRequest: 2,     // Reduced for faster failover
        
        // Production retry strategy
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          logger.warn(`Redis retry attempt ${times}, delay: ${delay}ms`);
          return delay;
        },
        
        // Additional production settings
        lazyConnect: true,
        keepAlive: 30000,           // 30 second keepalive
        connectionName: `auth-cache-${process.env.INSTANCE_ID || 'unknown'}`,
        
        // Compression for large session data
        compression: 'gzip'
      };

      // Create Redis instance with URL or config object
      if (typeof redisConfig === 'string') {
        this.redis = new Redis(redisConfig, redisOptions);
      } else {
        this.redis = new Redis({ ...redisConfig, ...redisOptions });
      }

      // Enhanced event listeners for production monitoring
      this.redis.on('connect', () => {
        logger.info(`Redis connecting... (Instance: ${process.env.INSTANCE_ID || 'unknown'})`);
      });

      this.redis.on('ready', () => {
        logger.info(`Redis connected successfully (Instance: ${process.env.INSTANCE_ID || 'unknown'})`);
        this.isConnected = true;
        this.connectionAttempts = 0; // Reset attempts on successful connection
        this.isReconnecting = false;
      });

      this.redis.on('error', (err) => {
        logger.error(`Redis connection error (Instance: ${process.env.INSTANCE_ID || 'unknown'}):`, {
          message: err.message,
          code: err.code,
          errno: err.errno,
          attempts: this.connectionAttempts
        });
        this.isConnected = false;
        
        // Stop retrying after max attempts
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          logger.error(`Max Redis connection attempts reached (${this.maxConnectionAttempts}), giving up`);
          this.redis = null;
        }
      });

      this.redis.on('close', () => {
        logger.warn(`Redis connection closed (Instance: ${process.env.INSTANCE_ID || 'unknown'})`);
        this.isConnected = false;
      });

      this.redis.on('reconnecting', (delay) => {
        if (!this.isReconnecting) {
          this.isReconnecting = true;
          logger.info(`Redis reconnecting in ${delay}ms... (Instance: ${process.env.INSTANCE_ID || 'unknown'})`);
        }
      });

      this.redis.on('end', () => {
        logger.warn(`Redis connection ended (Instance: ${process.env.INSTANCE_ID || 'unknown'})`);
        this.isConnected = false;
      });

      // Connect to Redis
      await this.redis.connect();
      
      return this.redis;
    } catch (error) {
      logger.warn('Failed to connect to Redis, continuing without Redis:', error.message);
      this.redis = null;
      this.isConnected = false;
      return null;
    }
  }

  getClient() {
    if (!this.redis || !this.isConnected) {
      // Don't spam logs if Redis is intentionally disabled
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        logger.warn('Redis client not connected, returning null');
      }
      return null;
    }
    return this.redis;
  }

  getConnectionConfig() {
    if (process.env.REDIS_URL) {
      return process.env.REDIS_URL;
    } else {
      return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
      };
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  async healthCheck() {
    try {
      if (!this.redis) return { healthy: false, error: 'No Redis client' };
      
      const start = Date.now();
      const result = await this.redis.ping();
      const latency = Date.now() - start;
      
      const isHealthy = result === 'PONG';
      
      return {
        healthy: isHealthy,
        latency,
        connected: this.isConnected,
        connectionAttempts: this.connectionAttempts,
        instanceId: process.env.INSTANCE_ID || 'unknown'
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { 
        healthy: false, 
        error: error.message,
        connected: this.isConnected,
        connectionAttempts: this.connectionAttempts
      };
    }
  }

  /**
   * Get Redis connection info and stats
   */
  async getConnectionInfo() {
    try {
      if (!this.redis || !this.isConnected) {
        return {
          connected: false,
          error: 'Redis not connected'
        };
      }

      const info = await this.redis.info('server');
      const memory = await this.redis.info('memory');
      const stats = await this.redis.info('stats');

      return {
        connected: this.isConnected,
        connectionAttempts: this.connectionAttempts,
        serverInfo: this.parseRedisInfo(info),
        memoryInfo: this.parseRedisInfo(memory),
        statsInfo: this.parseRedisInfo(stats)
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Redis INFO command output
   */
  parseRedisInfo(infoString) {
    const lines = infoString.split('\r\n');
    const info = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#') && line.includes(':')) {
        const [key, value] = line.split(':');
        info[key] = isNaN(value) ? value : Number(value);
      }
    });
    
    return info;
  }

  /**
   * Attempt to reconnect Redis manually
   */
  async forceReconnect() {
    try {
      if (this.redis) {
        await this.disconnect();
      }
      
      logger.info('Attempting manual Redis reconnection...');
      return await this.connect();
    } catch (error) {
      logger.error('Force reconnect failed:', error);
      throw error;
    }
  }
}

// Singleton instance
const redisConfig = new RedisConfig();

module.exports = redisConfig;