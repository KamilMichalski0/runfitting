const logger = require('./logger');

/**
 * Circuit Breaker pattern for Redis operations
 * Prevents cascading failures when Redis is down
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
    this.name = options.name || 'CircuitBreaker';
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute(operation, fallback) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        logger.debug(`${this.name}: Circuit OPEN, using fallback`);
        return fallback ? await fallback() : null;
      } else {
        // Try to transition to HALF_OPEN
        this.state = 'HALF_OPEN';
        logger.info(`${this.name}: Circuit transitioning to HALF_OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      
      if (fallback) {
        logger.debug(`${this.name}: Operation failed, using fallback`);
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info(`${this.name}: Circuit CLOSED after successful operation`);
    }
  }

  /**
   * Handle failed operation
   */
  onFailure(error) {
    this.failureCount++;
    logger.warn(`${this.name}: Failure ${this.failureCount}/${this.failureThreshold} - ${error.message}`);

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.error(`${this.name}: Circuit OPEN for ${this.resetTimeout}ms after ${this.failureCount} failures`);
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null,
      healthCheck: this.state === 'CLOSED'
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
    logger.info(`${this.name}: Circuit manually reset`);
  }

  /**
   * Start monitoring and logging
   */
  startMonitoring() {
    setInterval(() => {
      const status = this.getStatus();
      if (status.state !== 'CLOSED') {
        logger.info(`${this.name}: Circuit Status`, status);
      }
    }, this.monitoringInterval);
  }
}

module.exports = CircuitBreaker;