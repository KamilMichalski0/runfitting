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
      message: err.message,
      ...(Object.keys(err.details || {}).length > 0 && { details: err.details }) // Dodaj szczegóły, jeśli istnieją
    });
  } else {
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
  } else { // Produkcja lub Test
    let errorToHandle = err; // Pracuj na kopii referencji lub nowym obiekcie

    // Sprawdź specyficzne typy błędów TYLKO jeśli nie jest to już AppError
    if (!(errorToHandle instanceof AppError)) {
      if (errorToHandle.code === 11000) errorToHandle = handleDuplicateKeyError(errorToHandle);
      else if (errorToHandle.name === 'ValidationError') errorToHandle = handleValidationError(errorToHandle);
      else if (errorToHandle.name === 'JsonWebTokenError') errorToHandle = handleJWTError();
      else if (errorToHandle.name === 'TokenExpiredError') errorToHandle = handleJWTExpiredError();
      else {
        // Jeśli to inny, nieznany błąd, oznacz jako nieoperacyjny
        // Tworzymy nowy obiekt, aby nie modyfikować oryginału, jeśli to nie jest konieczne
        errorToHandle = new AppError(
          err.message || 'Coś poszło nie tak!', 
          err.statusCode || 500, 
          false // Oznacz jako nieoperacyjny
        );
      }
    }
    
    // Przekaż oryginalny AppError lub przetworzony błąd do sendErrorProd
    sendErrorProd(errorToHandle, res);
  }
}; 