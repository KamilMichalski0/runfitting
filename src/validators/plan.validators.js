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

    // SEKCJA 2B: Kluczowe dla planu biegowego - WALIDACJA WARUNKOWA
    // Dla celów biegowych te pola są WYMAGANE
    body('poziomZaawansowania')
      .if(body('glownyCel').isIn(['przebiegniecie_dystansu', 'zaczac_biegac']))
      .notEmpty().withMessage('Poziom zaawansowania jest wymagany dla celów biegowych')
      .isIn(['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']).withMessage('Nieprawidłowy poziom zaawansowania.'),
    
    body('dystansDocelowy')
      .if(body('glownyCel').equals('przebiegniecie_dystansu'))
      .notEmpty().withMessage('Dystans docelowy jest wymagany dla celu przebiegnięcia dystansu')
      .isIn(['5km', '10km', 'polmaraton', 'maraton', 'inny']).withMessage('Nieprawidłowy dystans docelowy.'),
    // SEKCJA 2B cd: Walidacja warunkowa dla różnych celów biegowych
    body('aktualnyKilometrTygodniowy')
      .if(body('glownyCel').isIn(['przebiegniecie_dystansu', 'poprawa_kondycji']))
      .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Aktualny kilometraż musi być liczbą nieujemną.'),
    
    // Rekordy wymagane dla celów wydajnościowych
    body('rekord5km')
      .if(body('dystansDocelowy').equals('5km'))
      .optional({ checkFalsy: true }).isIn(['ponizej_20min', '20_25min', '25_30min', '30_35min', '35_40min', 'powyzej_40min', '']).withMessage('Nieprawidłowa wartość rekordu 5km.'),
    
    body('rekord10km')
      .if(body('dystansDocelowy').equals('10km'))
      .optional({ checkFalsy: true }).isIn(['ponizej_40min', '40_50min', '50_60min', '60_70min', '70_80min', 'powyzej_80min', '']).withMessage('Nieprawidłowa wartość rekordu 10km.'),
    
    body('rekordPolmaraton')
      .if(body('dystansDocelowy').equals('polmaraton'))
      .optional({ checkFalsy: true }).isIn(['ponizej_90min', '90_120min', '120_150min', '150_180min', '180_210min', 'powyzej_210min', '']).withMessage('Nieprawidłowa wartość rekordu półmaratonu.'),
    
    body('rekordMaraton')
      .if(body('dystansDocelowy').equals('maraton'))
      .optional({ checkFalsy: true }).isIn(['ponizej_3h', '3_4h', '4_5h', '5_6h', 'powyzej_6h', '']).withMessage('Nieprawidłowa wartość rekordu maratonu.'),
    
    // SEKCJA 2A: Walidacja warunkowa dla redukcji masy ciała
    body('aktualnaAktywnoscFizyczna')
      .if(body('glownyCel').equals('redukcja_masy_ciala'))
      .notEmpty().withMessage('Aktualna aktywność fizyczna jest wymagana dla celu redukcji masy ciała')
      .isIn(['brak', 'minimalna', 'umiarkowana', 'wysoka']).withMessage('Nieprawidłowa wartość aktualnej aktywności fizycznej.'),
    
    body('docelowaWaga')
      .if(body('glownyCel').equals('redukcja_masy_ciala'))
      .optional({ checkFalsy: true }).isFloat({ min: 30, max: 200 }).withMessage('Docelowa waga musi być liczbą między 30 a 200 kg.'),

    // SEKCJA 6: Styl życia (wymagane)
    body('godzinySnuOd').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Nieprawidłowy format godziny snu (od). Oczekiwano HH:MM.'),
    body('godzinySnuDo').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Nieprawidłowy format godziny snu (do). Oczekiwano HH:MM.'),
    body('chronotyp').isIn(['ranny_ptaszek', 'nocny_marek', 'posredni']).withMessage('Nieprawidłowa wartość chronotypu.'),
    body('preferowanyCzasTreningu').isIn(['rano', 'poludnie', 'wieczor', 'dowolnie']).withMessage('Nieprawidłowa wartość preferowanego czasu treningu.'),
    body('dniTreningowe').isArray({ min: 1 }).withMessage('Należy wybrać co najmniej jeden dzień treningowy.')
      .custom((value, { req }) => {
        // Dla początkujących maksymalnie 2 dni treningowe (pierwsze 8 tygodni)
        if (req.body.poziomZaawansowania === 'poczatkujacy' && value.length > 2) {
          throw new Error('Dla początkujących maksymalnie 2 dni treningowe w tygodniu przez pierwsze 8 tygodni');
        }
        return true;
      }),
    body('dniTreningowe.*').isIn(['poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota', 'niedziela']).withMessage('Nieprawidłowa nazwa dnia treningowego.'),
    // Walidacja czasu treningu z uwzględnieniem poziomu zaawansowania
    body('czasTreningu').optional({ checkFalsy: true }).isInt({ min: 15, max: 180 }).withMessage('Preferowany czas treningu musi być liczbą między 15 a 180 minut.')
      .custom((value, { req }) => {
        // Dla początkujących maksymalnie 45 minut
        if (req.body.poziomZaawansowania === 'poczatkujacy' && value > 45) {
          throw new Error('Dla początkujących maksymalny czas treningu to 45 minut');
        }
        return true;
      }),

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