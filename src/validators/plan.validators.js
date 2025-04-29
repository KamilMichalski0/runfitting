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

// === NOWE WALIDATORY FORMULARZA ===
const formValidators = {
  validateFormForPlanGeneration: [
    // SEKCJA 0: Dane podstawowe (wymagane)
    body('imieNazwisko').trim().notEmpty().withMessage('Imię i nazwisko jest wymagane.').isLength({ min: 3 }).withMessage('Imię i nazwisko musi mieć co najmniej 3 znaki.'),
    body('wiek').isInt({ min: 12, max: 100 }).withMessage('Wiek musi być liczbą między 12 a 100.'),
    body('plec').isIn(['Kobieta', 'Mężczyzna', 'Inna']).withMessage('Nieprawidłowa wartość pola płeć.'),
    body('wzrost').isFloat({ min: 100, max: 250 }).withMessage('Wzrost musi być liczbą między 100 a 250.'),
    body('masaCiala').isFloat({ min: 30, max: 300 }).withMessage('Masa ciała musi być liczbą między 30 a 300.'),
    // email i telefon są opcjonalne w modelu do zapisu, ale mogą być potrzebne? Zakładamy, że nie są krytyczne dla generowania planu
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Nieprawidłowy format email.'),
    body('telefon').optional({ checkFalsy: true }).isMobilePhone('pl-PL').withMessage('Nieprawidłowy format numeru telefonu.'),

    // SEKCJA 1: Cel (wymagany)
    body('glownyCel').isIn([
      'redukcja_masy_ciala', 'przebiegniecie_dystansu', 'zaczac_biegac', 
      'aktywny_tryb_zycia', 'zmiana_nawykow', 'powrot_po_kontuzji', 
      'poprawa_kondycji', 'inny_cel'
    ]).withMessage('Nieprawidłowa wartość głównego celu.'),
    // Walidacja warunkowa dla innyCelOpis
    body('innyCelOpis').if(body('glownyCel').equals('inny_cel')).trim().notEmpty().withMessage('Opis innego celu jest wymagany, gdy wybrano "inny_cel".'),

    // SEKCJA 2B: Kluczowe dla planu biegowego (jeśli cel to przebiegnięcie dystansu)
    // Używamy `optional`, bo nie wiemy na pewno, czy cel to bieganie, kontroler musi to obsłużyć
    body('poziomZaawansowania').optional().isIn(['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']).withMessage('Nieprawidłowy poziom zaawansowania.'),
    body('dystansDocelowy').optional().isIn(['5km', '10km', 'polmaraton', 'maraton', 'inny']).withMessage('Nieprawidłowy dystans docelowy.'),
    body('aktualnyKilometrTygodniowy').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Aktualny kilometraż musi być liczbą nieujemną.'),
    // Dodajemy warunkową walidację dla pól rekordu, jeśli poziom nie jest początkujący
    body('rekord5km').optional({ checkFalsy: true }).isIn(['ponizej_20min', '20_25min', '25_30min', '30_35min', '35_40min', 'powyzej_40min', '']).withMessage('Nieprawidłowa wartość rekordu 5km.'),
    //... (podobne dla 10km, półmaratonu, maratonu - można dodać dla pełności)

    // SEKCJA 6: Styl życia (wymagane)
    body('godzinySnuOd').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Nieprawidłowy format godziny snu (od). Oczekiwano HH:MM.'),
    body('godzinySnuDo').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Nieprawidłowy format godziny snu (do). Oczekiwano HH:MM.'),
    body('chronotyp').isIn(['ranny_ptaszek', 'nocny_marek', 'posredni']).withMessage('Nieprawidłowa wartość chronotypu.'),
    body('preferowanyCzasTreningu').isIn(['rano', 'poludnie', 'wieczor', 'dowolnie']).withMessage('Nieprawidłowa wartość preferowanego czasu treningu.'),
    body('dniTreningowe').isArray({ min: 1 }).withMessage('Należy wybrać co najmniej jeden dzień treningowy.'),
    body('dniTreningowe.*').isIn(['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']).withMessage('Nieprawidłowa nazwa dnia treningowego.'),
    body('czasTreningu').optional({ checkFalsy: true }).isInt({ min: 15, max: 180 }).withMessage('Preferowany czas treningu musi być liczbą między 15 a 180 minut.'), // Zakładam min 15 min

    // SEKCJA 8: Zgody (wymagane)
    body('zgodaPrawdziwosc').isBoolean().toBoolean().equals(true).withMessage('Zgoda na prawdziwość danych jest wymagana.'),
    body('zgodaPrzetwarzanieDanych').isBoolean().toBoolean().equals(true).withMessage('Zgoda na przetwarzanie danych jest wymagana.'),
    // zgodaPowiadomienia jest opcjonalna

    // Na koniec sprawdzamy wynik
    checkValidationResult 
  ]
};
// === KONIEC NOWYCH WALIDATORÓW ===

module.exports = {
  planValidators,
  trainingDayValidators,
  formValidators
}; 