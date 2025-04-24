const AppError = require('../utils/app-error');

/**
 * Middleware do obsługi błędów Mongoose związanych z duplikacją
 * @param {Error} err - Obiekt błędu
 * @returns {AppError} - Sformatowany błąd aplikacji
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Wartość '${value}' w polu '${field}' już istnieje.`;
  return new AppError(message, 400, true, { field, value });
};

/**
 * Middleware do obsługi błędów walidacji Mongoose
 * @param {Error} err - Obiekt błędu
 * @returns {AppError} - Sformatowany błąd aplikacji
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Nieprawidłowe dane wejściowe. ${errors.join('. ')}`;
  return new AppError(message, 400, true, { validationErrors: errors });
};

/**
 * Middleware do obsługi błędów JWT
 * @param {Error} err - Obiekt błędu
 * @returns {AppError} - Sformatowany błąd aplikacji
 */
const handleJWTError = () => {
  return new AppError('Nieprawidłowy token. Zaloguj się ponownie.', 401);
};

/**
 * Middleware do obsługi błędów wygaśnięcia JWT
 * @param {Error} err - Obiekt błędu
 * @returns {AppError} - Sformatowany błąd aplikacji
 */
const handleJWTExpiredError = () => {
  return new AppError('Token wygasł. Zaloguj się ponownie.', 401);
};

/**
 * Obsługa błędów w środowisku deweloperskim - więcej szczegółów
 * @param {Error} err - Obiekt błędu
 * @param {Object} res - Obiekt odpowiedzi Express
 */
const sendErrorDev = (err, res) => {
  // Sprawdź, czy err ma metodę toJSON
  if (typeof err.toJSON === 'function') {
    res.status(err.statusCode).json(err.toJSON());
  } else {
    // Jeśli nie, utwórz własną odpowiedź
    res.status(err.statusCode || 500).json({
      success: false,
      status: err.status || 'error',
      message: err.message || 'Nieznany błąd',
      stack: err.stack
    });
  }
};

/**
 * Obsługa błędów w środowisku produkcyjnym - mniej szczegółów
 * @param {Error} err - Obiekt błędu
 * @param {Object} res - Obiekt odpowiedzi Express
 */
const sendErrorProd = (err, res) => {
  // Zwracamy tylko operacyjne błędy (przewidywalne)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } else {
    // Logowanie błędu
    console.error('BŁĄD KRYTYCZNY 💥', err);
    
    // Wysłanie ogólnej wiadomości
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Coś poszło nie tak!'
    });
  }
};

/**
 * Globalny middleware do obsługi błędów Express
 * @param {Error} err - Obiekt błędu
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
module.exports = (err, req, res, next) => {
  // Domyślnie ustawiamy kod statusu 500 (Internal Server Error)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Różne zachowanie w zależności od środowiska
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Obsługa różnych typów błędów
    if (error.code === 11000) error = handleDuplicateKeyError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    // Sprawdź, czy error jest instancją AppError (ma metodę toJSON)
    if (typeof error.toJSON !== 'function') {
      // Jeśli nie, konwertuj go na format odpowiedzi produkcyjnej
      const isOperational = error.name === 'ValidationError' || 
                          error.code === 11000 || 
                          error.name === 'JsonWebTokenError' || 
                          error.name === 'TokenExpiredError';
      
      error = {
        statusCode: error.statusCode || 500,
        status: error.status || 'error',
        message: error.message || 'Coś poszło nie tak!',
        isOperational: isOperational
      };
    }
    
    sendErrorProd(error, res);
  }
}; 