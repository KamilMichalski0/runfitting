const { body, param } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

/**
 * Walidatory dla operacji związanych z treningami
 */
const trainingValidators = {
  /**
   * Walidacja danych przy tworzeniu nowego treningu
   */
  createTraining: [
    body('name')
      .notEmpty()
      .withMessage('Nazwa treningu jest wymagana')
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa treningu musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Opis treningu nie może przekraczać 500 znaków'),
    body('type')
      .notEmpty()
      .withMessage('Typ treningu jest wymagany')
      .isIn(['cardio', 'strength', 'flexibility', 'mixed'])
      .withMessage('Typ treningu musi być jednym z: cardio, strength, flexibility, mixed'),
    body('difficulty')
      .notEmpty()
      .withMessage('Poziom trudności jest wymagany')
      .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, professional'),
    body('duration')
      .notEmpty()
      .withMessage('Czas trwania treningu jest wymagany')
      .isInt({ min: 10, max: 180 })
      .withMessage('Czas trwania treningu musi być liczbą całkowitą między 10 a 180 minut'),
    body('caloriesBurn')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Spalane kalorie muszą być liczbą nieujemną'),
    body('exercises')
      .isArray({ min: 1 })
      .withMessage('Trening musi zawierać co najmniej jedno ćwiczenie'),
    body('exercises.*.exerciseId')
      .notEmpty()
      .withMessage('ID ćwiczenia jest wymagane'),
    body('exercises.*.sets')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Liczba serii musi być liczbą całkowitą między 1 a 10'),
    body('exercises.*.reps')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Liczba powtórzeń musi być liczbą całkowitą między 1 a 100'),
    body('exercises.*.duration')
      .optional()
      .isInt({ min: 5, max: 600 })
      .withMessage('Czas trwania ćwiczenia musi być liczbą całkowitą między 5 a 600 sekund'),
    body('exercises.*.restTime')
      .optional()
      .isInt({ min: 0, max: 300 })
      .withMessage('Czas odpoczynku musi być liczbą całkowitą między 0 a 300 sekund'),
    body('exercises.*.weight')
      .optional()
      .isFloat({ min: 0, max: 500 })
      .withMessage('Ciężar musi być liczbą między 0 a 500 kg'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Sprzęt musi być tablicą'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tagi muszą być tablicą'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy aktualizacji treningu
   */
  updateTraining: [
    param('id')
      .notEmpty()
      .withMessage('ID treningu jest wymagane'),
    body('name')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa treningu musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Opis treningu nie może przekraczać 500 znaków'),
    body('type')
      .optional()
      .isIn(['cardio', 'strength', 'flexibility', 'mixed'])
      .withMessage('Typ treningu musi być jednym z: cardio, strength, flexibility, mixed'),
    body('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, professional'),
    body('duration')
      .optional()
      .isInt({ min: 10, max: 180 })
      .withMessage('Czas trwania treningu musi być liczbą całkowitą między 10 a 180 minut'),
    body('caloriesBurn')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Spalane kalorie muszą być liczbą nieujemną'),
    body('exercises')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Trening musi zawierać co najmniej jedno ćwiczenie'),
    body('exercises.*.exerciseId')
      .optional()
      .notEmpty()
      .withMessage('ID ćwiczenia jest wymagane'),
    body('exercises.*.sets')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Liczba serii musi być liczbą całkowitą między 1 a 10'),
    body('exercises.*.reps')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Liczba powtórzeń musi być liczbą całkowitą między 1 a 100'),
    body('exercises.*.duration')
      .optional()
      .isInt({ min: 5, max: 600 })
      .withMessage('Czas trwania ćwiczenia musi być liczbą całkowitą między 5 a 600 sekund'),
    body('exercises.*.restTime')
      .optional()
      .isInt({ min: 0, max: 300 })
      .withMessage('Czas odpoczynku musi być liczbą całkowitą między 0 a 300 sekund'),
    body('exercises.*.weight')
      .optional()
      .isFloat({ min: 0, max: 500 })
      .withMessage('Ciężar musi być liczbą między 0 a 500 kg'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Sprzęt musi być tablicą'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tagi muszą być tablicą'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy dodawaniu wykonania treningu
   */
  logTrainingSession: [
    body('trainingId')
      .notEmpty()
      .withMessage('ID treningu jest wymagane'),
    body('startTime')
      .notEmpty()
      .withMessage('Czas rozpoczęcia jest wymagany')
      .isISO8601()
      .withMessage('Czas rozpoczęcia musi być w formacie ISO8601'),
    body('endTime')
      .notEmpty()
      .withMessage('Czas zakończenia jest wymagany')
      .isISO8601()
      .withMessage('Czas zakończenia musi być w formacie ISO8601')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startTime)) {
          throw new Error('Czas zakończenia musi być późniejszy niż czas rozpoczęcia');
        }
        return true;
      }),
    body('completedExercises')
      .optional()
      .isArray()
      .withMessage('Ukończone ćwiczenia muszą być tablicą'),
    body('completedExercises.*.exerciseId')
      .optional()
      .notEmpty()
      .withMessage('ID ćwiczenia jest wymagane'),
    body('completedExercises.*.sets')
      .optional()
      .isArray()
      .withMessage('Wykonane serie muszą być tablicą'),
    body('completedExercises.*.sets.*.reps')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Liczba powtórzeń musi być liczbą całkowitą między 0 a 100'),
    body('completedExercises.*.sets.*.weight')
      .optional()
      .isFloat({ min: 0, max: 500 })
      .withMessage('Ciężar musi być liczbą między 0 a 500 kg'),
    body('completedExercises.*.sets.*.duration')
      .optional()
      .isInt({ min: 0, max: 600 })
      .withMessage('Czas trwania musi być liczbą całkowitą między 0 a 600 sekund'),
    body('caloriesBurned')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Spalone kalorie muszą być liczbą nieujemną'),
    body('heartRate')
      .optional()
      .isObject()
      .withMessage('Dane o tętnie muszą być obiektem'),
    body('heartRate.avg')
      .optional()
      .isInt({ min: 40, max: 220 })
      .withMessage('Średnie tętno musi być liczbą całkowitą między 40 a 220'),
    body('heartRate.max')
      .optional()
      .isInt({ min: 40, max: 220 })
      .withMessage('Maksymalne tętno musi być liczbą całkowitą między 40 a 220'),
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Ocena musi być liczbą całkowitą między 1 a 5'),
    body('perceivedExertion')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Odczuwalny wysiłek musi być liczbą całkowitą między 1 a 10'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy generowaniu planu treningowego
   */
  generateTrainingPlan: [
    body('goal')
      .notEmpty()
      .withMessage('Cel treningu jest wymagany')
      .isIn(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness'])
      .withMessage('Cel treningu musi być jednym z: weight_loss, muscle_gain, endurance, strength, flexibility, general_fitness'),
    body('duration')
      .notEmpty()
      .withMessage('Czas trwania planu jest wymagany')
      .isInt({ min: 1, max: 52 })
      .withMessage('Czas trwania planu musi być liczbą całkowitą między 1 a 52 tygodni'),
    body('frequency')
      .notEmpty()
      .withMessage('Częstotliwość treningów jest wymagana')
      .isInt({ min: 1, max: 7 })
      .withMessage('Częstotliwość treningów musi być liczbą całkowitą między 1 a 7 dni tygodniowo'),
    body('preferredDays')
      .optional()
      .isArray()
      .withMessage('Preferowane dni treningowe muszą być tablicą')
      .custom(days => {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.every(day => validDays.includes(day));
      })
      .withMessage('Preferowane dni treningowe muszą być poprawnymi nazwami dni tygodnia'),
    body('difficulty')
      .notEmpty()
      .withMessage('Poziom trudności jest wymagany')
      .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, professional'),
    body('availableEquipment')
      .optional()
      .isArray()
      .withMessage('Dostępny sprzęt musi być tablicą'),
    body('focusAreas')
      .optional()
      .isArray()
      .withMessage('Obszary skupienia muszą być tablicą')
      .custom(areas => {
        const validAreas = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'fullbody'];
        return areas.every(area => validAreas.includes(area));
      })
      .withMessage('Obszary skupienia muszą być poprawnymi wartościami'),
    body('excludedExercises')
      .optional()
      .isArray()
      .withMessage('Wykluczone ćwiczenia muszą być tablicą'),
    body('maxDurationPerSession')
      .optional()
      .isInt({ min: 10, max: 180 })
      .withMessage('Maksymalny czas treningu musi być liczbą całkowitą między 10 a 180 minut'),
    checkValidationResult
  ]
};

module.exports = trainingValidators; 