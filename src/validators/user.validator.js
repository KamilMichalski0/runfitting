const { body, validationResult } = require('express-validator');
const AppError = require('../utils/app-error');

/**
 * Middleware do walidacji błędów w żądaniu
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => ({ [err.path]: err.msg }));
  return next(new AppError('Błąd walidacji danych', 400, true, { errors: extractedErrors }));
};

/**
 * Walidacja podczas aktualizacji profilu użytkownika
 */
exports.validateProfileUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Proszę podać prawidłowy adres email')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Imię musi mieć co najmniej 2 znaki')
    .escape(),
  body('height')
    .optional()
    .isFloat({ min: 100, max: 250 })
    .withMessage('Wzrost musi być pomiędzy 100 a 250 cm'),
  body('weight')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Waga musi być pomiędzy 30 a 300 kg'),
  body('age')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Wiek musi być pomiędzy 15 a 120 lat'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Płeć musi być jedną z: male, female, other'),
  exports.validate
];

/**
 * Walidacja danych historii treningowej
 */
exports.validateTrainingHistory = [
  body('trainingHistory.runningExperience')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Doświadczenie biegowe musi mieć jedną z wartości: beginner, intermediate, advanced'),
  
  body('trainingHistory.weeklyDistance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tygodniowy dystans musi być nieujemną liczbą'),
  
  body('trainingHistory.personalBests.fiveK')
    .optional()
    .isInt({ min: 600, max: 7200 }).withMessage('Rekord życiowy na 5km musi być pomiędzy 10 minut a 2 godziny (600-7200 sekund)'),
  
  body('trainingHistory.personalBests.tenK')
    .optional()
    .isInt({ min: 1200, max: 14400 }).withMessage('Rekord życiowy na 10km musi być pomiędzy 20 minut a 4 godziny (1200-14400 sekund)'),
  
  body('trainingHistory.personalBests.halfMarathon')
    .optional()
    .isInt({ min: 3600, max: 28800 }).withMessage('Rekord życiowy na półmaraton musi być pomiędzy 1 a 8 godzin (3600-28800 sekund)'),
  
  body('trainingHistory.personalBests.marathon')
    .optional()
    .isInt({ min: 7200, max: 43200 }).withMessage('Rekord życiowy na maraton musi być pomiędzy 2 a 12 godzin (7200-43200 sekund)')
];

/**
 * Walidacja danych celu treningowego
 */
exports.validateTrainingGoal = [
  body('trainingGoals.targetRace')
    .notEmpty().withMessage('Typ wyścigu jest wymagany')
    .isIn(['5k', '10k', 'half_marathon', 'marathon', 'ultra']).withMessage('Typ wyścigu musi mieć jedną z wartości: 5k, 10k, half_marathon, marathon, ultra'),
  
  body('trainingGoals.targetDate')
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
  
  body('trainingGoals.targetTime')
    .optional()
    .isInt({ min: 600 }).withMessage('Docelowy czas musi być co najmniej 10 minut (600 sekund)'),
  
  body('trainingGoals.priority')
    .optional()
    .isIn(['finish', 'improve', 'compete']).withMessage('Priorytet musi mieć jedną z wartości: finish, improve, compete')
];