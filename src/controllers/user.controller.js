const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');
const heartRateCalculator = require('../algorithms/heart-rate-calculator');
const paceCalculator = require('../algorithms/pace-calculator');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

/**
 * Generuje token JWT dla użytkownika
 * @param {Object} user - Obiekt użytkownika
 * @returns {String} - Token JWT
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user._id }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * Tworzy token JWT i wysyła go w odpowiedzi
 * @param {Object} user - Obiekt użytkownika
 * @param {Number} statusCode - Kod statusu HTTP
 * @param {Object} res - Obiekt odpowiedzi Express
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user);
  
  // Ustawienie opcji dla ciasteczka
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  
  // W produkcji używamy secure: true (tylko HTTPS)
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
  // Usuwanie hasła z odpowiedzi
  user.password = undefined;
  
  // Wysłanie tokena jako ciasteczka i w odpowiedzi JSON
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

/**
 * Rejestracja nowego użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.register = async (req, res, next) => {
  try {
    // Sprawdź czy email jest już używany
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return next(new AppError('Email jest już używany', 400));
    }

    // Tworzenie nowego użytkownika
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.confirmPassword,
      role: req.body.role || 'user',
      // Opcjonalne pola
      gender: req.body.gender,
      age: req.body.age,
      weight: req.body.weight,
      height: req.body.height
    });

    // Generowanie tokena JWT i wysłanie odpowiedzi
    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Logowanie użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Sprawdzenie czy email i hasło istnieją
    if (!email || !password) {
      return next(new AppError('Proszę podać email i hasło', 400));
    }

    // Sprawdzenie czy użytkownik istnieje i czy hasło jest poprawne
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Niepoprawny email lub hasło', 401));
    }

    // Generowanie tokena JWT i wysłanie odpowiedzi
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Wylogowanie użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 */
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Wylogowano pomyślnie'
  });
};

/**
 * Pobieranie profilu zalogowanego użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getProfile = async (req, res, next) => {
  try {
    // Użytkownik jest już dostępny w req.user dzięki middleware authenticate
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
 * Zmiana hasła użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updatePassword = async (req, res, next) => {
  try {
    // Pobierz użytkownika z bazy danych
    const user = await User.findById(req.user.id).select('+password');

    // Sprawdź, czy podane aktualne hasło jest poprawne
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return next(new AppError('Aktualne hasło jest nieprawidłowe', 401));
    }

    // Aktualizacja hasła
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.confirmNewPassword;
    await user.save();

    // Zaloguj użytkownika, wyślij nowy JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Tworzenie tokena resetowania hasła
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    // Znajdź użytkownika na podstawie adresu email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('Nie znaleziono użytkownika z tym adresem email', 404));
    }

    // Wygeneruj token resetowania
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Przykładowa odpowiedź z tokenem (w praktyce token powinien być wysłany emailem)
    res.status(200).json({
      success: true,
      message: 'Token resetowania hasła został wysłany',
      resetToken // W rzeczywistej aplikacji NIE wysyłaj tokena w odpowiedzi API
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resetowanie hasła za pomocą tokena
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // Hashowanie tokena z URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Znajdź użytkownika na podstawie tokena i sprawdź czy token nie wygasł
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token jest nieprawidłowy lub wygasł', 400));
    }

    // Ustaw nowe hasło
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Zaloguj użytkownika, wyślij JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Dezaktywacja konta użytkownika (soft delete)
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kontroler aktualizujący historię treningową użytkownika
 * @route PUT /api/users/training-history
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
 * Kontroler aktualizujący cele treningowe użytkownika
 * @route PUT /api/users/training-goals
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
 * Kontroler obliczający strefy tętna użytkownika
 * @route GET /api/users/heart-rate-zones
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
 * @route GET /api/users/training-paces
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