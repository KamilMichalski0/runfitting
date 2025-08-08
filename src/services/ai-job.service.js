const redisQueueService = require('./redis-queue.service');
const GeminiService = require('./gemini.service');
const TrainingFormSubmission = require('../models/running-form.model');
const TrainingPlan = require('../models/training-plan.model');
const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
const runningKnowledgeBase = require('../knowledge/running-knowledge-base');
const correctiveExercisesKnowledgeBase = require('../knowledge/corrective-knowledge-base');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const sseNotificationService = require('./sse-notification.service');

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
        delay: 10000 // 10 sekund, potem 20s, 40s
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
   * Dodaje zadanie generowania planu tygodniowego do kolejki Redis
   * @param {string} userId - ID użytkownika
   * @param {string} scheduleId - ID harmonogramu
   * @param {Object} planData - Dane do generowania planu
   * @param {Object} options - Opcje zadania
   * @returns {Promise<string>} - ID zadania
   */
  async queueWeeklyPlanGeneration(userId, scheduleId, planData, options = {}) {
    const jobId = `weekly_plan_${userId}_${Date.now()}`;
    
    const jobData = {
      userId,
      scheduleId,
      planData,
      type: 'weekly_plan_generation',
      timestamp: Date.now()
    };

    // Dodaj zadanie do Redis queue
    const job = await redisQueueService.addTrainingPlanJob(jobId, jobData, {
      priority: options.priority || 1, // Wyższy priorytet dla planów tygodniowych
      delay: options.delay || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000 // 10 sekund, potem 20s, 40s
      }
    });
    
    logger.info(`Dodano zadanie generowania planu tygodniowego do kolejki: ${jobId}`);
    
    // Wyślij powiadomienie SSE o rozpoczęciu
    sseNotificationService.notifyPlanGenerationStarted(jobId, userId, jobData);
    
    return jobId;
  }

  /**
   * Przetwarza zadanie generowania planu tygodniowego
   * @param {Object} jobData - Dane zadania
   * @returns {Promise<Object>} - Wynik przetwarzania
   */
  async processWeeklyPlanGeneration(jobData) {
    const { userId, scheduleId, planData } = jobData;
    const WeeklyPlanDeliveryService = require('./weekly-plan-delivery.service');
    const weeklyService = new WeeklyPlanDeliveryService();
    
    try {
      console.log(`🚀 [AI-JOB-SERVICE] STARTING WEEKLY PLAN GENERATION for user: ${userId}`);
      logger.info(`Rozpoczęto generowanie planu tygodniowego dla użytkownika: ${userId}`);
      
      // DEBUG: Sprawdź jakie dane przychodzą do AI Job Service
      logger.info(`AI Job Service - otrzymane dane`, {
        userId,
        scheduleId,
        planData: planData ? Object.keys(planData) : null,
        planData_resetToWeekOne: planData?.resetToWeekOne,
        planData_mockSchedule: planData?.mockSchedule ? 'present' : 'not present',
        jobData_keys: Object.keys(jobData)
      });
      
      // Wyślij powiadomienie o rozpoczęciu przetwarzania
      if (jobData.jobId) {
        sseNotificationService.notifyPlanGenerationProgress(jobData.jobId, 10, 'Przygotowywanie danych...');
      }
      
      // Pobierz harmonogram - zawsze powinien być podany scheduleId
      let schedule = null;
      if (scheduleId) {
        schedule = await WeeklyPlanSchedule.findById(scheduleId);
        if (!schedule) {
          throw new Error(`Harmonogram ${scheduleId} nie został znaleziony`);
        }
        logger.info(`Pobrany harmonogram z scheduleId`, {
          scheduleId,
          schedule_userProfile_dniTreningowe: schedule.userProfile?.dniTreningowe,
          schedule_userProfile_trainingDays: schedule.userProfile?.trainingDays,
          hasUserProfile: !!schedule.userProfile,
          userProfileKeys: schedule.userProfile ? Object.keys(schedule.userProfile) : []
        });
      } else {
        // Fallback - spróbuj pobrać aktywny harmonogram użytkownika
        schedule = await WeeklyPlanSchedule.findOne({ userId, isActive: true });
        if (!schedule) {
          throw new Error(`Nie znaleziono aktywnego harmonogramu dla użytkownika ${userId}`);
        }
        logger.info(`Pobrany harmonogram fallback dla użytkownika`, {
          userId,
          scheduleId: schedule._id,
          schedule_userProfile_dniTreningowe: schedule.userProfile?.dniTreningowe,
          schedule_userProfile_trainingDays: schedule.userProfile?.trainingDays,
          hasUserProfile: !!schedule.userProfile,
          userProfileKeys: schedule.userProfile ? Object.keys(schedule.userProfile) : []
        });
      }

      // Wyślij powiadomienie o rozpoczęciu generowania
      if (jobData.jobId) {
        sseNotificationService.notifyPlanGenerationProgress(jobData.jobId, 50, 'Generowanie planu za pomocą AI...');
      }

      // Generuj plan
      const resetToWeekOne = planData.resetToWeekOne || false;
      console.log(`🔥 [AI-JOB-SERVICE] CALLING weeklyService.generateWeeklyPlan with resetToWeekOne: ${resetToWeekOne}`);
      const generatedPlan = await weeklyService.generateWeeklyPlan(schedule, resetToWeekOne);
      console.log(`✅ [AI-JOB-SERVICE] PLAN GENERATED successfully: ${generatedPlan?._id}`);

      // Wyślij powiadomienie o finalizacji
      if (jobData.jobId) {
        sseNotificationService.notifyPlanGenerationProgress(jobData.jobId, 90, 'Zapisywanie planu...');
      }

      logger.info(`Ukończono generowanie planu tygodniowego dla użytkownika: ${userId}, tydzień: ${generatedPlan.weekNumber}`);
      
      const result = {
        planId: generatedPlan._id,
        weekNumber: generatedPlan.weekNumber,
        userId: userId,
        status: 'completed'
      };

      // Wyślij powiadomienie SSE o ukończeniu
      sseNotificationService.notifyPlanGenerationCompleted(jobData.jobId, result);
      
      return result;
    } catch (error) {
      logger.error(`Błąd podczas generowania planu tygodniowego dla użytkownika ${userId}:`, error);
      
      // Wyślij powiadomienie SSE o błędzie
      if (jobData.jobId) {
        sseNotificationService.notifyPlanGenerationFailed(jobData.jobId, error);
      }
      
      throw error;
    }
  }

  /**
   * Inicjalizuje service i worker processy
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log(`🔧 [AI-JOB-SERVICE] Initializing AI Job Service...`);
    await redisQueueService.initialize();
    
    // Zarejestruj processor dla zadań generowania planów
    const queue = redisQueueService.getQueue();
    console.log(`🔧 [AI-JOB-SERVICE] Redis queue available: ${!!queue}`);
    
    if (queue) {
      // Redis dostępny - użyj normalnych processorów
      // Processor dla formularzy (stary flow)
      queue.process('generate-training-plan', 1, async (job) => {
        console.log(`⚡ [AI-JOB-SERVICE] PROCESSING TRAINING PLAN JOB: ${job.id}`);
        return await this.processTrainingPlanGeneration(job.data);
      });
      
      // Processor dla planów tygodniowych (nowy flow)
      queue.process('generate-weekly-plan', 1, async (job) => {
        console.log(`⚡ [AI-JOB-SERVICE] PROCESSING WEEKLY PLAN JOB: ${job.id}`);
        try {
          const result = await this.processWeeklyPlanGeneration(job.data);
          console.log(`✅ [AI-JOB-SERVICE] Weekly plan job completed: ${job.id}`);
          return result;
        } catch (error) {
          console.log(`❌ [AI-JOB-SERVICE] Weekly plan job failed: ${job.id}`, error.message);
          throw error;
        }
      });
      
      console.log(`✅ [AI-JOB-SERVICE] Processors registered: generate-training-plan, generate-weekly-plan`);
      logger.info('AI Job Service initialized with Redis queue for both training and weekly plans');
    } else {
      // Redis niedostępny - zarejestruj synchroniczny processor
      redisQueueService.setSyncProcessor(async (jobData) => {
        console.log(`⚡ [AI-JOB-SERVICE] PROCESSING SYNC JOB: ${jobData.type}`);
        if (jobData.type === 'weekly_plan_generation') {
          return await this.processWeeklyPlanGeneration(jobData);
        } else {
          return await this.processTrainingPlanGeneration(jobData);
        }
      });
      
      logger.info('AI Job Service initialized with synchronous processing (Redis not available)');
    }
  }

  /**
   * Test method to manually trigger a job for debugging
   */
  async testWeeklyPlanGeneration() {
    console.log(`🧪 [AI-JOB-SERVICE] Testing manual job creation...`);
    
    const testJobData = {
      userId: 'test-user-123',
      scheduleId: 'test-schedule-456',
      planData: { resetToWeekOne: true },
      type: 'weekly_plan_generation',
      timestamp: Date.now()
    };
    
    const jobId = await redisQueueService.addTrainingPlanJob('test-job-123', testJobData, {
      priority: 10
    });
    
    console.log(`🧪 [AI-JOB-SERVICE] Test job created with ID: ${jobId}`);
    return jobId;
  }

  /**
   * Debug method to check queue status
   */
  async debugQueueStatus() {
    const queue = redisQueueService.getQueue();
    if (!queue) {
      console.log(`🔍 [AI-JOB-SERVICE] No queue available for debugging`);
      return;
    }

    try {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      console.log(`🔍 [AI-JOB-SERVICE] Queue Status:`);
      console.log(`  - Waiting jobs: ${waiting.length}`);
      console.log(`  - Active jobs: ${active.length}`);
      console.log(`  - Completed jobs: ${completed.length}`);
      console.log(`  - Failed jobs: ${failed.length}`);

      if (waiting.length > 0) {
        console.log(`🔍 [AI-JOB-SERVICE] Waiting jobs details:`);
        waiting.forEach(job => {
          console.log(`  - Job ${job.id}: ${job.name}, created: ${new Date(job.timestamp)}`);
        });
      }

      if (failed.length > 0) {
        console.log(`🔍 [AI-JOB-SERVICE] Failed jobs details:`);
        failed.forEach(job => {
          console.log(`  - Job ${job.id}: ${job.failedReason}`);
        });
      }

    } catch (error) {
      console.log(`❌ [AI-JOB-SERVICE] Error checking queue status:`, error.message);
    }
  }

  /**
   * Force process a waiting job manually for debugging
   */
  async forceProcessWaitingJobs() {
    const queue = redisQueueService.getQueue();
    if (!queue) {
      console.log(`🔍 [AI-JOB-SERVICE] No queue available`);
      return;
    }

    try {
      const waiting = await queue.getWaiting();
      console.log(`🔧 [AI-JOB-SERVICE] Found ${waiting.length} waiting jobs`);
      
      if (waiting.length > 0) {
        const job = waiting[0];
        console.log(`🔧 [AI-JOB-SERVICE] Manually processing job: ${job.id}`);
        
        // Try to manually trigger the processor
        if (job.name === 'generate-weekly-plan') {
          try {
            const result = await this.processWeeklyPlanGeneration(job.data);
            console.log(`✅ [AI-JOB-SERVICE] Manual processing completed:`, result);
            
            // Mark job as completed
            await job.moveToCompleted(result, true);
            return result;
          } catch (error) {
            console.log(`❌ [AI-JOB-SERVICE] Manual processing failed:`, error.message);
            await job.moveToFailed(error, true);
            throw error;
          }
        }
      } else {
        console.log(`🔧 [AI-JOB-SERVICE] No waiting jobs to process`);
      }
    } catch (error) {
      console.log(`❌ [AI-JOB-SERVICE] Error force processing:`, error.message);
    }
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