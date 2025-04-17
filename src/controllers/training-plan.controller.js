const TrainingPlan = require('../models/training-plan.model');
const RunningForm = require('../models/running-form.model');
const geminiService = require('../services/gemini.service');
const FallbackPlanGeneratorService = require('../services/fallback-plan-generator.service');
const AppError = require('../utils/app-error');
const PlanGeneratorService = require('../services/plan-generator.service');
const { logError } = require('../utils/logger');
const mongoose = require('mongoose');

// Inicjalizacja serwisów
const fallbackPlanGenerator = new FallbackPlanGeneratorService();

class TrainingPlanController {
  constructor() {
    this.planGeneratorService = new PlanGeneratorService();
  }

  /**
   * @openapi
   * /api/training-plan/generate:
   *   post:
   *     summary: Generuje nowy plan treningowy dla użytkownika
   *     tags:
   *       - TrainingPlan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               experienceLevel:
   *                 type: string
   *               mainGoal:
   *                 type: string
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
   *                 data:
   *                   type: object
   *                   properties:
   *                     plan:
   *                       $ref: '#/components/schemas/TrainingPlan'
   *                     formId:
   *                       type: string
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
          weeklyKilometers: formData.weeklyDistance || 20,
          age: formData.age || 30,
          // inne pola, jeśli są dostępne
          description: formData.description,
          hasInjuries: formData.hasInjuries || false,
          restingHeartRate: formData.heartRate 
            ? { known: true, value: formData.heartRate } 
            : { known: false, value: 60 }
        };
      }

      // Zapisanie danych formularza w bazie
      const runningForm = new RunningForm({
        ...processedFormData,
        userId,
        status: 'pending'
      });
      
      await runningForm.save();

      // Generowanie planu
      let planData;
      try {
        // Próba wygenerowania planu za pomocą Gemini
        planData = await geminiService.generateTrainingPlan(processedFormData);
      } catch (error) {
        console.error('Błąd generowania planu przez Gemini:', error);
        // Aktualizacja statusu formularza na błąd
        runningForm.status = 'error';
        await runningForm.save();
        
        // Fallback do lokalnego generatora
        planData = await fallbackPlanGenerator.generateFallbackPlan(processedFormData);
      }

      // Tworzenie nowego planu treningowego
      const trainingPlan = new TrainingPlan({
        ...planData,
        userId
      });

      await trainingPlan.save();
      
      // Aktualizacja formularza o ID wygenerowanego planu
      runningForm.status = 'processed';
      runningForm.planId = trainingPlan._id;
      await runningForm.save();

      res.status(201).json({
        status: 'success',
        data: {
          plan: trainingPlan,
          formId: runningForm._id
        }
      });
    } catch (error) {
      logError('Błąd generowania planu treningowego', error);
      return res.status(500).json({ 
        error: 'Wystąpił błąd podczas generowania planu treningowego' 
      });
    }
  }

  /**
   * @openapi
   * /api/training-plan/forms:
   *   post:
   *     summary: Zapisuje formularz biegowy bez generowania planu
   *     tags:
   *       - TrainingPlan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Formularz został zapisany
   */
  async saveRunningForm(req, res, next) {
    try {
      const formData = req.body;
      const userId = req.user.sub;
      
      // Sprawdzenie wymaganych pól w obu formatach danych
      const isLegacyFormat = formData.firstName !== undefined && 
                             formData.email !== undefined;
      
      const isNewFormat = formData.name !== undefined && 
                          formData.email !== undefined &&
                          formData.goal !== undefined &&
                          formData.level !== undefined;

      if (!isLegacyFormat && !isNewFormat) {
        return res.status(400).json({ 
          error: 'Brak wymaganych danych do zapisania formularza' 
        });
      }

      // Mapowanie danych z nowego formatu na format obsługiwany przez model
      let processedFormData = formData;
      
      if (isNewFormat) {
        processedFormData = {
          firstName: formData.name,
          email: formData.email,
          experienceLevel: formData.level,
          mainGoal: formData.goal,
          trainingDaysPerWeek: formData.daysPerWeek,
          weeklyKilometers: formData.weeklyDistance || 20,
          age: formData.age || 30,
          hasInjuries: formData.hasInjuries || false,
          // inne pola, jeśli są dostępne
          description: formData.description
        };
      }

      // Zapisanie danych formularza w bazie
      const runningForm = new RunningForm({
        ...processedFormData,
        userId,
        status: 'pending'
      });
      
      await runningForm.save();

      res.status(201).json({
        status: 'success',
        data: {
          formId: runningForm._id,
          message: 'Formularz zapisany pomyślnie. Plan zostanie wygenerowany asynchronicznie.'
        }
      });
    } catch (error) {
      logError('Błąd zapisywania formularza biegowego', error);
      return res.status(500).json({ 
        error: 'Wystąpił błąd podczas zapisywania formularza biegowego' 
      });
    }
  }

  /**
   * @openapi
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
      const runningForm = await RunningForm.findOne({ 
        _id: formId,
        userId
      });
      
      if (!runningForm) {
        throw new AppError('Nie znaleziono formularza', 404);
      }
      
      if (runningForm.status === 'processed') {
        throw new AppError('Ten formularz został już przetworzony', 400);
      }

      // Generowanie planu
      let planData;
      try {
        // Próba wygenerowania planu za pomocą Gemini
        planData = await geminiService.generateTrainingPlan(runningForm.toObject());
      } catch (error) {
        console.error('Błąd Gemini:', error);
        // Fallback - wygeneruj plan za pomocą wbudowanego generatora
        const fallbackGenerator = new FallbackPlanGeneratorService();
        planData = await fallbackGenerator.generateFallbackPlan(runningForm.toObject());
      }

      // Tworzenie nowego planu treningowego
      const trainingPlan = new TrainingPlan({
        ...planData,
        userId
      });

      await trainingPlan.save();
      
      // Aktualizacja formularza o ID wygenerowanego planu
      runningForm.status = 'processed';
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
   * @openapi
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
   * @openapi
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
      const planId = req.params.id;
      const userId = req.user.sub;

      const plan = await TrainingPlan.findOne({
        id: planId,
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
   * @openapi
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
   * @openapi
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
      const planId = req.params.id;
      const userId = req.user.sub;

      const plan = await TrainingPlan.findOneAndDelete({
        _id: planId,
        userId
      });

      if (!plan) {
        throw new AppError('Nie znaleziono planu treningowego', 404);
      }

      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
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
   * @openapi
   * /api/training-plan/forms:
   *   post:
   *     summary: Zapisuje nowy formularz biegowy
   *     tags:
   *       - TrainingPlan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Formularz został zapisany
   */
  async submitRunningForm(req, res, next) {
    try {
      // Tworzenie nowego formularza z danymi z żądania
      const formData = {
        ...req.body,
        userId: req.user.sub,
        status: 'pending'
      };

      const runningForm = new RunningForm(formData);
      await runningForm.save();

      res.status(201).json({
        status: 'success',
        data: {
          formId: runningForm._id,
          message: 'Formularz został zapisany. Możesz teraz wygenerować plan treningowy.'
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas zapisywania formularza: ${error.message}`, 400));
    }
  }

  /**
   * @openapi
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
      const forms = await RunningForm.find({ userId: req.user.sub })
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
   * @openapi
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
      const form = await RunningForm.findOne({ 
        _id: req.params.id,
        userId: req.user.sub
      });

      if (!form) {
        return next(new AppError('Nie znaleziono formularza o podanym ID', 404));
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
      next(new AppError(`Błąd podczas pobierania szczegółów formularza: ${error.message}`, 400));
    }
  }

  /**
   * @openapi
   * /api/training-plan/generate-from-form:
   *   post:
   *     summary: Generuje plan treningowy na podstawie formularza biegowego
   *     tags:
   *       - TrainingPlan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Plan treningowy został wygenerowany
   */
  async generatePlanFromForm(req, res, next) {
    try {
      // Znajdź formularz po ID i sprawdź, czy należy do zalogowanego użytkownika
      const runningForm = await RunningForm.findOne({
        _id: req.params.id,
        userId: req.user.sub
      });

      if (!runningForm) {
        throw new AppError('Nie znaleziono formularza', 404);
      }
      
      if (runningForm.status === 'processed') {
        throw new AppError('Ten formularz został już przetworzony', 400);
      }

      // Sprawdź, czy formularz został już przetworzony i czy wymuszono ponowne generowanie
      if (runningForm.status === 'processed' && req.query.force !== 'true') {
        throw new AppError('Ten formularz został już przetworzony. Użyj parametru force=true, aby wygenerować nowy plan.', 400);
      }

      // Generowanie planu
      let planData;
      try {
        // Próba wygenerowania planu za pomocą Gemini
        planData = await geminiService.generateTrainingPlan(runningForm.toObject());
      } catch (error) {
        console.error('Błąd Gemini:', error);
        // Fallback - wygeneruj plan za pomocą wbudowanego generatora
        const fallbackGenerator = new FallbackPlanGeneratorService();
        planData = await fallbackGenerator.generateFallbackPlan(runningForm.toObject());
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
      runningForm.status = 'processed';
      await runningForm.save();

      res.status(201).json({
        status: 'success',
        data: {
          planId: trainingPlan._id,
          message: 'Plan treningowy został wygenerowany pomyślnie'
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas generowania planu: ${error.message}`, error.statusCode || 400));
    }
  }

  /**
   * @openapi
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
      const runningForm = await RunningForm.findOne({
        _id: formId,
        userId: req.user.sub
      });

      if (!runningForm) {
        throw new AppError('Nie znaleziono formularza', 404);
      }
      
      // Generowanie planu
      let planData;
      try {
        // Próba wygenerowania planu za pomocą Gemini
        planData = await geminiService.generateTrainingPlan(runningForm.toObject());
      } catch (error) {
        console.error('Błąd Gemini:', error);
        // Fallback - wygeneruj plan za pomocą wbudowanego generatora
        const fallbackGenerator = new FallbackPlanGeneratorService();
        planData = await fallbackGenerator.generateFallbackPlan(runningForm.toObject());
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
          message: 'Plan treningowy został zregenerowany pomyślnie'
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas regenerowania planu: ${error.message}`, error.statusCode || 400));
    }
  }
}

module.exports = new TrainingPlanController(); 