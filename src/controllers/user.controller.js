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
    res.status(200).json({
      success: true,
      data: {
        user: req.user
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
    // Sprawdzenie czy użytkownik próbuje zaktualizować hasło
    if (req.body.password || req.body.passwordConfirm) {
      return next(new AppError('Ta trasa nie służy do zmiany hasła. Proszę użyć /updatePassword', 400));
    }

    // Filtrowanie niepożądanych pól, które nie powinny być aktualizowane
    const filteredBody = {};
    const allowedFields = ['name', 'email', 'gender', 'age', 'weight', 'height', 'fitnessGoals', 'restingHeartRate'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        filteredBody[field] = req.body[field];
      }
    });

    // Aktualizacja użytkownika
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('Nie znaleziono użytkownika', 404));
    }

    // Aktualizacja celów treningowych
    const updatedTrainingGoals = {
      ...user.trainingGoals || {},
      ...req.body
    };

    // Aktualizacja profilu użytkownika
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('Nie znaleziono użytkownika', 404));
    }

    // Aktualizacja historii treningowej
    const updatedTrainingHistory = {
      ...user.trainingHistory || {},
      ...req.body
    };

    // Aktualizacja profilu użytkownika
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
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