const cron = require('node-cron');
const NotificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Job do przetwarzania zaplanowanych powiadomień
 * Uruchamia się co minutę i przetwarza powiadomienia gotowe do wysłania
 */
class NotificationProcessorJob {
  constructor() {
    this.notificationService = new NotificationService();
    this.isRunning = false;
    this.lastRunTime = null;
    this.processedCount = 0;
    this.errorCount = 0;
    
    logger.info('Notification processor job initialized');
  }

  /**
   * Uruchomienie job-a
   */
  start() {
    // Uruchamiaj co minutę
    cron.schedule('* * * * *', async () => {
      await this.processPendingNotifications();
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    });

    // Uruchamiaj co 5 minut dla powiadomień o niskim priorytecie
    cron.schedule('*/5 * * * *', async () => {
      await this.processLowPriorityNotifications();
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    });

    // Czyszczenie starych powiadomień co godzinę
    cron.schedule('0 * * * *', async () => {
      await this.cleanupOldNotifications();
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    });

    // Raport dzienny o 9:00
    cron.schedule('0 9 * * *', async () => {
      await this.generateDailyReport();
    }, {
      scheduled: true,
      timezone: 'Europe/Warsaw'
    });

    logger.info('Notification processor job started with cron schedules');
  }

  /**
   * Przetwarzanie powiadomień o normalnym i wysokim priorytecie
   */
  async processPendingNotifications() {
    if (this.isRunning) {
      logger.debug('Notification processor already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();

    try {
      logger.debug('Processing pending notifications...');
      
      const result = await this.notificationService.processPendingNotifications(50);
      
      this.processedCount += result.processed || 0;
      this.errorCount += result.failed || 0;

      if (result.processed > 0) {
        logger.info(`Processed ${result.processed} pending notifications (${result.successful} successful, ${result.failed} failed)`);
      }

      // Loguj błędy jeśli występują
      if (result.errors && result.errors.length > 0) {
        logger.warn('Notification processing errors:', result.errors);
      }

    } catch (error) {
      logger.error('Failed to process pending notifications:', error);
      this.errorCount++;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Przetwarzanie powiadomień o niskim priorytecie
   */
  async processLowPriorityNotifications() {
    try {
      logger.debug('Processing low priority notifications...');
      
      // Znajdź powiadomienia o niskim priorytecie starsze niż 5 minut
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const result = await this.notificationService.processPendingNotifications(20);
      
      if (result.processed > 0) {
        logger.info(`Processed ${result.processed} low priority notifications`);
      }

    } catch (error) {
      logger.error('Failed to process low priority notifications:', error);
    }
  }

  /**
   * Czyszczenie starych powiadomień
   */
  async cleanupOldNotifications() {
    try {
      logger.debug('Cleaning up old notifications...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Usuń powiadomienia starsze niż 30 dni (tylko te które zostały dostarczone lub niepowodzenie)
      const Notification = require('../models/notification.model');
      
      const deleteResult = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        status: { $in: ['delivered', 'failed', 'bounced'] }
      });

      if (deleteResult.deletedCount > 0) {
        logger.info(`Cleaned up ${deleteResult.deletedCount} old notifications`);
      }

      // Usuń wygasłe powiadomienia
      const expiredResult = await Notification.deleteMany({
        expiresAt: { $lt: new Date() },
        status: 'pending'
      });

      if (expiredResult.deletedCount > 0) {
        logger.info(`Removed ${expiredResult.deletedCount} expired notifications`);
      }

    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
    }
  }

  /**
   * Generowanie raportu dziennego
   */
  async generateDailyReport() {
    try {
      logger.debug('Generating daily notification report...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const Notification = require('../models/notification.model');
      
      // Statystyki z wczoraj
      const stats = await Notification.aggregate([
        {
          $match: {
            createdAt: {
              $gte: yesterday,
              $lt: today
            }
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

      // Oblicz ogólne statystyki
      const totalNotifications = stats.reduce((sum, channel) => sum + channel.total, 0);
      const successfulNotifications = stats.reduce((sum, channel) => {
        const successful = channel.statuses
          .filter(s => ['sent', 'delivered', 'opened', 'clicked'].includes(s.status))
          .reduce((total, s) => total + s.count, 0);
        return sum + successful;
      }, 0);

      const failedNotifications = stats.reduce((sum, channel) => {
        const failed = channel.statuses
          .filter(s => ['failed', 'bounced'].includes(s.status))
          .reduce((total, s) => total + s.count, 0);
        return sum + failed;
      }, 0);

      const successRate = totalNotifications > 0 ? 
        ((successfulNotifications / totalNotifications) * 100).toFixed(2) : 0;

      logger.info('Daily notification report:', {
        date: yesterday.toISOString().split('T')[0],
        totalNotifications,
        successfulNotifications,
        failedNotifications,
        successRate: `${successRate}%`,
        byChannel: stats
      });

      // Jeśli współczynnik sukcesu jest niski, wyślij alert
      if (totalNotifications > 10 && successRate < 85) {
        logger.warn(`Low notification success rate detected: ${successRate}%`);
        
        // Można tutaj dodać wysłanie alertu do administratorów
        await this.sendLowSuccessRateAlert(successRate, stats);
      }

    } catch (error) {
      logger.error('Failed to generate daily notification report:', error);
    }
  }

  /**
   * Wysyłanie alertu o niskim współczynniku sukcesu
   */
  async sendLowSuccessRateAlert(successRate, stats) {
    try {
      // Znajdź administratorów
      const User = require('../models/user.model');
      const admins = await User.find({ role: 'admin' }).select('_id email');

      if (admins.length === 0) {
        logger.warn('No administrators found to send alert');
        return;
      }

      // Przygotuj dane alertu
      const alertData = {
        message: `Alert: Niski współczynnik sukcesu powiadomień - ${successRate}%`,
        successRate,
        details: stats,
        date: new Date().toISOString().split('T')[0]
      };

      // Wyślij alert do każdego administratora
      for (const admin of admins) {
        await this.notificationService.sendNotification({
          userId: admin._id,
          type: 'system_notification',
          data: alertData,
          options: {
            priority: 'high',
            title: 'Alert systemu powiadomień',
            channels: ['email']
          }
        });
      }

      logger.info(`Low success rate alert sent to ${admins.length} administrators`);

    } catch (error) {
      logger.error('Failed to send low success rate alert:', error);
    }
  }

  /**
   * Wysyłanie przypomnień o treningach
   * Uruchamiane w określonych godzinach
   */
  async sendTrainingReminders() {
    try {
      logger.debug('Sending training reminders...');
      
      // Logika znajdowania użytkowników z zaplanowanymi treningami na dziś
      // i wysyłania im przypomnień
      
      const User = require('../models/user.model');
      const TrainingPlan = require('../models/training-plan.model');
      
      // Znajdź użytkowników z aktywniejszymi planami treningowymi
      const usersWithPlans = await User.find({
        // Kryteria filtrowania użytkowników
      }).populate('currentTrainingPlan');

      let remindersSent = 0;

      for (const user of usersWithPlans) {
        try {
          // Sprawdź czy użytkownik ma trening zaplanowany na dziś
          const hasTodayTraining = await this.checkTodayTraining(user);
          
          if (hasTodayTraining) {
            await this.notificationService.sendNotification({
              userId: user._id,
              type: 'training_reminder',
              data: {
                userName: user.name,
                trainingType: 'Dzisiejszy trening',
                time: '60 minut'
              },
              options: {
                priority: 'high'
              }
            });
            
            remindersSent++;
          }
        } catch (error) {
          logger.error(`Failed to send training reminder to user ${user._id}:`, error);
        }
      }

      if (remindersSent > 0) {
        logger.info(`Sent ${remindersSent} training reminders`);
      }

    } catch (error) {
      logger.error('Failed to send training reminders:', error);
    }
  }

  /**
   * Sprawdzenie czy użytkownik ma trening na dziś
   */
  async checkTodayTraining(user) {
    // Implementacja sprawdzenia czy użytkownik ma zaplanowany trening na dziś
    // To zależy od struktury planów treningowych w systemie
    return false; // Placeholder
  }

  /**
   * Pobranie statystyk job-a
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      uptime: this.lastRunTime ? Date.now() - this.lastRunTime.getTime() : 0
    };
  }

  /**
   * Restart job-a (na potrzeby debugowania)
   */
  restart() {
    logger.info('Restarting notification processor job...');
    
    // Reset statystyk
    this.processedCount = 0;
    this.errorCount = 0;
    this.lastRunTime = null;
    this.isRunning = false;
    
    logger.info('Notification processor job restarted');
  }
}

// Eksport instancji job-a
const notificationProcessorJob = new NotificationProcessorJob();

module.exports = notificationProcessorJob; 