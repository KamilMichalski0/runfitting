const EmailService = require('./notification/email.service');
const SmsService = require('./notification/sms.service');
const PushService = require('./notification/push.service');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { notificationConfig, getNotificationTypeConfig } = require('../config/notification.config');
const logger = require('../utils/logger');
const AppError = require('../utils/app-error');

/**
 * Główny serwis powiadomień RunFitting
 * Koordynuje wszystkie kanały komunikacji i zarządza logiką biznesową
 */
class NotificationService {
  constructor() {
    // Inicjalizacja serwisów kanałów
    this.emailService = new EmailService();
    this.smsService = new SmsService();
    this.pushService = new PushService();
    
    // Mapa dostępnych serwisów
    this.channelServices = {
      email: this.emailService,
      sms: this.smsService,
      push: this.pushService
    };
    
    // Konfiguracja wyciszenia globalnego
    this.globalQuietHours = notificationConfig.global.globalQuietHours;
    
    logger.info('Notification service initialized');
  }

  /**
   * Wysyłanie powiadomienia
   * @param {Object} params - Parametry powiadomienia
   * @param {string|mongoose.Types.ObjectId} params.userId - ID użytkownika
   * @param {string} params.type - Typ powiadomienia
   * @param {Object} params.data - Dane powiadomienia
   * @param {Object} params.options - Dodatkowe opcje
   * @returns {Promise<Object>} Wynik wysyłania
   */
  async sendNotification({
    userId,
    type,
    data = {},
    options = {}
  }) {
    try {
      // Pobierz użytkownika z preferencjami
      const user = await this.getUserWithPreferences(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Sprawdź czy typ powiadomienia jest obsługiwany
      if (!this.isNotificationTypeSupported(type)) {
        throw new AppError(`Notification type '${type}' is not supported`, 400);
      }

      // Sprawdź czy użytkownik ma włączone powiadomienia tego typu
      if (!this.isNotificationEnabledForUser(user, type)) {
        logger.info(`Notification type '${type}' is disabled for user ${userId}`);
        return { success: true, message: 'Notification disabled by user preferences' };
      }

      // Sprawdź wyciszenie (quiet hours)
      if (this.isInQuietHours(user)) {
        const delay = this.calculateQuietHoursDelay(user);
        return this.scheduleNotification({
          userId,
          type,
          data,
          options: { ...options, scheduledFor: delay }
        });
      }

      // Określ kanały do wysyłania
      const channels = this.determineChannels(user, type, options);
      
      // Utwórz wpisy w bazie danych dla każdego kanału
      const notifications = await this.createNotificationRecords(
        user, type, data, options, channels
      );

      // Wyślij powiadomienia przez wszystkie kanały
      const results = await this.sendToChannels(notifications, user, data, options);

      // Zwróć agregowane wyniki
      return this.aggregateResults(results);

    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Wysyłanie powiadomienia do wielu użytkowników
   * @param {Array} userIds - Lista ID użytkowników
   * @param {string} type - Typ powiadomienia
   * @param {Object} data - Dane powiadomienia
   * @param {Object} options - Dodatkowe opcje
   * @returns {Promise<Object>} Wyniki wysyłania
   */
  async sendToMultipleUsers(userIds, type, data = {}, options = {}) {
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Przetwarzaj użytkowników w batchach
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      batches.push(userIds.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (userId) => {
        try {
          const result = await this.sendNotification({
            userId,
            type,
            data,
            options
          });
          
          if (result.success) {
            results.successful++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            userId,
            error: error.message
          });
        }
      });

      await Promise.allSettled(promises);
    }

    logger.info(`Bulk notification completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
    return results;
  }

  /**
   * Zaplanowanie powiadomienia na później
   * @param {Object} params - Parametry powiadomienia
   * @param {Date} params.scheduledFor - Kiedy wysłać powiadomienie
   * @returns {Promise<Object>} Utworzone powiadomienie
   */
  async scheduleNotification({
    userId,
    type,
    data = {},
    options = {}
  }) {
    try {
      const user = await this.getUserWithPreferences(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Określ kanały
      const channels = this.determineChannels(user, type, options);
      
      // Utwórz zaplanowane powiadomienia
      const notifications = await this.createNotificationRecords(
        user, type, data, options, channels, 'pending'
      );

      logger.info(`Scheduled ${notifications.length} notifications for user ${userId}, type: ${type}`);
      
      return {
        success: true,
        scheduledCount: notifications.length,
        scheduledFor: options.scheduledFor
      };

    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Przetwarzanie zaplanowanych powiadomień
   * @param {number} limit - Maksymalna liczba powiadomień do przetworzenia
   * @returns {Promise<Object>} Wyniki przetwarzania
   */
  async processPendingNotifications(limit = 100) {
    try {
      // Pobierz zaplanowane powiadomienia
      const pendingNotifications = await Notification.findPendingNotifications(limit);
      
      if (pendingNotifications.length === 0) {
        return { processed: 0 };
      }

      logger.info(`Processing ${pendingNotifications.length} pending notifications`);

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };

      // Przetwórz powiadomienia
      for (const notification of pendingNotifications) {
        try {
          results.processed++;
          
          // Sprawdź czy powiadomienie nie wygasło
          if (notification.expiresAt && notification.expiresAt < new Date()) {
            await notification.markAsFailed({ message: 'Notification expired' });
            continue;
          }

          // Pobierz dane użytkownika
          const user = notification.userId;
          
          // Wysłij powiadomienie
          await this.sendSingleNotification(notification, user, {}, {});
          
          results.successful++;

        } catch (error) {
          results.failed++;
          results.errors.push({
            notificationId: notification._id,
            error: error.message
          });
          
          // Oznacz jako nieudane
          await notification.markAsFailed(error);
        }
      }

      logger.info(`Processed ${results.processed} notifications: ${results.successful} successful, ${results.failed} failed`);
      return results;

    } catch (error) {
      logger.error('Failed to process pending notifications:', error);
      throw error;
    }
  }

  /**
   * Aktualizacja preferencji użytkownika
   */
  async updateUserPreferences(userId, preferences) {
    const user = await this.getUserWithPreferences(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Walidacja preferencji
    this.validatePreferences(preferences);

    // Aktualizacja kanałów
    if (preferences.channels) {
      for (const [channel, config] of Object.entries(preferences.channels)) {
        if (user.notificationPreferences.channels[channel]) {
          user.notificationPreferences.channels[channel].enabled = config.enabled;
        }
      }
    }

    // Aktualizacja typów powiadomień
    if (preferences.types) {
      // Konwertuj typy na format systemowy
      const normalizedTypes = {};
      for (const [type, config] of Object.entries(preferences.types)) {
        const normalizedType = this.normalizeNotificationType(type);
        normalizedTypes[normalizedType] = config;
      }
      
      // Aktualizuj preferencje użytkownika
      user.notificationPreferences.types = {
        ...user.notificationPreferences.types,
        ...normalizedTypes
      };
    }

    // Aktualizacja quiet hours
    if (preferences.quietHours) {
      user.quietHours = {
        ...user.quietHours,
        ...preferences.quietHours
      };
    }

    // Zapisz zmiany
    await user.save();

    return {
      success: true,
      preferences: user.notificationPreferences,
      quietHours: user.quietHours
    };
  }

  /**
   * Subskrypcja push notifications
   * @param {string} userId - ID użytkownika
   * @param {Object} subscription - Dane subskrypcji
   * @returns {Promise<Object>} Wynik subskrypcji
   */
  async subscribeToPush(userId, subscription) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Walidacja subskrypcji
      this.pushService.validateSubscription(subscription);

      // Sprawdź czy subskrypcja już istnieje
      const existingIndex = user.notificationPreferences.channels.push.subscriptions
        .findIndex(sub => sub.endpoint === subscription.endpoint);

      if (existingIndex !== -1) {
        // Aktualizuj istniejącą subskrypcję
        user.notificationPreferences.channels.push.subscriptions[existingIndex] = {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          deviceInfo: {
            userAgent: subscription.userAgent,
            platform: subscription.platform
          },
          createdAt: new Date()
        };
      } else {
        // Dodaj nową subskrypcję
        user.notificationPreferences.channels.push.subscriptions.push({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          deviceInfo: {
            userAgent: subscription.userAgent,
            platform: subscription.platform
          },
          createdAt: new Date()
        });
      }

      // Włącz push notifications
      user.notificationPreferences.channels.push.enabled = true;

      await user.save();

      logger.info(`User ${userId} subscribed to push notifications`);
      
      return {
        success: true,
        message: 'Successfully subscribed to push notifications'
      };

    } catch (error) {
      logger.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Pobieranie historii powiadomień użytkownika
   * @param {string} userId - ID użytkownika
   * @param {Object} options - Opcje filtrowania
   * @returns {Promise<Array>} Historia powiadomień
   */
  async getUserNotificationHistory(userId, options = {}) {
    try {
      const query = { userId };
      
      if (options.type) {
        query.type = options.type;
      }
      
      if (options.channel) {
        query.channel = options.channel;
      }
      
      if (options.status) {
        query.status = options.status;
      }
      
      if (options.dateFrom) {
        query.createdAt = { $gte: new Date(options.dateFrom) };
      }
      
      if (options.dateTo) {
        query.createdAt = { ...query.createdAt, $lte: new Date(options.dateTo) };
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .select('-targetData -attempts'); // Ukryj wrażliwe dane

      return notifications;

    } catch (error) {
      logger.error('Failed to get user notification history:', error);
      throw error;
    }
  }

  /**
   * Pobieranie statystyk powiadomień
   * @param {string} userId - ID użytkownika (opcjonalnie)
   * @param {number} days - Liczba dni wstecz
   * @returns {Promise<Object>} Statystyki
   */
  async getNotificationStats(userId = null, days = 30) {
    try {
      let stats;
      
      if (userId) {
        // Statystyki dla konkretnego użytkownika
        stats = await Notification.getUserNotificationStats(userId, days);
      } else {
        // Globalne statystyki
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        stats = await Notification.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                channel: '$channel',
                status: '$status'
              },
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: '$_id.channel',
              statuses: {
                $push: {
                  status: '$_id.status',
                  count: '$count'
                }
              },
              total: { $sum: '$count' }
            }
          }
        ]);
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * Sprawdzenie statusu wszystkich serwisów
   * @returns {Promise<Object>} Status serwisów
   */
  async getServicesStatus() {
    try {
      const [emailStatus, smsStatus, pushStatus] = await Promise.all([
        this.emailService.getStatus(),
        this.smsService.getStatus(),
        this.pushService.getStatus()
      ]);

      return {
        email: emailStatus,
        sms: smsStatus,
        push: pushStatus,
        global: {
          configured: emailStatus.configured || smsStatus.configured || pushStatus.configured,
          totalSentToday: emailStatus.sentToday + smsStatus.sentToday + pushStatus.sentToday
        }
      };

    } catch (error) {
      logger.error('Failed to get services status:', error);
      throw error;
    }
  }

  // === METODY POMOCNICZE ===

  /**
   * Pobranie użytkownika z preferencjami
   */
  async getUserWithPreferences(userId) {
    return await User.findById(userId)
      .select('+notificationPreferences +quietHours +email +phoneNumber');
  }

  /**
   * Sprawdzenie czy typ powiadomienia jest obsługiwany
   */
  isNotificationTypeSupported(type) {
    // Mapowanie camelCase na snake_case (obsługa liczby pojedynczej i mnogiej)
    const typeMapping = {
      // Liczba pojedyncza
      'trainingReminder': 'training_reminder',
      'motivationalMessage': 'motivational_message',
      'progressReport': 'progress_report',
      'systemNotification': 'system_notification',
      'achievement': 'achievement',
      // Liczba mnoga
      'trainingReminders': 'training_reminder',
      'motivationalMessages': 'motivational_message',
      'progressReports': 'progress_report',
      'systemNotifications': 'system_notification',
      'achievements': 'achievement'
    };

    // Jeśli typ jest w formacie camelCase, przekonwertuj go
    const normalizedType = typeMapping[type] || type;
    
    // Sprawdź czy typ istnieje w konfiguracji
    return !!getNotificationTypeConfig(normalizedType);
  }

  /**
   * Sprawdzenie czy powiadomienie jest włączone dla użytkownika
   */
  isNotificationEnabledForUser(user, type) {
    const typePrefs = user.notificationPreferences?.types?.[type];
    return typePrefs?.enabled !== false;
  }

  /**
   * Sprawdzenie czy kanał jest włączony dla użytkownika
   */
  isChannelEnabledForUser(user, channel) {
    const channelPrefs = user.notificationPreferences?.channels?.[channel];
    return channelPrefs?.enabled === true;
  }

  /**
   * Sprawdzenie czy jest w trakcie wyciszenia
   */
  isInQuietHours(user) {
    const quietHours = user.quietHours;
    if (!quietHours?.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const startTime = quietHours.start.hour * 60 + quietHours.start.minute;
    const endTime = quietHours.end.hour * 60 + quietHours.end.minute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Obliczenie opóźnienia dla wyciszenia
   */
  calculateQuietHoursDelay(user) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(user.quietHours.end.hour, user.quietHours.end.minute, 0, 0);
    
    return endTime;
  }

  /**
   * Określenie kanałów do wysyłania
   */
  determineChannels(user, type, options) {
    if (options.channels) {
      return options.channels;
    }

    const typeConfig = getNotificationTypeConfig(type);
    const defaultChannels = typeConfig?.channels || ['email'];
    
    return defaultChannels.filter(channel => 
      this.isChannelEnabledForUser(user, channel)
    );
  }

  /**
   * Utworzenie wpisów powiadomień w bazie danych
   */
  async createNotificationRecords(user, type, data, options, channels, status = 'pending') {
    const notifications = [];
    
    for (const channel of channels) {
      const notification = await this.createNotificationRecord(
        user, type, data, options, channel, status
      );
      notifications.push(notification);
    }
    
    return notifications;
  }

  /**
   * Utworzenie pojedynczego wpisu powiadomienia
   */
  async createNotificationRecord(user, type, data, options, channel, status = 'pending') {
    const typeConfig = getNotificationTypeConfig(type);
    
    // Przygotuj dane docelowe
    const targetData = this.prepareTargetData(user, channel);
    
    // Przygotuj zawartość
    const content = this.prepareNotificationContent(type, data, options);
    
    const notification = new Notification({
      userId: user._id,
      type,
      channel,
      status,
      priority: options.priority || typeConfig?.priority || 'normal',
      content,
      targetData,
      scheduledFor: options.scheduledFor || new Date(),
      expiresAt: options.expiresAt,
      category: typeConfig?.category || 'system',
      userSegment: this.determineUserSegment(user),
      abTestVariant: options.abTestVariant
    });

    await notification.save();
    return notification;
  }

  /**
   * Przygotowanie danych docelowych dla kanału
   */
  prepareTargetData(user, channel) {
    switch (channel) {
      case 'email':
        return { email: user.email };
      case 'sms':
        return { phoneNumber: user.phoneNumber };
      case 'push':
        return { 
          pushSubscription: user.notificationPreferences.channels.push.subscriptions[0] 
        };
      default:
        return {};
    }
  }

  /**
   * Przygotowanie zawartości powiadomienia
   */
  prepareNotificationContent(type, data, options) {
    const typeConfig = getNotificationTypeConfig(type);
    
    return {
      title: options.title || `RunFitting - ${type}`,
      body: options.message || data.message || 'Masz nowe powiadomienie',
      metadata: {
        ...data,
        actionUrl: options.actionUrl || data.actionUrl
      }
    };
  }

  /**
   * Określenie segmentu użytkownika
   */
  determineUserSegment(user) {
    if (user.subscriptionTier === 'premium') return 'premium';
    if (user.subscriptionTier === 'basic') return 'basic';
    return 'free';
  }

  /**
   * Wysyłanie powiadomień przez kanały
   */
  async sendToChannels(notifications, user, data, options) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        const result = await this.sendSingleNotification(notification, user, data, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          channel: notification.channel,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Wysyłanie pojedynczego powiadomienia
   */
  async sendSingleNotification(notification, user, data, options) {
    const service = this.channelServices[notification.channel];
    
    if (!service) {
      throw new AppError(`Service for channel ${notification.channel} not found`, 500);
    }

    let result;
    
    try {
      switch (notification.channel) {
        case 'email':
          result = await service.sendEmail({
            to: notification.targetData.email,
            type: notification.type,
            data: { ...data, userName: user.name },
            options: { ...options, userId: user._id }
          });
          break;
          
        case 'sms':
          result = await service.sendSms({
            to: notification.targetData.phoneNumber,
            type: notification.type,
            data: { ...data, userName: user.name },
            options
          });
          break;
          
        case 'push':
          result = await service.sendPushNotification({
            subscription: notification.targetData.pushSubscription,
            type: notification.type,
            data: { ...data, userName: user.name },
            options
          });
          break;
          
        default:
          throw new AppError(`Unsupported channel: ${notification.channel}`, 400);
      }

      // Oznacz jako wysłane
      await notification.markAsSent(result.messageId, result);
      
      return {
        success: true,
        channel: notification.channel,
        messageId: result.messageId
      };

    } catch (error) {
      // Oznacz jako nieudane
      await notification.markAsFailed(error);
      throw error;
    }
  }

  /**
   * Agregacja wyników
   */
  aggregateResults(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      success: successful > 0,
      total: results.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Walidacja preferencji
   */
  validatePreferences(preferences) {
    // Podstawowa walidacja struktury preferencji
    if (preferences.channels) {
      for (const [channel, config] of Object.entries(preferences.channels)) {
        if (!['email', 'sms', 'push'].includes(channel)) {
          throw new AppError(`Invalid channel: ${channel}`, 400);
        }
      }
    }
    
    if (preferences.types) {
      for (const [type, config] of Object.entries(preferences.types)) {
        if (!this.isNotificationTypeSupported(type)) {
          throw new AppError(`Invalid notification type: ${type}`, 400);
        }
      }
    }

    // Walidacja quiet hours
    if (preferences.quietHours) {
      const { start, end } = preferences.quietHours;
      
      if (start) {
        if (!Number.isInteger(start.hour) || start.hour < 0 || start.hour > 23) {
          throw new AppError('Invalid quiet hours start hour', 400);
        }
        if (!Number.isInteger(start.minute) || start.minute < 0 || start.minute > 59) {
          throw new AppError('Invalid quiet hours start minute', 400);
        }
      }
      
      if (end) {
        if (!Number.isInteger(end.hour) || end.hour < 0 || end.hour > 23) {
          throw new AppError('Invalid quiet hours end hour', 400);
        }
        if (!Number.isInteger(end.minute) || end.minute < 0 || end.minute > 59) {
          throw new AppError('Invalid quiet hours end minute', 400);
        }
      }
    }
  }

  /**
   * Konwersja typu powiadomienia na format systemowy
   */
  normalizeNotificationType(type) {
    const typeMapping = {
      // Liczba pojedyncza
      'trainingReminder': 'training_reminder',
      'motivationalMessage': 'motivational_message',
      'progressReport': 'progress_report',
      'systemNotification': 'system_notification',
      'achievement': 'achievement',
      // Liczba mnoga
      'trainingReminders': 'training_reminder',
      'motivationalMessages': 'motivational_message',
      'progressReports': 'progress_report',
      'systemNotifications': 'system_notification',
      'achievements': 'achievement'
    };

    return typeMapping[type] || type;
  }
}

module.exports = NotificationService; 