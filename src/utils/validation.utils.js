const { validationResult } = require('express-validator');

/**
 * Sprawdza wynik walidacji i zwraca błędy jeśli wystąpiły
 * @param {object} req - Obiekt żądania Express
 * @param {object} res - Obiekt odpowiedzi Express
 * @param {function} next - Funkcja next Express
 */
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  next();
};

module.exports = {
  checkValidationResult
}; 