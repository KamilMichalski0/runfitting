const { body, param, query } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

/**
 * Walidatory dla operacji związanych z użytkownikami
 */
const userValidators = {
  /**
   * Walidacja danych przy rejestracji nowego użytkownika
   */
  registerUser: [
    body('email')
      .notEmpty()
      .withMessage('Email jest wymagany')
      .isEmail()
      .withMessage('Podaj prawidłowy adres email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Hasło jest wymagane')
      .isLength({ min: 8 })
      .withMessage('Hasło musi mieć co najmniej 8 znaków')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .withMessage('Hasło musi zawierać dużą literę, małą literę, cyfrę i znak specjalny'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Potwierdzenie hasła jest wymagane')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Hasła muszą być identyczne');
        }
        return true;
      }),
    body('firstName')
      .notEmpty()
      .withMessage('Imię jest wymagane')
      .isString()
      .withMessage('Imię musi być tekstem')
      .isLength({ min: 2, max: 50 })
      .withMessage('Imię musi mieć od 2 do 50 znaków'),
    body('lastName')
      .notEmpty()
      .withMessage('Nazwisko jest wymagane')
      .isString()
      .withMessage('Nazwisko musi być tekstem')
      .isLength({ min: 2, max: 50 })
      .withMessage('Nazwisko musi mieć od 2 do 50 znaków'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Data urodzenia musi być w formacie ISO 8601'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Płeć musi mieć jedną z wartości: male, female, other, prefer_not_to_say'),
    body('phone')
      .optional()
      .isString()
      .withMessage('Numer telefonu musi być tekstem')
      .matches(/^\+?[0-9\s\-\(\)]+$/)
      .withMessage('Podaj prawidłowy format numeru telefonu'),
    body('termsAccepted')
      .notEmpty()
      .withMessage('Musisz zaakceptować regulamin')
      .isBoolean()
      .withMessage('Akceptacja regulaminu musi być wartością logiczną')
      .custom((value) => {
        if (value !== true) {
          throw new Error('Musisz zaakceptować regulamin');
        }
        return true;
      }),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy logowaniu użytkownika
   */
  loginUser: [
    body('email')
      .notEmpty()
      .withMessage('Email jest wymagany')
      .isEmail()
      .withMessage('Podaj prawidłowy adres email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Hasło jest wymagane'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy aktualizacji profilu użytkownika
   */
  updateProfile: [
    body('firstName')
      .optional()
      .isString()
      .withMessage('Imię musi być tekstem')
      .isLength({ min: 2, max: 50 })
      .withMessage('Imię musi mieć od 2 do 50 znaków'),
    body('lastName')
      .optional()
      .isString()
      .withMessage('Nazwisko musi być tekstem')
      .isLength({ min: 2, max: 50 })
      .withMessage('Nazwisko musi mieć od 2 do 50 znaków'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Data urodzenia musi być w formacie ISO 8601'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Płeć musi mieć jedną z wartości: male, female, other, prefer_not_to_say'),
    body('phone')
      .optional()
      .isString()
      .withMessage('Numer telefonu musi być tekstem')
      .matches(/^\+?[0-9\s\-\(\)]+$/)
      .withMessage('Podaj prawidłowy format numeru telefonu'),
    body('avatarUrl')
      .optional()
      .isURL()
      .withMessage('URL avatara musi być prawidłowym adresem URL'),
    body('bio')
      .optional()
      .isString()
      .withMessage('Bio musi być tekstem')
      .isLength({ max: 1000 })
      .withMessage('Bio nie może przekraczać 1000 znaków'),
    body('fitnessLevel')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom sprawności musi mieć jedną z wartości: beginner, intermediate, advanced, expert'),
    body('fitnessGoals')
      .optional()
      .isArray()
      .withMessage('Cele fitness muszą być tablicą'),
    body('fitnessGoals.*')
      .isIn([
        'weight_loss', 'muscle_gain', 'strength', 'endurance', 
        'flexibility', 'cardiovascular_health', 'overall_fitness', 
        'sports_performance', 'rehabilitation', 'maintenance'
      ])
      .withMessage('Każdy cel fitness musi mieć prawidłową wartość'),
    body('preferredWorkoutDays')
      .optional()
      .isArray()
      .withMessage('Preferowane dni treningowe muszą być tablicą'),
    body('preferredWorkoutDays.*')
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Każdy preferowany dzień treningowy musi mieć prawidłową wartość'),
    body('preferredWorkoutTime')
      .optional()
      .isIn(['morning', 'afternoon', 'evening', 'night', 'flexible'])
      .withMessage('Preferowana pora treningowa musi mieć jedną z wartości: morning, afternoon, evening, night, flexible'),
    body('workoutDuration')
      .optional()
      .isInt({ min: 10, max: 240 })
      .withMessage('Czas trwania treningu musi być liczbą całkowitą między 10 a 240 minut'),
    body('fitnessExperience')
      .optional()
      .isIn(['less_than_6_months', '6_months_to_1_year', '1_to_3_years', '3_to_5_years', 'more_than_5_years'])
      .withMessage('Doświadczenie fitness musi mieć prawidłową wartość'),
    body('healthConditions')
      .optional()
      .isArray()
      .withMessage('Problemy zdrowotne muszą być tablicą'),
    body('healthConditions.*')
      .isString()
      .withMessage('Każdy problem zdrowotny musi być tekstem')
      .isLength({ min: 2, max: 100 })
      .withMessage('Każdy problem zdrowotny musi mieć od 2 do 100 znaków'),
    body('injuries')
      .optional()
      .isArray()
      .withMessage('Kontuzje muszą być tablicą'),
    body('injuries.*')
      .isString()
      .withMessage('Każda kontuzja musi być tekstem')
      .isLength({ min: 2, max: 100 })
      .withMessage('Każda kontuzja musi mieć od 2 do 100 znaków'),
    body('notificationPreferences')
      .optional()
      .isObject()
      .withMessage('Preferencje powiadomień muszą być obiektem'),
    body('notificationPreferences.email')
      .optional()
      .isBoolean()
      .withMessage('Preferencja powiadomień e-mail musi być wartością logiczną'),
    body('notificationPreferences.push')
      .optional()
      .isBoolean()
      .withMessage('Preferencja powiadomień push musi być wartością logiczną'),
    body('notificationPreferences.sms')
      .optional()
      .isBoolean()
      .withMessage('Preferencja powiadomień SMS musi być wartością logiczną'),
    body('settings')
      .optional()
      .isObject()
      .withMessage('Ustawienia muszą być obiektem'),
    body('settings.language')
      .optional()
      .isIn(['pl', 'en', 'de', 'fr', 'es'])
      .withMessage('Język musi mieć jedną z wartości: pl, en, de, fr, es'),
    body('settings.measurementSystem')
      .optional()
      .isIn(['metric', 'imperial'])
      .withMessage('System miar musi mieć jedną z wartości: metric, imperial'),
    body('settings.theme')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Motyw musi mieć jedną z wartości: light, dark, system'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy zmianie hasła
   */
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Aktualne hasło jest wymagane'),
    body('newPassword')
      .notEmpty()
      .withMessage('Nowe hasło jest wymagane')
      .isLength({ min: 8 })
      .withMessage('Hasło musi mieć co najmniej 8 znaków')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .withMessage('Hasło musi zawierać dużą literę, małą literę, cyfrę i znak specjalny')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('Nowe hasło musi być różne od aktualnego');
        }
        return true;
      }),
    body('confirmNewPassword')
      .notEmpty()
      .withMessage('Potwierdzenie nowego hasła jest wymagane')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Hasła muszą być identyczne');
        }
        return true;
      }),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy resetowaniu hasła
   */
  requestPasswordReset: [
    body('email')
      .notEmpty()
      .withMessage('Email jest wymagany')
      .isEmail()
      .withMessage('Podaj prawidłowy adres email')
      .normalizeEmail(),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy potwierdzeniu resetowania hasła
   */
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Token jest wymagany'),
    body('newPassword')
      .notEmpty()
      .withMessage('Nowe hasło jest wymagane')
      .isLength({ min: 8 })
      .withMessage('Hasło musi mieć co najmniej 8 znaków')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .withMessage('Hasło musi zawierać dużą literę, małą literę, cyfrę i znak specjalny'),
    body('confirmNewPassword')
      .notEmpty()
      .withMessage('Potwierdzenie nowego hasła jest wymagane')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Hasła muszą być identyczne');
        }
        return true;
      }),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy aktualizacji pomiarów ciała
   */
  updateBodyMeasurements: [
    body('weight')
      .optional()
      .isFloat({ min: 20, max: 500 })
      .withMessage('Waga musi być liczbą między 20 a 500'),
    body('height')
      .optional()
      .isFloat({ min: 50, max: 250 })
      .withMessage('Wzrost musi być liczbą między 50 a 250 cm'),
    body('bodyFat')
      .optional()
      .isFloat({ min: 1, max: 60 })
      .withMessage('Procent tkanki tłuszczowej musi być liczbą między 1 a 60'),
    body('muscleMass')
      .optional()
      .isFloat({ min: 10, max: 100 })
      .withMessage('Masa mięśniowa musi być liczbą między 10 a 100 kg'),
    body('bmi')
      .optional()
      .isFloat({ min: 10, max: 50 })
      .withMessage('BMI musi być liczbą między 10 a 50'),
    body('waistCircumference')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód talii musi być liczbą między 30 a 200 cm'),
    body('hipCircumference')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód bioder musi być liczbą między 30 a 200 cm'),
    body('chestCircumference')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód klatki piersiowej musi być liczbą między 30 a 200 cm'),
    body('armCircumference')
      .optional()
      .isFloat({ min: 15, max: 100 })
      .withMessage('Obwód ramion musi być liczbą między 15 a 100 cm'),
    body('thighCircumference')
      .optional()
      .isFloat({ min: 20, max: 100 })
      .withMessage('Obwód ud musi być liczbą między 20 a 100 cm'),
    body('calfCircumference')
      .optional()
      .isFloat({ min: 15, max: 80 })
      .withMessage('Obwód łydek musi być liczbą między 15 a 80 cm'),
    body('neckCircumference')
      .optional()
      .isFloat({ min: 20, max: 80 })
      .withMessage('Obwód szyi musi być liczbą między 20 a 80 cm'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Data musi być w formacie ISO 8601'),
    body('notes')
      .optional()
      .isString()
      .withMessage('Notatki muszą być tekstem')
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy dodawaniu osiągnięcia
   */
  addAchievement: [
    body('type')
      .notEmpty()
      .withMessage('Typ osiągnięcia jest wymagany')
      .isIn(['workout_streak', 'weight_goal', 'performance', 'custom'])
      .withMessage('Typ osiągnięcia musi mieć jedną z wartości: workout_streak, weight_goal, performance, custom'),
    body('title')
      .notEmpty()
      .withMessage('Tytuł osiągnięcia jest wymagany')
      .isString()
      .withMessage('Tytuł musi być tekstem')
      .isLength({ min: 3, max: 100 })
      .withMessage('Tytuł musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isString()
      .withMessage('Opis musi być tekstem')
      .isLength({ max: 500 })
      .withMessage('Opis nie może przekraczać 500 znaków'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Data musi być w formacie ISO 8601'),
    body('value')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Wartość musi być nieujemną liczbą'),
    body('unit')
      .optional()
      .isString()
      .withMessage('Jednostka musi być tekstem')
      .isLength({ max: 20 })
      .withMessage('Jednostka nie może przekraczać 20 znaków'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('Status publiczny musi być wartością logiczną'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy wyszukiwaniu użytkowników
   */
  searchUsers: [
    query('query')
      .optional()
      .isString()
      .withMessage('Zapytanie musi być tekstem'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Numer strony musi być liczbą całkowitą większą od 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit wyników musi być liczbą całkowitą między 1 a 100'),
    query('sortBy')
      .optional()
      .isIn(['firstName', 'lastName', 'email', 'createdAt', 'fitnessLevel'])
      .withMessage('Pole sortowania musi być jednym z: firstName, lastName, email, createdAt, fitnessLevel'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Kierunek sortowania musi być jednym z: asc, desc'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy wysyłaniu zaproszenia do znajomych
   */
  sendFriendRequest: [
    body('recipientId')
      .notEmpty()
      .withMessage('ID odbiorcy jest wymagane')
      .isMongoId()
      .withMessage('ID odbiorcy musi być poprawnym identyfikatorem MongoDB'),
    body('message')
      .optional()
      .isString()
      .withMessage('Wiadomość musi być tekstem')
      .isLength({ max: 200 })
      .withMessage('Wiadomość nie może przekraczać 200 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy odpowiedzi na zaproszenie do znajomych
   */
  respondToFriendRequest: [
    param('requestId')
      .notEmpty()
      .withMessage('ID zaproszenia jest wymagane')
      .isMongoId()
      .withMessage('ID zaproszenia musi być poprawnym identyfikatorem MongoDB'),
    body('response')
      .notEmpty()
      .withMessage('Odpowiedź jest wymagana')
      .isIn(['accept', 'reject'])
      .withMessage('Odpowiedź musi mieć jedną z wartości: accept, reject'),
    checkValidationResult
  ]
};

module.exports = userValidators; 