const WeeklyPlanDeliveryService = require('../services/weekly-plan-delivery.service');
const AppError = require('../utils/app-error');
const { logError } = require('../utils/logger');

/**
 * Kontroler odpowiedzialny za zarządzanie harmonogramami dostarczania planów tygodniowych
 */
class WeeklyScheduleController {
  constructor() {
    this.weeklyPlanDeliveryService = new WeeklyPlanDeliveryService();
    
    // Bindowanie metod
    this.createSchedule = this.createSchedule.bind(this);
    this.getSchedule = this.getSchedule.bind(this);
    this.updateSchedule = this.updateSchedule.bind(this);
    this.pauseSchedule = this.pauseSchedule.bind(this);
    this.resumeSchedule = this.resumeSchedule.bind(this);
    this.deactivateSchedule = this.deactivateSchedule.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.manualDelivery = this.manualDelivery.bind(this);
    this.getHistory = this.getHistory.bind(this);
  }

  /**
   * @swagger
   * /api/weekly-schedule:
   *   post:
   *     summary: Tworzy nowy harmonogram dostarczania planów tygodniowych
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userProfile
   *             properties:
   *               userProfile:
   *                 type: object
   *                 properties:
   *                   name:
   *                     type: string
   *                     example: "Jan Kowalski"
   *                   age:
   *                     type: number
   *                     example: 30
   *                   level:
   *                     type: string
   *                     enum: ['początkujący', 'średnio-zaawansowany', 'zaawansowany']
   *                     example: "średnio-zaawansowany"
   *                   goal:
   *                     type: string
   *                     example: "przygotowanie do półmaratonu"
   *                   daysPerWeek:
   *                     type: number
   *                     minimum: 1
   *                     maximum: 7
   *                     example: 4
   *                   weeklyDistance:
   *                     type: number
   *                     example: 25
   *                   hasInjuries:
   *                     type: boolean
   *                     example: false
   *                   heartRate:
   *                     type: number
   *                     example: 65
   *                   description:
   *                     type: string
   *                     example: "Dodatkowe informacje o treningu"
   *               deliveryFrequency:
   *                 type: string
   *                 enum: ['weekly', 'biweekly']
   *                 example: "weekly"
   *               deliveryDay:
   *                 type: string
   *                 enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
   *                 example: "sunday"
   *               deliveryTime:
   *                 type: string
   *                 example: "18:00"
   *               timezone:
   *                 type: string
   *                 example: "Europe/Warsaw"
   *               longTermGoal:
   *                 type: object
   *                 properties:
   *                   targetEvent:
   *                     type: string
   *                     example: "Maraton Warszawski"
   *                   targetDate:
   *                     type: string
   *                     format: date
   *                     example: "2024-09-29"
   *                   targetTime:
   *                     type: string
   *                     example: "3:30:00"
   *     responses:
   *       201:
   *         description: Harmonogram został utworzony pomyślnie
   *       400:
   *         description: Błąd walidacji danych lub użytkownik już ma aktywny harmonogram
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async createSchedule(req, res, next) {
    try {
      const userId = req.user.sub;
      const scheduleData = req.body;

      // Walidacja wymaganych pól
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
  }

  /**
   * @swagger
   * /api/weekly-schedule:
   *   get:
   *     summary: Pobiera harmonogram dostarczania planów użytkownika
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Harmonogram użytkownika
   *       404:
   *         description: Nie znaleziono aktywnego harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async getSchedule(req, res, next) {
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
  }

  /**
   * @swagger
   * /api/weekly-schedule:
   *   put:
   *     summary: Aktualizuje istniejący harmonogram dostarczania
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userProfile:
   *                 type: object
   *               deliveryFrequency:
   *                 type: string
   *                 enum: ['weekly', 'biweekly']
   *               deliveryDay:
   *                 type: string
   *                 enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
   *               deliveryTime:
   *                 type: string
   *               longTermGoal:
   *                 type: object
   *     responses:
   *       200:
   *         description: Harmonogram został zaktualizowany pomyślnie
   *       404:
   *         description: Nie znaleziono aktywnego harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async updateSchedule(req, res, next) {
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
  }

  /**
   * @swagger
   * /api/weekly-schedule/pause:
   *   post:
   *     summary: Wstrzymuje harmonogram dostarczania na określony czas
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pauseUntil
   *             properties:
   *               pauseUntil:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-02-15T00:00:00.000Z"
   *     responses:
   *       200:
   *         description: Harmonogram został wstrzymany pomyślnie
   *       404:
   *         description: Nie znaleziono aktywnego harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async pauseSchedule(req, res, next) {
    try {
      const userId = req.user.sub;
      const { pauseUntil } = req.body;

      if (!pauseUntil) {
        return res.status(400).json({
          error: 'Data końca wstrzymania jest wymagana'
        });
      }

      const schedule = await this.weeklyPlanDeliveryService.pauseSchedule(userId, new Date(pauseUntil));

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
  }

  /**
   * @swagger
   * /api/weekly-schedule/resume:
   *   post:
   *     summary: Wznawia wstrzymany harmonogram dostarczania
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Harmonogram został wznowiony pomyślnie
   *       404:
   *         description: Nie znaleziono aktywnego harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async resumeSchedule(req, res, next) {
    try {
      const userId = req.user.sub;

      const schedule = await this.weeklyPlanDeliveryService.pauseSchedule(userId, null);

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
  }

  /**
   * @swagger
   * /api/weekly-schedule/deactivate:
   *   post:
   *     summary: Deaktywuje harmonogram dostarczania
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Harmonogram został deaktywowany pomyślnie
   *       404:
   *         description: Nie znaleziono aktywnego harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async deactivateSchedule(req, res, next) {
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
  }

  /**
   * @swagger
   * /api/weekly-schedule/progress:
   *   post:
   *     summary: Aktualizuje postęp wykonania planu tygodniowego
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - weekNumber
   *               - progressData
   *             properties:
   *               weekNumber:
   *                 type: number
   *                 example: 5
   *               progressData:
   *                 type: object
   *                 properties:
   *                   completed:
   *                     type: boolean
   *                     example: true
   *                   completionRate:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                     example: 0.85
   *                   completedDistance:
   *                     type: number
   *                     example: 22.5
   *                   feedback:
   *                     type: string
   *                     example: "Tydzień przebiegł bardzo dobrze"
   *     responses:
   *       200:
   *         description: Postęp został zaktualizowany pomyślnie
   *       404:
   *         description: Nie znaleziono aktywnego harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async updateProgress(req, res, next) {
    try {
      const userId = req.user.sub;
      const { weekNumber, progressData } = req.body;

      if (!weekNumber || !progressData) {
        return res.status(400).json({
          error: 'Numer tygodnia i dane o postępie są wymagane'
        });
      }

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
  }

  /**
   * @swagger
   * /api/weekly-schedule/manual-delivery:
   *   post:
   *     summary: Ręczne wygenerowanie planu tygodniowego (poza harmonogramem)
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Plan został wygenerowany pomyślnie
   *       404:
   *         description: Nie znaleziono aktywnego harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async manualDelivery(req, res, next) {
    try {
      const userId = req.user.sub;
      
      const schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
      const plan = await this.weeklyPlanDeliveryService.generateWeeklyPlan(schedule);

      res.json({
        status: 'success',
        data: {
          plan,
          message: 'Plan został wygenerowany ręcznie'
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
  }

  /**
   * @swagger
   * /api/weekly-schedule/history:
   *   get:
   *     summary: Pobiera historię planów tygodniowych użytkownika
   *     tags:
   *       - WeeklySchedule
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Liczba planów do pobrania
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Przesunięcie dla paginacji
   *     responses:
   *       200:
   *         description: Historia planów tygodniowych
   *       404:
   *         description: Nie znaleziono harmonogramu
   *       401:
   *         description: Brak uwierzytelnienia
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user.sub;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const history = await this.weeklyPlanDeliveryService.getPlanHistory(userId, limit, offset);

      res.json({
        status: 'success',
        data: {
          history,
          pagination: {
            limit,
            offset,
            total: history.length
          }
        }
      });
    } catch (error) {
      logError('Błąd pobierania historii planów', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message
        });
      }
      
      return res.status(500).json({
        error: 'Wystąpił błąd podczas pobierania historii planów'
      });
    }
  }
}

module.exports = WeeklyScheduleController; 