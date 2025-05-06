const { body } = require('express-validator');
const { checkValidationResult } = require('../utils/validation.utils');

/**
 * Walidatory dla formularza biegowego
 */
const experienceLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
const mainGoals = ['run_5k', 'run_10k', 'half_marathon', 'marathon', 'ultra', 'weight_loss', 'endurance', 'speed'];

/**
 * Walidator dla formularza biegowego
 */
exports.validateRunningForm = [
  // Dane podstawowe
  body('firstName')
    .notEmpty().withMessage('Imię jest wymagane')
    .isString().withMessage('Imię musi być tekstem')
    .isLength({ min: 2, max: 50 }).withMessage('Imię musi mieć od 2 do 50 znaków'),
  
  body('age')
    .notEmpty().withMessage('Wiek jest wymagany')
    .isInt({ min: 10, max: 100 }).withMessage('Wiek musi być liczbą od 10 do 100'),
  
  body('email')
    .notEmpty().withMessage('Email jest wymagany')
    .isEmail().withMessage('Podaj prawidłowy adres email'),
  
  // Informacje biegowe
  body('experienceLevel')
    .notEmpty().withMessage('Poziom doświadczenia jest wymagany')
    .isString().withMessage('Poziom doświadczenia musi być tekstem')
    .isIn(experienceLevels).withMessage(`Poziom doświadczenia musi być jednym z: ${experienceLevels.join(', ')}`),
  
  body('mainGoal')
    .notEmpty().withMessage('Główny cel jest wymagany')
    .isString().withMessage('Główny cel musi być tekstem')
    .isIn(mainGoals).withMessage(`Główny cel musi być jednym z: ${mainGoals.join(', ')}`),
  
  body('weeklyKilometers')
    .notEmpty().withMessage('Tygodniowy kilometraż jest wymagany')
    .isInt({ min: 0, max: 300 }).withMessage('Tygodniowy kilometraż musi być liczbą od 0 do 300'),
  
  body('trainingDaysPerWeek')
    .notEmpty().withMessage('Liczba dni treningowych w tygodniu jest wymagana')
    .isInt({ min: 1, max: 7 }).withMessage('Liczba dni treningowych musi być liczbą od 1 do 7'),
  
  body('hasInjuries')
    .notEmpty().withMessage('Informacja o kontuzjach jest wymagana')
    .isBoolean().withMessage('Informacja o kontuzjach musi być wartością logiczną'),
  
  // Tętno spoczynkowe
  body('restingHeartRate.known')
    .notEmpty().withMessage('Informacja czy tętno spoczynkowe jest znane jest wymagana')
    .isBoolean().withMessage('Informacja o znajomości tętna musi być wartością logiczną'),
  
  body('restingHeartRate.value')
    .if(body('restingHeartRate.known').equals('true'))
    .notEmpty().withMessage('Wartość tętna spoczynkowego jest wymagana, gdy znane jest true')
    .isInt({ min: 30, max: 120 }).withMessage('Tętno spoczynkowe musi być liczbą od 30 do 120'),
  
  // Rekordy życiowe
  body('personalBests.fiveKm.minutes')
    .optional()
    .isInt({ min: 10, max: 90 }).withMessage('Minuty w rekordzie na 5km muszą być liczbą od 10 do 90'),
  
  body('personalBests.fiveKm.seconds')
    .optional()
    .isInt({ min: 0, max: 59 }).withMessage('Sekundy w rekordzie na 5km muszą być liczbą od 0 do 59'),
  
  body('personalBests.tenKm.minutes')
    .optional()
    .isInt({ min: 20, max: 180 }).withMessage('Minuty w rekordzie na 10km muszą być liczbą od 20 do 180'),
  
  body('personalBests.tenKm.seconds')
    .optional()
    .isInt({ min: 0, max: 59 }).withMessage('Sekundy w rekordzie na 10km muszą być liczbą od 0 do 59'),
  
  body('personalBests.halfMarathon.hours')
    .optional()
    .isInt({ min: 0, max: 5 }).withMessage('Godziny w rekordzie na półmaraton muszą być liczbą od 0 do 5'),
  
  body('personalBests.halfMarathon.minutes')
    .optional()
    .isInt({ min: 0, max: 59 }).withMessage('Minuty w rekordzie na półmaraton muszą być liczbą od 0 do 59'),
  
  body('personalBests.marathon.hours')
    .optional()
    .isInt({ min: 0, max: 12 }).withMessage('Godziny w rekordzie na maraton muszą być liczbą od 0 do 12'),
  
  body('personalBests.marathon.minutes')
    .optional()
    .isInt({ min: 0, max: 59 }).withMessage('Minuty w rekordzie na maraton muszą być liczbą od 0 do 59'),
  
  // Opis
  body('description')
    .optional()
    .isString().withMessage('Opis musi być tekstem')
    .isLength({ max: 1000 }).withMessage('Opis może mieć maksymalnie 1000 znaków'),
  
  // --- SEKCJA 5: Odżywianie i nawodnienie ---
  body('ograniczeniaZywieniowe')
    .optional()
    .isArray().withMessage('Ograniczenia żywieniowe muszą być tablicą.')
    .custom((value) => {
      if (!Array.isArray(value)) return true; // Skip if not an array (handled by isArray)
      return value.every(item => typeof item === 'string');
    }).withMessage('Każdy element w ograniczeniach żywieniowych musi być tekstem.'),

  body('opisOgraniczen')
    .optional()
    .if(body('ograniczeniaZywieniowe').exists({ checkFalsy: true }).isArray({ min: 1 })) // Required if ograniczeniaZywieniowe is not empty
    .notEmpty().withMessage('Opis ograniczeń jest wymagany, jeśli podano ograniczenia.')
    .isString().withMessage('Opis ograniczeń musi być tekstem.')
    .trim(),
    
  body('celeDietetyczne')
    .optional()
    .isArray().withMessage('Cele dietetyczne muszą być tablicą.')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(item => typeof item === 'string');
    }).withMessage('Każdy element w celach dietetycznych musi być tekstem.'),

  body('problemyZoladkowe')
    // Assuming this field might become mandatory later based on context, keeping notEmpty for now
    // If it can be truly optional, replace notEmpty() with optional()
    .notEmpty().withMessage('Informacja o problemach żołądkowych jest wymagana.') 
    .isString().withMessage('Informacja o problemach żołądkowych musi być tekstem.')
    .isIn(['tak', 'nie']).withMessage('Problemy żołądkowe muszą być "tak" lub "nie".'),

  body('opisProblemowZoladkowych')
    .optional()
    .if(body('problemyZoladkowe').equals('tak'))
    .notEmpty().withMessage('Opis problemów żołądkowych jest wymagany, jeśli zaznaczono "tak".')
    .isString().withMessage('Opis problemów żołądkowych musi być tekstem.')
    .trim(),
    
  body('posilekPrzedTreningiem')
    .optional()
    .isArray().withMessage('Posiłek przed treningiem musi być tablicą.')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(item => typeof item === 'string');
    }).withMessage('Każdy element w posiłku przed treningiem musi być tekstem.'),
    
  body('czasPrzedTreningiem')
    .optional()
    .isString().withMessage('Czas przed treningiem musi być tekstem.')
    .trim(),
    
  body('posilekPodczasTreningu')
    .optional()
    .isArray().withMessage('Posiłek podczas treningu musi być tablicą.')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(item => typeof item === 'string');
    }).withMessage('Każdy element w posiłku podczas treningu musi być tekstem.'),
    
  body('posilekPoTreningu')
    .optional()
    .isArray().withMessage('Posiłek po treningu musi być tablicą.')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(item => typeof item === 'string');
    }).withMessage('Każdy element w posiłku po treningu musi być tekstem.'),
    
  body('nawadnianie')
    .optional()
    .isFloat({ min: 0, max: 10 }).withMessage('Nawadnianie musi być liczbą od 0 do 10.'), // Changed to isFloat for flexibility
    
  body('inneNapoje')
    .optional()
    .isArray().withMessage('Inne napoje muszą być tablicą.')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(item => typeof item === 'string');
    }).withMessage('Każdy element w innych napojach musi być tekstem.'),
  
  // Sprawdzenie wyników walidacji
  checkValidationResult
];

// Middleware do weryfikacji, czy podany format czasu jest poprawny
exports.validateTimeConsistency = (req, res, next) => {
  const { personalBests } = req.body;
  let hasError = false;
  const errors = [];

  // Funkcja pomocnicza do sprawdzania poprawności wartości czasu
  const validateTimeEntry = (distanceName, timeObj, fieldName) => {
    // Jeśli nie podano obiektu czasu lub jest pusty, pomijamy walidację
    if (!timeObj || Object.keys(timeObj).length === 0) {
      return;
    }

    // Sprawdź czy nie podano samych sekund bez minut lub godzin
    if (timeObj.seconds !== undefined && timeObj.minutes === undefined && timeObj.hours === undefined) {
      hasError = true;
      errors.push({
        value: timeObj,
        msg: `Dla ${distanceName} musisz podać minuty, jeśli podajesz sekundy`,
        param: `personalBests.${fieldName}`,
        location: 'body'
      });
    }
    
    // Sprawdź czy dla dystansów wymagających godzin, podano godziny
    if ((fieldName === 'marathon' || fieldName === 'halfMarathon') && timeObj.minutes !== undefined) {
      if (timeObj.minutes > 59 && timeObj.hours === undefined) {
        hasError = true;
        errors.push({
          value: timeObj,
          msg: `Dla ${distanceName} podaj godziny, jeśli czas przekracza 59 minut`,
          param: `personalBests.${fieldName}`,
          location: 'body'
        });
      }
    }
  };

  // Sprawdź każdy dystans tylko jeśli personalBests zostało podane
  if (personalBests && typeof personalBests === 'object') {
    // Walidujemy tylko te rekordy, które zostały faktycznie podane
    if (Object.keys(personalBests).includes('fiveKm')) {
      validateTimeEntry('5km', personalBests.fiveKm, 'fiveKm');
    }
    if (Object.keys(personalBests).includes('tenKm')) {
      validateTimeEntry('10km', personalBests.tenKm, 'tenKm');
    }
    if (Object.keys(personalBests).includes('halfMarathon')) {
      validateTimeEntry('półmaratonu', personalBests.halfMarathon, 'halfMarathon');
    }
    if (Object.keys(personalBests).includes('marathon')) {
      validateTimeEntry('maratonu', personalBests.marathon, 'marathon');
    }
  }

  if (hasError) {
    return res.status(400).json({ errors });
  }

  next();
};

// Eksport walidatora formularza
module.exports.validateRunningFormSubmission = [
  ...exports.validateRunningForm,
  exports.validateTimeConsistency
]; 