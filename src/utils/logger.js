/**
 * Moduł do logowania informacji i błędów w aplikacji
 */

/**
 * Loguje informacje
 * @param {string} message - Wiadomość do zalogowania
 * @param {Object} data - Opcjonalne dane dodatkowe
 */
function logInfo(message, data) {
  console.log(`[INFO] ${message}`, data ? data : '');
}

/**
 * Loguje błędy
 * @param {string} message - Wiadomość błędu
 * @param {Error|Object} error - Obiekt błędu lub dodatkowe dane
 */
function logError(message, error) {
  console.error(`[ERROR] ${message}`);
  if (error instanceof Error) {
    console.error(`Stack: ${error.stack}`);
    console.error(`Message: ${error.message}`);
  } else if (error) {
    console.error(error);
  }
}

/**
 * Loguje ostrzeżenia
 * @param {string} message - Wiadomość ostrzeżenia
 * @param {Object} data - Opcjonalne dane dodatkowe
 */
function logWarning(message, data) {
  console.warn(`[WARNING] ${message}`, data ? data : '');
}

/**
 * Loguje debugowanie
 * @param {string} message - Wiadomość do debugowania
 * @param {Object} data - Opcjonalne dane dodatkowe
 */
function logDebug(message, data) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DEBUG] ${message}`, data ? data : '');
  }
}

module.exports = {
  logInfo,
  logError,
  logWarning,
  logDebug
}; 