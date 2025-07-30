const EventEmitter = require('events');
const logger = require('../utils/logger');

class QueueService extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.processing = false;
    this.queue = [];
    this.maxConcurrent = 3; // Maksymalna liczba jednoczesnych zadań AI
    this.activeJobs = 0;
  }

  /**
   * Dodaje zadanie do kolejki
   * @param {string} jobId - Unikalny identyfikator zadania
   * @param {Object} jobData - Dane zadania
   * @param {Function} processor - Funkcja przetwarzająca zadanie
   * @returns {Promise} - Promise który resolve'uje się gdy zadanie zostanie ukończone
   */
  async addJob(jobId, jobData, processor) {
    return new Promise((resolve, reject) => {
      const job = {
        id: jobId,
        data: jobData,
        processor,
        resolve,
        reject,
        status: 'pending',
        createdAt: new Date(),
        startedAt: null,
        completedAt: null
      };

      this.jobs.set(jobId, job);
      this.queue.push(job);
      
      logger.info(`Dodano zadanie do kolejki: ${jobId}`);
      this.emit('jobAdded', job);
      
      // Uruchom przetwarzanie kolejki
      this.processQueue();
    });
  }

  /**
   * Pobiera status zadania
   * @param {string} jobId - Identyfikator zadania
   * @returns {Object|null} - Status zadania lub null jeśli nie istnieje
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      progress: job.progress || 0
    };
  }

  /**
   * Przetwarza kolejkę zadań
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0 || this.activeJobs >= this.maxConcurrent) {
      return;
    }

    this.processing = true;
    
    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const job = this.queue.shift();
      this.processJob(job);
    }

    this.processing = false;
  }

  /**
   * Przetwarza pojedyncze zadanie
   * @param {Object} job - Zadanie do przetworzenia
   */
  async processJob(job) {
    this.activeJobs++;
    job.status = 'processing';
    job.startedAt = new Date();
    
    logger.info(`Rozpoczęto przetwarzanie zadania: ${job.id}`);
    this.emit('jobStarted', job);

    try {
      const result = await job.processor(job.data);
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      logger.info(`Ukończono zadanie: ${job.id}`);
      this.emit('jobCompleted', job);
      
      job.resolve(result);
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      
      logger.error(`Błąd w zadaniu ${job.id}:`, error);
      this.emit('jobFailed', job);
      
      job.reject(error);
    } finally {
      this.activeJobs--;
      
      // Usuń zadanie z mapy po 1 godzinie
      setTimeout(() => {
        this.jobs.delete(job.id);
      }, 3600000); // 1 godzina
      
      // Kontynuuj przetwarzanie kolejki
      this.processQueue();
    }
  }

  /**
   * Anuluje zadanie
   * @param {string} jobId - Identyfikator zadania
   * @returns {boolean} - true jeśli zadanie zostało anulowane
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') {
      return false;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    
    // Usuń z kolejki
    const queueIndex = this.queue.indexOf(job);
    if (queueIndex > -1) {
      this.queue.splice(queueIndex, 1);
    }
    
    logger.info(`Anulowano zadanie: ${jobId}`);
    this.emit('jobCancelled', job);
    
    job.reject(new Error('Zadanie zostało anulowane'));
    return true;
  }

  /**
   * Pobiera statystyki kolejki
   * @returns {Object} - Statystyki kolejki
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalJobs: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Singleton instance
const queueService = new QueueService();

module.exports = queueService;