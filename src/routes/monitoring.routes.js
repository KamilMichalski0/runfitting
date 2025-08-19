const express = require('express');
const router = express.Router();
const redisConfig = require('../config/redis.config');
const { authService } = require('../middleware/supabaseAuth.middleware');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: Monitoring
 *   description: Instance monitoring and health checks
 */

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Comprehensive health check
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 instance:
 *                   type: object
 *                 redis:
 *                   type: object
 *                 auth:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get('/health', async (req, res) => {
  try {
    const instanceId = process.env.INSTANCE_ID || require('crypto').randomBytes(4).toString('hex');
    
    // Check Redis health
    const redisHealth = await redisConfig.healthCheck();
    
    // Get authentication metrics
    const authMetrics = authService ? authService.getMetrics() : { error: 'Auth service unavailable' };
    
    // Check database connectivity
    const mongoose = require('mongoose');
    const dbHealth = {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
    
    // Determine overall health status
    let overallStatus = 'healthy';
    if (!redisHealth.healthy && redisHealth.error !== 'No Redis client') {
      overallStatus = 'degraded'; // Can work without Redis but performance affected
    }
    if (!dbHealth.connected) {
      overallStatus = 'unhealthy'; // Cannot work without database
    }
    
    res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
      status: overallStatus,
      instance: {
        id: instanceId,
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        loadAverage: require('os').loadavg()
      },
      redis: redisHealth,
      database: dbHealth,
      auth: authMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/monitoring/redis-info:
 *   get:
 *     summary: Detailed Redis connection information
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Redis connection details
 */
router.get('/redis-info', async (req, res) => {
  try {
    const connectionInfo = await redisConfig.getConnectionInfo();
    
    res.json({
      success: true,
      data: connectionInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Redis info error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/monitoring/auth-metrics:
 *   get:
 *     summary: Authentication service metrics
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Authentication metrics
 */
router.get('/auth-metrics', (req, res) => {
  try {
    const metrics = authService ? authService.getMetrics() : null;
    
    if (!metrics) {
      return res.status(503).json({
        success: false,
        error: 'Authentication service not available'
      });
    }
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Auth metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/monitoring/cache-stats:
 *   get:
 *     summary: Cache performance statistics
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Cache statistics
 */
router.get('/cache-stats', async (req, res) => {
  try {
    const redis = redisConfig.getClient();
    
    if (!redis) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          message: 'Redis cache not available - using stateless auth'
        }
      });
    }
    
    // Get Redis stats
    const info = await redis.info('stats');
    const memory = await redis.info('memory');
    
    // Parse the info strings
    const statsInfo = redisConfig.parseRedisInfo(info);
    const memoryInfo = redisConfig.parseRedisInfo(memory);
    
    // Calculate cache-specific metrics
    const authMetrics = authService.getMetrics();
    
    res.json({
      success: true,
      data: {
        enabled: true,
        redis: {
          totalCommandsProcessed: statsInfo.total_commands_processed,
          totalConnectionsReceived: statsInfo.total_connections_received,
          usedMemory: memoryInfo.used_memory,
          usedMemoryHuman: memoryInfo.used_memory_human,
          keyspaceHits: statsInfo.keyspace_hits,
          keyspaceMisses: statsInfo.keyspace_misses
        },
        auth: authMetrics
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/monitoring/cache-clear:
 *   post:
 *     summary: Clear authentication cache (admin only)
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       503:
 *         description: Redis not available
 */
router.post('/cache-clear', async (req, res) => {
  try {
    const redis = redisConfig.getClient();
    
    if (!redis) {
      return res.status(503).json({
        success: false,
        error: 'Redis not available'
      });
    }
    
    // Clear all auth session keys
    const keys = await redis.keys('auth:session:*');
    
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} authentication cache entries`);
    }
    
    res.json({
      success: true,
      message: `Cleared ${keys.length} cache entries`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;