const twilio = require('twilio');
const { notificationConfig } = require('../../config/notification.config');
const logger = require('../../utils/logger');
const AppError = require('../../utils/app-error');

/**
 * Serwis powiadomień SMS
 * Obsługuje wysyłanie wiadomości SMS przez Twilio
 */
class SmsService {
  constructor() {
    this.twilioClient = null;
    this.isConfigured = false;
    this.sentToday = 0;
    this.sentThisHour = 0;
    this.usersSentToday = new Map();
    
    this.initialize();
    this.setupHourlyReset();
    this.setupDailyReset();
  }

  /**
   * Inicjalizacja klienta Twilio
   */
  async initialize() {
    try {
      const smsConfig = notificationConfig.sms.twilio;
      
      if (!smsConfig.accountSid || !smsConfig.authToken) {
        logger.warn('SMS service: Twilio credentials not configured');
        return;
      }

      // Tworzenie klienta Twilio
      this.twilioClient = twilio(smsConfig.accountSid, smsConfig.authToken);
      
      // Weryfikacja konfiguracji
      await this.verifyConfiguration();
      this.isConfigured = true;
      
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('SMS service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Weryfikacja konfiguracji Twilio
   */
  async verifyConfiguration() {
    try {
      // Sprawdź czy account jest aktywny
      const account = await this.twilioClient.api.accounts(
        notificationConfig.sms.twilio.accountSid
      ).fetch();
      
      if (account.status !== 'active') {
        throw new Error('Twilio account is not active');
      }
      
      logger.info('Twilio configuration verified successfully');
    } catch (error) {
      logger.error('Twilio configuration verification failed:', error);
      throw error;
    }
  }

  /**
   * Wysyłanie wiadomości SMS
   * @param {Object} params - Parametry wiadomości
   * @param {string} params.to - Numer telefonu odbiorcy (format międzynarodowy, np. +48123456789)
   * @param {string} params.type - Typ powiadomienia
   * @param {Object} params.data - Dane do podstawienia w szablonie
   * @param {Object} params.options - Dodatkowe opcje
   * @returns {Promise<Object>} Wynik wysyłania
   */
  async sendSms({
    to,
    type,
    data = {},
    options = {}
  }) {
    try {
      // Sprawdź czy serwis jest skonfigurowany
      if (!this.isConfigured) {
        throw new AppError('SMS service is not configured', 500);
      }

      // Walidacja numeru telefonu
      const phoneNumber = this.validatePhoneNumber(to);

      // Sprawdź limity wysyłania
      await this.checkLimits(phoneNumber);

      // Przygotuj zawartość wiadomości
      const messageContent = this.prepareSmsContent(type, data, options);

      // Konfiguracja wiadomości
      const messageOptions = {
        body: messageContent,
        to: phoneNumber,
        from: options.from || 
              notificationConfig.sms.twilio.fromNumber ||
              notificationConfig.sms.twilio.messagingServiceSid
      };

      // Jeśli używamy Messaging Service
      if (notificationConfig.sms.twilio.messagingServiceSid && !options.from) {
        delete messageOptions.from;
        messageOptions.messagingServiceSid = notificationConfig.sms.twilio.messagingServiceSid;
      }

      // Dodatkowe opcje
      if (options.statusCallback) {
        messageOptions.statusCallback = options.statusCallback;
      }

      // Wysyłanie wiadomości z timeoutem
      const result = await Promise.race([
        this.twilioClient.messages.create(messageOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMS sending timeout')), 
                    notificationConfig.global.timeouts.sms)
        )
      ]);

      // Aktualizuj liczniki
      this.updateCounters(phoneNumber);

      logger.info(`SMS sent successfully to ${phoneNumber}, type: ${type}`, {
        sid: result.sid,
        type,
        to: phoneNumber,
        status: result.status
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        provider: 'twilio',
        channel: 'sms',
        timestamp: new Date(),
        to: phoneNumber
      };

    } catch (error) {
      logger.error(`Failed to send SMS to ${to}:`, error);
      
      // Mapowanie błędów Twilio
      const mappedError = this.mapTwilioError(error);
      
      throw new AppError(
        `SMS sending failed: ${mappedError.message}`,
        mappedError.statusCode,
        {
          to,
          type,
          provider: 'twilio',
          originalError: error.message,
          errorCode: error.code
        }
      );
    }
  }

  /**
   * Przygotowanie zawartości wiadomości SMS
   * @param {string} type - Typ powiadomienia
   * @param {Object} data - Dane do podstawienia
   * @param {Object} options - Opcje
   * @returns {string} Zawartość SMS
   */
  prepareSmsContent(type, data, options) {
    const smsConfig = notificationConfig.sms.templates;
    
    // Pobierz szablon wiadomości
    let template = options.message || 
                  smsConfig.messages[type] || 
                  smsConfig.messages.system_notification;

    // Renderuj szablon z danymi
    const content = this.renderTemplate(template, {
      ...data,
      userName: data.userName || 'Użytkowniku',
      appName: 'RunFitting'
    });

    // Sprawdź długość wiadomości
    if (content.length > smsConfig.maxLength) {
      logger.warn(`SMS content too long (${content.length} chars), truncating`);
      return content.substring(0, smsConfig.maxLength - 3) + '...';
    }

    return content;
  }

  /**
   * Renderowanie szablonu z danymi
   * @param {string} template - Szablon
   * @param {Object} data - Dane
   * @returns {string} Wyrenderowany szablon
   */
  renderTemplate(template, data) {
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
   * Walidacja numeru telefonu
   * @param {string} phoneNumber - Numer telefonu
   * @returns {string} Zwalidowany numer telefonu
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new AppError('Phone number is required', 400);
    }

    // Usuń białe znaki i znaki specjalne
    let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');

    // Sprawdź czy numer zaczyna się od +
    if (!cleaned.startsWith('+')) {
      // Jeśli nie ma +, załóż że to polski numer
      if (cleaned.startsWith('0')) {
        cleaned = '+48' + cleaned.substring(1);
      } else if (cleaned.length === 9) {
        cleaned = '+48' + cleaned;
      } else {
        throw new AppError('Invalid phone number format. Use international format (+48...)', 400);
      }
    }

    // Sprawdź czy numer ma odpowiednią długość
    if (cleaned.length < 10 || cleaned.length > 16) {
      throw new AppError('Invalid phone number length', 400);
    }

    // Sprawdź czy składa się tylko z cyfr i znaku +
    if (!/^\+\d+$/.test(cleaned)) {
      throw new AppError('Phone number can only contain digits and + sign', 400);
    }

    return cleaned;
  }

  /**
   * Sprawdzenie limitów wysyłania
   * @param {string} phoneNumber - Numer telefonu
   */
  async checkLimits(phoneNumber) {
    const limits = notificationConfig.sms.limits;
    
    // Sprawdź limit dzienny
    if (this.sentToday >= limits.dailyLimit) {
      throw new AppError('Daily SMS limit exceeded', 429);
    }
    
    // Sprawdź limit godzinny
    if (this.sentThisHour >= limits.hourlyLimit) {
      throw new AppError('Hourly SMS limit exceeded', 429);
    }
    
    // Sprawdź limit dzienny per użytkownik
    const userCount = this.usersSentToday.get(phoneNumber) || 0;
    if (userCount >= limits.perUserDailyLimit) {
      throw new AppError('Daily SMS limit per user exceeded', 429);
    }
  }

  /**
   * Aktualizacja liczników
   * @param {string} phoneNumber - Numer telefonu
   */
  updateCounters(phoneNumber) {
    this.sentToday++;
    this.sentThisHour++;
    
    const userCount = this.usersSentToday.get(phoneNumber) || 0;
    this.usersSentToday.set(phoneNumber, userCount + 1);
  }

  /**
   * Mapowanie błędów Twilio na standardowe błędy
   * @param {Error} error - Błąd Twilio
   * @returns {Object} Zmapowany błąd
   */
  mapTwilioError(error) {
    // Mapowanie kodów błędów Twilio
    const errorMapping = {
      21211: { message: 'Invalid phone number', statusCode: 400 },
      21612: { message: 'Phone number is not a valid mobile number', statusCode: 400 },
      21614: { message: 'Phone number is not a valid mobile number for SMS', statusCode: 400 },
      30001: { message: 'Message queue is full', statusCode: 429 },
      30002: { message: 'Account suspended', statusCode: 402 },
      30003: { message: 'Unreachable destination handset', statusCode: 400 },
      30004: { message: 'Message blocked', statusCode: 400 },
      30005: { message: 'Unknown destination handset', statusCode: 400 },
      30006: { message: 'Landline or unreachable carrier', statusCode: 400 },
      30007: { message: 'Carrier violation', statusCode: 400 },
      30008: { message: 'Unknown error', statusCode: 500 }
    };

    const mappedError = errorMapping[error.code];
    if (mappedError) {
      return mappedError;
    }

    // Błędy HTTP
    if (error.status) {
      return {
        message: error.message || 'SMS service error',
        statusCode: error.status
      };
    }

    // Domyślny błąd
    return {
      message: error.message || 'Unknown SMS error',
      statusCode: 500
    };
  }

  /**
   * Sprawdzenie statusu wiadomości
   * @param {string} messageSid - SID wiadomości Twilio
   * @returns {Promise<Object>} Status wiadomości
   */
  async getMessageStatus(messageSid) {
    try {
      if (!this.isConfigured) {
        throw new AppError('SMS service is not configured', 500);
      }

      const message = await this.twilioClient.messages(messageSid).fetch();
      
      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode || null,
        errorMessage: message.errorMessage || null,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent,
        direction: message.direction,
        from: message.from,
        to: message.to,
        price: message.price,
        priceUnit: message.priceUnit
      };
    } catch (error) {
      logger.error(`Failed to get SMS status for ${messageSid}:`, error);
      throw new AppError(`Failed to get SMS status: ${error.message}`, 500);
    }
  }

  /**
   * Reset licznika godzinnego
   */
  setupHourlyReset() {
    setInterval(() => {
      this.sentThisHour = 0;
      logger.debug('SMS service: Hourly counter reset');
    }, 60 * 60 * 1000); // Co godzinę
  }

  /**
   * Reset licznika dziennego
   */
  setupDailyReset() {
    setInterval(() => {
      this.sentToday = 0;
      this.usersSentToday.clear();
      logger.debug('SMS service: Daily counters reset');
    }, 24 * 60 * 60 * 1000); // Co 24 godziny
  }

  /**
   * Sprawdzenie statusu usługi
   * @returns {Object} Status
   */
  async getStatus() {
    let accountInfo = null;
    
    if (this.isConfigured) {
      try {
        const account = await this.twilioClient.api.accounts(
          notificationConfig.sms.twilio.accountSid
        ).fetch();
        accountInfo = {
          status: account.status,
          type: account.type,
          dateCreated: account.dateCreated
        };
      } catch (error) {
        logger.error('Failed to get Twilio account info:', error);
      }
    }

    return {
      configured: this.isConfigured,
      sentToday: this.sentToday,
      sentThisHour: this.sentThisHour,
      limits: notificationConfig.sms.limits,
      accountInfo
    };
  }

  /**
   * Wysyłka testowa
   * @param {string} to - Numer telefonu odbiorcy
   * @returns {Promise<Object>} Wynik
   */
  async sendTest(to) {
    return this.sendSms({
      to,
      type: 'system_notification',
      data: {
        message: 'To jest wiadomość testowa z serwisu SMS RunFitting. Wszystko działa poprawnie! 🎉'
      }
    });
  }

  /**
   * Pobranie historii wiadomości
   * @param {Object} options - Opcje filtrowania
   * @returns {Promise<Array>} Historia wiadomości
   */
  async getMessageHistory(options = {}) {
    try {
      if (!this.isConfigured) {
        throw new AppError('SMS service is not configured', 500);
      }

      const queryOptions = {
        limit: options.limit || 20,
        pageSize: options.pageSize || 20
      };

      if (options.dateSentAfter) {
        queryOptions.dateSentAfter = new Date(options.dateSentAfter);
      }

      if (options.dateSentBefore) {
        queryOptions.dateSentBefore = new Date(options.dateSentBefore);
      }

      if (options.to) {
        queryOptions.to = this.validatePhoneNumber(options.to);
      }

      if (options.from) {
        queryOptions.from = options.from;
      }

      const messages = await this.twilioClient.messages.list(queryOptions);
      
      return messages.map(message => ({
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        price: message.price,
        priceUnit: message.priceUnit
      }));
    } catch (error) {
      logger.error('Failed to get SMS history:', error);
      throw new AppError(`Failed to get SMS history: ${error.message}`, 500);
    }
  }
}

module.exports = SmsService; 