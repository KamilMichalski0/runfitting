const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisConfig {
  constructor() {
    this.redis = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Skip Redis connection if no configuration is provided
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        logger.info('No Redis configuration found, skipping Redis connection');
        return null;
      }

      let redisConfig;

      if (process.env.REDIS_URL) {
        // Use REDIS_URL as single source of truth
        redisConfig = process.env.REDIS_URL;
        logger.info('Connecting to Redis using REDIS_URL');
      } else {
        // Fallback to individual environment variables for backwards compatibility
        redisConfig = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB) || 0,
        };
        logger.info(`Connecting to Redis at ${redisConfig.host}:${redisConfig.port}`);
      }

      // Common Redis options
      const redisOptions = {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Connection pool settings
        family: 4,
        keepAlive: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // Retry settings
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        // Memory usage optimization
        enableOfflineQueue: false
      };

      // Create Redis instance with URL or config object
      if (typeof redisConfig === 'string') {
        this.redis = new Redis(redisConfig, redisOptions);
      } else {
        this.redis = new Redis({ ...redisConfig, ...redisOptions });
      }

      // Event listeners
      this.redis.on('connect', () => {
        logger.info('Redis connecting...');
      });

      this.redis.on('ready', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
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
      if (!this.redis) return false;
      
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
const redisConfig = new RedisConfig();

module.exports = redisConfig;