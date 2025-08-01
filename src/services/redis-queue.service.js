const Queue = require('bull');
const redisConfig = require('../config/redis.config');
const logger = require('../utils/logger');

class RedisQueueService {
  constructor() {
    this.queues = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Connect to Redis
      const redisClient = await redisConfig.connect();
      
      // If Redis is not available, skip queue initialization
      if (!redisClient) {
        logger.info('Redis not available, queue service will not be initialized');
        this.isInitialized = true;
        return;
      }

      // Create training plan generation queue using centralized Redis config
      const redisConnectionConfig = redisConfig.getConnectionConfig();
      
      this.trainingPlanQueue = new Queue('training-plan-generation', {
        redis: redisConnectionConfig,
        defaultJobOptions: {
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 25, // Keep last 25 failed jobs
          attempts: 3, // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 second delay
          },
          // Job timeout: 5 minutes for AI generation
          timeout: 300000,
        },
        settings: {
          stalledInterval: 30000, // Check for stalled jobs every 30s
          maxStalledCount: 1, // Max number of stalled jobs
        }
      });

      // Queue event listeners
      this.trainingPlanQueue.on('ready', () => {
        logger.info('Training plan queue ready');
      });

      this.trainingPlanQueue.on('error', (error) => {
        logger.error('Training plan queue error:', error);
      });

      this.trainingPlanQueue.on('waiting', (jobId) => {
        logger.info(`Job ${jobId} waiting in queue`);
      });

      this.trainingPlanQueue.on('active', (job) => {
        logger.info(`Job ${job.id} started processing`);
      });

      this.trainingPlanQueue.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed successfully`);
      });

      this.trainingPlanQueue.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed:`, err);
      });

      this.trainingPlanQueue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} stalled`);
      });

      this.queues.set('training-plan-generation', this.trainingPlanQueue);
      this.isInitialized = true;
      
      logger.info('Redis queue service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis queue service:', error);
      throw error;
    }
  }

  /**
   * Add training plan generation job to queue
   * @param {string} jobId - Unique job identifier
   * @param {Object} jobData - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Object>} - Bull job object
   */
  async addTrainingPlanJob(jobId, jobData, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If Redis queue is not available, return a mock job object
    if (!this.trainingPlanQueue) {
      logger.warn(`Redis queue not available, job ${jobId} will be processed synchronously`);
      return {
        id: jobId,
        data: jobData,
        opts: options,
        status: 'completed-sync'
      };
    }

    const jobOptions = {
      jobId,
      priority: options.priority || 0, // Higher number = higher priority
      delay: options.delay || 0,
      ...options
    };

    try {
      // Określ typ zadania na podstawie danych
      const jobType = jobData.type === 'weekly_plan_generation' ? 'generate-weekly-plan' : 'generate-training-plan';
      
      const job = await this.trainingPlanQueue.add(
        jobType,
        jobData,
        jobOptions
      );

      logger.info(`${jobType} job ${jobId} added to queue`);
      return job;
    } catch (error) {
      logger.error(`Failed to add job ${jobId} to queue:`, error);
      throw error;
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job identifier
   * @returns {Promise<Object|null>} - Job status or null if not found
   */
  async getJobStatus(jobId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If Redis queue is not available, return a mock status
    if (!this.trainingPlanQueue) {
      return {
        id: jobId,
        status: 'completed',
        progress: 100,
        createdAt: new Date(),
        processedAt: new Date(),
        finishedAt: new Date(),
        failedReason: null,
        attempts: 1,
        maxAttempts: 1,
        data: {}
      };
    }

    try {
      const job = await this.trainingPlanQueue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      
      return {
        id: job.id,
        status: state,
        progress: job.progress() || 0,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        failedReason: job.failedReason || null,
        attempts: job.attemptsMade || 0,
        maxAttempts: job.opts.attempts || 1,
        data: job.data
      };
    } catch (error) {
      logger.error(`Failed to get job status for ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job identifier
   * @returns {Promise<boolean>} - Success status
   */
  async cancelJob(jobId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const job = await this.trainingPlanQueue.getJob(jobId);
      if (!job) return false;

      const state = await job.getState();
      if (state === 'completed' || state === 'failed') {
        return false; // Can't cancel completed or failed jobs
      }

      await job.remove();
      logger.info(`Job ${jobId} cancelled successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get queue statistics
   * @returns {Promise<Object>} - Queue statistics
   */
  async getQueueStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.trainingPlanQueue.getWaiting(),
        this.trainingPlanQueue.getActive(),
        this.trainingPlanQueue.getCompleted(),
        this.trainingPlanQueue.getFailed(),
        this.trainingPlanQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        error: error.message
      };
    }
  }

  /**
   * Clean old jobs from queue
   * @param {number} grace - Grace period in milliseconds
   * @returns {Promise<void>}
   */
  async cleanOldJobs(grace = 24 * 60 * 60 * 1000) { // 24 hours
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.trainingPlanQueue.clean(grace, 'completed');
      await this.trainingPlanQueue.clean(grace, 'failed');
      logger.info('Old jobs cleaned from queue');
    } catch (error) {
      logger.error('Failed to clean old jobs:', error);
    }
  }

  /**
   * Pause the queue
   * @returns {Promise<void>}
   */
  async pauseQueue() {
    if (!this.isInitialized) return;

    try {
      await this.trainingPlanQueue.pause();
      logger.info('Queue paused');
    } catch (error) {
      logger.error('Failed to pause queue:', error);
    }
  }

  /**
   * Resume the queue
   * @returns {Promise<void>}
   */
  async resumeQueue() {
    if (!this.isInitialized) return;

    try {
      await this.trainingPlanQueue.resume();
      logger.info('Queue resumed');
    } catch (error) {
      logger.error('Failed to resume queue:', error);
    }
  }

  /**
   * Get the queue instance (for advanced operations)
   * @returns {Queue} - Bull queue instance
   */
  getQueue() {
    return this.trainingPlanQueue;
  }

  /**
   * Shutdown the queue service
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (!this.isInitialized) return;

    try {
      await this.trainingPlanQueue.close();
      await redisConfig.disconnect();
      this.isInitialized = false;
      logger.info('Redis queue service shutdown complete');
    } catch (error) {
      logger.error('Failed to shutdown queue service:', error);
    }
  }
}

// Singleton instance
const redisQueueService = new RedisQueueService();

module.exports = redisQueueService;