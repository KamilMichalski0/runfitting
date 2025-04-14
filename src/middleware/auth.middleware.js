const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');

/**
 * Middleware do uwierzytelniania użytkowników
 * Sprawdza czy token JWT jest prawidłowy i czy użytkownik istnieje
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.authenticate = async (req, res, next) => {
  try {
    // 1) Sprawdzenie czy token jest obecny w nagłówkach
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Nie jesteś zalogowany. Zaloguj się, aby uzyskać dostęp.', 401));
    }

    // 2) Weryfikacja tokenu
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Sprawdzenie czy użytkownik nadal istnieje
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('Użytkownik, do którego należał ten token, już nie istnieje.', 401));
    }

    // 4) Sprawdzenie czy użytkownik zmienił hasło po wygenerowaniu tokenu
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Hasło zostało niedawno zmienione. Zaloguj się ponownie.', 401));
    }

    // Przypisanie użytkownika do obiektu żądania
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware sprawdzające czy użytkownik jest administratorem
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Brak uprawnień do wykonania tej operacji'
  });
};

/**
 * Middleware weryfikujące, czy użytkownik ma prawo do wykonania operacji
 * @param {String} paramName - Nazwa parametru zawierającego ID zasobu
 * @param {String} ownerField - Pole modelu wskazujące na właściciela (domyślnie user)
 */
const isResourceOwner = (paramName, ownerField = 'user') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `Brak identyfikatora zasobu (${paramName})`
        });
      }

      // Użyj odpowiedniego modelu w zależności od kontekstu
      // To jest przykład - należy dostosować do rzeczywistej struktury aplikacji
      let model;
      if (req.baseUrl.includes('training')) {
        model = require('../models/training.model');
      } else if (req.baseUrl.includes('plan')) {
        model = require('../models/training-plan.model');
      } else {
        return next(new AppError('Nieznany typ zasobu', 500));
      }
      
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Zasób nie został znaleziony'
        });
      }
      
      // Sprawdź czy zalogowany użytkownik jest właścicielem zasobu
      if (resource[ownerField].toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Nie masz uprawnień do tego zasobu'
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      next(new AppError('Błąd podczas weryfikacji uprawnień', 500));
    }
  };
};

/**
 * Middleware do autoryzacji - sprawdza czy użytkownik ma odpowiednie uprawnienia
 * @param  {...String} roles - Dozwolone role użytkowników
 * @returns {Function} - Middleware Express
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Middleware authenticate musi być wywołany wcześniej
    if (!req.user) {
      return next(new AppError('Nie masz dostępu do tego zasobu.', 403));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Nie masz uprawnień do wykonania tej akcji.', 403));
    }

    next();
  };
};

/**
 * Generuje token JWT dla użytkownika
 * @param {Object} user - Obiekt użytkownika z ID
 * @returns {string} Token JWT
 */
exports.signToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * Tworzy i wysyła token JWT w odpowiedzi
 * @param {Object} user - Obiekt użytkownika
 * @param {number} statusCode - Kod statusu HTTP
 * @param {Object} res - Obiekt odpowiedzi Express
 */
exports.createSendToken = (user, statusCode, res) => {
  const token = exports.signToken(user);

  // Usuń wrażliwe dane z odpowiedzi
  const userData = { ...user.toObject() };
  delete userData.password;
  delete userData.passwordChangedAt;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userData
    }
  });
};

/**
 * Middleware do opcjonalnego uwierzytelniania - użytkownik może być zalogowany lub nie
 * Ustawia req.user jeśli użytkownik jest zalogowany, ale nie przerywa żądania, jeśli nie
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    // 1) Pobieranie tokenu
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // Brak tokenu, ale kontynuujemy
      return next();
    }

    // 2) Weryfikacja tokenu
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Sprawdzenie, czy użytkownik nadal istnieje
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      // Użytkownik nie istnieje, ale kontynuujemy
      return next();
    }

    // 4) Sprawdzenie, czy użytkownik zmienił hasło po wygenerowaniu tokenu
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      // Hasło zostało zmienione, ale kontynuujemy
      return next();
    }

    // Ustawienie użytkownika w req
    req.user = currentUser;
    next();
  } catch (err) {
    // Błąd weryfikacji tokenu, ale kontynuujemy
    next();
  }
};

module.exports = {
  authenticate: exports.authenticate,
  isAdmin,
  isResourceOwner,
  restrictTo: exports.restrictTo,
  signToken: exports.signToken,
  createSendToken: exports.createSendToken,
  optionalAuth: exports.optionalAuth
}; 