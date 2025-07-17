const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
const TrainingPlan = require('../models/training-plan.model');
const GeminiService = require('./gemini.service');
const runningKnowledgeBase = require('../knowledge/running-knowledge-base');
const correctiveExercisesKnowledgeBase = require('../knowledge/corrective-knowledge-base');
const AppError = require('../utils/app-error');
const { logInfo, logError } = require('../utils/logger');

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
      await schedule.save();

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

      await schedule.save();
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
      await schedule.save();

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
      await schedule.save();

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
   * @returns {Object} Wygenerowany plan treningowy
   */
  async generateWeeklyPlan(schedule) {
    try {
      // Przygotuj dane dla generatora planów
      const weeklyData = this.prepareWeeklyPlanData(schedule);
      
      let planData;
      try {
        // Wygeneruj plan za pomocą ulepszonego Gemini Service (z wbudowanym fallbackiem)
        planData = await this.geminiService.generateWeeklyTrainingPlan(weeklyData);
      } catch (error) {
        logError('Błąd podczas generowania planu tygodniowego', error);
        throw new AppError('Nie udało się wygenerować planu tygodniowego. Spróbuj ponownie później.', 500);
      }

      // Utwórz plan treningowy w bazie danych
      const trainingPlan = new TrainingPlan({
        ...planData,
        userId: schedule.userId,
        planType: 'weekly',
        weekNumber: schedule.progressTracking.weekNumber,
        parentSchedule: schedule._id
      });

      await trainingPlan.save();

      // Aktualizuj harmonogram
      schedule.recentPlans.push({
        weekNumber: schedule.progressTracking.weekNumber,
        planId: trainingPlan._id,
        deliveryDate: new Date()
      });

      // Zachowaj tylko ostatnie 4 plany
      if (schedule.recentPlans.length > 4) {
        schedule.recentPlans = schedule.recentPlans.slice(-4);
      }

      schedule.updateProgress();
      await schedule.save();

      logInfo(`Wygenerowano plan tygodniowy dla użytkownika ${schedule.userId}, tydzień ${schedule.progressTracking.weekNumber}`);
      return trainingPlan;
    } catch (error) {
      logError('Błąd podczas generowania planu tygodniowego', error);
      throw error;
    }
  }

  /**
   * Przygotowuje dane dla generatora planów tygodniowych
   * @param {Object} schedule - Harmonogram dostarczania
   * @returns {Object} Dane dla generatora
   */
  prepareWeeklyPlanData(schedule) {
    const weeklyData = {
      // Podstawowe dane użytkownika
      ...schedule.userProfile,
      
      // Kontekst progresji
      weekNumber: schedule.progressTracking.weekNumber,
      currentPhase: schedule.progressTracking.currentPhase,
      totalWeeksDelivered: schedule.progressTracking.totalWeeksDelivered,
      
      // Adaptacja na podstawie poprzednich tygodni
      lastWeeklyDistance: schedule.progressTracking.lastWeeklyDistance,
      progressionRate: schedule.progressTracking.progressionRate,
      
      // Cel długoterminowy
      longTermGoal: schedule.longTermGoal,
      
      // Ustawienia adaptacji
      adaptationSettings: schedule.adaptationSettings,
      
      // Historia realizacji (jeśli dostępna)
      recentPerformance: this.analyzeRecentPerformance(schedule.recentPlans),
      
      // Typ planu
      planType: 'weekly',
      deliveryFrequency: schedule.deliveryFrequency
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

    const completed = recentPlans.filter(plan => plan.wasCompleted);
    const averageCompletion = completed.length / recentPlans.length;
    
    let trend = 'stable';
    if (recentPlans.length >= 2) {
      const recent = recentPlans.slice(-2);
      if (recent[1].completionRate > recent[0].completionRate + 0.1) {
        trend = 'improving';
      } else if (recent[1].completionRate < recent[0].completionRate - 0.1) {
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
   * Metoda do uruchamiania przez cron job
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
          await this.generateWeeklyPlan(schedule);
          results.successful++;
          logInfo(`Pomyślnie dostarczone plan dla użytkownika ${schedule.userId}`);
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
   * @param {number} weekNumber - Numer tygodnia
   * @param {Object} progressData - Dane o postępie
   */
  async updateWeeklyProgress(userId, weekNumber, progressData) {
    try {
      const schedule = await WeeklyPlanSchedule.findOne({
        userId,
        isActive: true
      });

      if (!schedule) {
        throw new AppError('Nie znaleziono aktywnego harmonogramu dla użytkownika', 404);
      }

      // Znajdź odpowiedni plan w historii
      const planIndex = schedule.recentPlans.findIndex(
        plan => plan.weekNumber === weekNumber
      );

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
        
        await schedule.save();
        logInfo(`Zaktualizowano postęp tygodnia ${weekNumber} dla użytkownika ${userId}`);

        // Natychmiast wygeneruj nowy plan po ocenie
        const newPlan = await this.generateWeeklyPlan(schedule);
        logInfo(`Wygenerowano nowy plan tygodniowy po ocenie dla użytkownika ${userId}`);

        return {
          schedule,
          newPlan
        };
      }

      return { schedule };
    } catch (error) {
      logError('Błąd podczas aktualizacji postępu tygodniowego', error);
      throw error;
    }
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
}

module.exports = WeeklyPlanDeliveryService; 