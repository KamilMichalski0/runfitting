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
        console.log(`⚡ [REDIS-QUEUE] Job ${job.id} started processing type: ${job.name}`);
        logger.info(`Job ${job.id} started processing`);
      });

      this.trainingPlanQueue.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed successfully`);
      });

      this.trainingPlanQueue.on('failed', (job, err) => {
        console.log(`❌ [REDIS-QUEUE] Job ${job.id} failed with error:`, err.message);
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

    // If Redis queue is not available, process synchronously
    if (!this.trainingPlanQueue) {
      logger.warn(`Redis queue not available, processing job ${jobId} synchronously`);
      
      // Simulate job processing synchronously
      try {
        // Store job for synchronous processing - will be handled by callback
        // Store in a simple in-memory map for now
        if (!this.syncJobs) this.syncJobs = new Map();
        
        this.syncJobs.set(jobId, {
          id: jobId,
          data: jobData,
          type: jobData.type,
          timestamp: Date.now(),
          status: 'pending'
        });
        
        // Process immediately in background
        setImmediate(async () => {
          try {
            // Use callback-based processing to avoid circular dependency
            if (this.syncProcessor) {
              const result = await this.syncProcessor(jobData);
              if (this.syncJobs.has(jobId)) {
                const job = this.syncJobs.get(jobId);
                job.status = 'completed';
                job.result = result;
                // Extract planId from result if available
                if (result && result._id) {
                  job.planId = result._id;
                }
              }
              logger.info(`Synchronously processed job: ${jobId}`);
            } else {
              logger.warn(`No sync processor registered for job: ${jobId}`);
              if (this.syncJobs.has(jobId)) {
                this.syncJobs.get(jobId).status = 'failed';
                this.syncJobs.get(jobId).error = 'No sync processor available';
              }
            }
          } catch (error) {
            logger.error(`Error in synchronous processing: ${jobId}`, error);
            if (this.syncJobs.has(jobId)) {
              this.syncJobs.get(jobId).status = 'failed';
              this.syncJobs.get(jobId).error = error.message;
            }
          }
        });
        
        return {
          id: jobId,
          data: jobData,
          opts: options,
          status: 'queued-sync'
        };
      } catch (error) {
        logger.error(`Failed to process job synchronously: ${jobId}`, error);
        return {
          id: jobId,
          data: jobData,
          opts: options,
          status: 'failed-sync',
          error: error.message
        };
      }
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
      
      console.log(`🔥 [REDIS-QUEUE] Adding job type: ${jobType} for jobData.type: ${jobData.type}`);
      
      const job = await this.trainingPlanQueue.add(
        jobType,
        jobData,
        jobOptions
      );

      console.log(`✅ [REDIS-QUEUE] Job added successfully: ${jobType} with id: ${job.id}`);
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

    console.log(`🔍 [REDIS-QUEUE] Checking job status for: ${jobId}`);

    // If Redis queue is not available, check synchronous job status
    if (!this.trainingPlanQueue) {
      const syncJob = this.getSyncJobStatus(jobId);
      
      if (syncJob) {
        // Calculate realistic progress for sync jobs
        const timeElapsed = Date.now() - syncJob.timestamp;
        const expectedDuration = 30000; // 30 seconds expected
        const progressFromTime = Math.min((timeElapsed / expectedDuration) * 100, 95);
        
        let status, progress;
        if (syncJob.status === 'completed') {
          status = 'completed';
          progress = 100;
        } else if (syncJob.status === 'failed') {
          status = 'failed'; 
          progress = 0;
        } else if (syncJob.status === 'pending') {
          status = 'processing';
          progress = Math.max(progressFromTime, 10); // At least 10% progress
        } else {
          status = 'waiting';
          progress = 5;
        }
        
        return {
          id: jobId,
          status: status,
          progress: Math.round(progress),
          createdAt: new Date(syncJob.timestamp),
          processedAt: syncJob.status !== 'pending' ? new Date(syncJob.timestamp + 1000) : null,
          finishedAt: syncJob.status === 'completed' ? new Date() : null,
          failedReason: syncJob.error || null,
          attempts: 1,
          data: syncJob.data,
          returnValue: syncJob.result || null,
          result: syncJob.status === 'completed' && syncJob.planId ? { 
            planId: syncJob.planId 
          } : null
        };
      }
      
      // Job not found in sync jobs - return not found status
      return null;
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
   * Register synchronous processor for when Redis is not available
   * @param {Function} processor - Function to process jobs synchronously
   */
  setSyncProcessor(processor) {
    this.syncProcessor = processor;
    logger.info('Synchronous job processor registered');
  }

  /**
   * Get status of synchronous job
   * @param {string} jobId - Job ID
   * @returns {Object|null} - Job status or null if not found
   */
  getSyncJobStatus(jobId) {
    if (!this.syncJobs) return null;
    return this.syncJobs.get(jobId) || null;
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