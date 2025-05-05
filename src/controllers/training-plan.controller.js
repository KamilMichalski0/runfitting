const mongoose = require('mongoose');
const TrainingPlan = require('../models/training-plan.model');
const TrainingFormSubmission = require('../models/running-form.model');
const GeminiService = require('../services/gemini.service');
const FallbackPlanGeneratorService = require('../services/fallback-plan-generator.service');
const runningKnowledgeBase = require('../knowledge/running-knowledge-base');
const AppError = require('../utils/app-error');
const PlanGeneratorService = require('../services/plan-generator.service');
const { logError } = require('../utils/logger');

// Inicjalizacja serwisów
const fallbackPlanGenerator = new FallbackPlanGeneratorService();

class TrainingPlanController {
  constructor() {
    this.planGeneratorService = new PlanGeneratorService();
    this.geminiService = new GeminiService(runningKnowledgeBase);

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
      console.log('Otrzymane dane formularza:', formData);
      
      const userId = req.user.sub;

      // Sprawdzenie wymaganych pól w obu formatach danych
      const isLegacyFormat = formData.firstName !== undefined && 
                             formData.experienceLevel !== undefined &&
                             formData.mainGoal !== undefined;
      
      const isNewFormat = formData.name !== undefined && 
                          formData.level !== undefined &&
                          formData.goal !== undefined;

      console.log('Format danych:', { isLegacyFormat, isNewFormat });
      console.log('Dni treningowe w tygodniu:', {
        daysPerWeek: formData.daysPerWeek,
        trainingDaysPerWeek: formData.trainingDaysPerWeek
      });

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
        console.log('Przetworzone dane:', processedFormData);
      }

      // Zapisanie danych formularza w bazie
      const runningForm = new TrainingFormSubmission({
        ...processedFormData,
        userId,
        status: 'pending'
      });
      
      console.log('Dane formularza przed zapisem:', runningForm);
      await runningForm.save();

      // Generowanie planu
      let planData;
      try {
        // Logowanie danych formularza przed wysłaniem do Gemini
        console.log('Dane formularza przekazywane do geminiService:', JSON.stringify(runningForm.toObject(), null, 2));
        // Próba wygenerowania planu za pomocą Gemini
        planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());
      } catch (error) {
        console.error('Błąd Gemini:', error);
        // Logowanie danych formularza przed wysłaniem do generatora zapasowego
        console.log('Dane formularza przekazywane do fallbackGenerator:', JSON.stringify(runningForm.toObject(), null, 2));
        // Fallback - wygeneruj plan za pomocą wbudowanego generatora
        const fallbackGenerator = new FallbackPlanGeneratorService();
        planData = await fallbackGenerator.generateFallbackPlan(runningForm.toObject());
      }

      // Logowanie danych planu PRZED utworzeniem instancji TrainingPlan
      console.log('Dane planu (planData) przed zapisem:', JSON.stringify(planData, null, 2));

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
          plan: trainingPlan,
          formId: runningForm._id,
          planId: trainingPlan.id
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

      // Sprawdzenie, czy podstawowe wymagane pola są obecne (można dodać więcej walidacji)
      if (!formData.imieNazwisko || !formData.wiek || !formData.glownyCel) {
        return res.status(400).json({
          error: 'Brak podstawowych danych do zapisania formularza (imię, wiek, cel).'
        });
      }

      // Zapisanie danych formularza w bazie przy użyciu nowego modelu
      const newFormSubmission = new TrainingFormSubmission({
        ...formData,
        userId,
        status: 'nowy' // Ustawienie początkowego statusu
      });

      await newFormSubmission.save();

      res.status(201).json({
        status: 'success',
        data: {
          formId: newFormSubmission._id,
          message: 'Formularz zgłoszeniowy zapisany pomyślnie.' // Zaktualizowany komunikat
        }
      });
    } catch (error) {
      logError('Błąd zapisywania formularza zgłoszeniowego', error);
      // Dodanie szczegółów błędu walidacji, jeśli wystąpił
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
        // Próba wygenerowania planu za pomocą Gemini
        planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());
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
        // Próba wygenerowania planu za pomocą Gemini
        planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());
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
        // Próba wygenerowania planu za pomocą Gemini
        planData = await this.geminiService.generateTrainingPlan(runningForm.toObject());
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
          treningId: trainingPlan.id,
          message: 'Plan treningowy został zregenerowany pomyślnie'
        }
      });
    } catch (error) {
      next(new AppError(`Błąd podczas regenerowania planu: ${error.message}`, error.statusCode || 400));
    }
  }
}

module.exports = new TrainingPlanController();