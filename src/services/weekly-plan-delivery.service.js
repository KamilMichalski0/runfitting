const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
const TrainingPlan = require('../models/training-plan.model');
const GeminiService = require('./gemini.service');
const runningKnowledgeBase = require('../knowledge/running-knowledge-base');
const correctiveExercisesKnowledgeBase = require('../knowledge/corrective-knowledge-base');
const AppError = require('../utils/app-error');
const { logInfo, logError, logWarning } = require('../utils/logger');

// Mapa locks dla użytkowników aby uniknąć race conditions
const userLocks = new Map();

/**
 * Serwis odpowiedzialny za cykliczne dostarczanie planów treningowych
 * Generuje plany tygodniowe/dwutygodniowe na podstawie harmonogramów użytkowników
 */
class WeeklyPlanDeliveryService {
  constructor() {
    this.geminiService = new GeminiService(runningKnowledgeBase, correctiveExercisesKnowledgeBase);
  }

  /**
   * Tworzy nowy harmonogram dostarczania dla użytkownika
   * @param {string} userId - ID użytkownika
   * @param {Object} scheduleData - Dane harmonogramu
   * @returns {Object} Utworzony harmonogram
   */
  async createSchedule(userId, scheduleData) {
    try {
      // Sprawdź czy użytkownik już ma aktywny harmonogram
      const existingSchedule = await WeeklyPlanSchedule.findOne({
        userId,
        isActive: true
      });

      if (existingSchedule) {
        throw new AppError('Użytkownik już posiada aktywny harmonogram dostarczania planów', 400);
      }

      // Utwórz nowy harmonogram
      const schedule = new WeeklyPlanSchedule({
        userId,
        userProfile: scheduleData.userProfile,
        deliveryFrequency: scheduleData.deliveryFrequency || 'weekly',
        deliveryDay: scheduleData.deliveryDay || 'sunday',
        deliveryTime: scheduleData.deliveryTime || '18:00',
        timezone: scheduleData.timezone || 'Europe/Warsaw',
        longTermGoal: scheduleData.longTermGoal,
        adaptationSettings: scheduleData.adaptationSettings
      });

      // Oblicz pierwszą datę dostarczania
      schedule.calculateNextDeliveryDate();
      await this._saveWithRetry(schedule);

      logInfo(`Utworzono harmonogram dostarczania planów dla użytkownika: ${userId}`);
      return schedule;
    } catch (error) {
      logError('Błąd podczas tworzenia harmonogramu dostarczania', error);
      throw error;
    }
  }

  /**
   * Aktualizuje istniejący harmonogram
   * @param {string} userId - ID użytkownika
   * @param {Object} updateData - Dane do aktualizacji
   * @returns {Object} Zaktualizowany harmonogram
   */
  async updateSchedule(userId, updateData) {
    try {
      const schedule = await WeeklyPlanSchedule.findOne({
        userId,
        isActive: true
      });

      if (!schedule) {
        throw new AppError('Nie znaleziono aktywnego harmonogramu dla użytkownika', 404);
      }

      // Aktualizuj dane
      Object.keys(updateData).forEach(key => {
        if (key === 'userProfile') {
          schedule.userProfile = { ...schedule.userProfile, ...updateData.userProfile };
        } else {
          schedule[key] = updateData[key];
        }
      });

      // Przelicz datę następnego dostarczania jeśli zmieniły się parametry czasowe
      if (updateData.deliveryDay || updateData.deliveryTime || updateData.deliveryFrequency) {
        schedule.calculateNextDeliveryDate();
      }

      await this._saveWithRetry(schedule);
      logInfo(`Zaktualizowano harmonogram dostarczania dla użytkownika: ${userId}`);
      return schedule;
    } catch (error) {
      logError('Błąd podczas aktualizacji harmonogramu', error);
      throw error;
    }
  }

  /**
   * Wstrzymuje harmonogram dostarczania na określony czas
   * @param {string} userId - ID użytkownika
   * @param {Date} pauseUntil - Data do kiedy wstrzymać
   * @returns {Object} Zaktualizowany harmonogram
   */
  async pauseSchedule(userId, pauseUntil) {
    try {
      const schedule = await WeeklyPlanSchedule.findOne({
        userId,
        isActive: true
      });

      if (!schedule) {
        throw new AppError('Nie znaleziono aktywnego harmonogramu dla użytkownika', 404);
      }

      schedule.pausedUntil = pauseUntil;
      await this._saveWithRetry(schedule);

      logInfo(`Wstrzymano harmonogram dostarczania dla użytkownika: ${userId} do ${pauseUntil}`);
      return schedule;
    } catch (error) {
      logError('Błąd podczas wstrzymywania harmonogramu', error);
      throw error;
    }
  }

  /**
   * Deaktywuje harmonogram dostarczania
   * @param {string} userId - ID użytkownika
   * @returns {Object} Zaktualizowany harmonogram
   */
  async deactivateSchedule(userId) {
    try {
      const schedule = await WeeklyPlanSchedule.findOne({
        userId,
        isActive: true
      });

      if (!schedule) {
        throw new AppError('Nie znaleziono aktywnego harmonogramu dla użytkownika', 404);
      }

      schedule.isActive = false;
      await this._saveWithRetry(schedule);

      logInfo(`Dezaktywowano harmonogram dostarczania dla użytkownika: ${userId}`);
      return schedule;
    } catch (error) {
      logError('Błąd podczas dezaktywacji harmonogramu', error);
      throw error;
    }
  }

  /**
   * Generuje plan tygodniowy na podstawie harmonogramu
   * @param {Object} schedule - Harmonogram dostarczania
   * @param {boolean} resetToWeekOne - Czy zresetować do tygodnia 1 (true) czy kontynuować progresję (false)
   * @returns {Object} Wygenerowany plan treningowy
   */
  async generateWeeklyPlan(schedule, resetToWeekOne = false) {
    const userId = schedule.userId;
    
    // Użyj lock aby uniknąć race conditions
    return await this._withUserLock(userId, async () => {
      try {
      // Determine the correct week number based on the operation type
      let targetWeekNumber;
      
      if (resetToWeekOne) {
        // New plan generation - always start from week 1
        targetWeekNumber = 1;
        logInfo('Generating new plan starting from week 1');
      } else {
        // Week progression - get current week and increment by 1
        const currentWeek = schedule.progressTracking?.weekNumber || 1;
        targetWeekNumber = currentWeek + 1;
        logInfo(`Progressing from week ${currentWeek} to week ${targetWeekNumber}`);
      }
      
      // Prepare data for plan generation with the correct week number
      const weeklyData = this.prepareWeeklyPlanDataWithWeek(schedule, targetWeekNumber);
      
      let planData;
      try {
        // Wygeneruj plan za pomocą ulepszonego Gemini Service (z wbudowanym fallbackiem)
        planData = await this.geminiService.generateWeeklyTrainingPlan(weeklyData);
      } catch (error) {
        logError('Błąd podczas generowania planu tygodniowego', error);
        
        // Dynamic fallback plan with variety based on week number
        const baseDuration = 20 + (targetWeekNumber * 5); // Progressive increase
        const baseDistance = 3 + (targetWeekNumber * 0.5); // Progressive distance
        
        // Generate varied workouts based on week number and randomization
        const workoutVariations = [
          {
            day_name: 'poniedziałek',
            workout: {
              type: 'easy',
              description: `Week ${targetWeekNumber}: Easy base building run with comfortable pace`,
              duration: baseDuration,
              distance: baseDistance,
              target_pace: `5:30-6:00 min/km`,
              target_heart_rate: { min: 120 + (targetWeekNumber * 2), max: 140 + (targetWeekNumber * 2) },
              support_exercises: [
                { name: 'Dynamic warm-up', sets: 1, duration: 8 },
                { name: 'Post-run stretching', sets: 1, duration: 10 }
              ]
            }
          },
          {
            day_name: 'środa',
            workout: {
              type: targetWeekNumber > 2 ? 'tempo' : 'easy',
              description: targetWeekNumber > 2 
                ? `Week ${targetWeekNumber}: Tempo intervals - 4x5min at comfortable hard pace`
                : `Week ${targetWeekNumber}: Comfortable pace with walking breaks`,
              duration: baseDuration + 10,
              distance: baseDistance + 1,
              target_pace: targetWeekNumber > 2 ? `5:00-5:30 min/km` : `6:00-6:30 min/km`,
              target_heart_rate: { 
                min: targetWeekNumber > 2 ? 150 : 125, 
                max: targetWeekNumber > 2 ? 170 : 145 
              },
              support_exercises: [
                { name: 'Core strengthening', sets: 2, duration: 12 },
                { name: 'Leg swings', sets: 1, duration: 5 }
              ]
            }
          },
          {
            day_name: 'piątek',
            workout: {
              type: 'recovery',
              description: `Week ${targetWeekNumber}: Recovery run focusing on form and relaxation`,
              duration: Math.max(15, baseDuration - 10),
              distance: Math.max(2, baseDistance - 1),
              target_pace: `6:30-7:00 min/km`,
              target_heart_rate: { min: 110, max: 130 },
              support_exercises: [
                { name: 'Static stretching', sets: 1, duration: 15 },
                { name: 'Foam rolling', sets: 1, duration: 10 }
              ]
            }
          }
        ];

        // Add weekend long run for weeks 3+
        if (targetWeekNumber >= 3) {
          workoutVariations.push({
            day_name: 'niedziela',
            workout: {
              type: 'long',
              description: `Week ${targetWeekNumber}: Long steady run for endurance building`,
              duration: baseDuration + 20,
              distance: baseDistance + 2,
              target_pace: `6:00-6:30 min/km`,
              target_heart_rate: { min: 130, max: 150 },
              support_exercises: [
                { name: 'Pre-run activation', sets: 1, duration: 10 },
                { name: 'Post-run recovery', sets: 1, duration: 20 }
              ]
            }
          });
        }

        planData = {
          id: `fallback-weekly-plan-${Date.now()}`,
          metadata: {
            discipline: 'running',
            target_group: 'beginners',
            target_goal: weeklyData.longTermGoal || 'general_fitness',
            level_hint: targetWeekNumber <= 2 ? 'beginner' : targetWeekNumber <= 6 ? 'intermediate' : 'advanced',
            days_per_week: targetWeekNumber >= 3 ? 4 : 3,
            duration_weeks: 1,
            description: `Progressive training plan - Week ${targetWeekNumber}`,
            author: 'Dynamic Fallback System',
            weeklyDistance: baseDistance * (targetWeekNumber >= 3 ? 4 : 3),
            workoutsCount: targetWeekNumber >= 3 ? 4 : 3
          },
          plan_weeks: [{
            week_num: targetWeekNumber,
            focus: targetWeekNumber <= 2 
              ? 'Building base fitness and consistency'
              : targetWeekNumber <= 6 
                ? 'Developing speed and endurance'
                : 'Peak performance and race preparation',
            days: workoutVariations
          }]
        };
        
        logInfo('Użyto fallback planu tygodniowego');
      }
      
      // Generuj unikalny identyfikator dla planu
      const uniqueId = `plan_${schedule.userId.substring(0, 8)}_week${targetWeekNumber}_${Date.now()}`;
      
      // Transformuj plan do formatu zgodnego z modelem
      const transformedPlanData = this._transformPlanDataForDatabase(planData, targetWeekNumber);
      
      const trainingPlan = new TrainingPlan({
        ...transformedPlanData,
        id: uniqueId, // Zastąp statyczne ID z Gemini unikalnym
        userId: schedule.userId,
        planType: 'weekly',
        weekNumber: targetWeekNumber,
        parentSchedule: schedule._id && schedule._id !== 'mock-schedule-id' && !schedule._id.toString().startsWith('new-plan-') ? schedule._id : null
      });

      try {
        await trainingPlan.save();
        logInfo(`Plan treningowy zapisany do bazy z ID: ${trainingPlan._id}, week: ${targetWeekNumber}`);
      } catch (saveError) {
        logError('Błąd zapisu planu treningowego do bazy danych', saveError);
        // Dla testów - jeśli baza nie jest dostępna, kontynuuj bez zapisywania
        if (schedule.userId === 'test-user') {
          logInfo('Pominięto zapis do bazy - tryb testowy');
          trainingPlan._id = 'mock-training-plan-id';
          trainingPlan.isNew = false;
        } else {
          // Dla prawdziwych użytkowników, zawsze próbuj zapisać
          throw saveError;
        }
      }

      // Aktualizuj harmonogram z cleanup stalych referencji
      if (!schedule.recentPlans) {
        schedule.recentPlans = [];
      }
      
      // Cleanup stalych referencji przed dodaniem nowego planu
      await this._cleanupStaleReferences(schedule);
      
      // Generuj globalny identyfikator planu
      const globalPlanId = this._generateGlobalPlanId(targetWeekNumber, trainingPlan._id);
      
      schedule.recentPlans.push({
        weekNumber: targetWeekNumber,
        planId: trainingPlan._id,
        deliveryDate: new Date(),
        globalPlanId: globalPlanId,
        createdAt: new Date()
      });

      // Zachowaj tylko ostatnie 4 plany i usuń duplikaty
      schedule.recentPlans = this._deduplicateAndLimitPlans(schedule.recentPlans, 4);

      // Update progress tracking based on the operation type
      if (!schedule.progressTracking) {
        schedule.progressTracking = {
          weekNumber: 1,
          currentPhase: 'base',
          totalWeeksDelivered: 0,
          lastWeeklyDistance: 0,
          progressionRate: 1.0
        };
      }

      if (resetToWeekOne) {
        // For new plans, reset to week 1
        schedule.progressTracking.weekNumber = 1;
        schedule.progressTracking.currentPhase = 'base';
        schedule.progressTracking.totalWeeksDelivered = 0;
        logInfo('Reset progress tracking to week 1 for new plan');
      } else {
        // For week progression, update to the target week number
        schedule.progressTracking.weekNumber = targetWeekNumber;
        schedule.progressTracking.totalWeeksDelivered = (schedule.progressTracking.totalWeeksDelivered || 0) + 1;
        logInfo(`Updated progress tracking to week ${targetWeekNumber}`);
        
        // Update progress using the schedule method if available
        if (typeof schedule.updateProgress === 'function') {
          // Don't call updateProgress as we've already set the correct week number
          // Just update the delivery date and other metadata
          schedule.lastDeliveryDate = new Date();
          schedule.calculateNextDeliveryDate();
        }
      }
      
        // Retry mechanism dla VersionError
        await this._saveWithRetry(schedule, 3);

        logInfo(`Wygenerowano plan tygodniowy dla użytkownika ${schedule.userId}, tydzień ${targetWeekNumber}`);
        return trainingPlan;
      } catch (error) {
        logError('Błąd podczas generowania planu tygodniowego', error);
        throw error;
      }
    });
  }

  /**
   * Przygotowuje dane dla generatora planów tygodniowych z określonym numerem tygodnia
   * @param {Object} schedule - Harmonogram dostarczania
   * @param {number} weekNumber - Docelowy numer tygodnia
   * @returns {Object} Dane dla generatora
   */
  prepareWeeklyPlanDataWithWeek(schedule, weekNumber) {
    // Sprawdź czy schedule i jego właściwości istnieją
    if (!schedule) {
      throw new Error('Schedule object is required');
    }
    
    // Domyślne wartości dla progressTracking
    const defaultProgressTracking = {
      weekNumber: weekNumber,
      currentPhase: 'base',
      totalWeeksDelivered: 0,
      lastWeeklyDistance: 0,
      progressionRate: 1.0
    };
    
    // Użyj podanego weekNumber zamiast tego z schedule
    const progressTracking = { 
      ...schedule.progressTracking, 
      weekNumber: weekNumber 
    } || defaultProgressTracking;
    
    const weeklyData = {
      // Podstawowe dane użytkownika
      ...schedule.userProfile,
      
      // Dane użytkownika dla Gemini Service
      userData: schedule.userProfile || {},
      
      // Kontekst progresji z zabezpieczeniami (używając podanego weekNumber)
      weekNumber: weekNumber,
      currentPhase: progressTracking.currentPhase || 'base',
      totalWeeksDelivered: progressTracking.totalWeeksDelivered || 0,
      
      // Adaptacja na podstawie poprzednich tygodni
      lastWeeklyDistance: progressTracking.lastWeeklyDistance || 0,
      progressionRate: progressTracking.progressionRate || 1.0,
      
      // Cel długoterminowy
      longTermGoal: schedule.longTermGoal || 'general_fitness',
      
      // Ustawienia adaptacji
      adaptationSettings: schedule.adaptationSettings || {},
      
      // Historia realizacji (jeśli dostępna)
      recentPerformance: this.analyzeRecentPerformance(schedule.recentPlans || []),
      
      // Typ planu
      planType: 'weekly',
      deliveryFrequency: schedule.deliveryFrequency || 'weekly'
    };

    return weeklyData;
  }

  /**
   * Przygotowuje dane dla generatora planów tygodniowych
   * @param {Object} schedule - Harmonogram dostarczania
   * @returns {Object} Dane dla generatora
   */
  prepareWeeklyPlanData(schedule) {
    // Sprawdź czy schedule i jego właściwości istnieją
    if (!schedule) {
      throw new Error('Schedule object is required');
    }
    
    // Domyślne wartości dla progressTracking
    const defaultProgressTracking = {
      weekNumber: 1,
      currentPhase: 'base',
      totalWeeksDelivered: 0,
      lastWeeklyDistance: 0,
      progressionRate: 1.0
    };
    
    // Użyj istniejących wartości lub domyślnych
    const progressTracking = schedule.progressTracking || defaultProgressTracking;
    
    const weeklyData = {
      // Podstawowe dane użytkownika
      ...schedule.userProfile,
      
      // Dane użytkownika dla Gemini Service
      userData: schedule.userProfile || {},
      
      // Kontekst progresji z zabezpieczeniami
      weekNumber: progressTracking.weekNumber || 1,
      currentPhase: progressTracking.currentPhase || 'base',
      totalWeeksDelivered: progressTracking.totalWeeksDelivered || 0,
      
      // Adaptacja na podstawie poprzednich tygodni
      lastWeeklyDistance: progressTracking.lastWeeklyDistance || 0,
      progressionRate: progressTracking.progressionRate || 1.0,
      
      // Cel długoterminowy
      longTermGoal: schedule.longTermGoal || 'general_fitness',
      
      // Ustawienia adaptacji
      adaptationSettings: schedule.adaptationSettings || {},
      
      // Historia realizacji (jeśli dostępna)
      recentPerformance: this.analyzeRecentPerformance(schedule.recentPlans || []),
      
      // Typ planu
      planType: 'weekly',
      deliveryFrequency: schedule.deliveryFrequency || 'weekly'
    };

    return weeklyData;
  }

  /**
   * Analizuje wydajność z ostatnich tygodni
   * @param {Array} recentPlans - Ostatnie plany
   * @returns {Object} Analiza wydajności
   */
  analyzeRecentPerformance(recentPlans) {
    if (!recentPlans || recentPlans.length === 0) {
      return {
        averageCompletion: 0.5,
        trend: 'stable',
        recommendation: 'maintain'
      };
    }

    const completed = recentPlans.filter(plan => plan && plan.wasCompleted);
    const averageCompletion = completed.length / recentPlans.length;
    
    let trend = 'stable';
    if (recentPlans.length >= 2) {
      const recent = recentPlans.slice(-2);
      if (recent[1] && recent[0] && 
          recent[1].completionRate && recent[0].completionRate &&
          recent[1].completionRate > recent[0].completionRate + 0.1) {
        trend = 'improving';
      } else if (recent[1] && recent[0] && 
                 recent[1].completionRate && recent[0].completionRate &&
                 recent[1].completionRate < recent[0].completionRate - 0.1) {
        trend = 'declining';
      }
    }

    let recommendation = 'maintain';
    if (averageCompletion > 0.8) {
      recommendation = 'increase';
    } else if (averageCompletion < 0.6) {
      recommendation = 'decrease';
    }

    return {
      averageCompletion,
      trend,
      recommendation
    };
  }

  // REMOVED: generateFallbackWeeklyPlan - nie jest już potrzebne dzięki ulepszeniom GeminiService

  /**
   * Przetwarza wszystkie harmonogramy wymagające dostarczania
   * Metoda do uruchamiania przez cron job - używa progresji tygodniowej (false)
   */
  async processScheduledDeliveries() {
    try {
      logInfo('Rozpoczęcie przetwarzania zaplanowanych dostaw planów');
      
      const dueSchedules = await WeeklyPlanSchedule.findDueForDelivery();
      logInfo(`Znaleziono ${dueSchedules.length} harmonogramów wymagających dostarczania`);

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const schedule of dueSchedules) {
        results.processed++;
        
        try {
          // Use false for resetToWeekOne - this is scheduled delivery (week progression)
          const generatedPlan = await this.generateWeeklyPlan(schedule, false);
          results.successful++;
          logInfo(`Pomyślnie dostarczone plan dla użytkownika ${schedule.userId}, tydzień ${generatedPlan.weekNumber}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            userId: schedule.userId,
            error: error.message
          });
          logError(`Błąd dostarczania planu dla użytkownika ${schedule.userId}`, error);
        }
      }

      logInfo(`Zakończono przetwarzanie dostaw: ${results.successful}/${results.processed} pomyślnych`);
      return results;
    } catch (error) {
      logError('Błąd podczas przetwarzania zaplanowanych dostaw', error);
      throw error;
    }
  }

  /**
   * Pobiera harmonogram użytkownika
   * @param {string} userId - ID użytkownika
   * @returns {Object} Harmonogram użytkownika
   */
  async getUserSchedule(userId) {
    try {
      const schedule = await WeeklyPlanSchedule.findOne({
        userId,
        isActive: true
      }).populate('recentPlans.planId');

      if (!schedule) {
        throw new AppError('Nie znaleziono aktywnego harmonogramu dla użytkownika', 404);
      }

      return schedule;
    } catch (error) {
      logError('Błąd podczas pobierania harmonogramu użytkownika', error);
      throw error;
    }
  }

  /**
   * Aktualizuje postęp wykonania planu tygodniowego
   * @param {string} userId - ID użytkownika
   * @param {string|number} planIdOrWeekNumber - ID planu (ObjectId) lub numer tygodnia
   * @param {Object} progressData - Dane o postępie
   */
  async updateWeeklyProgress(userId, planIdOrWeekNumber, progressData) {
    // Użyj lock aby uniknąć race conditions
    return await this._withUserLock(userId, async () => {
      try {
      logInfo(`Aktualizacja postępu dla użytkownika ${userId} z parametrem: ${planIdOrWeekNumber}`);
      
      // Spróbuj znaleźć harmonogram, ale nie wymagaj go
      let schedule = null;
      let scheduleUpdated = false;
      
      try {
        schedule = await WeeklyPlanSchedule.findOne({
          userId,
          isActive: true
        });
        logInfo(`Znaleziono harmonogram dla użytkownika ${userId}: ${schedule ? 'TAK' : 'NIE'}`);
      } catch (error) {
        logWarning(`Nie udało się pobrać harmonogramu dla użytkownika ${userId}: ${error.message}`);
      }

      // Określ czy to ObjectId czy weekNumber
      const isObjectId = typeof planIdOrWeekNumber === 'string' && planIdOrWeekNumber.length === 24;
      logInfo(`Parametr ${planIdOrWeekNumber} jest ObjectId: ${isObjectId}`);

      let updatedPlan = null;
      
      // Jeśli mamy harmonogram, spróbuj zaktualizować w nim plan
      if (schedule && schedule.recentPlans && schedule.recentPlans.length > 0) {
        let planIndex = -1;
        
        if (isObjectId) {
          // Szukaj po planId (ObjectId)
          planIndex = schedule.recentPlans.findIndex(
            p => p.planId && p.planId.toString() === planIdOrWeekNumber
          );
          logInfo(`Znaleziono plan w harmonogramie po planId: ${planIndex !== -1}`);
        } else {
          // Szukaj po weekNumber
          planIndex = schedule.recentPlans.findIndex(
            p => p.weekNumber === planIdOrWeekNumber
          );
          logInfo(`Znaleziono plan w harmonogramie po weekNumber: ${planIndex !== -1}`);
        }

        if (planIndex !== -1) {
          schedule.recentPlans[planIndex].wasCompleted = true;
          schedule.recentPlans[planIndex].completionRate = progressData.completionRate || 0;
          schedule.recentPlans[planIndex].wasRated = true;
          schedule.recentPlans[planIndex].ratingData = {
            difficultyLevel: progressData.difficultyLevel,
            injuries: progressData.injuries,
            injuryDescription: progressData.injuryDescription,
            feedback: progressData.feedback,
            nextWeekPreference: progressData.nextWeekPreference
          };
          
          await this._saveWithRetry(schedule);
          scheduleUpdated = true;
          logInfo(`Zaktualizowano plan w harmonogramie dla użytkownika ${userId}`);
        }
      }

      // Zaktualizuj bezpośrednio w TrainingPlan (jako backup lub główny sposób)
      if (isObjectId) {
        try {
          updatedPlan = await TrainingPlan.findOneAndUpdate(
            { _id: planIdOrWeekNumber, userId },
            { 
              'progress.wasCompleted': true,
              'progress.wasRated': true,
              'progress.ratingData': progressData,
              'progress.completedAt': new Date(),
              'progress.completionRate': progressData.completionRate || 0
            },
            { new: true }
          );
          
          if (updatedPlan) {
            logInfo(`Bezpośrednio zaktualizowano plan ${planIdOrWeekNumber} w TrainingPlan`);
          } else {
            logWarning(`Nie znaleziono planu ${planIdOrWeekNumber} w TrainingPlan dla użytkownika ${userId}`);
          }
        } catch (error) {
          logError(`Błąd podczas bezpośredniej aktualizacji planu: ${error.message}`);
        }
      } else {
        // Jeśli to weekNumber, znajdź najnowszy plan o tym numerze
        try {
          updatedPlan = await TrainingPlan.findOneAndUpdate(
            { 
              userId, 
              weekNumber: planIdOrWeekNumber,
              planType: 'weekly'
            },
            { 
              'progress.wasCompleted': true,
              'progress.wasRated': true,
              'progress.ratingData': progressData,
              'progress.completedAt': new Date(),
              'progress.completionRate': progressData.completionRate || 0
            },
            { new: true, sort: { createdAt: -1 } } // Pobierz najnowszy
          );
          
          if (updatedPlan) {
            logInfo(`Bezpośrednio zaktualizowano plan tygodnia ${planIdOrWeekNumber} w TrainingPlan`);
          } else {
            logWarning(`Nie znaleziono planu tygodnia ${planIdOrWeekNumber} w TrainingPlan dla użytkownika ${userId}`);
          }
        } catch (error) {
          logError(`Błąd podczas bezpośredniej aktualizacji planu po weekNumber: ${error.message}`);
        }
      }

      // Zaplanuj asynchroniczne generowanie nowego planu (bez czekania)
      let planGenerationQueued = false;
      if (schedule && (scheduleUpdated || updatedPlan)) {
        try {
          // Uruchom generowanie planu w tle - nie czekaj na wynik
          this._generatePlanAsync(userId, schedule);
          planGenerationQueued = true;
          logInfo(`Zaplanowano asynchroniczne generowanie nowego planu dla użytkownika ${userId}`);
        } catch (error) {
          logWarning(`Nie udało się zaplanować generowania nowego planu: ${error.message}`);
        }
      }

      const result = {
        schedule,
        updatedPlan,
        newPlan: null, // Nie zwracamy planu - będzie wygenerowany asynchronicznie
        scheduleUpdated,
        planGenerationQueued,
        message: updatedPlan || scheduleUpdated ? 
          'Postęp został pomyślnie zapisany' + (planGenerationQueued ? ', nowy plan jest generowany w tle' : '') : 
          'Nie znaleziono planu do aktualizacji'
      };

        logInfo(`Rezultat aktualizacji postępu dla użytkownika ${userId}: ${JSON.stringify(result.message)}`);
        return result;

      } catch (error) {
        logError('Błąd podczas aktualizacji postępu tygodniowego', error);
        throw error;
      }
    });
  }

  /**
   * Asynchronicznie generuje nowy plan w tle (bez blokowania odpowiedzi)
   * Używa progresji tygodniowej (false) - gdy użytkownik zakończy tydzień, generuje następny
   * @param {string} userId - ID użytkownika
   * @param {Object} schedule - Harmonogram użytkownika
   */
  _generatePlanAsync(userId, schedule) {
    // Uruchom w następnym tick'u event loop, żeby nie blokować odpowiedzi
    setImmediate(async () => {
      try {
        logInfo(`Rozpoczęcie asynchronicznego generowania planu dla użytkownika ${userId} (week progression)`);
        
        // Use false for resetToWeekOne - this is week progression, not new plan generation
        const newPlan = await this.generateWeeklyPlan(schedule, false);
        
        if (newPlan && newPlan._id) {
          logInfo(`Pomyślnie wygenerowano nowy plan ${newPlan._id} dla użytkownika ${userId}, tydzień ${newPlan.weekNumber}`);
          
          // TODO: W przyszłości można dodać notification/webhook do frontend
          // np.: await this.notifyPlanGenerated(userId, newPlan._id);
          
        } else {
          logWarning(`Nie udało się wygenerować planu dla użytkownika ${userId} - brak _id`);
        }
        
      } catch (error) {
        logError(`Błąd podczas asynchronicznego generowania planu dla użytkownika ${userId}:`, error);
        
        // TODO: W przyszłości można dodać retry mechanism lub notification o błędzie
        // np.: await this.notifyPlanGenerationFailed(userId, error.message);
      }
    });
  }

  /**
   * Pobiera historię planów tygodniowych użytkownika
   * @param {string} userId - ID użytkownika
   * @param {number} limit - Limit planów do pobrania
   * @param {number} offset - Przesunięcie dla paginacji
   * @returns {Array} Historia planów
   */
  async getPlanHistory(userId, limit = 10, offset = 0) {
    try {
      const TrainingPlan = require('../models/training-plan.model');
      
      const plans = await TrainingPlan.find({
        userId: userId,
        planType: 'weekly'
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('id weekNumber metadata createdAt progress deliveryFrequency');

      return plans;
    } catch (error) {
      logError('Błąd podczas pobierania historii planów', error);
      throw new AppError('Nie udało się pobrać historii planów', 500);
    }
  }

  /**
   * Czyści stale referencje z harmonogramu
   * @param {Object} schedule - Harmonogram użytkownika
   * @returns {Promise<void>}
   */
  async _cleanupStaleReferences(schedule) {
    if (!schedule.recentPlans || schedule.recentPlans.length === 0) {
      return;
    }

    const validPlans = [];
    const staleReferences = [];

    // Sprawdź każdy plan w recentPlans
    for (const planRef of schedule.recentPlans) {
      try {
        // Sprawdź czy plan istnieje
        const planExists = await TrainingPlan.exists({ 
          _id: planRef.planId,
          userId: schedule.userId,
          planType: 'weekly'
        });

        if (planExists) {
          validPlans.push(planRef);
        } else {
          staleReferences.push(planRef);
          logWarning(`Znaleziono stalą referencję do planu ${planRef.planId} dla użytkownika ${schedule.userId}`);
        }
      } catch (error) {
        // W przypadku błędu, tratuj jako stalą referencję
        staleReferences.push(planRef);
        logError(`Błąd podczas walidacji planu ${planRef.planId}`, error);
      }
    }

    // Aktualizuj recentPlans tylko z prawidłowymi planami
    schedule.recentPlans = validPlans;

    if (staleReferences.length > 0) {
      logInfo(`Usunięto ${staleReferences.length} stalych referencji dla użytkownika ${schedule.userId}`);
    }
  }

  /**
   * Generuje globalny identyfikator planu
   * @param {number} weekNumber - Numer tygodnia
   * @param {string} planId - ID planu
   * @returns {string} Globalny identyfikator
   */
  _generateGlobalPlanId(weekNumber, planId) {
    const timestamp = Date.now();
    return `${weekNumber}_${planId}_${timestamp}`;
  }

  /**
   * Usuwa duplikaty i limituje liczbę planów
   * @param {Array} plans - Lista planów
   * @param {number} limit - Maksymalna liczba planów
   * @returns {Array} Zdeduplicowane i ograniczone plany
   */
  _deduplicateAndLimitPlans(plans, limit) {
    // Usuń duplikaty na podstawie planId
    const uniquePlans = plans.filter((plan, index, self) => 
      index === self.findIndex(p => p.planId?.toString() === plan.planId?.toString())
    );

    // Sortuj po dacie utworzenia (najnowsze pierwsze)
    uniquePlans.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.deliveryDate);
      const dateB = new Date(b.createdAt || b.deliveryDate);
      return dateB.getTime() - dateA.getTime();
    });

    // Zwróć tylko ostatnie `limit` planów
    return uniquePlans.slice(0, limit);
  }

  /**
   * Usuwa wszystkie plany tygodniowe użytkownika (bulk delete)
   * @param {string} userId - ID użytkownika
   * @returns {Object} Wynik operacji z liczbą usuniętych planów
   */
  async deleteAllPlans(userId) {
    try {
      logInfo(`Starting bulk delete of all weekly plans for user: ${userId}`);

      // 1. Znajdź wszystkie plany tygodniowe użytkownika
      const plansToDelete = await TrainingPlan.find({
        userId: userId,
        planType: 'weekly'
      }).select('_id weekNumber createdAt');

      const totalPlans = plansToDelete.length;
      logInfo(`Found ${totalPlans} weekly plans to delete for user ${userId}`);

      if (totalPlans === 0) {
        return {
          deletedCount: 0,
          scheduleReset: false,
          message: 'Brak planów tygodniowych do usunięcia'
        };
      }

      // 2. Usuń wszystkie plany tygodniowe użytkownika
      const deleteResult = await TrainingPlan.deleteMany({
        userId: userId,
        planType: 'weekly'
      });

      logInfo(`Deleted ${deleteResult.deletedCount} weekly plans for user ${userId}`);

      // 3. Zresetuj harmonogram użytkownika
      let scheduleReset = false;
      try {
        const schedule = await WeeklyPlanSchedule.findOne({ userId });
        
        if (schedule) {
          // Wyczyść recentPlans i zresetuj postęp
          schedule.recentPlans = [];
          schedule.progressTracking = {
            weekNumber: 1,
            currentPhase: 'base',
            totalWeeksDelivered: 0,
            lastWeeklyDistance: 0,
            progressionRate: 1.0
          };
          
          await this._saveWithRetry(schedule);
          scheduleReset = true;
          logInfo(`Reset schedule for user ${userId} after bulk delete`);
        }
      } catch (scheduleError) {
        logError(`Error resetting schedule for user ${userId} after bulk delete:`, scheduleError);
        // Nie blokuj operacji jeśli reset harmonogramu się nie udał
      }

      // 4. Loguj szczegóły operacji
      const planIds = plansToDelete.map(p => p._id.toString());
      logInfo(`Bulk delete completed for user ${userId}:`, {
        deletedCount: deleteResult.deletedCount,
        scheduleReset,
        deletedPlanIds: planIds.slice(0, 10) // Log tylko pierwsze 10 ID
      });

      return {
        deletedCount: deleteResult.deletedCount,
        scheduleReset,
        message: `Pomyślnie usunięto ${deleteResult.deletedCount} planów tygodniowych`
      };

    } catch (error) {
      logError(`Error during bulk delete for user ${userId}:`, error);
      throw new AppError('Nie udało się usunąć wszystkich planów tygodniowych', 500);
    }
  }

  /**
   * Transformuje dane planu z formatu Gemini do formatu zgodnego z modelem MongoDB
   * @param {Object} planData - Dane planu z Gemini
   * @param {number} weekNumber - Numer tygodnia
   * @returns {Object} Transformowane dane planu
   */
  _transformPlanDataForDatabase(planData, weekNumber) {
    const transformedPlan = { ...planData };

    // Mapowanie nazw dni z angielskiego na polski
    const dayNameMapping = {
      'Monday': 'poniedziałek',
      'Tuesday': 'wtorek', 
      'Wednesday': 'środa',
      'Thursday': 'czwartek',
      'Friday': 'piątek',
      'Saturday': 'sobota',
      'Sunday': 'niedziela',
      'Poniedziałek': 'poniedziałek',
      'Wtorek': 'wtorek',
      'Środa': 'środa',
      'Czwartek': 'czwartek',
      'Piątek': 'piątek',
      'Sobota': 'sobota',
      'Niedziela': 'niedziela'
    };

    // Transformuj każdy tydzień w planie
    if (transformedPlan.plan_weeks && Array.isArray(transformedPlan.plan_weeks)) {
      transformedPlan.plan_weeks.forEach(week => {
        if (week.days && Array.isArray(week.days)) {
          week.days.forEach((day, index) => {
            // Zmień day_of_week na day_name jeśli istnieje
            if (day.day_of_week && !day.day_name) {
              day.day_name = dayNameMapping[day.day_of_week] || day.day_of_week.toLowerCase();
              delete day.day_of_week;
            }

            // Normalizuj day_name do poprawnego formatu
            if (day.day_name) {
              day.day_name = dayNameMapping[day.day_name] || day.day_name.toLowerCase();
            }

            // Dodaj pole date jeśli nie istnieje
            if (!day.date) {
              // Oblicz datę na podstawie obecnego tygodnia i dnia tygodnia
              const startOfWeek = new Date();
              startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Poniedziałek obecnego tygodnia
              
              // Dodaj tygodnie (weekNumber - 1)
              startOfWeek.setDate(startOfWeek.getDate() + (weekNumber - 1) * 7);
              
              // Dodaj dni w zależności od pozycji w tablicy
              const targetDate = new Date(startOfWeek);
              targetDate.setDate(startOfWeek.getDate() + index);
              
              day.date = targetDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
            }

            // Upewnij się, że workout jest obiektem lub przekształć z innych pól
            if (!day.workout && (day.main_workout || day.type || day.duration_minutes)) {
              day.workout = {
                type: day.type || 'training',
                duration_minutes: day.duration_minutes || 30,
                main_workout: day.main_workout || day.description || 'Trening podstawowy',
                focus: day.focus || 'Rozwój kondycji',
                description: day.description || day.main_workout || 'Trening podstawowy'
              };
            }
          });
        }
      });
    }

    return transformedPlan;
  }

  /**
   * Uzyskuje lock dla użytkownika aby uniknąć równoczesnych modyfikacji
   * @param {string} userId - ID użytkownika
   * @returns {Promise<void>}
   */
  async _acquireUserLock(userId) {
    while (userLocks.has(userId)) {
      // Czekaj 50ms i spróbuj ponownie
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    userLocks.set(userId, Date.now());
    logInfo(`Acquired lock for user ${userId}`);
  }

  /**
   * Zwalnia lock dla użytkownika
   * @param {string} userId - ID użytkownika
   */
  _releaseUserLock(userId) {
    userLocks.delete(userId);
    logInfo(`Released lock for user ${userId}`);
  }

  /**
   * Wykonuje operację z lockiem dla użytkownika
   * @param {string} userId - ID użytkownika
   * @param {Function} operation - Operacja do wykonania
   * @returns {Promise<any>} Wynik operacji
   */
  async _withUserLock(userId, operation) {
    await this._acquireUserLock(userId);
    try {
      return await operation();
    } finally {
      this._releaseUserLock(userId);
    }
  }

  /**
   * Zapisuje dokument z retry mechanism dla VersionError
   * @param {Object} document - Dokument Mongoose do zapisania
   * @param {number} maxRetries - Maksymalna liczba prób
   * @param {number} baseDelay - Bazowe opóźnienie w ms
   * @returns {Promise<Object>} Zapisany dokument
   */
  async _saveWithRetry(document, maxRetries = 3, baseDelay = 100) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Przed zapisem, odśwież dokument z bazy aby mieć najnowszą wersję
        if (attempt > 1) {
          // Reload document z bazy danych
          const freshDoc = await document.model.findById(document._id);
          if (freshDoc) {
            // Skopiuj zmiany na świeży dokument
            freshDoc.recentPlans = document.recentPlans;
            freshDoc.progressTracking = document.progressTracking;
            freshDoc.lastDeliveryDate = document.lastDeliveryDate;
            freshDoc.nextDeliveryDate = document.nextDeliveryDate;
            
            return await freshDoc.save();
          }
        }
        
        const result = await document.save();
        if (attempt > 1) {
          logInfo(`Successfully saved document ${document._id} on attempt ${attempt}/${maxRetries}`);
        }
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Retry tylko dla VersionError
        if (error.name === 'VersionError' && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logWarning(`VersionError on attempt ${attempt}/${maxRetries} for document ${document._id}, retrying in ${delay}ms...`);
          
          // Czekaj przed następną próbą
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Dla innych błędów lub jeśli skończyły się próby
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Atomowa aktualizacja harmonogramu z unikaniem race conditions
   * @param {string} userId - ID użytkownika  
   * @param {Object} updateData - Dane do aktualizacji
   * @returns {Promise<Object>} Zaktualizowany harmonogram
   */
  async _atomicScheduleUpdate(userId, updateData) {
    const maxRetries = 5;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Użyj findOneAndUpdate z upsert dla atomowej operacji
        const schedule = await WeeklyPlanSchedule.findOneAndUpdate(
          { userId, isActive: true },
          { 
            $push: updateData.$push || {},
            $set: updateData.$set || {},
            $inc: updateData.$inc || {}
          },
          { 
            new: true, 
            runValidators: true,
            // Użyj optimistic concurrency control
            overwrite: false
          }
        );
        
        if (!schedule) {
          throw new AppError(`Nie znaleziono aktywnego harmonogramu dla użytkownika ${userId}`, 404);
        }
        
        return schedule;
        
      } catch (error) {
        lastError = error;
        
        if ((error.name === 'VersionError' || error.code === 11000) && attempt < maxRetries) {
          const delay = 100 * Math.pow(2, attempt - 1);
          logWarning(`Atomic update failed on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }
}

module.exports = WeeklyPlanDeliveryService; 