const { body } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

/**
 * Walidatory dla operacji związanych z profilem użytkownika
 */
const profileValidators = {
  /**
   * Walidacja danych przy tworzeniu lub aktualizacji profilu użytkownika
   */
  updateProfile: [
    body('personalInfo')
      .optional()
      .isObject()
      .withMessage('Dane osobowe muszą być obiektem'),
    body('personalInfo.firstName')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Imię musi mieć od 2 do 50 znaków'),
    body('personalInfo.lastName')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nazwisko musi mieć od 2 do 50 znaków'),
    body('personalInfo.dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Data urodzenia musi być w formacie ISO8601')
      .custom(value => {
        const birthDate = new Date(value);
        const now = new Date();
        const minAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
        const maxAge = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
        return birthDate <= minAge && birthDate >= maxAge;
      })
      .withMessage('Wiek musi być między 13 a 100 lat'),
    body('personalInfo.gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Płeć musi być jedną z: male, female, other, prefer_not_to_say'),
    
    body('physicalInfo')
      .optional()
      .isObject()
      .withMessage('Dane fizyczne muszą być obiektem'),
    body('physicalInfo.height')
      .optional()
      .isFloat({ min: 100, max: 250 })
      .withMessage('Wzrost musi być liczbą między 100 a 250 cm'),
    body('physicalInfo.weight')
      .optional()
      .isFloat({ min: 30, max: 300 })
      .withMessage('Waga musi być liczbą między 30 a 300 kg'),
    body('physicalInfo.fitnessLevel')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'athletic'])
      .withMessage('Poziom sprawności musi być jednym z: beginner, intermediate, advanced, athletic'),
    
    body('fitnessGoals')
      .optional()
      .isArray()
      .withMessage('Cele treningowe muszą być tablicą'),
    body('fitnessGoals.*')
      .optional()
      .isIn([
        'weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 
        'cardiovascular_health', 'overall_fitness', 'athletic_performance'
      ])
      .withMessage('Każdy cel treningowy musi mieć poprawną wartość'),
    
    body('healthInfo')
      .optional()
      .isObject()
      .withMessage('Informacje zdrowotne muszą być obiektem'),
    body('healthInfo.medicalConditions')
      .optional()
      .isArray()
      .withMessage('Schorzenia muszą być tablicą'),
    body('healthInfo.allergies')
      .optional()
      .isArray()
      .withMessage('Alergie muszą być tablicą'),
    body('healthInfo.injuries')
      .optional()
      .isArray()
      .withMessage('Urazy muszą być tablicą'),
    body('healthInfo.medications')
      .optional()
      .isArray()
      .withMessage('Przyjmowane leki muszą być tablicą'),
    
    body('trainingPreferences')
      .optional()
      .isObject()
      .withMessage('Preferencje treningowe muszą być obiektem'),
    body('trainingPreferences.preferredDays')
      .optional()
      .isArray()
      .withMessage('Preferowane dni muszą być tablicą'),
    body('trainingPreferences.preferredDays.*')
      .optional()
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Każdy preferowany dzień musi mieć poprawną wartość'),
    body('trainingPreferences.preferredTimeOfDay')
      .optional()
      .isIn(['morning', 'afternoon', 'evening', 'night'])
      .withMessage('Preferowana pora dnia musi być jedną z: morning, afternoon, evening, night'),
    body('trainingPreferences.sessionDuration')
      .optional()
      .isInt({ min: 10, max: 240 })
      .withMessage('Czas trwania sesji musi być liczbą całkowitą między 10 a 240 minut'),
    body('trainingPreferences.trainingFrequency')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Częstotliwość treningu musi być liczbą całkowitą między 1 a 7 dni w tygodniu'),
    body('trainingPreferences.preferredExerciseTypes')
      .optional()
      .isArray()
      .withMessage('Preferowane typy ćwiczeń muszą być tablicą'),
    body('trainingPreferences.preferredExerciseTypes.*')
      .optional()
      .isIn(['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'functional'])
      .withMessage('Każdy preferowany typ ćwiczeń musi mieć poprawną wartość'),
    body('trainingPreferences.availableEquipment')
      .optional()
      .isArray()
      .withMessage('Dostępny sprzęt musi być tablicą'),
    
    body('notificationPreferences')
      .optional()
      .isObject()
      .withMessage('Preferencje powiadomień muszą być obiektem'),
    body('notificationPreferences.email')
      .optional()
      .isBoolean()
      .withMessage('Powiadomienia e-mail muszą być wartością logiczną'),
    body('notificationPreferences.push')
      .optional()
      .isBoolean()
      .withMessage('Powiadomienia push muszą być wartością logiczną'),
    body('notificationPreferences.sms')
      .optional()
      .isBoolean()
      .withMessage('Powiadomienia SMS muszą być wartością logiczną'),
    body('notificationPreferences.trainingReminders')
      .optional()
      .isBoolean()
      .withMessage('Przypomnienia o treningach muszą być wartością logiczną'),
    body('notificationPreferences.achievementNotifications')
      .optional()
      .isBoolean()
      .withMessage('Powiadomienia o osiągnięciach muszą być wartością logiczną'),
    body('notificationPreferences.newsletterSubscription')
      .optional()
      .isBoolean()
      .withMessage('Subskrypcja newslettera musi być wartością logiczną'),
    
    body('bodyMeasurements')
      .optional()
      .isObject()
      .withMessage('Pomiary ciała muszą być obiektem'),
    body('bodyMeasurements.chest')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód klatki piersiowej musi być liczbą między 30 a 200 cm'),
    body('bodyMeasurements.waist')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód talii musi być liczbą między 30 a 200 cm'),
    body('bodyMeasurements.hips')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód bioder musi być liczbą między 30 a 200 cm'),
    body('bodyMeasurements.thighs')
      .optional()
      .isFloat({ min: 20, max: 100 })
      .withMessage('Obwód ud musi być liczbą między 20 a 100 cm'),
    body('bodyMeasurements.arms')
      .optional()
      .isFloat({ min: 15, max: 80 })
      .withMessage('Obwód ramion musi być liczbą między 15 a 80 cm'),
    
    body('avatar')
      .optional()
      .isURL()
      .withMessage('Avatar musi być poprawnym adresem URL'),
    
    body('timezone')
      .optional()
      .isString()
      .withMessage('Strefa czasowa musi być ciągiem znaków'),
    
    body('language')
      .optional()
      .isIn(['pl', 'en', 'de', 'fr', 'es'])
      .withMessage('Język musi być jednym z: pl, en, de, fr, es'),
    
    checkValidationResult
  ],

  /**
   * Walidacja danych przy dodawaniu wpisu pomiaru ciała
   */
  addBodyMeasurement: [
    body('date')
      .notEmpty()
      .withMessage('Data pomiaru jest wymagana')
      .isISO8601()
      .withMessage('Data musi być w formacie ISO8601'),
    body('weight')
      .optional()
      .isFloat({ min: 30, max: 300 })
      .withMessage('Waga musi być liczbą między 30 a 300 kg'),
    body('bodyFat')
      .optional()
      .isFloat({ min: 1, max: 70 })
      .withMessage('Procent tkanki tłuszczowej musi być liczbą między 1 a 70%'),
    body('chest')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód klatki piersiowej musi być liczbą między 30 a 200 cm'),
    body('waist')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód talii musi być liczbą między 30 a 200 cm'),
    body('hips')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód bioder musi być liczbą między 30 a 200 cm'),
    body('thighs')
      .optional()
      .isFloat({ min: 20, max: 100 })
      .withMessage('Obwód ud musi być liczbą między 20 a 100 cm'),
    body('arms')
      .optional()
      .isFloat({ min: 15, max: 80 })
      .withMessage('Obwód ramion musi być liczbą między 15 a 80 cm'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notatki nie mogą przekraczać 1000 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy ustawianiu celów treningowych
   */
  setTrainingGoals: [
    body('goals')
      .notEmpty()
      .withMessage('Cele treningowe są wymagane')
      .isArray({ min: 1 })
      .withMessage('Cele treningowe muszą być tablicą z co najmniej jednym elementem'),
    body('goals.*.type')
      .notEmpty()
      .withMessage('Typ celu jest wymagany')
      .isIn([
        'weight_loss', 'muscle_gain', 'body_fat_percentage', 'run_distance', 
        'lifting_weight', 'workout_frequency', 'specific_exercise'
      ])
      .withMessage('Typ celu musi mieć poprawną wartość'),
    body('goals.*.target')
      .notEmpty()
      .withMessage('Wartość docelowa jest wymagana'),
    body('goals.*.current')
      .notEmpty()
      .withMessage('Aktualna wartość jest wymagana'),
    body('goals.*.deadline')
      .optional()
      .isISO8601()
      .withMessage('Termin musi być w formacie ISO8601'),
    body('goals.*.unit')
      .notEmpty()
      .withMessage('Jednostka jest wymagana')
      .isIn(['kg', 'lbs', '%', 'km', 'miles', 'reps', 'times_per_week'])
      .withMessage('Jednostka musi mieć poprawną wartość'),
    body('goals.*.notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    checkValidationResult
  ]
};

module.exports = profileValidators; 