const { body, param, query } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

/**
 * Walidatory dla operacji związanych z ćwiczeniami
 */
const exerciseValidators = {
  /**
   * Walidacja danych przy tworzeniu nowego ćwiczenia
   */
  createExercise: [
    body('name')
      .notEmpty()
      .withMessage('Nazwa ćwiczenia jest wymagana')
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa ćwiczenia musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Opis nie może przekraczać 2000 znaków'),
    body('type')
      .notEmpty()
      .withMessage('Typ ćwiczenia jest wymagany')
      .isIn([
        'strength', 'cardio', 'flexibility', 'balance', 'plyometric', 
        'functional', 'isometric', 'calisthenics', 'powerlifting', 'olympic_lifting', 
        'compound', 'isolation', 'circuit', 'hiit', 'tabata'
      ])
      .withMessage('Typ ćwiczenia musi być jednym z dozwolonych typów'),
    body('difficulty')
      .notEmpty()
      .withMessage('Poziom trudności jest wymagany')
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, expert'),
    body('primaryMuscleGroups')
      .notEmpty()
      .withMessage('Główne grupy mięśniowe są wymagane')
      .isArray()
      .withMessage('Główne grupy mięśniowe muszą być tablicą'),
    body('primaryMuscleGroups.*')
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Każda główna grupa mięśniowa musi mieć poprawną wartość'),
    body('secondaryMuscleGroups')
      .optional()
      .isArray()
      .withMessage('Drugorzędne grupy mięśniowe muszą być tablicą'),
    body('secondaryMuscleGroups.*')
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Każda drugorzędna grupa mięśniowa musi mieć poprawną wartość'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Wymagany sprzęt musi być tablicą'),
    body('equipment.*')
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Każdy element sprzętu musi mieć od 2 do 50 znaków'),
    body('mechanic')
      .optional()
      .isIn(['compound', 'isolation', 'both'])
      .withMessage('Mechanika ćwiczenia musi być jedną z: compound, isolation, both'),
    body('force')
      .optional()
      .isIn(['push', 'pull', 'static', 'both'])
      .withMessage('Typ siły musi być jednym z: push, pull, static, both'),
    body('instructions')
      .notEmpty()
      .withMessage('Instrukcje wykonania są wymagane')
      .isArray()
      .withMessage('Instrukcje muszą być tablicą'),
    body('instructions.*')
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage('Każda instrukcja musi mieć od 10 do 500 znaków'),
    body('tips')
      .optional()
      .isArray()
      .withMessage('Wskazówki muszą być tablicą'),
    body('tips.*')
      .isString()
      .isLength({ min: 5, max: 300 })
      .withMessage('Każda wskazówka musi mieć od 5 do 300 znaków'),
    body('cautions')
      .optional()
      .isArray()
      .withMessage('Ostrzeżenia muszą być tablicą'),
    body('cautions.*')
      .isString()
      .isLength({ min: 5, max: 300 })
      .withMessage('Każde ostrzeżenie musi mieć od 5 do 300 znaków'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Obrazy muszą być tablicą'),
    body('images.*')
      .isURL()
      .withMessage('Każdy obraz musi być prawidłowym URL'),
    body('videos')
      .optional()
      .isArray()
      .withMessage('Filmy muszą być tablicą'),
    body('videos.*')
      .isURL()
      .withMessage('Każdy film musi być prawidłowym URL'),
    body('variations')
      .optional()
      .isArray()
      .withMessage('Warianty ćwiczenia muszą być tablicą'),
    body('variations.*')
      .optional()
      .isString()
      .withMessage('Każdy wariant musi być ciągiem znaków'),
    body('defaultSets')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Domyślna liczba serii musi być liczbą całkowitą między 1 a 20'),
    body('defaultReps')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Domyślna liczba powtórzeń musi być liczbą całkowitą między 1 a 1000'),
    body('defaultDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Domyślny czas trwania musi być liczbą całkowitą większą od 0'),
    body('defaultRest')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Domyślny czas odpoczynku musi być liczbą całkowitą nieujemną'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('Status publiczny musi być wartością logiczną'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tagi muszą być tablicą'),
    body('tags.*')
      .isString()
      .isLength({ min: 2, max: 30 })
      .withMessage('Każdy tag musi mieć od 2 do 30 znaków'),
    body('targetHeartRate')
      .optional()
      .isObject()
      .withMessage('Docelowe tętno musi być obiektem'),
    body('targetHeartRate.min')
      .optional()
      .isInt({ min: 60, max: 200 })
      .withMessage('Minimalne tętno musi być liczbą całkowitą między 60 a 200'),
    body('targetHeartRate.max')
      .optional()
      .isInt({ min: 60, max: 220 })
      .withMessage('Maksymalne tętno musi być liczbą całkowitą między 60 a 220'),
    body('estimatedCaloriesBurn')
      .optional()
      .isObject()
      .withMessage('Szacowane spalanie kalorii musi być obiektem'),
    body('estimatedCaloriesBurn.perMinute')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Spalanie kalorii na minutę musi być liczbą nieujemną'),
    body('estimatedCaloriesBurn.perHour')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Spalanie kalorii na godzinę musi być liczbą nieujemną'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy aktualizacji ćwiczenia
   */
  updateExercise: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator ćwiczenia jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator ćwiczenia musi być poprawnym identyfikatorem MongoDB'),
    body('name')
      .optional()
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa ćwiczenia musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Opis nie może przekraczać 2000 znaków'),
    body('type')
      .optional()
      .isIn([
        'strength', 'cardio', 'flexibility', 'balance', 'plyometric', 
        'functional', 'isometric', 'calisthenics', 'powerlifting', 'olympic_lifting', 
        'compound', 'isolation', 'circuit', 'hiit', 'tabata'
      ])
      .withMessage('Typ ćwiczenia musi być jednym z dozwolonych typów'),
    body('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, expert'),
    body('primaryMuscleGroups')
      .optional()
      .isArray()
      .withMessage('Główne grupy mięśniowe muszą być tablicą'),
    body('primaryMuscleGroups.*')
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Każda główna grupa mięśniowa musi mieć poprawną wartość'),
    body('secondaryMuscleGroups')
      .optional()
      .isArray()
      .withMessage('Drugorzędne grupy mięśniowe muszą być tablicą'),
    body('secondaryMuscleGroups.*')
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Każda drugorzędna grupa mięśniowa musi mieć poprawną wartość'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Wymagany sprzęt musi być tablicą'),
    body('equipment.*')
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Każdy element sprzętu musi mieć od 2 do 50 znaków'),
    body('mechanic')
      .optional()
      .isIn(['compound', 'isolation', 'both'])
      .withMessage('Mechanika ćwiczenia musi być jedną z: compound, isolation, both'),
    body('force')
      .optional()
      .isIn(['push', 'pull', 'static', 'both'])
      .withMessage('Typ siły musi być jednym z: push, pull, static, both'),
    body('instructions')
      .optional()
      .isArray()
      .withMessage('Instrukcje muszą być tablicą'),
    body('instructions.*')
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage('Każda instrukcja musi mieć od 10 do 500 znaków'),
    body('tips')
      .optional()
      .isArray()
      .withMessage('Wskazówki muszą być tablicą'),
    body('tips.*')
      .isString()
      .isLength({ min: 5, max: 300 })
      .withMessage('Każda wskazówka musi mieć od 5 do 300 znaków'),
    body('cautions')
      .optional()
      .isArray()
      .withMessage('Ostrzeżenia muszą być tablicą'),
    body('cautions.*')
      .isString()
      .isLength({ min: 5, max: 300 })
      .withMessage('Każde ostrzeżenie musi mieć od 5 do 300 znaków'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Obrazy muszą być tablicą'),
    body('images.*')
      .isURL()
      .withMessage('Każdy obraz musi być prawidłowym URL'),
    body('videos')
      .optional()
      .isArray()
      .withMessage('Filmy muszą być tablicą'),
    body('videos.*')
      .isURL()
      .withMessage('Każdy film musi być prawidłowym URL'),
    body('variations')
      .optional()
      .isArray()
      .withMessage('Warianty ćwiczenia muszą być tablicą'),
    body('variations.*')
      .optional()
      .isString()
      .withMessage('Każdy wariant musi być ciągiem znaków'),
    body('defaultSets')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Domyślna liczba serii musi być liczbą całkowitą między 1 a 20'),
    body('defaultReps')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Domyślna liczba powtórzeń musi być liczbą całkowitą między 1 a 1000'),
    body('defaultDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Domyślny czas trwania musi być liczbą całkowitą większą od 0'),
    body('defaultRest')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Domyślny czas odpoczynku musi być liczbą całkowitą nieujemną'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('Status publiczny musi być wartością logiczną'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tagi muszą być tablicą'),
    body('tags.*')
      .isString()
      .isLength({ min: 2, max: 30 })
      .withMessage('Każdy tag musi mieć od 2 do 30 znaków'),
    body('targetHeartRate')
      .optional()
      .isObject()
      .withMessage('Docelowe tętno musi być obiektem'),
    body('targetHeartRate.min')
      .optional()
      .isInt({ min: 60, max: 200 })
      .withMessage('Minimalne tętno musi być liczbą całkowitą między 60 a 200'),
    body('targetHeartRate.max')
      .optional()
      .isInt({ min: 60, max: 220 })
      .withMessage('Maksymalne tętno musi być liczbą całkowitą między 60 a 220'),
    body('estimatedCaloriesBurn')
      .optional()
      .isObject()
      .withMessage('Szacowane spalanie kalorii musi być obiektem'),
    body('estimatedCaloriesBurn.perMinute')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Spalanie kalorii na minutę musi być liczbą nieujemną'),
    body('estimatedCaloriesBurn.perHour')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Spalanie kalorii na godzinę musi być liczbą nieujemną'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy wyszukiwaniu ćwiczeń
   */
  searchExercises: [
    query('name')
      .optional()
      .isString()
      .withMessage('Nazwa musi być ciągiem znaków'),
    query('type')
      .optional()
      .isIn([
        'strength', 'cardio', 'flexibility', 'balance', 'plyometric', 
        'functional', 'isometric', 'calisthenics', 'powerlifting', 'olympic_lifting', 
        'compound', 'isolation', 'circuit', 'hiit', 'tabata'
      ])
      .withMessage('Typ ćwiczenia musi być jednym z dozwolonych typów'),
    query('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, expert'),
    query('primaryMuscleGroup')
      .optional()
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Główna grupa mięśniowa musi mieć poprawną wartość'),
    query('secondaryMuscleGroup')
      .optional()
      .isIn([
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
        'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs', 'core', 
        'neck', 'hip_flexors', 'adductors', 'abductors', 'full_body'
      ])
      .withMessage('Drugorzędna grupa mięśniowa musi mieć poprawną wartość'),
    query('equipment')
      .optional()
      .isString()
      .withMessage('Sprzęt musi być ciągiem znaków'),
    query('mechanic')
      .optional()
      .isIn(['compound', 'isolation', 'both'])
      .withMessage('Mechanika ćwiczenia musi być jedną z: compound, isolation, both'),
    query('force')
      .optional()
      .isIn(['push', 'pull', 'static', 'both'])
      .withMessage('Typ siły musi być jednym z: push, pull, static, both'),
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
      .isIn(['name', 'type', 'difficulty', 'createdAt', 'popularity'])
      .withMessage('Pole sortowania musi być jednym z: name, type, difficulty, createdAt, popularity'),
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
   * Walidacja danych przy ocenianiu ćwiczenia
   */
  rateExercise: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator ćwiczenia jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator ćwiczenia musi być poprawnym identyfikatorem MongoDB'),
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
    body('review')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Recenzja nie może przekraczać 1000 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy zapisywaniu postępu ćwiczenia
   */
  logExerciseProgress: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator ćwiczenia jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator ćwiczenia musi być poprawnym identyfikatorem MongoDB'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Data musi być w formacie ISO 8601'),
    body('sets')
      .notEmpty()
      .withMessage('Serie są wymagane')
      .isArray({ min: 1 })
      .withMessage('Serie muszą być tablicą z co najmniej jednym elementem'),
    body('sets.*.weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Waga musi być liczbą nieujemną'),
    body('sets.*.reps')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Liczba powtórzeń musi być liczbą całkowitą nieujemną'),
    body('sets.*.duration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Czas trwania musi być liczbą całkowitą nieujemną'),
    body('sets.*.distance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Dystans musi być liczbą nieujemną'),
    body('sets.*.completed')
      .optional()
      .isBoolean()
      .withMessage('Status ukończenia musi być wartością logiczną'),
    body('sets.*.failureReason')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage('Powód niepowodzenia nie może przekraczać 200 znaków'),
    body('sets.*.restTime')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Czas odpoczynku musi być liczbą całkowitą nieujemną'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notatki nie mogą przekraczać 1000 znaków'),
    body('perceived_exertion')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Postrzegany wysiłek musi być liczbą całkowitą między 1 a 10'),
    body('heartRate')
      .optional()
      .isObject()
      .withMessage('Tętno musi być obiektem'),
    body('heartRate.average')
      .optional()
      .isInt({ min: 40, max: 220 })
      .withMessage('Średnie tętno musi być liczbą całkowitą między 40 a 220'),
    body('heartRate.max')
      .optional()
      .isInt({ min: 40, max: 220 })
      .withMessage('Maksymalne tętno musi być liczbą całkowitą między 40 a 220'),
    body('caloriesBurned')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Spalone kalorie muszą być liczbą nieujemną'),
    checkValidationResult
  ]
};

module.exports = exerciseValidators; 