const TrainingPlan = require('../models/training-plan.model');
const GeminiService = require('../services/gemini.service');
const FallbackPlanGeneratorService = require('../services/fallback-plan-generator.service');
const AppError = require('../utils/app-error');

class TrainingPlanController {
  /**
   * Generuje nowy plan treningowy dla użytkownika
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async generatePlan(req, res, next) {
    try {
      const userData = req.body;
      const userId = req.user._id;

      // Walidacja podstawowych danych
      if (!userData.age || !userData.level || !userData.injuryHistory) {
        throw new AppError('Brak wymaganych danych do generowania planu', 400);
      }

      let planData;
      try {
        // Próba wygenerowania planu przez Gemini API
        planData = await GeminiService.generateTrainingPlan(userData);
      } catch (error) {
        console.error('Błąd generowania planu przez Gemini:', error);
        // Fallback do lokalnego generatora
        planData = await FallbackPlanGeneratorService.generateFallbackPlan(userData);
      }

      // Tworzenie nowego planu treningowego
      const trainingPlan = new TrainingPlan({
        ...planData,
        userId
      });

      await trainingPlan.save();

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
   * Pobiera wszystkie plany treningowe użytkownika
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getUserPlans(req, res, next) {
    try {
      const userId = req.user._id;
      const plans = await TrainingPlan.find({ userId })
        .sort({ createdAt: -1 });

      res.status(200).json({
        status: 'success',
        results: plans.length,
        data: {
          plans
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pobiera szczegóły konkretnego planu treningowego
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getPlanDetails(req, res, next) {
    try {
      const planId = req.params.id;
      const userId = req.user._id;

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
      next(error);
    }
  }

  /**
   * Aktualizuje postęp w planie treningowym
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async updateProgress(req, res, next) {
    try {
      const { planId, weekNum, dayName, completed } = req.body;
      const userId = req.user._id;

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
      plan.calculateProgress();
      
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
   * Usuwa plan treningowy
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async deletePlan(req, res, next) {
    try {
      const planId = req.params.id;
      const userId = req.user._id;

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
   * Pobiera aktualny tydzień treningowy
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getCurrentWeek(req, res, next) {
    try {
      const planId = req.params.id;
      const userId = req.user._id;

      const plan = await TrainingPlan.findOne({
        _id: planId,
        userId
      });

      if (!plan) {
        throw new AppError('Nie znaleziono planu treningowego', 404);
      }

      const currentWeek = plan.getCurrentWeek();

      if (!currentWeek) {
        throw new AppError('Plan nie jest aktualnie aktywny', 400);
      }

      res.status(200).json({
        status: 'success',
        data: {
          currentWeek
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TrainingPlanController(); 