const express = require('express');
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { planValidators, trainingDayValidators } = require('../validators/plan.validators');

const router = express.Router();

// Ochrona wszystkich tras
router.use(authMiddleware.protect);

// Trasy dla planów treningowych
router.route('/')
  .get(planController.getAllPlans)
  .post(planValidators.createPlan, planController.createPlan);

router.route('/:id')
  .get(planController.getPlan)
  .put(planValidators.updatePlan, planController.updatePlan)
  .delete(planController.deletePlan);

// Trasy dla dni treningowych
router.get('/days', planController.getTrainingDays);
router.get('/:planId/days', planController.getPlanDays);

router.route('/:planId/days/:dayId')
  .put(trainingDayValidators.updateTrainingDay, planController.updateTrainingDay);

router.route('/:planId/days/:dayId/complete')
  .post(trainingDayValidators.completeWorkout, planController.completeWorkout);

router.route('/:planId/days/:dayId/miss')
  .post(planController.missWorkout);

module.exports = router; 