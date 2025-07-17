const NotificationService = require('../services/notification.service');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const AppError = require('../utils/app-error');

/**
 * Kontroler powiadomień
 * Obsługuje zarządzanie preferencjami i wysyłanie powiadomień
 */
class NotificationController {
  constructor() {
    this.notificationService = new NotificationService();
    
    // Bindowanie metod do kontekstu klasy
    this.getPreferences = this.getPreferences.bind(this);
    this.updatePreferences = this.updatePreferences.bind(this);
    this.subscribeToPush = this.subscribeToPush.bind(this);
    this.unsubscribeFromPush = this.unsubscribeFromPush.bind(this);
    this.getVapidKeys = this.getVapidKeys.bind(this);
    this.sendTestNotification = this.sendTestNotification.bind(this);
    this.getNotificationHistory = this.getNotificationHistory.bind(this);
    this.getNotificationStats = this.getNotificationStats.bind(this);
    this.getServicesStatus = this.getServicesStatus.bind(this);
    this.sendNotification = this.sendNotification.bind(this);
    this.scheduleNotification = this.scheduleNotification.bind(this);
    this.processPendingNotifications = this.processPendingNotifications.bind(this);
    this.handleWebhook = this.handleWebhook.bind(this);
  }

  /**
   * Pobranie preferencji powiadomień użytkownika
   * GET /api/notifications/preferences
   */
  async getPreferences(req, res, next) {
    try {
      const userId = req.user._id;
      
      const user = await this.notificationService.getUserWithPreferences(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          preferences: user.notificationPreferences,
          quietHours: user.quietHours
        }
      });

    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      next(error);
    }
  }

  /**
   * Aktualizacja preferencji powiadomień użytkownika
   * PUT /api/notifications/preferences
   */
  async updatePreferences(req, res, next) {
    try {
      // Walidacja danych wejściowych
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const preferences = req.body;

      const result = await this.notificationService.updateUserPreferences(userId, preferences);

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: result.preferences
      });

    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      next(error);
    }
  }

  /**
   * Subskrypcja push notifications
   * POST /api/notifications/push/subscribe
   */
  async subscribeToPush(req, res, next) {
    try {
      // Walidacja danych wejściowych
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const subscription = {
        endpoint: req.body.endpoint,
        keys: req.body.keys,
        userAgent: req.headers['user-agent'],
        platform: req.body.platform || 'web'
      };

      const result = await this.notificationService.subscribeToPush(userId, subscription);

      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to push notifications',
        data: result
      });

    } catch (error) {
      logger.error('Failed to subscribe to push notifications:', error);
      next(error);
    }
  }

  /**
   * Wypisanie z push notifications
   * DELETE /api/notifications/push/unsubscribe
   */
  async unsubscribeFromPush(req, res, next) {
    try {
      const userId = req.user.id;
      const { endpoint } = req.body;

      if (!endpoint) {
        throw new AppError('Endpoint is required', 400);
      }

      // Logika wypisania z push notifications
      const user = await this.notificationService.getUserWithPreferences(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Usuń subskrypcję
      user.notificationPreferences.channels.push.subscriptions = 
        user.notificationPreferences.channels.push.subscriptions
          .filter(sub => sub.endpoint !== endpoint);

      // Jeśli nie ma już subskrypcji, wyłącz push notifications
      if (user.notificationPreferences.channels.push.subscriptions.length === 0) {
        user.notificationPreferences.channels.push.enabled = false;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      });

    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications:', error);
      next(error);
    }
  }

  /**
   * Pobranie kluczy VAPID
   * GET /api/notifications/push/vapid-keys
   */
  async getVapidKeys(req, res, next) {
    try {
      const vapidKeys = this.notificationService.pushService.getVapidPublicKey();

      res.status(200).json({
        success: true,
        data: vapidKeys
      });

    } catch (error) {
      logger.error('Failed to get VAPID keys:', error);
      next(error);
    }
  }

  /**
   * Wysyłanie testowego powiadomienia
   * POST /api/notifications/test
   */
  async sendTestNotification(req, res, next) {
    try {
      // Walidacja danych wejściowych
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { type, channel, message } = req.body;

      let result;

      if (channel) {
        // Wysłanie przez konkretny kanał
        switch (channel) {
          case 'email':
            const user = await this.notificationService.getUserWithPreferences(userId);
            result = await this.notificationService.emailService.sendTest(user.email);
            break;
          case 'sms':
            const userSms = await this.notificationService.getUserWithPreferences(userId);
            if (!userSms.phoneNumber) {
              throw new AppError('Phone number not configured', 400);
            }
            result = await this.notificationService.smsService.sendTest(userSms.phoneNumber);
            break;
          case 'push':
            const userPush = await this.notificationService.getUserWithPreferences(userId);
            const subscription = userPush.notificationPreferences.channels.push.subscriptions[0];
            if (!subscription) {
              throw new AppError('Push subscription not found', 400);
            }
            result = await this.notificationService.pushService.sendTest(subscription);
            break;
          default:
            throw new AppError('Invalid channel', 400);
        }
      } else {
        // Wysłanie przez wszystkie dostępne kanały
        result = await this.notificationService.sendNotification({
          userId,
          type: type || 'system_notification',
          data: {
            message: message || 'To jest powiadomienie testowe z RunFitting!'
          },
          options: {
            title: 'Test powiadomienia'
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send test notification:', error);
      next(error);
    }
  }

  /**
   * Pobranie historii powiadomień użytkownika
   * GET /api/notifications/history
   */
  async getNotificationHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        type,
        channel,
        status,
        dateFrom,
        dateTo,
        limit = 50,
        page = 1
      } = req.query;

      const options = {
        type,
        channel,
        status,
        dateFrom,
        dateTo,
        limit: Math.min(parseInt(limit), 100), // Maksymalnie 100
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      const notifications = await this.notificationService.getUserNotificationHistory(userId, options);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: notifications.length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get notification history:', error);
      next(error);
    }
  }

  /**
   * Pobranie statystyk powiadomień użytkownika
   * GET /api/notifications/stats
   */
  async getNotificationStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const stats = await this.notificationService.getNotificationStats(userId, parseInt(days));

      res.status(200).json({
        success: true,
        data: {
          stats,
          period: `${days} days`
        }
      });

    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      next(error);
    }
  }

  /**
   * Pobranie statusu serwisów powiadomień
   * GET /api/notifications/status
   */
  async getServicesStatus(req, res, next) {
    try {
      const status = await this.notificationService.getServicesStatus();

      res.status(200).json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Failed to get services status:', error);
      next(error);
    }
  }

  /**
   * Wysyłanie powiadomienia (tylko dla adminów)
   * POST /api/notifications/send
   */
  async sendNotification(req, res, next) {
    try {
      // Sprawdź uprawnienia administratora
      if (req.user.role !== 'admin') {
        throw new AppError('Insufficient permissions', 403);
      }

      // Walidacja danych wejściowych
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId, userIds, type, data, options } = req.body;

      let result;

      if (userIds && Array.isArray(userIds)) {
        // Wysyłanie do wielu użytkowników
        result = await this.notificationService.sendToMultipleUsers(userIds, type, data, options);
      } else if (userId) {
        // Wysyłanie do jednego użytkownika
        result = await this.notificationService.sendNotification({
          userId,
          type,
          data,
          options
        });
      } else {
        throw new AppError('Either userId or userIds must be provided', 400);
      }

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send notification:', error);
      next(error);
    }
  }

  /**
   * Zaplanowanie powiadomienia (tylko dla adminów)
   * POST /api/notifications/schedule
   */
  async scheduleNotification(req, res, next) {
    try {
      // Sprawdź uprawnienia administratora
      if (req.user.role !== 'admin') {
        throw new AppError('Insufficient permissions', 403);
      }

      // Walidacja danych wejściowych
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId, userIds, type, data, scheduledFor, options = {} } = req.body;

      // Dodaj scheduledFor do opcji
      options.scheduledFor = new Date(scheduledFor);

      let result;

      if (userIds && Array.isArray(userIds)) {
        // Zaplanuj dla wielu użytkowników
        const promises = userIds.map(uid => 
          this.notificationService.scheduleNotification({
            userId: uid,
            type,
            data,
            options
          })
        );
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        result = {
          successful,
          failed,
          total: userIds.length
        };
      } else if (userId) {
        // Zaplanuj dla jednego użytkownika
        result = await this.notificationService.scheduleNotification({
          userId,
          type,
          data,
          options
        });
      } else {
        throw new AppError('Either userId or userIds must be provided', 400);
      }

      res.status(201).json({
        success: true,
        message: 'Notification scheduled successfully',
        data: result
      });

    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      next(error);
    }
  }

  /**
   * Przetwarzanie zaplanowanych powiadomień (endpoint wewnętrzny)
   * POST /api/notifications/process-pending
   */
  async processPendingNotifications(req, res, next) {
    try {
      // Sprawdź uprawnienia administratora lub klucz API
      if (req.user?.role !== 'admin' && req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY) {
        throw new AppError('Insufficient permissions', 403);
      }

      const { limit = 100 } = req.body;

      const result = await this.notificationService.processPendingNotifications(parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Pending notifications processed',
        data: result
      });

    } catch (error) {
      logger.error('Failed to process pending notifications:', error);
      next(error);
    }
  }

  /**
   * Webhook dla statusu powiadomień (np. z Twilio)
   * POST /api/notifications/webhook/:provider
   */
  async handleWebhook(req, res, next) {
    try {
      const { provider } = req.params;
      const webhookData = req.body;

      logger.info(`Received webhook from ${provider}:`, webhookData);

      // Tutaj można dodać logikę aktualizacji statusu powiadomień
      // na podstawie webhooków od dostawców usług

      switch (provider) {
        case 'twilio':
          await this.handleTwilioWebhook(webhookData);
          break;
        case 'sendgrid':
          await this.handleSendgridWebhook(webhookData);
          break;
        default:
          logger.warn(`Unknown webhook provider: ${provider}`);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      logger.error('Failed to process webhook:', error);
      next(error);
    }
  }

  /**
   * Obsługa webhooków Twilio
   */
  async handleTwilioWebhook(webhookData) {
    // Implementacja aktualizacji statusu SMS na podstawie webhooków Twilio
    // np. delivered, failed, undelivered
    logger.info('Processing Twilio webhook:', webhookData);
  }

  /**
   * Obsługa webhooków SendGrid
   */
  async handleSendgridWebhook(webhookData) {
    // Implementacja aktualizacji statusu email na podstawie webhooków SendGrid
    // np. delivered, opened, clicked, bounced
    logger.info('Processing SendGrid webhook:', webhookData);
  }
}

module.exports = new NotificationController(); 