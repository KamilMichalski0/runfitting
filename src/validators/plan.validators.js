const { body, param, query } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

// Walidatory dla planów treningowych
const planValidators = {
  createPlan: [
    body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Nazwa planu musi mieć od 3 do 100 znaków'),
    body('startDate').isISO8601().toDate().withMessage('Data rozpoczęcia musi być poprawną datą'),
    body('endDate').optional().isISO8601().toDate().withMessage('Data zakończenia musi być poprawną datą'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Opis nie może przekraczać 500 znaków'),
    body('type').isIn(['siłowy', 'wytrzymałościowy', 'mieszany', 'inny']).withMessage('Niepoprawny typ planu'),
    body('goal').trim().isLength({ min: 3, max: 100 }).withMessage('Cel musi mieć od 3 do 100 znaków'),
    body('daysPerWeek').isInt({ min: 1, max: 7 }).withMessage('Liczba dni treningowych musi być między 1 a 7'),
    body('difficultyLevel').isIn(['początkujący', 'średniozaawansowany', 'zaawansowany']).withMessage('Niepoprawny poziom trudności'),
    checkValidationResult
  ],
  
  updatePlan: [
    param('id').isMongoId().withMessage('Niepoprawny format ID planu'),
    body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Nazwa planu musi mieć od 3 do 100 znaków'),
    body('startDate').optional().isISO8601().toDate().withMessage('Data rozpoczęcia musi być poprawną datą'),
    body('endDate').optional().isISO8601().toDate().withMessage('Data zakończenia musi być poprawną datą'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Opis nie może przekraczać 500 znaków'),
    body('type').optional().isIn(['siłowy', 'wytrzymałościowy', 'mieszany', 'inny']).withMessage('Niepoprawny typ planu'),
    body('goal').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Cel musi mieć od 3 do 100 znaków'),
    body('status').optional().isIn(['aktywny', 'zakończony', 'wstrzymany']).withMessage('Niepoprawny status planu'),
    body('daysPerWeek').optional().isInt({ min: 1, max: 7 }).withMessage('Liczba dni treningowych musi być między 1 a 7'),
    body('difficultyLevel').optional().isIn(['początkujący', 'średniozaawansowany', 'zaawansowany']).withMessage('Niepoprawny poziom trudności'),
    checkValidationResult
  ]
};

// Walidatory dla dni treningowych
const trainingDayValidators = {
  updateTrainingDay: [
    param('planId').isMongoId().withMessage('Niepoprawny format ID planu'),
    param('dayId').isMongoId().withMessage('Niepoprawny format ID dnia treningowego'),
    body('exercises').optional().isArray().withMessage('Ćwiczenia muszą być tablicą'),
    body('exercises.*.name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Nazwa ćwiczenia musi mieć od 3 do 100 znaków'),
    body('exercises.*.sets').optional().isInt({ min: 1, max: 20 }).withMessage('Liczba serii musi być między 1 a 20'),
    body('exercises.*.reps').optional().isInt({ min: 1, max: 100 }).withMessage('Liczba powtórzeń musi być między 1 a 100'),
    body('exercises.*.weight').optional().isNumeric().withMessage('Waga musi być liczbą'),
    body('exercises.*.restTime').optional().isInt({ min: 0 }).withMessage('Czas odpoczynku musi być liczbą nieujemną'),
    body('exercises.*.notes').optional().trim().isLength({ max: 200 }).withMessage('Notatki nie mogą przekraczać 200 znaków'),
    body('scheduledDate').optional().isISO8601().toDate().withMessage('Data treningu musi być poprawną datą'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notatki nie mogą przekraczać 500 znaków'),
    checkValidationResult
  ],
  
  completeWorkout: [
    param('planId').isMongoId().withMessage('Niepoprawny format ID planu'),
    param('dayId').isMongoId().withMessage('Niepoprawny format ID dnia treningowego'),
    body('completedExercises').isArray().withMessage('Ukończone ćwiczenia muszą być tablicą'),
    body('completedExercises.*.name').trim().isLength({ min: 3, max: 100 }).withMessage('Nazwa ćwiczenia musi mieć od 3 do 100 znaków'),
    body('completedExercises.*.sets').isInt({ min: 1, max: 20 }).withMessage('Liczba serii musi być między 1 a 20'),
    body('completedExercises.*.reps').isInt({ min: 1, max: 100 }).withMessage('Liczba powtórzeń musi być między 1 a 100'),
    body('completedExercises.*.weight').optional().isNumeric().withMessage('Waga musi być liczbą'),
    body('completedExercises.*.notes').optional().trim().isLength({ max: 200 }).withMessage('Notatki nie mogą przekraczać 200 znaków'),
    body('duration').isInt({ min: 1 }).withMessage('Czas trwania treningu musi być liczbą dodatnią'),
    body('difficulty').isInt({ min: 1, max: 10 }).withMessage('Poziom trudności musi być między 1 a 10'),
    body('feelingRate').isInt({ min: 1, max: 10 }).withMessage('Ocena samopoczucia musi być między 1 a 10'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notatki nie mogą przekraczać 500 znaków'),
    checkValidationResult
  ]
};

module.exports = {
  planValidators,
  trainingDayValidators
}; 