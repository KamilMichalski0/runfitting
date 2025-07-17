const WeeklyPlanDeliveryService = require('../services/weekly-plan-delivery.service');
const TrainingPlan = require('../models/training-plan.model');
const AppError = require('../utils/app-error');
const { logError } = require('../utils/logger');

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
    
    const schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);

    res.json({
      status: 'success',
      data: {
        schedule
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
    const { weekNumber, progressData } = req.body;

    const schedule = await this.weeklyPlanDeliveryService.updateWeeklyProgress(
      userId,
      weekNumber,
      progressData
    );

    res.json({
      status: 'success',
      data: {
        schedule
      }
    });
  } catch (error) {
    logError('Błąd aktualizacji postępu', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Wystąpił błąd podczas aktualizacji postępu'
    });
  }
};

WeeklyScheduleController.prototype.manualDelivery = async function(req, res, next) {
  try {
    const userId = req.user.sub;

    const schedule = await this.weeklyPlanDeliveryService.generateWeeklyPlan(userId);

    res.json({
      status: 'success',
      data: {
        schedule
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

    const history = await this.weeklyPlanDeliveryService.getPlanHistory(
      userId,
      parseInt(limit) || 10,
      parseInt(offset) || 0
    );

    res.json({
      status: 'success',
      data: {
        history
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
    
    const schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
    
    if (!schedule) {
      return res.status(404).json({
        error: 'Nie znaleziono harmonogramu dla użytkownika'
      });
    }

    const weeklyPlans = await Promise.all(
      schedule.recentPlans
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map(async (planRef) => {
          const plan = await TrainingPlan.findById(planRef.planId);
          return {
            weekNumber: planRef.weekNumber,
            deliveryDate: planRef.deliveryDate,
            plan: plan
          };
        })
    );

    res.json({
      status: 'success',
      data: {
        totalWeeks: schedule.progressTracking.totalWeeksDelivered,
        currentWeek: schedule.progressTracking.weekNumber,
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

module.exports = new WeeklyScheduleController(); 