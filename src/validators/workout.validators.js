const { body, param, query } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

/**
 * Walidatory dla operacji związanych z treningami
 */
const workoutValidators = {
  /**
   * Walidacja danych przy tworzeniu nowego treningu
   */
  createWorkout: [
    body('name')
      .notEmpty()
      .withMessage('Nazwa treningu jest wymagana')
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa treningu musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Opis nie może przekraczać 1000 znaków'),
    body('type')
      .notEmpty()
      .withMessage('Typ treningu jest wymagany')
      .isIn(['strength', 'cardio', 'hiit', 'circuit', 'flexibility', 'recovery', 'custom'])
      .withMessage('Typ treningu musi być jednym z: strength, cardio, hiit, circuit, flexibility, recovery, custom'),
    body('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, expert'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 360 })
      .withMessage('Czas trwania musi być liczbą całkowitą między 1 a 360 minut'),
    body('caloriesBurn')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Szacowane spalone kalorie muszą być liczbą nieujemną'),
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
    body('exercises')
      .notEmpty()
      .withMessage('Ćwiczenia są wymagane')
      .isArray({ min: 1 })
      .withMessage('Trening musi zawierać co najmniej jedno ćwiczenie'),
    body('exercises.*.exerciseId')
      .notEmpty()
      .withMessage('ID ćwiczenia jest wymagane')
      .isMongoId()
      .withMessage('ID ćwiczenia musi być poprawnym identyfikatorem MongoDB'),
    body('exercises.*.sets')
      .notEmpty()
      .withMessage('Liczba serii jest wymagana')
      .isInt({ min: 1, max: 20 })
      .withMessage('Liczba serii musi być liczbą całkowitą między 1 a 20'),
    body('exercises.*.reps')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Liczba powtórzeń musi być liczbą całkowitą między 1 a 100'),
    body('exercises.*.duration')
      .optional()
      .isInt({ min: 1, max: 600 })
      .withMessage('Czas trwania musi być liczbą całkowitą między 1 a 600 sekund'),
    body('exercises.*.restTime')
      .optional()
      .isInt({ min: 0, max: 300 })
      .withMessage('Czas odpoczynku musi być liczbą całkowitą między 0 a 300 sekund'),
    body('exercises.*.weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Waga musi być liczbą nieujemną'),
    body('exercises.*.distance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Dystans musi być liczbą nieujemną'),
    body('exercises.*.notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    body('warmup')
      .optional()
      .isArray()
      .withMessage('Rozgrzewka musi być tablicą'),
    body('warmup.*.exerciseId')
      .optional()
      .isMongoId()
      .withMessage('ID ćwiczenia rozgrzewkowego musi być poprawnym identyfikatorem MongoDB'),
    body('warmup.*.duration')
      .optional()
      .isInt({ min: 30, max: 600 })
      .withMessage('Czas trwania rozgrzewki musi być liczbą całkowitą między 30 a 600 sekund'),
    body('cooldown')
      .optional()
      .isArray()
      .withMessage('Wyciszenie musi być tablicą'),
    body('cooldown.*.exerciseId')
      .optional()
      .isMongoId()
      .withMessage('ID ćwiczenia wyciszającego musi być poprawnym identyfikatorem MongoDB'),
    body('cooldown.*.duration')
      .optional()
      .isInt({ min: 30, max: 600 })
      .withMessage('Czas trwania wyciszenia musi być liczbą całkowitą między 30 a 600 sekund'),
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
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notatki nie mogą przekraczać 1000 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy aktualizacji treningu
   */
  updateWorkout: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator treningu jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator treningu musi być poprawnym identyfikatorem MongoDB'),
    body('name')
      .optional()
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nazwa treningu musi mieć od 3 do 100 znaków'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Opis nie może przekraczać 1000 znaków'),
    body('type')
      .optional()
      .isIn(['strength', 'cardio', 'hiit', 'circuit', 'flexibility', 'recovery', 'custom'])
      .withMessage('Typ treningu musi być jednym z: strength, cardio, hiit, circuit, flexibility, recovery, custom'),
    body('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, expert'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 360 })
      .withMessage('Czas trwania musi być liczbą całkowitą między 1 a 360 minut'),
    body('caloriesBurn')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Szacowane spalone kalorie muszą być liczbą nieujemną'),
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
    body('exercises')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Trening musi zawierać co najmniej jedno ćwiczenie'),
    body('exercises.*.exerciseId')
      .optional()
      .isMongoId()
      .withMessage('ID ćwiczenia musi być poprawnym identyfikatorem MongoDB'),
    body('exercises.*.sets')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Liczba serii musi być liczbą całkowitą między 1 a 20'),
    body('exercises.*.reps')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Liczba powtórzeń musi być liczbą całkowitą między 1 a 100'),
    body('exercises.*.duration')
      .optional()
      .isInt({ min: 1, max: 600 })
      .withMessage('Czas trwania musi być liczbą całkowitą między 1 a 600 sekund'),
    body('exercises.*.restTime')
      .optional()
      .isInt({ min: 0, max: 300 })
      .withMessage('Czas odpoczynku musi być liczbą całkowitą między 0 a 300 sekund'),
    body('exercises.*.weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Waga musi być liczbą nieujemną'),
    body('exercises.*.distance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Dystans musi być liczbą nieujemną'),
    body('exercises.*.notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notatki nie mogą przekraczać 500 znaków'),
    body('warmup')
      .optional()
      .isArray()
      .withMessage('Rozgrzewka musi być tablicą'),
    body('warmup.*.exerciseId')
      .optional()
      .isMongoId()
      .withMessage('ID ćwiczenia rozgrzewkowego musi być poprawnym identyfikatorem MongoDB'),
    body('warmup.*.duration')
      .optional()
      .isInt({ min: 30, max: 600 })
      .withMessage('Czas trwania rozgrzewki musi być liczbą całkowitą między 30 a 600 sekund'),
    body('cooldown')
      .optional()
      .isArray()
      .withMessage('Wyciszenie musi być tablicą'),
    body('cooldown.*.exerciseId')
      .optional()
      .isMongoId()
      .withMessage('ID ćwiczenia wyciszającego musi być poprawnym identyfikatorem MongoDB'),
    body('cooldown.*.duration')
      .optional()
      .isInt({ min: 30, max: 600 })
      .withMessage('Czas trwania wyciszenia musi być liczbą całkowitą między 30 a 600 sekund'),
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
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notatki nie mogą przekraczać 1000 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy wyszukiwaniu treningów
   */
  searchWorkouts: [
    query('name')
      .optional()
      .isString()
      .withMessage('Nazwa musi być ciągiem znaków'),
    query('type')
      .optional()
      .isIn(['strength', 'cardio', 'hiit', 'circuit', 'flexibility', 'recovery', 'custom'])
      .withMessage('Typ treningu musi być jednym z: strength, cardio, hiit, circuit, flexibility, recovery, custom'),
    query('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Poziom trudności musi być jednym z: beginner, intermediate, advanced, expert'),
    query('durationMin')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Minimalny czas trwania musi być liczbą całkowitą większą od 0'),
    query('durationMax')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Maksymalny czas trwania musi być liczbą całkowitą większą od 0'),
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
      .isIn(['name', 'type', 'difficulty', 'duration', 'createdAt'])
      .withMessage('Pole sortowania musi być jednym z: name, type, difficulty, duration, createdAt'),
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
   * Walidacja danych przy dodawaniu oceny treningu
   */
  rateWorkout: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator treningu jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator treningu musi być poprawnym identyfikatorem MongoDB'),
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
      .isLength({ max: 500 })
      .withMessage('Recenzja nie może przekraczać 500 znaków'),
    checkValidationResult
  ],

  /**
   * Walidacja danych przy zapisywaniu wykonanego treningu
   */
  logWorkoutCompletion: [
    param('id')
      .notEmpty()
      .withMessage('Identyfikator treningu jest wymagany')
      .isMongoId()
      .withMessage('Identyfikator treningu musi być poprawnym identyfikatorem MongoDB'),
    body('completedAt')
      .optional()
      .isISO8601()
      .withMessage('Data ukończenia musi być w formacie ISO 8601'),
    body('duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Rzeczywisty czas trwania musi być liczbą całkowitą większą od 0'),
    body('caloriesBurned')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Spalone kalorie muszą być liczbą nieujemną'),
    body('exercisesCompleted')
      .optional()
      .isArray()
      .withMessage('Ukończone ćwiczenia muszą być tablicą'),
    body('exercisesCompleted.*.exerciseId')
      .optional()
      .isMongoId()
      .withMessage('ID ćwiczenia musi być poprawnym identyfikatorem MongoDB'),
    body('exercisesCompleted.*.completed')
      .optional()
      .isBoolean()
      .withMessage('Status ukończenia musi być wartością logiczną'),
    body('exercisesCompleted.*.setsCompleted')
      .optional()
      .isArray()
      .withMessage('Ukończone serie muszą być tablicą'),
    body('exercisesCompleted.*.setsCompleted.*.reps')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Liczba powtórzeń musi być liczbą nieujemną'),
    body('exercisesCompleted.*.setsCompleted.*.weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Waga musi być liczbą nieujemną'),
    body('exercisesCompleted.*.setsCompleted.*.duration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Czas trwania musi być liczbą nieujemną'),
    body('exercisesCompleted.*.setsCompleted.*.distance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Dystans musi być liczbą nieujemną'),
    body('difficulty')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Odczuwana trudność musi być liczbą całkowitą między 1 a 10'),
    body('energy')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Poziom energii musi być liczbą całkowitą między 1 a 10'),
    body('mood')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Nastrój musi być liczbą całkowitą między 1 a 10'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Notatki nie mogą przekraczać 1000 znaków'),
    checkValidationResult
  ]
};

module.exports = workoutValidators; 