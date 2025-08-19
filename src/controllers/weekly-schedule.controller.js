const WeeklyPlanDeliveryService = require('../services/weekly-plan-delivery.service');
const TrainingPlan = require('../models/training-plan.model');
const AppError = require('../utils/app-error');
const { logError, logInfo, logWarning } = require('../utils/logger');
const aiJobService = require('../services/ai-job.service');
const sseNotificationService = require('../services/sse-notification.service');

/**
 * Kontroler odpowiedzialny za zarządzanie harmonogramami dostarczania planów tygodniowych
 */
function WeeklyScheduleController() {
  this.weeklyPlanDeliveryService = new WeeklyPlanDeliveryService();
  
  // Bind methods to this instance
  this.createSchedule = this.createSchedule.bind(this);
  this.getSchedule = this.getSchedule.bind(this);
  this.updateSchedule = this.updateSchedule.bind(this);
  this.pauseSchedule = this.pauseSchedule.bind(this);
  this.resumeSchedule = this.resumeSchedule.bind(this);
  this.deactivateSchedule = this.deactivateSchedule.bind(this);
  this.updateProgress = this.updateProgress.bind(this);
  this.manualDelivery = this.manualDelivery.bind(this);
  this.getHistory = this.getHistory.bind(this);
  this.getAllWeeklyPlans = this.getAllWeeklyPlans.bind(this);
  this.generateNewPlan = this.generateNewPlan.bind(this);
  this.deleteAllPlans = this.deleteAllPlans.bind(this);
  this.getJobStatus = this.getJobStatus.bind(this);
  this.getNotifications = this.getNotifications.bind(this);
}

WeeklyScheduleController.prototype.createSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    const scheduleData = req.body;

    // Szczegółowe logowanie na początku
    logInfo(`Creating schedule for user ${userId}`, {
      hasUserProfile: !!scheduleData.userProfile,
      hasDniTreningowe: !!scheduleData.userProfile?.dniTreningowe,
      hasTrainingDays: !!scheduleData.userProfile?.trainingDays,
      userProfileKeys: Object.keys(scheduleData.userProfile || {}),
      dniTreningoweValue: scheduleData.userProfile?.dniTreningowe,
      trainingDaysValue: scheduleData.userProfile?.trainingDays
    });

    if (!scheduleData.userProfile) {
      logError(`Missing userProfile in request for user ${userId}`);
      return res.status(400).json({
        error: 'Dane profilu użytkownika są wymagane'
      });
    }

    // Walidacja dni treningowych - to jest krytyczne dla generowania planów
    if (!scheduleData.userProfile?.dniTreningowe && !scheduleData.userProfile?.trainingDays) {
      logWarning(`Missing training days in userProfile for user ${userId}`, {
        userProfile: scheduleData.userProfile,
        availableKeys: Object.keys(scheduleData.userProfile || {})
      });
      
      // Zwróć błąd walidacji jeśli nie ma dni treningowych
      return res.status(400).json({
        error: 'Dni treningowe są wymagane do utworzenia harmonogramu. Proszę określić dniTreningowe lub trainingDays w profilu użytkownika.',
        details: {
          missingFields: ['dniTreningowe', 'trainingDays'],
          receivedFields: Object.keys(scheduleData.userProfile || {})
        }
      });
    }

    // Normalizacja danych - upewnij się że mamy dni treningowe w odpowiednim formacie
    if (scheduleData.userProfile.trainingDays && !scheduleData.userProfile.dniTreningowe) {
      scheduleData.userProfile.dniTreningowe = scheduleData.userProfile.trainingDays;
      logInfo(`Normalized trainingDays to dniTreningowe for user ${userId}`, {
        trainingDays: scheduleData.userProfile.trainingDays,
        normalizedTo: scheduleData.userProfile.dniTreningowe
      });
    }

    // Walidacja formatu dni treningowych
    const dniTreningowe = scheduleData.userProfile.dniTreningowe || scheduleData.userProfile.trainingDays;
    if (!Array.isArray(dniTreningowe) || dniTreningowe.length === 0) {
      logError(`Invalid training days format for user ${userId}`, {
        dniTreningowe,
        type: typeof dniTreningowe,
        isArray: Array.isArray(dniTreningowe)
      });
      return res.status(400).json({
        error: 'Dni treningowe muszą być niepustą tablicą',
        details: {
          received: dniTreningowe,
          expected: 'Array with at least one training day'
        }
      });
    }

    logInfo(`Validated training days for user ${userId}`, {
      dniTreningowe: dniTreningowe,
      count: dniTreningowe.length
    });

    const schedule = await this.weeklyPlanDeliveryService.createSchedule(userId, scheduleData);

    res.status(201).json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    logError('Błąd tworzenia harmonogramu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas tworzenia harmonogramu'
    });
  }
};

WeeklyScheduleController.prototype.getSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    
    console.log(`🔍 [SCHEDULE-CONTROLLER] Getting schedule for user: ${userId}`);
    
    // Pobierz harmonogram - jeśli nie ma, stwórz go
    const schedule = await this.weeklyPlanDeliveryService.getUserScheduleWithFallback(userId);
    
    // Wyciągnij aktualny plan z recentPlans
    let currentPlan = null;
    if (schedule && schedule.recentPlans && schedule.recentPlans.length > 0) {
      const latestPlan = schedule.recentPlans[0];
      if (latestPlan && latestPlan.planId) {
        currentPlan = latestPlan.planId;
        console.log(`🔍 [SCHEDULE-CONTROLLER] PLAN SOURCE: From harmonogram.recentPlans[0]`);
        console.log(`🔍 [SCHEDULE-CONTROLLER] Plan ID: ${latestPlan.planId._id}, Week: ${latestPlan.weekNumber}`);
      }
    }
    
    if (!currentPlan) {
      console.log(`🔍 [SCHEDULE-CONTROLLER] PLAN SOURCE: Brak planu w harmonogramie${schedule ? ' (harmonogram istnieje)' : ''}`);
    }

    res.json({
      status: 'success',
      data: {
        schedule,
        currentPlan,
        pendingReview: null,
        upcomingDelivery: schedule?.nextDeliveryDate || null,
        fallbackCreated: schedule._id === undefined ? false : schedule._id.toString().includes('fallback')
      }
    });
  } catch (error) {
    console.log(`❌ [SCHEDULE-CONTROLLER] Błąd pobierania harmonogramu:`, error.message);
    logError('Błąd pobierania harmonogramu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        needsSetup: error.statusCode === 400 && error.message.includes('Brak danych formularza')
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas pobierania harmonogramu'
    });
  }
};

WeeklyScheduleController.prototype.updateSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    const updateData = req.body;

    const schedule = await this.weeklyPlanDeliveryService.updateSchedule(userId, updateData);

    res.json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    logError('Błąd aktualizacji harmonogramu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas aktualizacji harmonogramu'
    });
  }
};

WeeklyScheduleController.prototype.pauseSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    const { pauseUntil } = req.body;

    const schedule = await this.weeklyPlanDeliveryService.pauseSchedule(userId, pauseUntil);

    res.json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    logError('Błąd wstrzymania harmonogramu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas wstrzymania harmonogramu'
    });
  }
};

WeeklyScheduleController.prototype.resumeSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;

    const schedule = await this.weeklyPlanDeliveryService.resumeSchedule(userId);

    res.json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    logError('Błąd wznawiania harmonogramu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas wznawiania harmonogramu'
    });
  }
};

WeeklyScheduleController.prototype.deactivateSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;

    const schedule = await this.weeklyPlanDeliveryService.deactivateSchedule(userId);

    res.json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    logError('Błąd deaktywacji harmonogramu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas deaktywacji harmonogramu'
    });
  }
};

WeeklyScheduleController.prototype.updateProgress = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    const { planId, weekNumber, progressData } = req.body;

    logInfo(`Otrzymano żądanie aktualizacji postępu dla użytkownika ${userId}: planId=${planId}, weekNumber=${weekNumber}`);

    // Użyj planId jeśli dostępne, w przeciwnym razie weekNumber
    const planIdentifier = planId || weekNumber;
    
    if (!planIdentifier) {
      return res.status(400).json({
        status: 'error',
        error: 'Wymagany jest planId lub weekNumber'
      });
    }

    if (!progressData) {
      return res.status(400).json({
        status: 'error',
        error: 'Dane postępu są wymagane'
      });
    }

    const result = await this.weeklyPlanDeliveryService.updateWeeklyProgress(
      userId,
      planIdentifier,
      progressData
    );

    let jobId = null;
    // Jeśli zaktualizowano postęp, wygeneruj nowy plan w kolejce Redis
    if (result.scheduleUpdated || result.updatedPlan) {
      try {
        // Pobierz harmonogram dla kolejki (z fallbackiem)
        const schedule = await this.weeklyPlanDeliveryService.getUserScheduleWithFallback(userId);
        
        jobId = await aiJobService.queueWeeklyPlanGeneration(
          userId,
          schedule._id,
          { resetToWeekOne: false },
          { priority: 2 } // Wyższy priorytet dla generowania po ocenie
        );
        
        logInfo(`Dodano zadanie generowania kolejnego planu do kolejki: ${jobId}`);
      } catch (queueError) {
        logError('Błąd podczas dodawania zadania do kolejki:', queueError);
        // Nie blokuj odpowiedzi jeśli kolejka nie działa
      }
    }

    // Przygotuj odpowiedź w zależności od tego co zostało zaktualizowane
    const responseData = {
      message: result.message || 'Postęp został zaktualizowany',
      updated: {
        schedule: !!result.scheduleUpdated,
        plan: !!result.updatedPlan
      }
    };

    // Dodaj informację o kolejce Redis
    if (jobId) {
      responseData.planGenerationQueued = true;
      responseData.jobId = jobId;
      responseData.statusUrl = `/api/plans/status/${jobId}`;
      responseData.message = 'Postęp zapisany, nowy plan jest generowany w kolejce Redis';
    }

    // Zachowaj starą logikę dla przypadków gdy plan jest od razu dostępny (nie powinno się zdarzyć)
    if (result.newPlan) {
      responseData.newPlan = result.newPlan;
      responseData.message = 'Postęp zapisany i wygenerowano nowy plan';
    }

    // Dodaj informacje o harmonogramie jeśli istnieje
    if (result.schedule) {
      responseData.schedule = result.schedule;
    }

    // Dodaj informacje o zaktualizowanym planie
    if (result.updatedPlan) {
      responseData.updatedPlan = result.updatedPlan;
    }

    res.json({
      status: 'success',
      data: responseData
    });

    logInfo(`Pomyślnie zaktualizowano postęp dla użytkownika ${userId}: ${result.message}`);

  } catch (error) {
    logError('Błąd aktualizacji postępu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message
      });
    }
    
    return res.status(500).json({
      status: 'error',
      error: 'Wystąpił błąd podczas aktualizacji postępu'
    });
  }
};

WeeklyScheduleController.prototype.manualDelivery = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    const { resetWeekNumber = false } = req.body; // Opcja resetowania numeru tygodnia

    logInfo(`Manual delivery requested for user ${userId} with resetWeekNumber=${resetWeekNumber}`);

    let schedule;
    let expectedWeekNumber;
    
    if (resetWeekNumber) {
      logInfo('Using mock schedule for new plan generation (starting from week 1)');
      expectedWeekNumber = 1;
      
      // Try to get user profile from existing schedule or saved form data
      let userProfile = {
        name: 'User',
        age: 30,
        experienceLevel: 'beginner',
        mainGoal: 'start_running',
        daysPerWeek: 3
      };
      
      // ZAWSZE próbuj pobrać dane z najnowszego formularza
      try {
        const TrainingFormSubmission = require('../models/running-form.model');
        // Znajdź najnowszy formularz z wypełnionymi dniami treningowymi
        const latestForm = await TrainingFormSubmission.findOne({ 
          userId,
          dniTreningowe: { $exists: true, $ne: [], $ne: null }
        }).sort({ createdAt: -1 });
        
        if (latestForm) {
          const formData = latestForm.toObject();
          logInfo(`=== DEBUG: Pobrano formularz dla użytkownika ${userId} (manual delivery) ===`, {
            formId: latestForm._id,
            createdAt: latestForm.createdAt,
            dniTreningowe: formData.dniTreningowe,
            allFormFields: Object.keys(formData),
            imieNazwisko: formData.imieNazwisko,
            poziomZaawansowania: formData.poziomZaawansowania
          });
          
          const trainingPlanController = require('./training-plan.controller');
          userProfile = trainingPlanController.mapFormToUserProfile(formData);
          logInfo(`Using profile from latest form data for user ${userId}: ${userProfile.name}, dni: ${JSON.stringify(userProfile.dniTreningowe)}`);
        } else {
          // Fallback: spróbuj istniejący harmonogram tylko gdy brak formularza
          try {
            const existingSchedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
            if (existingSchedule && existingSchedule.userProfile) {
              userProfile = { ...userProfile, ...existingSchedule.userProfile };
              logInfo(`No form found - using existing schedule profile for user ${userId}`);
            } else {
              logInfo('No saved form data and no existing schedule found');
            }
          } catch (scheduleError) {
            logError('Error fetching existing schedule:', scheduleError);
            logInfo('Using default profile due to schedule fetch error');
          }
        }
      } catch (formError) {
        logError('Error fetching form data:', formError);
        logInfo('Using default profile due to form fetch error');
      }
      
      // Stwórz tymczasowy obiekt schedule dla nowego planu (od tygodnia 1)
      schedule = {
        userId: userId,
        userProfile: userProfile,
        progressTracking: {
          weekNumber: 1,
          currentPhase: 'base',
          totalWeeksDelivered: 0,
          lastWeeklyDistance: 0,
          progressionRate: 1.0
        },
        longTermGoal: 'general_fitness',
        deliveryFrequency: 'weekly',
        adaptationSettings: {
          autoAdjust: true
        },
        recentPlans: [],
        _id: 'mock-schedule-id',
        
        // Mockowe metody dla testów
        updateProgress: function() {
          // Don't update for new plans - let generateWeeklyPlan handle it
        },
        save: async function() {
          return Promise.resolve(this);
        }
      };
    } else {
      logInfo('Using real schedule for week progression');
      // Pobierz prawdziwy harmonogram użytkownika (dla kolejnego tygodnia)
      schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
      
      if (!schedule) {
        return res.status(404).json({
          error: 'Nie znaleziono harmonogramu użytkownika. Użyj resetWeekNumber=true aby utworzyć nowy plan.'
        });
      }
      
      const currentWeek = schedule.progressTracking?.weekNumber || 1;
      expectedWeekNumber = currentWeek + 1;
      logInfo(`Using real schedule - progressing from week ${currentWeek} to week ${expectedWeekNumber}`);
    }

    // Dodaj zadanie do kolejki Redis zamiast synchronicznego generowania
    const planData = {
      resetToWeekOne: resetWeekNumber,
      mockSchedule: resetWeekNumber ? schedule : null
    };
    
    const jobId = await aiJobService.queueWeeklyPlanGeneration(
      userId,
      resetWeekNumber ? null : schedule._id,
      planData,
      { priority: 3 } // Najwyższy priorytet dla ręcznego generowania
    );

    res.json({
      status: 'queued',
      data: {
        jobId,
        expectedWeekNumber,
        isNewPlan: resetWeekNumber,
        statusUrl: `/api/plans/status/${jobId}`,
        message: resetWeekNumber 
          ? `Nowy plan jest generowany w kolejce od tygodnia ${expectedWeekNumber}`
          : `Plan progresji jest generowany w kolejce dla tygodnia ${expectedWeekNumber}`
      }
    });
  } catch (error) {
    logError('Błąd ręcznego generowania planu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas ręcznego generowania planu'
    });
  }
};

WeeklyScheduleController.prototype.getHistory = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    const { limit, offset } = req.query;

    // Pobierz plany bezpośrednio z TrainingPlan tabeli
    const plans = await TrainingPlan.find({
      userId: userId,
      planType: 'weekly'
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) || 10)
    .skip(parseInt(offset) || 0)
    .select('id weekNumber metadata createdAt plan_weeks userId planType');

    logInfo(`Found ${plans.length} weekly plans for user ${userId}`);

    res.json({
      status: 'success',
      data: {
        plans: plans,
        pagination: {
          limit: parseInt(limit) || 10,
          offset: parseInt(offset) || 0,
          total: plans.length
        }
      }
    });
  } catch (error) {
    logError('Błąd pobierania historii', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas pobierania historii'
    });
  }
};

WeeklyScheduleController.prototype.getAllWeeklyPlans = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    
    // Pobierz plany bezpośrednio z TrainingPlan tabeli
    const plans = await TrainingPlan.find({
      userId: userId,
      planType: 'weekly'
    })
    .sort({ createdAt: -1 })
    .select('id weekNumber metadata createdAt plan_weeks userId planType');

    logInfo(`Found ${plans.length} weekly plans for getAllWeeklyPlans for user ${userId}`);

    // Przekształć plany do formatu oczekiwanego przez frontend
    const weeklyPlans = plans.map((plan, index) => ({
      weekNumber: plan.weekNumber || (index + 1),
      deliveryDate: plan.createdAt.toISOString(),
      plan: plan
    }));

    // Spróbuj pobrać harmonogram dla metadanych (opcjonalne)
    let schedule = null;
    let totalWeeks = plans.length;
    let currentWeek = plans.length > 0 ? Math.max(...plans.map(p => p.weekNumber || 1)) : 1;
    
    try {
      schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
      if (schedule) {
        // Use longTermGoal.remainingWeeks if available for total program duration
        if (schedule.longTermGoal && schedule.longTermGoal.remainingWeeks) {
          totalWeeks = schedule.longTermGoal.remainingWeeks;
        } else {
          // Default to 12 weeks if no specific goal is set
          totalWeeks = 12;
        }
        
        if (schedule.progressTracking) {
          currentWeek = schedule.progressTracking.weekNumber || currentWeek;
        }
      }
    } catch (scheduleError) {
      logInfo(`No schedule found for user ${userId}, using default 12 weeks program`);
      totalWeeks = 12; // Default to 12 weeks program
    }

    res.json({
      status: 'success',
      data: {
        totalWeeks: totalWeeks,
        currentWeek: currentWeek,
        plans: weeklyPlans
      }
    });
  } catch (error) {
    logError('Błąd pobierania planów tygodniowych', error);
    return res.status(500).json({
      error: 'Wystąpił błąd podczas pobierania planów tygodniowych'
    });
  }
};

/**
 * Waliduje i czyści recentPlans, usuwając stale referencje
 * @param {Object} schedule - Harmonogram użytkownika
 * @param {string} userId - ID użytkownika
 * @returns {Array} Zwalidowane plany
 */
WeeklyScheduleController.prototype._validateAndCleanupPlans = async function(schedule, userId) {
  const validatedPlans = [];
  const staleReferences = [];

  // Sprawdź każdy plan w recentPlans
  for (const planRef of schedule.recentPlans || []) {
    try {
      // Sprawdź czy plan istnieje i należy do użytkownika
      const plan = await TrainingPlan.findOne({
        _id: planRef.planId,
        userId: userId,
        planType: 'weekly'
      }).lean();

      if (plan) {
        // Plan istnieje - dodaj do validatedPlans
        validatedPlans.push({
          weekNumber: planRef.weekNumber,
          deliveryDate: planRef.deliveryDate,
          plan: plan
        });
      } else {
        // Plan nie istnieje - zaznacz jako stale reference
        staleReferences.push(planRef);
        logWarning(`Znaleziono stale reference do planu ${planRef.planId} dla użytkownika ${userId}`);
      }
    } catch (error) {
      // Błąd podczas sprawdzania planu - zaznacz jako stale reference
      staleReferences.push(planRef);
      logError(`Błąd podczas walidacji planu ${planRef.planId}`, error);
    }
  }

  // Jeśli znaleziono stale referencje, usuń je z harmonogramu
  if (staleReferences.length > 0) {
    await this._cleanupStaleReferences(schedule, staleReferences, userId);
  }

  return validatedPlans;
};

/**
 * Usuwa stale referencje z harmonogramu
 * @param {Object} schedule - Harmonogram użytkownika
 * @param {Array} staleReferences - Lista stalych referencji do usunięcia
 * @param {string} userId - ID użytkownika
 */
WeeklyScheduleController.prototype._cleanupStaleReferences = async function(schedule, staleReferences, userId) {
  try {
    // Usuń stale referencje z recentPlans
    const staleIds = staleReferences.map(ref => ref.planId?.toString());
    schedule.recentPlans = schedule.recentPlans.filter(planRef => 
      !staleIds.includes(planRef.planId?.toString())
    );

    // Zapisz zaktualizowany harmonogram
    await schedule.save();
    
    logInfo(`Usunięto ${staleReferences.length} stalych referencji dla użytkownika ${userId}`);
  } catch (error) {
    logError(`Błąd podczas usuwania stalych referencji dla użytkownika ${userId}`, error);
  }
};

/**
 * Generuje nowy plan tygodniowy (zaczynając od tygodnia 1)
 */
WeeklyScheduleController.prototype.generateNewPlan = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    
    logInfo(`Generating new plan for user ${userId} starting from week 1`);

    // Spróbuj pobrać dane użytkownika z istniejącego harmonogramu lub formularza
    let userProfile = {
      name: 'User',
      age: 30,
      experienceLevel: 'beginner',
      mainGoal: 'start_running',
      daysPerWeek: 3
    };
    
    // ZAWSZE próbuj pobrać dane z najnowszego formularza
    try {
      const TrainingFormSubmission = require('../models/running-form.model');
      // Znajdź najnowszy formularz z wypełnionymi dniami treningowymi
      const latestForm = await TrainingFormSubmission.findOne({ 
        userId,
        dniTreningowe: { $exists: true, $ne: [], $ne: null }
      }).sort({ createdAt: -1 });
      
      if (latestForm) {
        const formData = latestForm.toObject();
        logInfo(`=== DEBUG: Pobrano formularz dla użytkownika ${userId} ===`, {
          formId: latestForm._id,
          createdAt: latestForm.createdAt,
          dniTreningowe: formData.dniTreningowe,
          allFormFields: Object.keys(formData),
          imieNazwisko: formData.imieNazwisko,
          poziomZaawansowania: formData.poziomZaawansowania
        });
        
        const trainingPlanController = require('./training-plan.controller');
        userProfile = trainingPlanController.mapFormToUserProfile(formData);
        logInfo(`Using profile from latest form data for new plan: ${userProfile.name}, dni: ${JSON.stringify(userProfile.dniTreningowe)}`);
      } else {
        // Brak formularza - stwórz podstawowy harmonogram
        logInfo('No form found - creating basic schedule with default profile');
        // Zostaw domyślny userProfile, system stworzy harmonogram automatycznie
      }
    } catch (formError) {
      logError('Error fetching form data for new plan:', formError);
      return res.status(500).json({
        status: 'error',
        error: 'Błąd podczas pobierania danych formularza',
        details: formError.message
      });
    }

    
    // Walidacja dni treningowych - BEZ fallbacków
    const hasTrainingDays = userProfile?.dniTreningowe && userProfile.dniTreningowe.length > 0;
    const hasTrainingDaysEn = userProfile?.trainingDays && userProfile.trainingDays.length > 0;
    
    if (!hasTrainingDays && !hasTrainingDaysEn) {
      logError(`User ${userId} nie ma określonych dni treningowych`, {
        userProfile_dniTreningowe: userProfile?.dniTreningowe,
        userProfile_trainingDays: userProfile?.trainingDays
      });
      
      return res.status(400).json({
        status: 'error',
        error: 'Brak dni treningowych. Musisz określić dni treningowe w swoim profilu aby wygenerować plan.',
        details: 'Przejdź do ustawień profilu i wybierz dni treningowe.'
      });
    }

    // Utwórz lub zaktualizuj prawdziwy harmonogram dla nowego planu
    let schedule;
    try {
      const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
      const existingSchedule = await WeeklyPlanSchedule.findOne({ userId });
      
      if (existingSchedule) {
        // Zaktualizuj istniejący harmonogram - resetuj do tygodnia 1
        existingSchedule.userProfile = userProfile; // Zaktualizuj profil użytkownika
        existingSchedule.progressTracking.weekNumber = 1;
        existingSchedule.progressTracking.currentPhase = 'base';
        existingSchedule.progressTracking.totalWeeksDelivered = 0;
        existingSchedule.progressTracking.lastWeeklyDistance = 0;
        existingSchedule.progressTracking.progressionRate = 1.0;
        existingSchedule.recentPlans = []; // Wyczyść poprzednie plany
        existingSchedule.isActive = true;
        existingSchedule.nextDeliveryDate = new Date();
        
        schedule = await existingSchedule.save();
        logInfo(`Zresetowano istniejący harmonogram użytkownika ${userId} do tygodnia 1`);
      } else {
        // Utwórz nowy harmonogram
        schedule = new WeeklyPlanSchedule({
          userId: userId,
          userProfile: userProfile,
          progressTracking: {
            weekNumber: 1,
            currentPhase: 'base',
            totalWeeksDelivered: 0,
            lastWeeklyDistance: 0,
            progressionRate: 1.0
          },
          longTermGoal: 'general_fitness',
          deliveryFrequency: 'weekly',
          adaptationSettings: {
            autoAdjust: true
          },
          recentPlans: [],
          isActive: true,
          nextDeliveryDate: new Date(),
          createdAt: new Date()
        });
        
        schedule = await schedule.save();
        logInfo(`Utworzono nowy harmonogram dla użytkownika ${userId} z tygodniem 1`);
      }
    } catch (scheduleError) {
      logError('Błąd podczas tworzenia/aktualizacji harmonogramu:', scheduleError);
      throw new AppError('Nie udało się przygotować harmonogramu dla nowego planu', 500);
    }

    logInfo(`Harmonogram przygotowany dla nowego planu`, {
      scheduleId: schedule._id,
      weekNumber: schedule.progressTracking.weekNumber,
      dniTreningowe: schedule.userProfile.dniTreningowe,
      trainingDays: schedule.userProfile.trainingDays
    });

    // Dodaj zadanie do kolejki Redis
    const planData = {
      resetToWeekOne: true
    };
    
    const jobId = await aiJobService.queueWeeklyPlanGeneration(
      userId,
      schedule._id, // Użyj prawdziwego ID harmonogramu
      planData,
      { priority: 4 } // Najwyższy priorytet dla nowych planów
    );

    res.json({
      status: 'queued',
      data: {
        jobId,
        weekNumber: 1,
        isNewPlan: true,
        statusUrl: `/api/plans/status/${jobId}`,
        message: 'Nowy plan tygodniowy jest generowany w kolejce od tygodnia 1'
      }
    });
  } catch (error) {
    logError('Błąd generowania nowego planu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas generowania nowego planu'
    });
  }
};

/**
 * Usuwa wszystkie plany tygodniowe użytkownika (bulk delete)
 */
WeeklyScheduleController.prototype.deleteAllPlans = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    
    logInfo(`Starting bulk delete of all weekly plans for user ${userId}`);

    const result = await this.weeklyPlanDeliveryService.deleteAllPlans(userId);

    logInfo(`Bulk delete completed for user ${userId}: deleted ${result.deletedCount} plans`);

    res.json({
      status: 'success',
      data: {
        message: `Usunięto ${result.deletedCount} planów tygodniowych`,
        deletedCount: result.deletedCount,
        scheduleReset: result.scheduleReset
      }
    });
  } catch (error) {
    logError('Błąd podczas bulk delete planów tygodniowych', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas usuwania wszystkich planów'
    });
  }
};

/**
 * Sprawdza status zadania generowania planu w kolejce Redis
 */
WeeklyScheduleController.prototype.getJobStatus = async function(req, res, next) {
  try {
    const { jobId } = req.params;
    const userId = req.user.sub;

    if (!jobId) {
      return res.status(400).json({
        status: 'error',
        error: 'Job ID jest wymagane'
      });
    }

    // Pobierz status zadania z kolejki Redis
    const jobStatus = await aiJobService.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({
        status: 'error',
        error: 'Zadanie nie zostało znalezione'
      });
    }

    // Sprawdź czy zadanie należy do użytkownika
    if (jobStatus.data && jobStatus.data.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        error: 'Brak uprawnień do tego zadania'
      });
    }

    // Przygotuj odpowiedź z informacjami o statusie
    const response = {
      status: 'success',
      data: {
        jobId,
        status: jobStatus.status || (jobStatus.finishedOn ? 'completed' : 
                jobStatus.failedReason ? 'failed' : 
                jobStatus.processedOn ? 'processing' : 'waiting'),
        progress: jobStatus.progress || 0,
        createdAt: jobStatus.createdAt ? jobStatus.createdAt.toISOString() : new Date(jobStatus.timestamp || Date.now()).toISOString(),
        message: jobStatus.status === 'completed' ? 'Plan został wygenerowany' :
                 jobStatus.status === 'failed' ? `Błąd: ${jobStatus.failedReason || 'Unknown error'}` :
                 jobStatus.status === 'processing' ? 'Plan jest generowany...' : 'Zadanie oczekuje w kolejce',
        result: jobStatus.result || null
      }
    };

    // Dodaj informacje o wygenerowanym planie jeśli zakończone
    if (jobStatus.finishedOn && jobStatus.returnvalue) {
      response.data.result = {
        planId: jobStatus.returnvalue.planId,
        weekNumber: jobStatus.returnvalue.weekNumber
      };
    }

    res.json(response);

  } catch (error) {
    logError('Błąd podczas sprawdzania statusu zadania', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message
      });
    }
    
    return res.status(500).json({
      status: 'error',
      error: 'Wystąpił błąd podczas sprawdzania statusu zadania'
    });
  }
};

/**
 * Debug endpoint to check user schedule status
 */
WeeklyScheduleController.prototype.debugUserSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    const { checkForm = false } = req.query;
    
    logInfo(`Debug schedule check for user: ${userId}`);
    
    const result = {
      userId,
      timestamp: new Date().toISOString(),
      schedule: null,
      form: null,
      issues: []
    };
    
    // Check for active schedule
    try {
      const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
      result.schedule = await WeeklyPlanSchedule.findOne({
        userId,
        isActive: true
      }).lean();
      
      if (!result.schedule) {
        result.issues.push('No active WeeklyPlanSchedule found');
      } else {
        result.schedule.hasValidProfile = !!(result.schedule.userProfile?.dniTreningowe?.length > 0);
      }
    } catch (error) {
      result.issues.push(`Schedule query error: ${error.message}`);
    }
    
    // Check form data if requested
    if (checkForm) {
      try {
        const TrainingFormSubmission = require('../models/running-form.model');
        result.form = await TrainingFormSubmission.findOne({
          userId,
          dniTreningowe: { $exists: true, $ne: [], $ne: null }
        }).sort({ createdAt: -1 }).lean();
        
        if (!result.form) {
          result.issues.push('No valid form submission with training days found');
        }
        
        // Check for multiple forms
        const allForms = await TrainingFormSubmission.find({ userId }).sort({ createdAt: -1 });
        result.totalForms = allForms.length;
        
        if (allForms.length > 1) {
          result.issues.push(`User has ${allForms.length} form submissions (should have only 1)`);
        }
      } catch (error) {
        result.issues.push(`Form query error: ${error.message}`);
      }
    }
    
    // Determine status
    result.status = result.issues.length === 0 ? 'healthy' : 'needs_attention';
    result.canCreateFallback = !result.schedule && result.form;
    
    res.json({
      status: 'success',
      data: result
    });
    
  } catch (error) {
    logError('Debug schedule check error', error);
    
    return res.status(500).json({
      status: 'error',
      error: 'Debug check failed',
      details: error.message
    });
  }
};

/**
 * Create fallback schedule for user (debug endpoint)
 */
WeeklyScheduleController.prototype.createFallbackSchedule = async function(req, res, next) {
  try {
    const userId = req.user.sub;
    
    logInfo(`Creating fallback schedule for user: ${userId}`);
    
    const schedule = await this.weeklyPlanDeliveryService._createFallbackSchedule(userId);
    
    res.json({
      status: 'success',
      data: {
        message: 'Fallback schedule created successfully',
        scheduleId: schedule._id,
        weekNumber: schedule.progressTracking.weekNumber,
        userProfile: {
          name: schedule.userProfile.name,
          daysPerWeek: schedule.userProfile.daysPerWeek,
          trainingDays: schedule.userProfile.dniTreningowe
        }
      }
    });
    
  } catch (error) {
    logError('Create fallback schedule error', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message
      });
    }
    
    return res.status(500).json({
      status: 'error',
      error: 'Failed to create fallback schedule',
      details: error.message
    });
  }
};

/**
 * Server-Sent Events endpoint dla powiadomień w czasie rzeczywistym
 */
WeeklyScheduleController.prototype.getNotifications = async function(req, res, next) {
  try {
    const userId = req.user.sub;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: 'Użytkownik musi być zalogowany'
      });
    }

    logInfo(`SSE connection request from user: ${userId}`);

    // Dodaj połączenie SSE
    sseNotificationService.addConnection(userId, res);

    // Nie wywołuj res.end() - połączenie powinno pozostać otwarte
    // Express automatycznie obsłuży zamykanie połączenia

  } catch (error) {
    logError('Błąd podczas ustanawiania połączenia SSE', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        status: 'error',
        error: 'Wystąpił błąd podczas ustanawiania połączenia z powiadomieniami'
      });
    }
  }
};

module.exports = new WeeklyScheduleController(); 