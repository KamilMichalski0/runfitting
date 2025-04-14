const { body, param, query } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

/**
 * Walidatory dla operacji związanych z planami treningowymi
 */
const trainingPlanValidators = {
  /**
   * Walidacja danych przy tworzeniu nowego planu treningowego
   */
  createTrainingPlan: [
    body('name')
      .notEmpty()
      .withMessage('Nazwa planu treningowego jest wymagana')
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa planu treningowego musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Opis nie może przekraczać 2000 znaków'),
    body('goal')
      .notEmpty()
      .withMessage('Cel planu treningowego jest wymagany')
      .isIn(['strength', 'muscle_gain', 'fat_loss', 'endurance', 'general_fitness', 'rehabilitation', 'custom'])
      .withMessage('Cel planu musi być jednym z: strength, muscle_gain, fat_loss, endurance, general_fitness, rehabilitation, custom'),
    body('level')
      .notEmpty()
      .withMessage('Poziom zaawansowania jest wymagany')
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom zaawansowania musi być jednym z: beginner, intermediate, advanced, expert'),
    body('duration')
      .notEmpty()
      .withMessage('Czas trwania planu jest wymagany')
      .isInt({ min: 1, max: 52 })
      .withMessage('Czas trwania musi być liczbą całkowitą między 1 a 52 tygodnie'),
    body('daysPerWeek')
      .notEmpty()
      .withMessage('Liczba dni treningowych w tygodniu jest wymagana')
      .isInt({ min: 1, max: 7 })
      .withMessage('Liczba dni treningowych musi być liczbą całkowitą między 1 a 7'),
    body('workouts')
      .notEmpty()
      .withMessage('Treningi są wymagane')
      .isArray({ min: 1 })
      .withMessage('Plan treningowy musi zawierać co najmniej jeden trening'),
    body('workouts.*.workoutId')
      .notEmpty()
      .withMessage('ID treningu jest wymagane')
      .isMongoId()
      .withMessage('ID treningu musi być poprawnym identyfikatorem MongoDB'),
    body('workouts.*.dayOfWeek')
      .notEmpty()
      .withMessage('Dzień tygodnia jest wymagany')
      .isInt({ min: 1, max: 7 })
      .withMessage('Dzień tygodnia musi być liczbą całkowitą między 1 (poniedziałek) a 7 (niedziela)'),
    body('workouts.*.weekNumber')
      .notEmpty()
      .withMessage('Numer tygodnia jest wymagany')
      .isInt({ min: 1, max: 52 })
      .withMessage('Numer tygodnia musi być liczbą całkowitą między 1 a 52'),
    body('workouts.*.order')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Kolejność musi być liczbą całkowitą większą od 0'),
    body('workouts.*.notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    body('targetMuscleGroups')
      .optional()
      .isArray()
      .withMessage('Docelowe grupy mięśniowe muszą być tablicą'),
    body('targetMuscleGroups.*')
      .optional()
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Każda grupa mięśniowa musi mieć poprawną wartość'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Wymagany sprzęt musi być tablicą'),
    body('equipment.*')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Każdy element sprzętu musi mieć od 2 do 50 znaków'),
    body('estimatedCaloriesBurn')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Szacowane spalone kalorie muszą być liczbą nieujemną'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tagi muszą być tablicą'),
    body('tags.*')
      .optional()
      .isString()
      .isLength({ min: 2, max: 30 })
      .withMessage('Każdy tag musi mieć od 2 do 30 znaków'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('Status publiczny musi być wartością logiczną'),
    body('restDays')
      .optional()
      .isArray()
      .withMessage('Dni odpoczynku muszą być tablicą'),
    body('restDays.*')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Dzień odpoczynku musi być liczbą całkowitą między 1 (poniedziałek) a 7 (niedziela)'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Notatki nie mogą przekraczać 2000 znaków'),
    body('progressionStrategy')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Strategia progresji nie może przekraczać 1000 znaków'),
    body('deloadStrategy')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Strategia rozładowania nie może przekraczać 1000 znaków'),
    body('nutritionTips')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Wskazówki żywieniowe nie mogą przekraczać 1000 znaków'),
    body('recoveryTips')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Wskazówki regeneracyjne nie mogą przekraczać 1000 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy aktualizacji planu treningowego
   */
  updateTrainingPlan: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator planu treningowego jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator planu treningowego musi być poprawnym identyfikatorem MongoDB'),
    body('name')
      .optional()
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa planu treningowego musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Opis nie może przekraczać 2000 znaków'),
    body('goal')
      .optional()
      .isIn(['strength', 'muscle_gain', 'fat_loss', 'endurance', 'general_fitness', 'rehabilitation', 'custom'])
      .withMessage('Cel planu musi być jednym z: strength, muscle_gain, fat_loss, endurance, general_fitness, rehabilitation, custom'),
    body('level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom zaawansowania musi być jednym z: beginner, intermediate, advanced, expert'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 52 })
      .withMessage('Czas trwania musi być liczbą całkowitą między 1 a 52 tygodnie'),
    body('daysPerWeek')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Liczba dni treningowych musi być liczbą całkowitą między 1 a 7'),
    body('workouts')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Plan treningowy musi zawierać co najmniej jeden trening'),
    body('workouts.*.workoutId')
      .optional()
      .isMongoId()
      .withMessage('ID treningu musi być poprawnym identyfikatorem MongoDB'),
    body('workouts.*.dayOfWeek')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Dzień tygodnia musi być liczbą całkowitą między 1 (poniedziałek) a 7 (niedziela)'),
    body('workouts.*.weekNumber')
      .optional()
      .isInt({ min: 1, max: 52 })
      .withMessage('Numer tygodnia musi być liczbą całkowitą między 1 a 52'),
    body('workouts.*.order')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Kolejność musi być liczbą całkowitą większą od 0'),
    body('workouts.*.notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    body('targetMuscleGroups')
      .optional()
      .isArray()
      .withMessage('Docelowe grupy mięśniowe muszą być tablicą'),
    body('targetMuscleGroups.*')
      .optional()
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Każda grupa mięśniowa musi mieć poprawną wartość'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Wymagany sprzęt musi być tablicą'),
    body('equipment.*')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Każdy element sprzętu musi mieć od 2 do 50 znaków'),
    body('estimatedCaloriesBurn')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Szacowane spalone kalorie muszą być liczbą nieujemną'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tagi muszą być tablicą'),
    body('tags.*')
      .optional()
      .isString()
      .isLength({ min: 2, max: 30 })
      .withMessage('Każdy tag musi mieć od 2 do 30 znaków'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('Status publiczny musi być wartością logiczną'),
    body('restDays')
      .optional()
      .isArray()
      .withMessage('Dni odpoczynku muszą być tablicą'),
    body('restDays.*')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Dzień odpoczynku musi być liczbą całkowitą między 1 (poniedziałek) a 7 (niedziela)'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Notatki nie mogą przekraczać 2000 znaków'),
    body('progressionStrategy')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Strategia progresji nie może przekraczać 1000 znaków'),
    body('deloadStrategy')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Strategia rozładowania nie może przekraczać 1000 znaków'),
    body('nutritionTips')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Wskazówki żywieniowe nie mogą przekraczać 1000 znaków'),
    body('recoveryTips')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Wskazówki regeneracyjne nie mogą przekraczać 1000 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy wyszukiwaniu planów treningowych
   */
  searchTrainingPlans: [
    query('name')
      .optional()
      .isString()
      .withMessage('Nazwa musi być ciągiem znaków'),
    query('goal')
      .optional()
      .isIn(['strength', 'muscle_gain', 'fat_loss', 'endurance', 'general_fitness', 'rehabilitation', 'custom'])
      .withMessage('Cel planu musi być jednym z: strength, muscle_gain, fat_loss, endurance, general_fitness, rehabilitation, custom'),
    query('level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom zaawansowania musi być jednym z: beginner, intermediate, advanced, expert'),
    query('durationMin')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Minimalny czas trwania musi być liczbą całkowitą większą od 0'),
    query('durationMax')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Maksymalny czas trwania musi być liczbą całkowitą większą od 0'),
    query('daysPerWeekMin')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Minimalna liczba dni w tygodniu musi być liczbą całkowitą między 1 a 7'),
    query('daysPerWeekMax')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Maksymalna liczba dni w tygodniu musi być liczbą całkowitą między 1 a 7'),
    query('muscleGroup')
      .optional()
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Grupa mięśniowa musi mieć poprawną wartość'),
    query('equipment')
      .optional()
      .isString()
      .withMessage('Sprzęt musi być ciągiem znaków'),
    query('tags')
      .optional()
      .isString()
      .withMessage('Tagi muszą być ciągiem znaków'),
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
      .isIn(['name', 'goal', 'level', 'duration', 'daysPerWeek', 'createdAt', 'popularity'])
      .withMessage('Pole sortowania musi być jednym z: name, goal, level, duration, daysPerWeek, createdAt, popularity'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Kierunek sortowania musi być jednym z: asc, desc'),
    query('isPublic')
      .optional()
      .isBoolean()
      .withMessage('Status publiczny musi być wartością logiczną'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy ocenianiu planu treningowego
   */
  rateTrainingPlan: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator planu treningowego jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator planu treningowego musi być poprawnym identyfikatorem MongoDB'),
    body('rating')
      .notEmpty()
      .withMessage('Ocena jest wymagana')
      .isInt({ min: 1, max: 5 })
      .withMessage('Ocena musi być liczbą całkowitą między 1 a 5'),
    body('difficultyRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Ocena trudności musi być liczbą całkowitą między 1 a 5'),
    body('effectivenessRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Ocena skuteczności musi być liczbą całkowitą między 1 a 5'),
    body('enjoymentRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Ocena przyjemności musi być liczbą całkowitą między 1 a 5'),
    body('review')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Recenzja nie może przekraczać 1000 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy śledzeniu postępu w planie treningowym
   */
  trackTrainingPlanProgress: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator planu treningowego jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator planu treningowego musi być poprawnym identyfikatorem MongoDB'),
    body('currentWeek')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Aktualny tydzień musi być liczbą całkowitą większą od 0'),
    body('workoutsCompleted')
      .optional()
      .isArray()
      .withMessage('Ukończone treningi muszą być tablicą'),
    body('workoutsCompleted.*.workoutId')
      .optional()
      .isMongoId()
      .withMessage('ID treningu musi być poprawnym identyfikatorem MongoDB'),
    body('workoutsCompleted.*.completedAt')
      .optional()
      .isISO8601()
      .withMessage('Data ukończenia musi być w formacie ISO 8601'),
    body('workoutsCompleted.*.weekNumber')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Numer tygodnia musi być liczbą całkowitą większą od 0'),
    body('workoutsCompleted.*.dayOfWeek')
      .optional()
      .isInt({ min: 1, max: 7 })
      .withMessage('Dzień tygodnia musi być liczbą całkowitą między 1 (poniedziałek) a 7 (niedziela)'),
    body('workoutsCompleted.*.duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Czas trwania musi być liczbą całkowitą większą od 0'),
    body('workoutsCompleted.*.caloriesBurned')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Spalone kalorie muszą być liczbą nieujemną'),
    body('workoutsCompleted.*.difficulty')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Trudność musi być liczbą całkowitą między 1 a 10'),
    body('workoutsCompleted.*.notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    body('status')
      .optional()
      .isIn(['in_progress', 'completed', 'paused', 'abandoned'])
      .withMessage('Status musi być jednym z: in_progress, completed, paused, abandoned'),
    body('overallFeedback')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Ogólna opinia nie może przekraczać 1000 znaków'),
    body('measurements')
      .optional()
      .isObject()
      .withMessage('Pomiary muszą być obiektem'),
    body('measurements.weight')
      .optional()
      .isFloat({ min: 20, max: 500 })
      .withMessage('Waga musi być liczbą między 20 a 500 kg'),
    body('measurements.bodyFat')
      .optional()
      .isFloat({ min: 1, max: 70 })
      .withMessage('Procent tkanki tłuszczowej musi być liczbą między 1 a 70%'),
    body('measurements.chest')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód klatki piersiowej musi być liczbą między 30 a 200 cm'),
    body('measurements.waist')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód talii musi być liczbą między 30 a 200 cm'),
    body('measurements.hips')
      .optional()
      .isFloat({ min: 30, max: 200 })
      .withMessage('Obwód bioder musi być liczbą między 30 a 200 cm'),
    body('measurements.arms')
      .optional()
      .isFloat({ min: 15, max: 100 })
      .withMessage('Obwód ramion musi być liczbą między 15 a 100 cm'),
    body('measurements.thighs')
      .optional()
      .isFloat({ min: 20, max: 120 })
      .withMessage('Obwód ud musi być liczbą między 20 a 120 cm'),
    body('measurements.calves')
      .optional()
      .isFloat({ min: 10, max: 80 })
      .withMessage('Obwód łydek musi być liczbą między 10 a 80 cm'),
    checkValidationResult
  ]
};

module.exports = trainingPlanValidators; 