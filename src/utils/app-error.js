/**
 * Klasa do obsługi błędów aplikacji
 * Rozszerza wbudowaną klasę Error i dodaje funkcjonalności potrzebne w API
 */
class AppError extends Error {
  /**
   * Konstruktor klasy błędu
   * @param {string} message - Komunikat błędu
   * @param {number} statusCode - Kod HTTP (domyślnie 500)
   * @param {boolean} isOperational - Czy błąd jest operacyjny (przewidywalny) czy krytyczny
   * @param {Object} details - Dodatkowe szczegóły błędu
   */
  constructor(message, statusCode = 500, isOperational = true, details = {}) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational; // Odróżnia błędy przewidywalne od krytycznych
    this.details = details;
    
    // Zachowaj stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Tworzy odpowiedź błędu w formacie JSON dla API
   * @returns {Object} - Obiekt odpowiedzi błędu
   */
  toJSON() {
    const response = {
      success: false,
      status: this.status,
      message: this.message
    };

    // Dodaj szczegóły błędu, jeśli istnieją
    if (Object.keys(this.details).length > 0) {
      response.details = this.details;
    }

    // Dodaj stack trace tylko w środowisku deweloperskim
    if (process.env.NODE_ENV === 'development' && this.stack) {
      response.stack = this.stack;
    }

    return response;
  }
}

module.exports = AppError; 