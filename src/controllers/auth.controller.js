const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Kontroler obsługujący proces rejestracji użytkownika
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    // Sprawdzenie wyników walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Sprawdzenie, czy użytkownik z podanym emailem już istnieje
    const existingUser = await User.findByEmail(req.body.email);
    if (existingUser) {
      return next(new AppError('Użytkownik z tym adresem email już istnieje', 400));
    }

    // Utworzenie nowego użytkownika
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      // Dodatkowe pola, jeśli są dostępne
      age: req.body.age,
      gender: req.body.gender,
      weight: req.body.weight,
      height: req.body.height,
      trainingHistory: req.body.trainingHistory || {},
      trainingGoals: req.body.trainingGoals || {}
    });

    // Utworzenie i wysłanie tokenu JWT
    authMiddleware.createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler obsługujący proces logowania użytkownika
 * @route POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    // Sprawdzenie wyników walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 1) Sprawdzenie, czy podano email i hasło
    if (!email || !password) {
      return next(new AppError('Proszę podać email i hasło', 400));
    }

    // 2) Sprawdzenie, czy użytkownik istnieje i hasło jest poprawne
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Nieprawidłowy email lub hasło', 401));
    }

    // 3) Jeśli wszystko jest ok, wysłanie tokenu JWT
    authMiddleware.createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler obsługujący zmianę hasła użytkownika
 * @route PATCH /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    // Sprawdzenie wyników walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // 1) Pobranie użytkownika z bazy danych
    const user = await User.findById(req.user.id).select('+password');

    // 2) Sprawdzenie, czy aktualne hasło jest poprawne
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return next(new AppError('Aktualne hasło jest nieprawidłowe', 401));
    }

    // 3) Aktualizacja hasła
    user.password = req.body.newPassword;
    await user.save();

    // 4) Zalogowanie użytkownika, wysłanie nowego tokenu JWT
    authMiddleware.createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler zwracający informacje o aktualnie zalogowanym użytkowniku
 * @route GET /api/auth/me
 */
exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

/**
 * Kontroler obsługujący wylogowanie użytkownika
 * W przypadku autentykacji JWT, wylogowanie po stronie serwera nie jest konieczne,
 * klient po prostu usuwa token, ale ten endpoint może być używany do logowania wylogowania
 * lub do innych działań związanych z bezpieczeństwem
 * @route GET /api/auth/logout
 */
exports.logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Pomyślnie wylogowano'
  });
}; 