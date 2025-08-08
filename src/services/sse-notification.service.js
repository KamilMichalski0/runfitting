const logger = require('../utils/logger');

/**
 * Service do obsługi Server-Sent Events dla powiadomień w czasie rzeczywistym
 */
class SSENotificationService {
  constructor() {
    // Mapa połączeń SSE: userId -> response objects
    this.connections = new Map();
    
    // Mapa jobId -> userId dla routingu powiadomień
    this.jobUserMap = new Map();
  }

  /**
   * Dodaje nowe połączenie SSE dla użytkownika
   * @param {string} userId - ID użytkownika
   * @param {Object} res - Express response object
   */
  addConnection(userId, res) {
    // Konfiguracja SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Wyślij wiadomość inicjalizującą
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Połączono z powiadomieniami w czasie rzeczywistym',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Zapisz połączenie
    if (!this.connections.has(userId)) {
      this.connections.set(userId, []);
    }
    this.connections.get(userId).push(res);

    logger.info(`SSE connection established for user: ${userId}`);

    // Obsługa zamykania połączenia
    res.on('close', () => {
      this.removeConnection(userId, res);
      logger.info(`SSE connection closed for user: ${userId}`);
    });

    // Heartbeat co 30 sekund
    const heartbeat = setInterval(() => {
      if (res.finished) {
        clearInterval(heartbeat);
        return;
      }
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }, 30000);

    res.on('close', () => {
      clearInterval(heartbeat);
    });
  }

  /**
   * Usuwa połączenie SSE
   * @param {string} userId - ID użytkownika
   * @param {Object} res - Express response object
   */
  removeConnection(userId, res) {
    if (this.connections.has(userId)) {
      const connections = this.connections.get(userId);
      const index = connections.indexOf(res);
      if (index > -1) {
        connections.splice(index, 1);
      }
      
      // Usuń mapę jeśli brak połączeń
      if (connections.length === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Rejestruje job dla konkretnego użytkownika
   * @param {string} jobId - ID zadania
   * @param {string} userId - ID użytkownika
   */
  registerJob(jobId, userId) {
    this.jobUserMap.set(jobId, userId);
    logger.info(`Registered job ${jobId} for user ${userId}`);
  }

  /**
   * Wyrejestrowuje job
   * @param {string} jobId - ID zadania
   */
  unregisterJob(jobId) {
    this.jobUserMap.delete(jobId);
  }

  /**
   * Wysyła powiadomienie do użytkownika
   * @param {string} userId - ID użytkownika
   * @param {Object} notification - Dane powiadomienia
   */
  sendNotificationToUser(userId, notification) {
    if (!this.connections.has(userId)) {
      logger.warn(`No SSE connections found for user: ${userId}`);
      return;
    }

    const connections = this.connections.get(userId);
    const message = JSON.stringify({
      ...notification,
      timestamp: new Date().toISOString()
    });

    // Wyślij do wszystkich połączeń użytkownika
    connections.forEach((res, index) => {
      try {
        if (!res.finished) {
          res.write(`data: ${message}\n\n`);
        } else {
          // Usuń zamknięte połączenie
          connections.splice(index, 1);
        }
      } catch (error) {
        logger.error(`Error sending SSE notification to user ${userId}:`, error);
        connections.splice(index, 1);
      }
    });

    logger.info(`SSE notification sent to user ${userId}: ${notification.type}`);
  }

  /**
   * Wysyła powiadomienie o rozpoczęciu generowania planu
   * @param {string} jobId - ID zadania
   * @param {string} userId - ID użytkownika
   * @param {Object} jobData - Dane zadania
   */
  notifyPlanGenerationStarted(jobId, userId, jobData) {
    this.registerJob(jobId, userId);
    
    this.sendNotificationToUser(userId, {
      type: 'plan_generation_started',
      jobId,
      message: 'Rozpoczęto generowanie planu treningowego',
      data: {
        expectedWeekNumber: jobData.planData?.resetToWeekOne ? 1 : null,
        isNewPlan: jobData.planData?.resetToWeekOne || false
      }
    });
  }

  /**
   * Wysyła powiadomienie o ukończeniu generowania planu
   * @param {string} jobId - ID zadania
   * @param {Object} result - Wynik generowania
   */
  notifyPlanGenerationCompleted(jobId, result) {
    const userId = this.jobUserMap.get(jobId);
    if (!userId) {
      logger.warn(`No user found for completed job: ${jobId}`);
      return;
    }

    this.sendNotificationToUser(userId, {
      type: 'plan_generation_completed',
      jobId,
      data: {
        planId: result.planId,
        weekNumber: result.weekNumber,
        status: 'completed'
      }
    });

    this.unregisterJob(jobId);
  }

  /**
   * Wysyła powiadomienie o błędzie generowania planu
   * @param {string} jobId - ID zadania
   * @param {Error} error - Błąd
   */
  notifyPlanGenerationFailed(jobId, error) {
    const userId = this.jobUserMap.get(jobId);
    if (!userId) {
      logger.warn(`No user found for failed job: ${jobId}`);
      return;
    }

    this.sendNotificationToUser(userId, {
      type: 'plan_generation_failed',
      jobId,
      message: 'Wystąpił błąd podczas generowania planu',
      data: {
        error: error.message,
        status: 'failed'
      }
    });

    this.unregisterJob(jobId);
  }

  /**
   * Wysyła powiadomienie o postępie generowania
   * @param {string} jobId - ID zadania
   * @param {number} progress - Postęp (0-100)
   * @param {string} message - Wiadomość o postępie
   */
  notifyPlanGenerationProgress(jobId, progress, message) {
    const userId = this.jobUserMap.get(jobId);
    if (!userId) {
      return;
    }

    this.sendNotificationToUser(userId, {
      type: 'plan_generation_progress',
      jobId,
      message,
      data: {
        progress,
        status: 'processing'
      }
    });
  }

  /**
   * Zamyka wszystkie połączenia (do użycia podczas shutdown)
   */
  closeAllConnections() {
    for (const [userId, connections] of this.connections.entries()) {
      connections.forEach(res => {
        try {
          if (!res.finished) {
            res.write(`data: ${JSON.stringify({
              type: 'server_shutdown',
              message: 'Serwer zostaje zamknięty'
            })}\n\n`);
            res.end();
          }
        } catch (error) {
          logger.error(`Error closing SSE connection for user ${userId}:`, error);
        }
      });
    }
    
    this.connections.clear();
    this.jobUserMap.clear();
    logger.info('All SSE connections closed');
  }

  /**
   * Zwraca statystyki połączeń
   * @returns {Object} Statystyki
   */
  getStats() {
    const activeConnections = Array.from(this.connections.values())
      .reduce((total, connections) => total + connections.length, 0);
    
    return {
      activeUsers: this.connections.size,
      activeConnections,
      activeJobs: this.jobUserMap.size
    };
  }
}

module.exports = new SSENotificationService();