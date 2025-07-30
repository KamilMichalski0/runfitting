const redisQueueService = require('./redis-queue.service');
const GeminiService = require('./gemini.service');
const TrainingFormSubmission = require('../models/running-form.model');
const TrainingPlan = require('../models/training-plan.model');
const runningKnowledgeBase = require('../knowledge/running-knowledge-base');
const correctiveExercisesKnowledgeBase = require('../knowledge/corrective-knowledge-base');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class AIJobService {
  constructor() {
    this.geminiService = new GeminiService(runningKnowledgeBase, correctiveExercisesKnowledgeBase);
  }

  /**
   * Dodaje zadanie generowania planu treningowego do kolejki Redis
   * @param {string} formId - ID formularza
   * @param {string} userId - ID użytkownika
   * @param {Object} options - Opcje zadania (priority, delay)
   * @returns {Promise<string>} - ID zadania
   */
  async queueTrainingPlanGeneration(formId, userId, options = {}) {
    const jobId = `plan_generation_${formId}_${Date.now()}`;
    
    const jobData = {
      formId,
      userId,
      type: 'training_plan_generation',
      timestamp: Date.now()
    };

    // Dodaj zadanie do Redis queue
    const job = await redisQueueService.addTrainingPlanJob(jobId, jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
    
    logger.info(`Dodano zadanie generowania planu do Redis queue: ${jobId}`);
    return jobId;
  }

  /**
   * Przetwarza zadanie generowania planu treningowego
   * @param {Object} jobData - Dane zadania
   * @returns {Promise<Object>} - Wynik przetwarzania
   */
  async processTrainingPlanGeneration(jobData) {
    const { formId, userId } = jobData;
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // Pobierz formularz
        const runningForm = await TrainingFormSubmission.findById(formId).session(session);
        if (!runningForm) {
          throw new Error(`Formularz ${formId} nie został znaleziony`);
        }

        // Aktualizuj status na "processing"
        runningForm.status = 'processing';
        await runningForm.save({ session });

        // Generuj plan treningowy
        logger.info(`Rozpoczęto generowanie planu dla formularza: ${formId}`);
        const planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());

        // Zapisz plan treningowy
        const trainingPlan = new TrainingPlan({
          ...planData,
          userId
        });
        await trainingPlan.save({ session });

        // Aktualizuj formularz
        runningForm.status = 'wygenerowany';
        runningForm.planId = trainingPlan._id;
        await runningForm.save({ session });

        logger.info(`Ukończono generowanie planu dla formularza: ${formId}`);
        
        return {
          planId: trainingPlan._id,
          formId: runningForm._id,
          status: 'completed'
        };
      });
    } catch (error) {
      // W przypadku błędu, zaktualizuj status formularza
      try {
        await TrainingFormSubmission.findByIdAndUpdate(formId, { 
          status: 'failed',
          error: error.message 
        });
      } catch (updateError) {
        logger.error('Błąd podczas aktualizacji statusu formularza:', updateError);
      }
      
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Pobiera status zadania generowania planu
   * @param {string} jobId - ID zadania
   * @returns {Promise<Object|null>} - Status zadania
   */
  async getJobStatus(jobId) {
    return await redisQueueService.getJobStatus(jobId);
  }

  /**
   * Pobiera statystyki kolejki AI
   * @returns {Promise<Object>} - Statystyki kolejki
   */
  async getQueueStats() {
    return await redisQueueService.getQueueStats();
  }

  /**
   * Anuluje zadanie generowania planu
   * @param {string} jobId - ID zadania
   * @returns {Promise<boolean>} - true jeśli zadanie zostało anulowane
   */
  async cancelJob(jobId) {
    return await redisQueueService.cancelJob(jobId);
  }

  /**
   * Inicjalizuje service i worker processy
   * @returns {Promise<void>}
   */
  async initialize() {
    await redisQueueService.initialize();
    
    // Zarejestruj processor dla zadań generowania planów
    const queue = redisQueueService.getQueue();
    queue.process('generate-training-plan', 5, async (job) => {
      return await this.processTrainingPlanGeneration(job.data);
    });
    
    logger.info('AI Job Service initialized with Redis queue');
  }

  /**
   * Graceful shutdown
   * @returns {Promise<void>}
   */
  async shutdown() {
    await redisQueueService.shutdown();
    logger.info('AI Job Service shutdown complete');
  }
}

module.exports = new AIJobService();