const { body } = require('express-validator');

/**
 * Walidacja danych tworzenia nowego planu treningowego
 */
exports.validateCreatePlan = [
  body('goal.type')
    .notEmpty().withMessage('Typ celu jest wymagany')
    .isIn(['5k', '10k', 'half_marathon', 'marathon', 'ultra']).withMessage('Typ celu musi mieć jedną z wartości: 5k, 10k, half_marathon, marathon, ultra'),
  
  body('goal.targetDate')
    .notEmpty().withMessage('Data docelowa jest wymagana')
    .isISO8601().withMessage('Data docelowa musi być w formacie ISO8601 (YYYY-MM-DD)')
    .custom((value) => {
      const targetDate = new Date(value);
      const now = new Date();
      if (targetDate <= now) {
        throw new Error('Data docelowa musi być w przyszłości');
      }
      return true;
    }),
  
  body('goal.targetTime')
    .optional()
    .isInt({ min: 600 }).withMessage('Docelowy czas musi być co najmniej 10 minut (600 sekund)'),
  
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Poziom zaawansowania musi mieć jedną z wartości: beginner, intermediate, advanced'),
  
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Nazwa planu musi mieć od 3 do 100 znaków')
];

/**
 * Walidacja danych aktualizacji planu treningowego
 */
exports.validateUpdatePlan = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Nazwa planu musi mieć od 3 do 100 znaków'),
  
  body('goal.targetDate')
    .optional()
    .isISO8601().withMessage('Data docelowa musi być w formacie ISO8601 (YYYY-MM-DD)')
    .custom((value) => {
      const targetDate = new Date(value);
      const now = new Date();
      if (targetDate <= now) {
        throw new Error('Data docelowa musi być w przyszłości');
      }
      return true;
    }),
  
  body('goal.targetTime')
    .optional()
    .isInt({ min: 600 }).withMessage('Docelowy czas musi być co najmniej 10 minut (600 sekund)'),
  
  body('status')
    .optional()
    .isIn(['active', 'paused', 'completed', 'cancelled']).withMessage('Status musi mieć jedną z wartości: active, paused, completed, cancelled'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notatki mogą mieć maksymalnie 500 znaków')
];

/**
 * Walidacja danych aktualizacji dnia treningowego
 */
exports.validateUpdateTrainingDay = [
  body('plannedDistance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Planowany dystans musi być nieujemną liczbą'),
  
  body('plannedDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('Planowany czas trwania musi być nieujemną liczbą całkowitą'),
  
  body('plannedPace')
    .optional()
    .isInt({ min: 0 }).withMessage('Planowane tempo musi być nieujemną liczbą całkowitą'),
  
  body('targetHeartRateZone')
    .optional()
    .isObject().withMessage('Strefa tętna musi być obiektem'),
  
  body('targetHeartRateZone.min')
    .optional()
    .isInt({ min: 40, max: 220 }).withMessage('Minimalna wartość tętna musi być liczbą całkowitą pomiędzy 40 a 220'),
  
  body('targetHeartRateZone.max')
    .optional()
    .isInt({ min: 40, max: 220 }).withMessage('Maksymalna wartość tętna musi być liczbą całkowitą pomiędzy 40 a 220')
    .custom((value, { req }) => {
      if (req.body.targetHeartRateZone && req.body.targetHeartRateZone.min && value <= req.body.targetHeartRateZone.min) {
        throw new Error('Maksymalna wartość tętna musi być większa niż minimalna wartość tętna');
      }
      return true;
    }),
  
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Tytuł treningu musi mieć od 3 do 100 znaków'),
  
  body('description')
    .optional()
    .isLength({ min: 3, max: 1000 }).withMessage('Opis treningu musi mieć od 3 do 1000 znaków'),
  
  body('type')
    .optional()
    .isIn(['easy', 'tempo', 'intervals', 'long', 'rest', 'cross_training', 'hills', 'fartlek', 'recovery']).withMessage('Typ treningu musi mieć jedną z dozwolonych wartości')
];

/**
 * Walidacja danych ukończenia treningu
 */
exports.validateCompleteWorkout = [
  body('actualDistance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Rzeczywisty dystans musi być nieujemną liczbą'),
  
  body('actualDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('Rzeczywisty czas trwania musi być nieujemną liczbą całkowitą'),
  
  body('actualPace')
    .optional()
    .isInt({ min: 0 }).withMessage('Rzeczywiste tempo musi być nieujemną liczbą całkowitą'),
  
  body('avgHeartRate')
    .optional()
    .isInt({ min: 40, max: 220 }).withMessage('Średnie tętno musi być liczbą całkowitą pomiędzy 40 a 220'),
  
  body('perceivedEffort')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Odczuwany wysiłek musi być liczbą całkowitą pomiędzy 1 a 10'),
  
  body('userFeedback')
    .optional()
    .isLength({ max: 500 }).withMessage('Informacja zwrotna może mieć maksymalnie 500 znaków'),
  
  body('splits')
    .optional()
    .isArray().withMessage('Splity muszą być tablicą'),
  
  body('splits.*.distance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Dystans splitu musi być nieujemną liczbą'),
  
  body('splits.*.duration')
    .optional()
    .isInt({ min: 0 }).withMessage('Czas trwania splitu musi być nieujemną liczbą całkowitą'),
  
  body('splits.*.pace')
    .optional()
    .isInt({ min: 0 }).withMessage('Tempo splitu musi być nieujemną liczbą całkowitą'),
  
  body('splits.*.heartRate')
    .optional()
    .isInt({ min: 40, max: 220 }).withMessage('Tętno splitu musi być liczbą całkowitą pomiędzy 40 a 220')
]; 