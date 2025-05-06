const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');
const heartRateCalculator = require('../algorithms/heart-rate-calculator');
const paceCalculator = require('../algorithms/pace-calculator');

/**
 * Pobieranie profilu zalogowanego użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getProfile = async (req, res, next) => {
  try {
    // Sprawdź, czy obiekt req.user i req.user.sub istnieją
    if (!req.user || !req.user.sub) {
      return next(new AppError('Informacje o użytkowniku nie są dostępne w żądaniu. Upewnij się, że użytkownik jest uwierzytelniony.', 401));
    }

    const supabaseUserId = req.user.sub;

    // Znajdź użytkownika w bazie MongoDB na podstawie supabaseId
    const user = await User.findOne({ supabaseId: supabaseUserId });

    if (!user) {
      // Możesz zdecydować, co zrobić, jeśli użytkownik istnieje w Supabase, ale nie ma go w Twojej lokalnej bazie MongoDB.
      // Na przykład, możesz zwrócić 404 lub spróbować go utworzyć/zsynchronizować.
      // Na razie zwrócimy 404.
      return next(new AppError('Nie znaleziono profilu użytkownika w bazie danych aplikacji.', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user: user // Zwróć użytkownika z MongoDB
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualizacja profilu użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.sub) {
      return next(new AppError('Błąd uwierzytelniania: nie znaleziono szczegółów użytkownika. Upewnij się, że token jest prawidłowy.', 401));
    }

    const supabaseUserEmail = req.user.email;
    const supabaseUserName = (req.user.user_metadata && (req.user.user_metadata.full_name || req.user.user_metadata.name)) || 'Nowy Użytkownik';

    const filteredBody = {};
    const fieldsForSetOnInsert = {
        supabaseId: req.user.sub,
        email: supabaseUserEmail,
        name: supabaseUserName
    };

    const allowedFields = [
      'name',
      'email',
      'gender',
      'age',
      'weight',
      'height',
      'phoneNumber',
      'waistCircumference',
      'restingHeartRate',
      'maxHeartRate',
      'experienceLevel',
      'currentActivityLevel',
      'chronotype',
      'preferredTrainingTime',
      'availableEquipment',
      'hasCurrentInjuries',
      'hasHealthRestrictions',
      'hasAllergies',
      'mainFitnessGoal',
      'fitnessGoals'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        filteredBody[field] = req.body[field];
        if (field === 'email' || field === 'name') {
            delete fieldsForSetOnInsert[field];
        }
      }
    });

    // Przygotowanie operacji aktualizacji/wstawienia
    const updateOperation = {
      $set: filteredBody,
      $setOnInsert: fieldsForSetOnInsert
    };
    
    if (Object.keys(filteredBody).length === 0 && Object.keys(fieldsForSetOnInsert).length > 0) {
        // Nie ma potrzeby $set, jeśli nie ma co aktualizować, a tylko wstawiamy
        // Ale Mongoose wymaga, aby $set lub $setOnInsert coś robiły, jeśli nie ma $set, pusty obiekt $set jest ok
    }

    // Aktualizacja użytkownika lub jego utworzenie, jeśli nie istnieje
    const updatedUser = await User.findOneAndUpdate(
      { supabaseId: req.user.sub },
      updateOperation,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    if (!updatedUser) {
      // Ten przypadek nie powinien wystąpić przy poprawnie działającym upsert,
      // ale na wszelki wypadek zostawiamy obsługę błędu.
      return next(new AppError('Nie można było zaktualizować ani utworzyć profilu użytkownika.', 500));
    }

    // Określenie statusu odpowiedzi: 201 (Created) jeśli dokument został wstawiony,
    // 200 (OK) jeśli został zaktualizowany.
    // `upsertedId` jest dostępne w wyniku, jeśli dokument został utworzony.
    // Jednak proste sprawdzenie `updatedUser` jest wystarczające, ponieważ `findOneAndUpdate` zwróci dokument.
    // Można by bardziej precyzyjnie sprawdzić, czy operacja była insertem, ale dla uproszczenia zwracamy 200.
    res.status(200).json({
      success: true,
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    // Obsługa potencjalnego błędu duplikacji klucza (np. jeśli email jest unikalny w MongoDB)
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return next(new AppError('Ten adres email jest już używany przez inne konto w bazie danych.', 409));
      }
      if (error.keyPattern && error.keyPattern.supabaseId) {
        // To nie powinno się zdarzyć, skoro `supabaseId` jest w kryterium wyszukiwania upsert
        return next(new AppError('Konflikt ID Supabase. To jest nieoczekiwany błąd.', 409));
      }
    }
    next(error);
  }
};

/**
 * Kontroler aktualizujący cele treningowe użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updateTrainingGoals = async (req, res, next) => {
  try {
    // Sprawdzenie wyników walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Pobranie obecnych celów treningowych
    const user = await User.findOne({ supabaseId: req.user.sub });
    if (!user) {
      return next(new AppError('Nie znaleziono użytkownika', 404));
    }

    // Aktualizacja celów treningowych
    const updatedTrainingGoals = {
      ...user.trainingGoals || {},
      ...req.body
    };

    // Aktualizacja profilu użytkownika
    const updatedUser = await User.findOneAndUpdate(
      { supabaseId: req.user.sub },
      { trainingGoals: updatedTrainingGoals },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        trainingGoals: updatedUser.trainingGoals
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler aktualizujący historię treningową użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updateTrainingHistory = async (req, res, next) => {
  try {
    // Sprawdzenie wyników walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Pobranie obecnej historii treningowej
    const user = await User.findOne({ supabaseId: req.user.sub });
    if (!user) {
      return next(new AppError('Nie znaleziono użytkownika', 404));
    }

    // Aktualizacja historii treningowej
    const updatedTrainingHistory = {
      ...user.trainingHistory || {},
      ...req.body
    };

    // Aktualizacja profilu użytkownika
    const updatedUser = await User.findOneAndUpdate(
      { supabaseId: req.user.sub },
      { trainingHistory: updatedTrainingHistory },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        trainingHistory: updatedUser.trainingHistory
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler obliczający strefy tętna użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getHeartRateZones = async (req, res, next) => {
  try {
    const user = req.user;

    // Sprawdzenie, czy użytkownik ma potrzebne dane
    if (!user.age || !user.restingHeartRate) {
      return next(new AppError('Brak wymaganych danych (wiek, tętno spoczynkowe) do obliczenia stref tętna', 400));
    }

    // Obliczenie stref tętna
    const heartRateZones = heartRateCalculator.calculateHeartRateZones(user.age, user.restingHeartRate);

    res.status(200).json({
      status: 'success',
      data: {
        heartRateZones
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler obliczający tempa treningowe użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getTrainingPaces = async (req, res, next) => {
  try {
    const user = req.user;

    // Sprawdzenie, czy użytkownik ma historię treningową
    if (!user.trainingHistory || !user.trainingHistory.personalBests) {
      return next(new AppError('Brak wymaganych danych o rekordach życiowych do obliczenia temp treningowych', 400));
    }

    // Obliczenie temp treningowych
    const paces = paceCalculator.generateRacePaces(user.trainingHistory.personalBests);

    res.status(200).json({
      status: 'success',
      data: {
        paces
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Sprawdza, czy użytkownik po raz pierwszy wypełnia formularz biegowy.
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.checkFirstFormSubmission = async (req, res, next) => {
  try {
    // Zakładamy, że req.user jest dostępne po uwierzytelnieniu
    // i zawiera pole hasFilledRunningForm
    const isFirstSubmission = !req.user.hasFilledRunningForm;

    res.status(200).json({
      success: true,
      data: {
        isFirstSubmission: isFirstSubmission
      }
    });
  } catch (error) {
    next(error);
  }
}; 