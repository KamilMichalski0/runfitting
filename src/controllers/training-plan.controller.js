const mongoose = require('mongoose');
const TrainingPlan = require('../models/training-plan.model');
const TrainingFormSubmission = require('../models/running-form.model');
const GeminiService = require('../services/gemini.service');
const runningKnowledgeBase = require('../knowledge/running-knowledge-base');
const correctiveExercisesKnowledgeBase = require('../knowledge/corrective-knowledge-base');
const AppError = require('../utils/app-error');
// REMOVED: const PlanGeneratorService = require('../services/plan-generator.service'); // Już nie używany
const { logError, logInfo } = require('../utils/logger');
const logger = require('../utils/logger');
const TrainingPlanService = require('../services/trainingPlan.service');
const WeeklyPlanDeliveryService = require('../services/weekly-plan-delivery.service');
const aiJobService = require('../services/ai-job.service');

class TrainingPlanController {
  constructor() {
    // REMOVED: this.planGeneratorService = new PlanGeneratorService(); // Już nie używany
    this.geminiService = new GeminiService(runningKnowledgeBase, correctiveExercisesKnowledgeBase);
    this.weeklyPlanDeliveryService = new WeeklyPlanDeliveryService();

    // Bindowanie metod do instancji kontrolera
    this.generatePlan = this.generatePlan.bind(this);
    this.saveRunningForm = this.saveRunningForm.bind(this);
    this.generatePlanFromSavedForm = this.generatePlanFromSavedForm.bind(this);
    this.getUserPlans = this.getUserPlans.bind(this);
    this.getPlanDetails = this.getPlanDetails.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.deletePlan = this.deletePlan.bind(this);
    this.getCurrentWeek = this.getCurrentWeek.bind(this);
    this.getUserRunningForms = this.getUserRunningForms.bind(this);
    this.getRunningFormDetails = this.getRunningFormDetails.bind(this);
    this.generatePlanFromForm = this.generatePlanFromForm.bind(this);
    this.regeneratePlanFromForm = this.regeneratePlanFromForm.bind(this);

    // NOWE METODY DLA MODYFIKACJI
    this.modifyPlanDay = this.modifyPlanDay.bind(this);
    this.modifyPlanWeek = this.modifyPlanWeek.bind(this);
    this.getJobStatus = this.getJobStatus.bind(this);
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/generate:
   *   post:
   *     summary: Generuje nowy plan treningowy na podstawie danych formularza
   *     tags:
   *       - TrainingPlan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TrainingFormSubmission' # Odniesienie do schematu
   *     responses:
   *       201:
   *         description: Plan treningowy został wygenerowany pomyślnie
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     plan:
   *                       $ref: '#/components/schemas/TrainingPlan'
   *                     formId:
   *                       type: string
   *                       format: objectid
   *                       description: ID zapisanego formularza
   *                     planId:
   *                       type: string
   *                       description: ID wygenerowanego planu (starsze pole, może być duplikatem _id)
   *       400:
   *         description: Błąd walidacji danych wejściowych lub brak wymaganych danych
   *       500:
   *         description: Wewnętrzny błąd serwera podczas generowania planu
   */
  async generatePlan(req, res, next) {
    try {
      const formData = req.body;
      const userId = req.user.sub;

      // Sprawdzenie wymaganych pól w obu formatach danych
      const isLegacyFormat = formData.firstName !== undefined && 
                             formData.experienceLevel !== undefined &&
                             formData.mainGoal !== undefined;
      
      const isNewFormat = formData.name !== undefined && 
                          formData.level !== undefined &&
                          formData.goal !== undefined;

      if (!isLegacyFormat && !isNewFormat) {
        return res.status(400).json({ 
          error: 'Brak wymaganych danych do wygenerowania planu' 
        });
      }

      // Mapowanie danych z nowego formatu na format obsługiwany przez model
      let processedFormData = formData;
      
      if (isNewFormat) {
        processedFormData = {
          firstName: formData.name,
          experienceLevel: formData.level,
          mainGoal: formData.goal,
          trainingDaysPerWeek: formData.daysPerWeek || 3,
          daysPerWeek: formData.daysPerWeek || 3,
          weeklyKilometers: formData.weeklyDistance || 20,
          age: formData.age || 30,
          description: formData.description,
          hasInjuries: formData.hasInjuries || false,
          restingHeartRate: formData.heartRate 
            ? { known: true, value: formData.heartRate } 
            : { known: false, value: 60 }
        };
      }

      // Sprawdź czy user już ma formularz - jeśli tak, zaktualizuj go, jeśli nie, stwórz nowy
      let runningForm = await TrainingFormSubmission.findOne({ userId });
      
      if (runningForm) {
        // Aktualizuj istniejący formularz
        Object.assign(runningForm, processedFormData);
        runningForm.status = 'queued';
        runningForm.updatedAt = new Date();
      } else {
        // Stwórz nowy formularz
        runningForm = new TrainingFormSubmission({
          ...processedFormData,
          userId,
          status: 'queued'
        });
      }
      
      await runningForm.save();

      // Dodanie zadania do kolejki
      const jobId = await aiJobService.queueTrainingPlanGeneration(runningForm._id, userId);

      // Natychmiastowa odpowiedź z ID zadania
      res.status(202).json({
        status: 'queued',
        message: 'Plan treningowy jest generowany w tle',
        data: {
          formId: runningForm._id,
          jobId: jobId,
          statusUrl: `/api/plans/status/${jobId}`
        }
      });

    } catch (error) {
      logger.error('Błąd podczas dodawania zadania do kolejki', error);
      return res.status(500).json({ 
        error: 'Wystąpił błąd podczas generowania planu treningowego' 
      });
    }
  }

  /**
   * Pobiera status zadania generowania planu
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  async getJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;
      const status = await aiJobService.getJobStatus(jobId);
      
      if (!status) {
        return res.status(404).json({
          error: 'Zadanie nie zostało znalezione'
        });
      }

      res.status(200).json({
        status: 'success',
        data: status
      });

    } catch (error) {
      logger.error('Błąd podczas pobierania statusu zadania', error);
      return res.status(500).json({ 
        error: 'Wystąpił błąd podczas pobierania statusu zadania' 
      });
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/forms:
   *   post:
   *     summary: Zapisuje nowy formularz zgłoszeniowy użytkownika
   *     tags:
   *       - TrainingPlan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TrainingFormSubmission' # Odniesienie do schematu
   *     responses:
   *       201:
   *         description: Formularz został zapisany pomyślnie
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     formId:
   *                       type: string
   *                       format: objectid
   *                       description: ID zapisanego formularza
   *                     message:
   *                       type: string
   *                       example: Formularz zgłoszeniowy zapisany pomyślnie.
   *       400:
   *         description: Błąd walidacji danych formularza
   *       500:
   *         description: Wewnętrzny błąd serwera podczas zapisywania formularza
   */
  async saveRunningForm(req, res, next) {
    try {
      const formData = req.body;
      const userId = req.user.sub;

      // Sprawdzenie, czy podstawowe wymagane pola są obecne
      if (!formData.imieNazwisko || !formData.wiek || !formData.glownyCel) {
        return res.status(400).json({
          error: 'Brak podstawowych danych do zapisania formularza (imię, wiek, cel).'
        });
      }

      // Sprawdź czy user już ma formularz - jeśli tak, zaktualizuj go, jeśli nie, stwórz nowy
      let formSubmission = await TrainingFormSubmission.findOne({ userId });
      
      if (formSubmission) {
        // Aktualizuj istniejący formularz
        Object.assign(formSubmission, formData);
        formSubmission.status = 'przetwarzany';
        formSubmission.updatedAt = new Date();
      } else {
        // Stwórz nowy formularz
        formSubmission = new TrainingFormSubmission({
          ...formData,
          userId,
          status: 'przetwarzany' // Status wskazujący rozpoczęcie przetwarzania
        });
      }

      await formSubmission.save();
      logInfo(`Zapisano formularz biegowy dla użytkownika: ${userId}`);

      // === AUTOMATYCZNE URUCHOMIENIE SYSTEMU TYGODNIOWYCH DOSTAW ===
      
      try {
        // 1. Przygotowanie danych profilu użytkownika na podstawie formularza
        const userProfile = this.mapFormToUserProfile(formData);
        
        // 2. Konfiguracja harmonogramu dostarczania
        const scheduleData = {
          userProfile,
          deliveryFrequency: formData.czestotliwoscDostaw || 'weekly', // domyślnie co tydzień
          deliveryDay: formData.dzienDostawy || 'sunday', // domyślnie niedziela
          deliveryTime: formData.godzinaDostawy || '18:00', // domyślnie 18:00
          timezone: formData.strefaCzasowa || 'Europe/Warsaw',
          longTermGoal: this.mapFormToLongTermGoal(formData)
        };

        // 3. Sprawdź czy użytkownik już ma aktywny harmonogram
        let schedule;
        try {
          schedule = await this.weeklyPlanDeliveryService.getUserSchedule(userId);
          logInfo(`Użytkownik ${userId} ma już aktywny harmonogram - aktualizacja`);
          
          // Aktualizuj istniejący harmonogram
          schedule = await this.weeklyPlanDeliveryService.updateSchedule(userId, scheduleData);
        } catch (error) {
          // Brak harmonogramu - utwórz nowy
          logInfo(`Tworzenie nowego harmonogramu dla użytkownika: ${userId}`);
          schedule = await this.weeklyPlanDeliveryService.createSchedule(userId, scheduleData);
        }

        // 4. Wygeneruj pierwszy plan tygodniowy od razu
        logInfo(`Generowanie pierwszego planu tygodniowego dla użytkownika: ${userId}`);
        const firstWeeklyPlan = await this.weeklyPlanDeliveryService.generateWeeklyPlan(schedule);

        // 5. Aktualizuj status formularza
        formSubmission.status = 'wygenerowany';
        formSubmission.planId = firstWeeklyPlan._id;
        formSubmission.scheduleId = schedule._id;
        await formSubmission.save();

        logInfo(`Pomyślnie uruchomiono system tygodniowych dostaw dla użytkownika: ${userId}`);

        res.status(201).json({
          status: 'success',
          data: {
            formId: newFormSubmission._id,
            scheduleId: schedule._id,
            firstPlanId: firstWeeklyPlan._id,
            message: 'Formularz zapisany i system dostaw planów uruchomiony pomyślnie!',
            schedule: {
              deliveryFrequency: schedule.deliveryFrequency,
              deliveryDay: schedule.deliveryDay,
              deliveryTime: schedule.deliveryTime,
              nextDeliveryDate: schedule.nextDeliveryDate
            },
            firstPlan: {
              weekNumber: firstWeeklyPlan.weekNumber,
              planType: firstWeeklyPlan.planType,
              metadata: firstWeeklyPlan.metadata
            }
          }
        });

      } catch (scheduleError) {
        logError('Błąd podczas uruchamiania systemu tygodniowych dostaw', scheduleError);
        
        // Nawet jeśli harmonogram się nie udał, formularz został zapisany
        formSubmission.status = 'błąd_harmonogramu';
        await formSubmission.save();

        res.status(201).json({
          status: 'partial_success',
          data: {
            formId: formSubmission._id,
            message: 'Formularz zapisany, ale wystąpił problem z uruchomieniem automatycznych dostaw planów.',
            error: scheduleError.message
          }
        });
      }

    } catch (error) {
      logError('Błąd zapisywania formularza zgłoszeniowego', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
           error: 'Błąd walidacji danych formularza.',
           details: error.errors
         });
      }
      return res.status(500).json({
        error: 'Wystąpił błąd podczas zapisywania formularza zgłoszeniowego'
      });
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/generate-from-saved-form/{formId}:
   *   post:
   *     summary: Generuje plan treningowy na podstawie zapisanego formularza
   *     tags:
   *       - TrainingPlan
   *     parameters:
   *       - in: path
   *         name: formId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Plan treningowy został wygenerowany pomyślnie
   */
  async generatePlanFromSavedForm(req, res, next) {
    try {
      const { formId } = req.params;
      const userId = req.user.sub;

      // Pobierz formularz z bazy
      const runningForm = await TrainingFormSubmission.findOne({ 
        _id: formId,
        userId
      });
      
      if (!runningForm) {
        throw new AppError('Nie znaleziono formularza', 404);
      }
      
      if (runningForm.status === 'wygenerowany') {
        throw new AppError('Ten formularz został już przetworzony', 400);
      }

      // Generowanie planu
      let planData;
      try {
        // Wygenerowanie planu za pomocą ulepszonego Gemini Service (z wbudowanym fallbackiem)
        planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());
      } catch (error) {
        console.error('Błąd podczas generowania planu:', error);
        throw new AppError('Nie udało się wygenerować planu treningowego. Spróbuj ponownie później.', 500);
      }

      // Tworzenie nowego planu treningowego
      const trainingPlan = new TrainingPlan({
        ...planData,
        userId
      });

      await trainingPlan.save();
      
      // Aktualizacja formularza o ID wygenerowanego planu
      runningForm.status = 'wygenerowany';
      runningForm.planId = trainingPlan._id;
      await runningForm.save();

      res.status(201).json({
        status: 'success',
        data: {
          plan: trainingPlan
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/user-plans:
   *   get:
   *     summary: Pobiera wszystkie plany treningowe użytkownika
   *     tags:
   *       - TrainingPlan
   *     responses:
   *       200:
   *         description: Lista planów użytkownika
   */
  async getUserPlans(req, res, next) {
    try {
      console.log('User from token:', req.user);
      const userId = req.user.sub; // Supabase używa sub jako ID użytkownika
      
      console.log('Szukam planów dla userId:', userId);
      const plans = await TrainingPlan.find({ userId })
        .sort({ createdAt: -1 });

      console.log(`Znaleziono ${plans.length} planów`);
      
      res.status(200).json({
        status: 'success',
        results: plans.length,
        data: {
          plans
        }
      });
    } catch (error) {
      console.error('Błąd podczas pobierania planów:', error);
      next(error);
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/details/{planId}:
   *   get:
   *     summary: Pobiera szczegóły konkretnego planu treningowego
   *     tags:
   *       - TrainingPlan
   *     parameters:
   *       - in: path
   *         name: planId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Szczegóły planu treningowego
   */
  async getPlanDetails(req, res, next) {
    try {
      const planId = req.params.planId;
      const userId = req.user.sub;

      // Walidacja formatu ObjectId
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        throw new AppError('Nieprawidłowy format ID planu', 400);
      }

      const plan = await TrainingPlan.findOne({
        _id: planId,
        userId
      });

      if (!plan) {
        throw new AppError('Nie znaleziono planu treningowego', 404);
      }

      res.status(200).json({
        status: 'success',
        data: {
          plan
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas pobierania planu: ${error.message}`, error.statusCode || 500));
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/progress:
   *   put:
   *     summary: Aktualizuje postęp w planie treningowym
   *     tags:
   *       - TrainingPlan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Postęp został zaktualizowany
   */
  async updateProgress(req, res, next) {
    try {
      const { planId, weekNum, dayName, completed } = req.body;
      const userId = req.user.sub;

      const plan = await TrainingPlan.findOne({
        _id: planId,
        userId
      });

      if (!plan) {
        throw new AppError('Nie znaleziono planu treningowego', 404);
      }

      // Znajdź odpowiedni dzień treningowy
      const week = plan.plan_weeks.find(w => w.week_num === weekNum);
      if (!week) {
        throw new AppError('Nie znaleziono tygodnia w planie', 404);
      }

      const day = week.days.find(d => d.day_name === dayName);
      if (!day) {
        throw new AppError('Nie znaleziono dnia treningowego', 404);
      }

      // Aktualizacja statusu ukończenia
      day.completed = completed;
      
      // Obliczenie nowego postępu
      const totalWorkouts = plan.plan_weeks.reduce((total, week) => total + week.days.length, 0);
      const completedWorkouts = plan.plan_weeks.reduce((total, week) => {
        return total + week.days.filter(day => day.completed).length;
      }, 0);
      
      plan.progress = {
        completedWorkouts,
        totalWorkouts
      };
      
      await plan.save();

      res.status(200).json({
        status: 'success',
        data: {
          plan
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/{planId}:
   *   delete:
   *     summary: Usuwa plan treningowy
   *     tags:
   *       - TrainingPlan
   *     parameters:
   *       - in: path
   *         name: planId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Plan został usunięty
   */
  async deletePlan(req, res, next) {
    try {
      const planId = req.params.planId;
      const userId = req.user.sub;

      // Walidacja formatu ObjectId
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        throw new AppError('Nieprawidłowy format ID planu', 400);
      }

      // Znajdź plan przed usunięciem
      const plan = await TrainingPlan.findOne({
        _id: planId,
        userId
      });

      if (!plan) {
        throw new AppError('Nie znaleziono planu treningowego', 404);
      }

      // Usuń plan z bazy danych
      await TrainingPlan.findOneAndDelete({
        _id: planId,
        userId
      });

      // Jeśli to plan tygodniowy, wyczyść referencje z harmonogramu
      if (plan.planType === 'weekly') {
        await this._cleanupPlanFromSchedule(planId, userId);
      }

      logInfo(`Usunięto plan ${planId} dla użytkownika ${userId}`);

      res.status(204).send();
    } catch (error) {
      logError(`Błąd podczas usuwania planu ${req.params.planId}`, error);
      next(error);
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/current-week:
   *   get:
   *     summary: Pobiera aktualny tydzień treningowy
   *     tags:
   *       - TrainingPlan
   *     responses:
   *       200:
   *         description: Szczegóły aktualnego tygodnia
   */
  async getCurrentWeek(req, res, next) {
    try {
      const planId = req.params.id;
      const userId = req.user.sub;

      const plan = await TrainingPlan.findOne({
        _id: planId,
        userId
      });

      if (!plan) {
        throw new AppError('Nie znaleziono planu treningowego', 404);
      }

      // Logika określania aktualnego tygodnia
      const startDate = new Date(plan.metadata.startDate || plan.createdAt);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const currentWeekNum = Math.floor(diffDays / 7) + 1;
      
      // Znajdź odpowiedni tydzień w planie
      const currentWeek = plan.plan_weeks.find(w => w.week_num === currentWeekNum) || 
                         plan.plan_weeks[plan.plan_weeks.length - 1]; // Jeśli poza planem, weź ostatni tydzień

      if (!currentWeek) {
        throw new AppError('Plan nie zawiera żadnych tygodni treningowych', 400);
      }

      res.status(200).json({
        status: 'success',
        data: {
          currentWeek,
          weekNumber: currentWeekNum,
          totalWeeks: plan.plan_weeks.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/user-forms:
   *   get:
   *     summary: Pobiera wszystkie formularze biegowe użytkownika
   *     tags:
   *       - TrainingPlan
   *     responses:
   *       200:
   *         description: Lista formularzy biegowych
   */
  async getUserRunningForms(req, res, next) {
    try {
      const forms = await TrainingFormSubmission.find({ userId: req.user.sub })
        .select('firstName mainGoal experienceLevel createdAt status')
        .sort({ createdAt: -1 });

      res.status(200).json({
        status: 'success',
        results: forms.length,
        data: {
          forms
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas pobierania formularzy: ${error.message}`, 400));
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/form-details/{formId}:
   *   get:
   *     summary: Pobiera szczegóły konkretnego formularza biegowego
   *     tags:
   *       - TrainingPlan
   *     parameters:
   *       - in: path
   *         name: formId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Szczegóły formularza biegowego
   */
  async getRunningFormDetails(req, res, next) {
    try {
      const formId = req.params.formId;
      // Walidacja formatu ObjectId
      if (!mongoose.Types.ObjectId.isValid(formId)) {
          throw new AppError('Nieprawidłowy format ID formularza', 400);
      }

      const form = await TrainingFormSubmission.findOne({
        _id: formId,
        userId: req.user.sub
      });

      if (!form) {
        return next(new AppError(`Nie znaleziono formularza o ID ${formId}`, 404));
      }

      // Sprawdzenie, czy formularz ma już powiązany plan treningowy
      let planId = null;
      const plan = await TrainingPlan.findOne({ 
        userId: req.user.sub,
        'metadata.description': { $regex: form.firstName, $options: 'i' }
      }).sort({ createdAt: -1 });
      
      if (plan) {
        planId = plan._id;
      }

      res.status(200).json({
        status: 'success',
        data: {
          form,
          planId
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas pobierania szczegółów formularza ${req.params.formId}: ${error.message}`, 400));
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/generate-from-form/{id}:
   *   post:
   *     summary: Generuje plan treningowy na podstawie zapisanego formularza (wg ID)
   *     tags:
   *       - TrainingPlan
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: objectid
   *         description: ID formularza zapisanego wcześniej przez użytkownika
   *     responses:
   *       201:
   *         description: Plan treningowy został wygenerowany pomyślnie
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     planId:
   *                       type: string
   *                       format: objectid
   *                       description: ID nowo wygenerowanego planu treningowego
   *                     message:
   *                       type: string
   *                       example: Plan treningowy został wygenerowany pomyślnie
   *       400:
   *         description: Błąd (np. formularz już przetworzony, nieprawidłowe ID)
   *       404:
   *         description: Nie znaleziono formularza o podanym ID
   *       500:
   *         description: Wewnętrzny błąd serwera podczas generowania planu
   */
  async generatePlanFromForm(req, res, next) {
    try {
      const formId = req.params.id;

      // Walidacja formatu ObjectId
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        throw new AppError('Nieprawidłowy format ID formularza', 400);
      }

      // Znajdź formularz po ID i sprawdź, czy należy do zalogowanego użytkownika
      const runningForm = await TrainingFormSubmission.findOne({
        _id: formId,
        userId: req.user.sub
      });

      if (!runningForm) {
        throw new AppError('Nie znaleziono formularza', 404);
      }
      
      if (runningForm.status === 'wygenerowany') {
        throw new AppError('Ten formularz został już przetworzony', 400);
      }

      // Sprawdź, czy formularz został już przetworzony i czy wymuszono ponowne generowanie
      if (runningForm.status === 'wygenerowany' && req.query.force !== 'true') {
        throw new AppError('Ten formularz został już przetworzony. Użyj parametru force=true, aby wygenerować nowy plan.', 400);
      }

      // Generowanie planu
      let planData;
      try {
        // Wygenerowanie planu za pomocą ulepszonego Gemini Service (z wbudowanym fallbackiem)
        planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());
      } catch (error) {
        console.error('Błąd Gemini:', error);
        throw new AppError('Nie udało się wygenerować planu treningowego. Spróbuj ponownie później.', 500);
      }

      // Tworzenie unikalnego ID planu
      const uniqueId = `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Zapisz wygenerowany plan
      const trainingPlan = new TrainingPlan({
        id: uniqueId,
        metadata: {
          discipline: 'running',
          target_group: runningForm.experienceLevel,
          target_goal: runningForm.mainGoal,
          level_hint: runningForm.experienceLevel,
          days_per_week: runningForm.trainingDaysPerWeek.toString(),
          duration_weeks: planData.duration_weeks || 8,
          description: planData.description || `Plan treningowy dla ${runningForm.firstName}`,
          author: 'RunFitting AI'
        },
        plan_weeks: planData.plan_weeks || [],
        corrective_exercises: planData.corrective_exercises || {
          frequency: 'Wykonuj 2-3 razy w tygodniu',
          list: []
        },
        pain_monitoring: planData.pain_monitoring || {
          scale: '0-10',
          rules: ['Przerwij trening przy bólu powyżej 5/10', 'Skonsultuj się z lekarzem przy utrzymującym się bólu']
        },
        notes: planData.notes || ['Dostosuj plan do swoich możliwości', 'Pamiętaj o nawodnieniu'],
        userId: req.user.sub,
        isActive: true
      });

      await trainingPlan.save();

      // Zaktualizuj status formularza
      runningForm.status = 'wygenerowany';
      await runningForm.save();

      res.status(201).json({
        status: 'success',
        data: {
          planId: trainingPlan._id,
          message: 'Plan treningowy został wygenerowany pomyślnie'
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas generowania planu z formularza ${req.params.id}: ${error.message}`, error.statusCode || 400));
    }
  }

  /**
   * @deprecated_openapi
   * /api/training-plan/regenerate-from-form/{formId}:
   *   post:
   *     summary: Regeneruje plan treningowy na podstawie formularza biegowego
   *     tags:
   *       - TrainingPlan
   *     parameters:
   *       - in: path
   *         name: formId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Plan treningowy został zregenerowany
   */
  async regeneratePlanFromForm(req, res, next) {
    try {
      const { formId } = req.params;

      // Walidacja formatu ObjectId
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        throw new AppError('Nieprawidłowy format ID formularza', 400);
      }

      // Znajdź formularz po ID i sprawdź, czy należy do zalogowanego użytkownika
      const runningForm = await TrainingFormSubmission.findOne({
        _id: formId,
        userId: req.user.sub
      });

      if (!runningForm) {
        throw new AppError('Nie znaleziono formularza', 404);
      }
      
      // Generowanie planu
      let planData;
      try {
        // Wygenerowanie planu za pomocą ulepszonego Gemini Service (z wbudowanym fallbackiem)
        planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());
      } catch (error) {
        console.error('Błąd Gemini:', error);
        throw new AppError('Nie udało się wygenerować planu treningowego. Spróbuj ponownie później.', 500);
      }

      // Tworzenie unikalnego ID planu
      const uniqueId = `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Zapisz wygenerowany plan
      const trainingPlan = new TrainingPlan({
        id: uniqueId,
        metadata: {
          discipline: 'running',
          target_group: runningForm.experienceLevel,
          target_goal: runningForm.mainGoal,
          level_hint: runningForm.experienceLevel,
          days_per_week: runningForm.trainingDaysPerWeek.toString(),
          duration_weeks: planData.duration_weeks || 8,
          description: planData.description || `Plan treningowy dla ${runningForm.firstName}`,
          author: 'RunFitting AI'
        },
        plan_weeks: planData.plan_weeks || [],
        corrective_exercises: planData.corrective_exercises || {
          frequency: 'Wykonuj 2-3 razy w tygodniu',
          list: []
        },
        pain_monitoring: planData.pain_monitoring || {
          scale: '0-10',
          rules: ['Przerwij trening przy bólu powyżej 5/10', 'Skonsultuj się z lekarzem przy utrzymującym się bólu']
        },
        notes: planData.notes || ['Dostosuj plan do swoich możliwości', 'Pamiętaj o nawodnieniu'],
        userId: req.user.sub,
        isActive: true
      });

      await trainingPlan.save();

      res.status(201).json({
        status: 'success',
        data: {
          planId: trainingPlan._id,
          treningId: trainingPlan.id,
          message: 'Plan treningowy został zregenerowany pomyślnie'
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas regenerowania planu: ${error.message}`, error.statusCode || 400));
    }
  }



  // --- NOWE METODY DLA MODYFIKACJI PLANU ---
  async modifyPlanDay(req, res, next) {
    try {
      const userId = req.user.sub;
      const { planId, weekIndex, dayIndex } = req.params;
      const { modificationReason } = req.body;

      if (!modificationReason) {
        throw new AppError('Powód modyfikacji jest wymagany.', 400);
      }
      if (isNaN(parseInt(weekIndex)) || isNaN(parseInt(dayIndex))) {
        throw new AppError('Indeksy tygodnia i dnia muszą być liczbami.', 400);
      }

      const updatedPlan = await TrainingPlanService.requestDayModification(
        userId,
        planId,
        parseInt(weekIndex),
        parseInt(dayIndex),
        modificationReason
      );

      res.status(200).json({
        status: 'success',
        message: 'Dzień w planie został zmodyfikowany.',
        data: {
          plan: updatedPlan
        }
      });
    } catch (error) {
      logError('Błąd podczas modyfikacji dnia w planie', error);
      next(error); // Przekaż błąd do globalnego error handlera
    }
  }

  async modifyPlanWeek(req, res, next) {
    try {
      const userId = req.user.sub;
      const { planId, weekIndex } = req.params;
      const { modificationReason } = req.body;

      if (!modificationReason) {
        throw new AppError('Powód modyfikacji jest wymagany.', 400);
      }
      if (isNaN(parseInt(weekIndex))) {
        throw new AppError('Indeks tygodnia musi być liczbą.', 400);
      }

      const updatedPlan = await TrainingPlanService.requestWeekModification(
        userId,
        planId,
        parseInt(weekIndex),
        modificationReason
      );

      res.status(200).json({
        status: 'success',
        message: 'Tydzień w planie został zmodyfikowany.',
        data: {
          plan: updatedPlan
        }
      });
    } catch (error) {
      logError('Błąd podczas modyfikacji tygodnia w planie', error);
      next(error); // Przekaż błąd do globalnego error handlera
    }
  }

  /**
   * Mapuje dane z formularza na profil użytkownika dla harmonogramu
   * @param {Object} formData - Dane z formularza biegowego
   * @returns {Object} Profil użytkownika
   */
  mapFormToUserProfile(formData) {
    // Map English day names to Polish (without diacritics)
    const dayMapping = {
      'monday': 'poniedzialek',
      'tuesday': 'wtorek', 
      'wednesday': 'sroda',
      'thursday': 'czwartek',
      'friday': 'piatek',
      'saturday': 'sobota',
      'sunday': 'niedziela'
    };
    
    // Validate training days - NO fallbacks!
    let trainingDays = formData.dniTreningowe;
    
    if (!trainingDays || !Array.isArray(trainingDays) || trainingDays.length === 0) {
      throw new Error(`Brak dni treningowych w formularzu. Pole dniTreningowe jest wymagane i nie może być puste. Otrzymane: ${JSON.stringify(formData.dniTreningowe)}`);
    }
    
    // If the days are in English, convert them to Polish
    if (Array.isArray(trainingDays) && trainingDays.length > 0) {
      const firstDay = trainingDays[0];
      if (dayMapping[firstDay]) {
        // Days are in English, convert to Polish
        trainingDays = trainingDays.map(day => dayMapping[day] || day);
      }
    }
    
    return {
      name: formData.imieNazwisko || formData.name || 'Biegacz',
      age: formData.wiek || formData.age || 30,
      level: this.mapExperienceLevel(formData.poziomZaawansowania || formData.level),
      goal: formData.glownyCel || formData.goal || 'poprawa_kondycji',
      daysPerWeek: formData.dniTreningowe?.length || formData.daysPerWeek || 3,
      weeklyDistance: formData.aktualnyKilometrTygodniowy || formData.weeklyDistance || 20,
      hasInjuries: formData.kontuzje || formData.hasInjuries || false,
      restingHeartRate: formData.restingHr || formData.heartRate,
      maxHeartRate: formData.maxHr,
      vo2max: formData.vo2max,
      targetDistance: formData.dystansDocelowy,
      description: formData.opisCelu || formData.description || '',
      trainingDays: trainingDays,
      dniTreningowe: trainingDays, // Dodaj też to pole dla kompatybilności
      preferredTrainingTime: formData.preferowanyCzasTreningu || 'rano',
      availableTime: formData.czasTreningu || 60
    };
  }

  /**
   * Mapuje poziom zaawansowania na standardowy format
   * @param {string} level - Poziom z formularza
   * @returns {string} Standardowy format poziomu
   */
  mapExperienceLevel(level) {
    const levelMap = {
      'beginner': 'początkujący',
      'intermediate': 'średnio-zaawansowany', 
      'advanced': 'zaawansowany',
      'początkujący': 'początkujący',
      'średnio-zaawansowany': 'średnio-zaawansowany',
      'zaawansowany': 'zaawansowany'
    };
    
    return levelMap[level] || 'początkujący';
  }

  /**
   * Mapuje dane z formularza na cel długoterminowy
   * @param {Object} formData - Dane z formularza
   * @returns {Object} Cel długoterminowy
   */
  mapFormToLongTermGoal(formData) {
    const longTermGoal = {};
    
    // Mapowanie z dystansu docelowego na wydarzenie
    if (formData.dystansDocelowy && formData.dystansDocelowy !== 'inny') {
      longTermGoal.targetEvent = `Zawody ${formData.dystansDocelowy}`;
    }
    
    if (formData.raceDate) {
      longTermGoal.targetDate = new Date(formData.raceDate);
    }
    
    // Mapowanie rekordów osobistych jako cele czasowe
    if (formData.dystansDocelowy === '5km' && formData.rekord5km) {
      longTermGoal.targetTime = this.mapPersonalRecordToTime(formData.rekord5km, '5km');
    } else if (formData.dystansDocelowy === '10km' && formData.rekord10km) {
      longTermGoal.targetTime = this.mapPersonalRecordToTime(formData.rekord10km, '10km');
    } else if (formData.dystansDocelowy === 'polmaraton' && formData.rekordPolmaraton) {
      longTermGoal.targetTime = this.mapPersonalRecordToTime(formData.rekordPolmaraton, 'polmaraton');
    } else if (formData.dystansDocelowy === 'maraton' && formData.rekordMaraton) {
      longTermGoal.targetTime = this.mapPersonalRecordToTime(formData.rekordMaraton, 'maraton');
    }

    // Oblicz pozostałe tygodnie do celu
    if (longTermGoal.targetDate) {
      const now = new Date();
      const diffTime = longTermGoal.targetDate - now;
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      longTermGoal.remainingWeeks = diffWeeks > 0 ? diffWeeks : 12; // domyślnie 12 tygodni
    } else {
      // Jeśli brak daty zawodów, ustaw domyślnie 12 tygodni
      longTermGoal.remainingWeeks = 12;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + (12 * 7));
      longTermGoal.targetDate = targetDate;
    }

    return Object.keys(longTermGoal).length > 0 ? longTermGoal : null;
  }

  /**
   * Mapuje rekord osobisty na cel czasowy
   * @param {string} recordRange - Zakres rekordu
   * @param {string} distance - Dystans
   * @returns {string} Cel czasowy
   */
  mapPersonalRecordToTime(recordRange, distance) {
    const recordMap = {
      '5km': {
        'ponizej_20min': '19:00',
        '20_25min': '22:30',
        '25_30min': '27:30',
        '30_35min': '32:30',
        '35_40min': '37:30',
        'powyzej_40min': '38:00'
      },
      '10km': {
        'ponizej_40min': '39:00',
        '40_50min': '45:00',
        '50_60min': '55:00',
        '60_70min': '65:00',
        '70_80min': '75:00',
        'powyzej_80min': '78:00'
      },
      'polmaraton': {
        'ponizej_1h30min': '1:28:00',
        '1h30_1h45min': '1:37:30',
        '1h45_2h00min': '1:52:30',
        '2h00_2h15min': '2:07:30',
        '2h15_2h30min': '2:22:30',
        'powyzej_2h30min': '2:25:00'
      },
      'maraton': {
        'ponizej_3h00min': '2:58:00',
        '3h00_3h30min': '3:15:00',
        '3h30_4h00min': '3:45:00',
        '4h00_4h30min': '4:15:00',
        '4h30_5h00min': '4:45:00',
        'powyzej_5h00min': '4:50:00'
      }
    };

    return recordMap[distance]?.[recordRange] || null;
  }

  /**
   * Czyści referencje do planu z harmonogramu tygodniowego
   * @param {string} planId - ID planu do usunięcia
   * @param {string} userId - ID użytkownika
   * @returns {Promise<void>}
   */
  async _cleanupPlanFromSchedule(planId, userId) {
    try {
      const WeeklyPlanSchedule = require('../models/weekly-plan-schedule.model');
      
      // Znajdź harmonogram użytkownika
      const schedule = await WeeklyPlanSchedule.findOne({ userId });
      
      if (!schedule) {
        logInfo(`Nie znaleziono harmonogramu dla użytkownika ${userId}`);
        return;
      }

      // Usuń plan z recentPlans
      const originalLength = schedule.recentPlans?.length || 0;
      schedule.recentPlans = schedule.recentPlans?.filter(
        planRef => planRef.planId?.toString() !== planId
      ) || [];

      const removedCount = originalLength - schedule.recentPlans.length;

      if (removedCount > 0) {
        await schedule.save();
        logInfo(`Usunięto ${removedCount} referencji do planu ${planId} z harmonogramu użytkownika ${userId}`);
      }
    } catch (error) {
      logError(`Błąd podczas czyszczenia referencji planu ${planId} z harmonogramu`, error);
      // Nie rzucaj błędu - cleanup nie powinien blokować usuwania planu
    }
  }
}

module.exports = new TrainingPlanController();