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

    if (!scheduleData.userProfile) {
      return res.status(400).json({
        error: 'Dane profilu użytkownika są wymagane'
      });
    }

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
    
    let schedule = null;
    let currentPlan = null;
    
    try {
      // Próbuj pobrać harmonogram z WeeklySchedule
      schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
      
      // Wyciągnij aktualny plan z recentPlans jeśli istnieje
      if (schedule && schedule.recentPlans && schedule.recentPlans.length > 0) {
        const latestPlan = schedule.recentPlans[0];
        if (latestPlan && latestPlan.planId) {
          currentPlan = latestPlan.planId;
        }
      }
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        logInfo(`No WeeklySchedule found for user ${userId}, will check TrainingPlan directly`);
        // Harmonogram nie istnieje, sprawdź bezpośrednio w TrainingPlan
      } else {
        throw error; // Re-throw inne błędy
      }
    }
    
    // Fallback: jeśli nie ma currentPlan z harmonogramu, sprawdź bezpośrednio w TrainingPlan
    if (!currentPlan) {
      try {
        const latestTrainingPlan = await TrainingPlan.findOne({
          userId: userId,
          planType: 'weekly'
        }).sort({ createdAt: -1 }).limit(1);
        
        if (latestTrainingPlan) {
          currentPlan = latestTrainingPlan;
          logInfo(`Found latest training plan directly: ${latestTrainingPlan._id} (week ${latestTrainingPlan.weekNumber})`);
        }
      } catch (planError) {
        logError('Error fetching latest training plan:', planError);
      }
    }

    res.json({
      status: 'success',
      data: {
        schedule,
        currentPlan,
        pendingReview: null, // TODO: implement if needed
        upcomingDelivery: schedule?.nextDeliveryDate || null
      }
    });
  } catch (error) {
    logError('Błąd pobierania harmonogramu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
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
        // Pobierz harmonogram dla kolejki
        const schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
        
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
      
      // Try to get user profile from existing schedule, or use defaults
      let userProfile = {
        name: 'Test User',
        age: 30,
        experienceLevel: 'beginner',
        mainGoal: 'start_running',
        daysPerWeek: 3
      };
      
      try {
        const existingSchedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
        if (existingSchedule && existingSchedule.userProfile) {
          userProfile = { ...userProfile, ...existingSchedule.userProfile };
        }
      } catch (error) {
        logInfo('No existing schedule found, using default profile');
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

    // Spróbuj pobrać dane użytkownika z istniejącego harmonogramu
    let userProfile = {
      name: 'User',
      age: 30,
      experienceLevel: 'beginner',
      mainGoal: 'start_running',
      daysPerWeek: 3
    };
    
    try {
      const existingSchedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
      if (existingSchedule && existingSchedule.userProfile) {
        userProfile = { ...userProfile, ...existingSchedule.userProfile };
        logInfo(`Using existing user profile for new plan: ${JSON.stringify(userProfile)}`);
      }
    } catch (error) {
      logInfo(`No existing schedule found, using default profile for new plan`);
    }

    // Użyj mock schedule dla nowych planów (z danymi użytkownika jeśli dostępne)
    const mockSchedule = {
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
      _id: `new-plan-${Date.now()}`,
      
      // Mockowe metody
      updateProgress: function() {
        // Nie aktualizuj weekNumber dla nowych planów
        logInfo('Mock updateProgress called - not updating weekNumber for new plan');
      },
      save: async function() {
        return Promise.resolve(this);
      }
    };

    logInfo(`Mock schedule created with weekNumber=${mockSchedule.progressTracking.weekNumber}`);

    // Resetuj harmonogram użytkownika do tygodnia 1 PRZED generowaniem
    try {
      const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
      const existingSchedule = await WeeklyPlanSchedule.findOne({ userId });
      
      if (existingSchedule) {
        existingSchedule.progressTracking.weekNumber = 1;
        existingSchedule.progressTracking.currentPhase = 'base';
        existingSchedule.progressTracking.totalWeeksDelivered = 0;
        existingSchedule.recentPlans = []; // Wyczyść poprzednie plany
        await existingSchedule.save();
        logInfo(`Zresetowano harmonogram użytkownika ${userId} do tygodnia 1`);
      }
    } catch (resetError) {
      logError('Błąd podczas resetowania harmonogramu:', resetError);
      // Nie blokuj odpowiedzi jeśli reset się nie udał
    }

    // Dodaj zadanie do kolejki Redis
    const planData = {
      resetToWeekOne: true,
      mockSchedule: mockSchedule
    };
    
    const jobId = await aiJobService.queueWeeklyPlanGeneration(
      userId,
      null, // Brak scheduleId dla nowych planów
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
        status: jobStatus.finishedOn ? 'completed' : 
                jobStatus.failedReason ? 'failed' : 
                jobStatus.processedOn ? 'processing' : 'waiting',
        progress: jobStatus.progress || 0,
        createdAt: new Date(jobStatus.timestamp).toISOString(),
        message: jobStatus.finishedOn ? 'Plan został wygenerowany' :
                 jobStatus.failedReason ? `Błąd: ${jobStatus.failedReason}` :
                 jobStatus.processedOn ? 'Plan jest generowany...' : 'Zadanie oczekuje w kolejce'
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