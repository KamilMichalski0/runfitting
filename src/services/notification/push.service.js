const webpush = require('web-push');
const { notificationConfig } = require('../../config/notification.config');
const logger = require('../../utils/logger');
const AppError = require('../../utils/app-error');

/**
 * Serwis powiadomień push
 * Obsługuje wysyłanie push notifications do przeglądarek
 */
class PushService {
  constructor() {
    this.isConfigured = false;
    this.sentToday = 0;
    this.sentThisHour = 0;
    this.usersSentToday = new Map();
    this.failedSubscriptions = new Set();
    
    this.initialize();
    this.setupHourlyReset();
    this.setupDailyReset();
  }

  /**
   * Inicjalizacja Web Push
   */
  async initialize() {
    try {
      const pushConfig = notificationConfig.push.vapid;
      
      if (!pushConfig.publicKey || !pushConfig.privateKey) {
        logger.warn('Push service: VAPID keys not configured');
        return;
      }

      // Konfiguracja VAPID
      webpush.setVapidDetails(
        pushConfig.subject,
        pushConfig.publicKey,
        pushConfig.privateKey
      );

      this.isConfigured = true;
      logger.info('Push service initialized successfully');
    } catch (error) {
      logger.error('Push service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Wysyłanie push notification
   * @param {Object} params - Parametry powiadomienia
   * @param {Object} params.subscription - Subskrypcja push (endpoint, keys)
   * @param {string} params.type - Typ powiadomienia
   * @param {Object} params.data - Dane do podstawienia w szablonie
   * @param {Object} params.options - Dodatkowe opcje
   * @returns {Promise<Object>} Wynik wysyłania
   */
  async sendPushNotification({
    subscription,
    type,
    data = {},
    options = {}
  }) {
    try {
      // Sprawdź czy serwis jest skonfigurowany
      if (!this.isConfigured) {
        throw new AppError('Push service is not configured', 500);
      }

      // Walidacja subskrypcji
      const validatedSubscription = this.validateSubscription(subscription);

      // Sprawdź czy subskrypcja nie jest na liście nieprawidłowych
      if (this.failedSubscriptions.has(validatedSubscription.endpoint)) {
        throw new AppError('Subscription is marked as invalid', 400);
      }

      // Sprawdź limity wysyłania
      await this.checkLimits(validatedSubscription.endpoint);

      // Przygotuj zawartość powiadomienia
      const notificationPayload = this.preparePushContent(type, data, options);

      // Opcje wysyłania
      const sendOptions = {
        TTL: options.ttl || notificationConfig.push.defaults.ttl,
        vapidDetails: {
          subject: notificationConfig.push.vapid.subject,
          publicKey: notificationConfig.push.vapid.publicKey,
          privateKey: notificationConfig.push.vapid.privateKey
        }
      };

      // Dodatkowe opcje
      if (options.urgency) {
        sendOptions.urgency = options.urgency; // very-low, low, normal, high
      }

      if (options.topic) {
        sendOptions.topic = options.topic;
      }

      // Wysyłanie powiadomienia z timeoutem
      const result = await Promise.race([
        webpush.sendNotification(
          validatedSubscription, 
          JSON.stringify(notificationPayload), 
          sendOptions
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Push notification sending timeout')), 
                    notificationConfig.global.timeouts.push)
        )
      ]);

      // Aktualizuj liczniki
      this.updateCounters(validatedSubscription.endpoint);

      logger.info(`Push notification sent successfully, type: ${type}`, {
        endpoint: this.maskEndpoint(validatedSubscription.endpoint),
        type,
        statusCode: result.statusCode
      });

      return {
        success: true,
        statusCode: result.statusCode,
        headers: result.headers,
        provider: 'web-push',
        channel: 'push',
        timestamp: new Date(),
        endpoint: this.maskEndpoint(validatedSubscription.endpoint)
      };

    } catch (error) {
      logger.error('Failed to send push notification:', error);
      
      // Obsługa różnych typów błędów
      await this.handlePushError(error, subscription);
      
      const mappedError = this.mapPushError(error);
      
      throw new AppError(
        `Push notification sending failed: ${mappedError.message}`,
        mappedError.statusCode,
        {
          type,
          provider: 'web-push',
          originalError: error.message,
          statusCode: error.statusCode
        }
      );
    }
  }

  /**
   * Przygotowanie zawartości push notification
   * @param {string} type - Typ powiadomienia
   * @param {Object} data - Dane do podstawienia
   * @param {Object} options - Opcje
   * @returns {Object} Payload powiadomienia
   */
  preparePushContent(type, data, options) {
    const pushConfig = notificationConfig.push.templates;
    const template = pushConfig.notifications[type] || pushConfig.notifications.system_notification;
    
    // Przygotuj podstawową zawartość
    const notification = {
      title: this.renderTemplate(template.title, data),
      body: this.renderTemplate(template.body, data),
      icon: options.icon || template.icon || notificationConfig.push.defaults.icon,
      badge: options.badge || template.badge || notificationConfig.push.defaults.badge,
      image: options.image || template.image,
      tag: options.tag || type,
      requireInteraction: options.requireInteraction || template.requireInteraction || notificationConfig.push.defaults.requireInteraction,
      silent: options.silent || false,
      vibrate: options.vibrate || notificationConfig.push.defaults.vibrate,
      timestamp: Date.now()
    };

    // Dodaj akcje jeśli są dostępne
    if (template.actions && template.actions.length > 0) {
      notification.actions = template.actions.map(action => ({
        action: action.action,
        title: this.renderTemplate(action.title, data),
        icon: action.icon
      }));
    }

    // Dodaj dodatkowe dane
    const payload = {
      notification,
      data: {
        type,
        timestamp: Date.now(),
        url: options.url || data.actionUrl || '/',
        ...data
      }
    };

    // Sprawdź długość payload (maksymalnie 4KB)
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > 4096) {
      logger.warn(`Push notification payload too large (${payloadString.length} bytes), truncating`);
      // Skróć body jeśli payload jest zbyt duży
      if (notification.body.length > 100) {
        notification.body = notification.body.substring(0, 97) + '...';
      }
    }

    return payload;
  }

  /**
   * Renderowanie szablonu z danymi
   * @param {string} template - Szablon
   * @param {Object} data - Dane
   * @returns {string} Wyrenderowany szablon
   */
  renderTemplate(template, data) {
    if (!template) return '';
    
    let rendered = template;
    
    // Podstawienie zmiennych {variable}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{${key}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }
    
    // Usuń pozostałe nieużyte zmienne
    rendered = rendered.replace(/{[^}]+}/g, '');
    
    return rendered;
  }

  /**
   * Walidacja subskrypcji push
   * @param {Object} subscription - Subskrypcja
   * @returns {Object} Zwalidowana subskrypcja
   */
  validateSubscription(subscription) {
    if (!subscription) {
      throw new AppError('Push subscription is required', 400);
    }

    if (!subscription.endpoint) {
      throw new AppError('Push subscription endpoint is required', 400);
    }

    if (!subscription.keys) {
      throw new AppError('Push subscription keys are required', 400);
    }

    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      throw new AppError('Push subscription keys (p256dh, auth) are required', 400);
    }

    // Sprawdź format endpoint
    try {
      new URL(subscription.endpoint);
    } catch (error) {
      throw new AppError('Invalid push subscription endpoint URL', 400);
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    };
  }

  /**
   * Sprawdzenie limitów wysyłania
   * @param {string} endpoint - Endpoint subskrypcji
   */
  async checkLimits(endpoint) {
    const limits = notificationConfig.push.limits;
    
    // Sprawdź limit dzienny
    if (this.sentToday >= limits.dailyLimit) {
      throw new AppError('Daily push notification limit exceeded', 429);
    }
    
    // Sprawdź limit godzinny
    if (this.sentThisHour >= limits.hourlyLimit) {
      throw new AppError('Hourly push notification limit exceeded', 429);
    }
    
    // Sprawdź limit dzienny per użytkownik (per endpoint)
    const userCount = this.usersSentToday.get(endpoint) || 0;
    if (userCount >= limits.perUserDailyLimit) {
      throw new AppError('Daily push notification limit per user exceeded', 429);
    }
  }

  /**
   * Aktualizacja liczników
   * @param {string} endpoint - Endpoint subskrypcji
   */
  updateCounters(endpoint) {
    this.sentToday++;
    this.sentThisHour++;
    
    const userCount = this.usersSentToday.get(endpoint) || 0;
    this.usersSentToday.set(endpoint, userCount + 1);
  }

  /**
   * Obsługa błędów push notifications
   * @param {Error} error - Błąd
   * @param {Object} subscription - Subskrypcja
   */
  async handlePushError(error, subscription) {
    const statusCode = error.statusCode;
    
    // Nieważne subskrypcje (410 Gone, 404 Not Found)
    if (statusCode === 410 || statusCode === 404) {
      this.failedSubscriptions.add(subscription.endpoint);
      logger.info(`Marked subscription as invalid: ${this.maskEndpoint(subscription.endpoint)}`);
    }
    
    // Przekroczenie limitów (413 Payload Too Large)
    if (statusCode === 413) {
      logger.warn('Push notification payload too large');
    }
    
    // Błędy uwierzytelniania VAPID (401, 403)
    if (statusCode === 401 || statusCode === 403) {
      logger.error('Push notification authentication failed - check VAPID keys');
    }
  }

  /**
   * Mapowanie błędów push na standardowe błędy
   * @param {Error} error - Błąd push
   * @returns {Object} Zmapowany błąd
   */
  mapPushError(error) {
    const statusCode = error.statusCode;
    
    const errorMapping = {
      400: { message: 'Invalid request', statusCode: 400 },
      401: { message: 'Unauthorized - invalid VAPID keys', statusCode: 401 },
      403: { message: 'Forbidden - invalid VAPID keys', statusCode: 403 },
      404: { message: 'Subscription not found', statusCode: 404 },
      410: { message: 'Subscription no longer valid', statusCode: 410 },
      413: { message: 'Payload too large', statusCode: 413 },
      429: { message: 'Too many requests', statusCode: 429 },
      500: { message: 'Internal server error', statusCode: 500 },
      502: { message: 'Bad gateway', statusCode: 502 },
      503: { message: 'Service unavailable', statusCode: 503 }
    };

    const mappedError = errorMapping[statusCode];
    if (mappedError) {
      return mappedError;
    }

    // Domyślny błąd
    return {
      message: error.message || 'Unknown push notification error',
      statusCode: statusCode || 500
    };
  }

  /**
   * Maskowanie endpoint dla logów (bezpieczeństwo)
   * @param {string} endpoint - Endpoint
   * @returns {string} Zamaskowany endpoint
   */
  maskEndpoint(endpoint) {
    if (!endpoint) return '';
    return endpoint.substring(0, 30) + '...';
  }

  /**
   * Wysyłanie powiadomień do wielu subskrypcji
   * @param {Array} subscriptions - Lista subskrypcji
   * @param {string} type - Typ powiadomienia
   * @param {Object} data - Dane powiadomienia
   * @param {Object} options - Opcje
   * @returns {Promise<Object>} Wyniki wysyłania
   */
  async sendToMultipleSubscriptions(subscriptions, type, data, options = {}) {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Wyślij do wszystkich subskrypcji równolegle (batch)
    const batchSize = notificationConfig.global.queues.batchSizes.push;
    const batches = [];
    
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      batches.push(subscriptions.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (subscription) => {
        try {
          await this.sendPushNotification({
            subscription,
            type,
            data,
            options
          });
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            endpoint: this.maskEndpoint(subscription.endpoint),
            error: error.message
          });
        }
      });

      // Czekaj na zakończenie batcha
      await Promise.allSettled(promises);
    }

    logger.info(`Push notifications batch completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Reset licznika godzinnego
   */
  setupHourlyReset() {
    setInterval(() => {
      this.sentThisHour = 0;
      logger.debug('Push service: Hourly counter reset');
    }, 60 * 60 * 1000); // Co godzinę
  }

  /**
   * Reset licznika dziennego
   */
  setupDailyReset() {
    setInterval(() => {
      this.sentToday = 0;
      this.usersSentToday.clear();
      // Czyszczenie listy nieprawidłowych subskrypcji co 24h
      this.failedSubscriptions.clear();
      logger.debug('Push service: Daily counters reset');
    }, 24 * 60 * 60 * 1000); // Co 24 godziny
  }

  /**
   * Sprawdzenie statusu usługi
   * @returns {Object} Status
   */
  async getStatus() {
    return {
      configured: this.isConfigured,
      sentToday: this.sentToday,
      sentThisHour: this.sentThisHour,
      limits: notificationConfig.push.limits,
      failedSubscriptionsCount: this.failedSubscriptions.size,
      vapidConfigured: !!(notificationConfig.push.vapid.publicKey && notificationConfig.push.vapid.privateKey)
    };
  }

  /**
   * Wysyłka testowa
   * @param {Object} subscription - Subskrypcja testowa
   * @returns {Promise<Object>} Wynik
   */
  async sendTest(subscription) {
    return this.sendPushNotification({
      subscription,
      type: 'system_notification',
      data: {
        message: 'To jest powiadomienie testowe z serwisu push notifications RunFitting. Wszystko działa poprawnie! 🎉'
      },
      options: {
        requireInteraction: true
      }
    });
  }

  /**
   * Pobieranie kluczy VAPID (publiczny klucz dla klienta)
   * @returns {Object} Klucze VAPID
   */
  getVapidPublicKey() {
    return {
      publicKey: notificationConfig.push.vapid.publicKey
    };
  }

  /**
   * Sprawdzenie ważności subskrypcji
   * @param {Object} subscription - Subskrypcja do sprawdzenia
   * @returns {boolean} Czy subskrypcja jest ważna
   */
  isSubscriptionValid(subscription) {
    try {
      this.validateSubscription(subscription);
      return !this.failedSubscriptions.has(subscription.endpoint);
    } catch (error) {
      return false;
    }
  }

  /**
   * Usunięcie nieprawidłowej subskrypcji z listy
   * @param {string} endpoint - Endpoint do usunięcia
   */
  removeFailedSubscription(endpoint) {
    this.failedSubscriptions.delete(endpoint);
    logger.info(`Removed failed subscription: ${this.maskEndpoint(endpoint)}`);
  }
}

module.exports = PushService; 