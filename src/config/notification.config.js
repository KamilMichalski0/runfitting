/**
 * Konfiguracja systemu powiadomień RunFitting
 * Zawiera ustawienia dla wszystkich kanałów komunikacji
 */

const notificationConfig = {
  // Konfiguracja email (AWS SES)
  email: {
    // Konfiguracja AWS SES
    ses: {
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      // Konfiguracja rate limitingu SES
      rateLimit: {
        maxSendRate: 14, // maksymalna liczba emaili na sekundę
        maxBurstSize: 5  // maksymalny burst size
      }
    },

    // Domyślne ustawienia wiadomości
    defaults: {
      from: process.env.EMAIL_FROM || 'RunFitting <noreply@runfitting.com>',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@runfitting.com'
    },

    // Szablony email
    templates: {
      basePath: 'src/templates/email/',
      defaultLanguage: 'pl',
      subjects: {
        training_reminder: 'Przypomnienie o treningu - RunFitting',
        motivational_message: 'Motywacja na dziś - RunFitting',
        progress_report: 'Twój raport postępów - RunFitting',
        system_notification: 'Ważna informacja - RunFitting',
        achievement: 'Gratulacje! Nowe osiągnięcie - RunFitting',
        plan_update: 'Aktualizacja planu treningowego - RunFitting',
        subscription_reminder: 'Informacja o subskrypcji - RunFitting',
        welcome_message: 'Witamy w RunFitting!'
      }
    },
    // Limity wysyłania
    limits: {
      dailyLimit: 1000, // maksymalnie 1000 emaili dziennie
      hourlyLimit: 100, // maksymalnie 100 emaili na godzinę
      perUserDailyLimit: 10 // maksymalnie 10 emaili na użytkownika dziennie
    }
  },

  // Konfiguracja SMS (Twilio)
  sms: {
    provider: 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      fromNumber: process.env.TWILIO_FROM_NUMBER
    },
    // Szablony SMS
    templates: {
      maxLength: 160, // standardowa długość SMS
      defaultLanguage: 'pl',
      messages: {
        training_reminder: 'Przypomnienie: Za {time} masz zaplanowany trening {type}. Powodzenia! 💪',
        motivational_message: 'Każdy dzień to nowa szansa na poprawę! Twój plan treningowy czeka. 🏃‍♀️',
        achievement: 'Brawo! Właśnie osiągnąłeś cel: {achievement}. Jesteś niesamowity! 🎉',
        system_notification: '{message}'
      }
    },
    // Limity wysyłania
    limits: {
      dailyLimit: 100, // maksymalnie 100 SMS dziennie
      hourlyLimit: 20, // maksymalnie 20 SMS na godzinę
      perUserDailyLimit: 5 // maksymalnie 5 SMS na użytkownika dziennie
    }
  },

  // Konfiguracja Push Notifications (Web Push)
  push: {
    vapid: {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject: process.env.VAPID_SUBJECT || 'mailto:support@runfitting.com'
    },
    // Domyślne opcje push notifications
    defaults: {
      icon: '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      image: '/icons/notification-image.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ttl: 86400 // 24 godziny
    },
    // Szablony push notifications
    templates: {
      defaultLanguage: 'pl',
      maxTitleLength: 65,
      maxBodyLength: 180,
      notifications: {
        training_reminder: {
          title: 'Czas na trening! 🏃‍♀️',
          body: 'Za {time} masz zaplanowany trening {type}. Gotowy?',
          actions: [
            {
              action: 'view_training',
              title: 'Zobacz trening',
              icon: '/icons/view-icon.png'
            },
            {
              action: 'postpone',
              title: 'Przypomnij później',
              icon: '/icons/postpone-icon.png'
            }
          ]
        },
        motivational_message: {
          title: 'Motywacja na dziś 💪',
          body: '{message}',
          actions: [
            {
              action: 'open_app',
              title: 'Otwórz aplikację',
              icon: '/icons/app-icon.png'
            }
          ]
        },
        progress_report: {
          title: 'Twój tygodniowy raport 📊',
          body: 'Zobacz jak się rozwijasz! {summary}',
          actions: [
            {
              action: 'view_report',
              title: 'Zobacz raport',
              icon: '/icons/report-icon.png'
            }
          ]
        },
        system_notification: {
          title: 'RunFitting',
          body: '{message}',
          actions: [
            {
              action: 'open_app',
              title: 'Otwórz aplikację',
              icon: '/icons/app-icon.png'
            }
          ]
        },
        achievement: {
          title: 'Nowe osiągnięcie! 🎉',
          body: 'Gratulacje! {achievement}',
          actions: [
            {
              action: 'view_achievements',
              title: 'Zobacz osiągnięcia',
              icon: '/icons/trophy-icon.png'
            },
            {
              action: 'share',
              title: 'Udostępnij',
              icon: '/icons/share-icon.png'
            }
          ]
        }
      }
    },
    // Limity wysyłania
    limits: {
      dailyLimit: 2000, // maksymalnie 2000 push notifications dziennie
      hourlyLimit: 200, // maksymalnie 200 push notifications na godzinę
      perUserDailyLimit: 20 // maksymalnie 20 push notifications na użytkownika dziennie
    }
  },

  // Globalne ustawienia systemu powiadomień
  global: {
    // Tryb debugowania
    debug: process.env.NODE_ENV === 'development',
    
    // Retry policy - polityka ponawiania
    retryPolicy: {
      maxAttempts: 3,
      retryDelays: [1000, 5000, 15000], // ms between retries
      exponentialBackoff: true
    },
    
    // Timeout dla różnych operacji
    timeouts: {
      email: 30000, // 30 sekund
      sms: 15000,   // 15 sekund
      push: 10000   // 10 sekund
    },
    
    // Ustawienia kolejek
    queues: {
      // Priorytety
      priorities: {
        urgent: 10,
        high: 7,
        normal: 5,
        low: 2
      },
      // Batch processing
      batchSizes: {
        email: 50,
        sms: 20,
        push: 100
      },
      // Interwały procesowania
      processingIntervals: {
        immediate: 1000,  // 1 sekunda
        normal: 30000,    // 30 sekund
        low: 300000       // 5 minut
      }
    },
    
    // Analityka i tracking
    analytics: {
      enabled: true,
      trackOpens: true,
      trackClicks: true,
      trackDelivery: true,
      retentionDays: 90 // ile dni przechowywać dane analityczne
    },
    
    // Wyciszenia globalne
    globalQuietHours: {
      enabled: true,
      start: { hour: 22, minute: 0 },
      end: { hour: 7, minute: 0 },
      timezone: 'Europe/Warsaw'
    },
    
    // A/B Testing
    abTesting: {
      enabled: process.env.AB_TESTING_ENABLED === 'true',
      defaultSplitRatio: 0.5 // 50/50 split
    },
    
    // Personalizacja
    personalization: {
      enabled: true,
      useAI: process.env.PERSONALIZATION_AI === 'true',
      maxPersonalizedMessagesPerDay: 5
    }
  },

  // Definicje typów powiadomień
  notificationTypes: {
    training_reminder: {
      category: 'reminder',
      priority: 'high',
      channels: ['push', 'email'],
      scheduling: {
        defaultTime: 60, // minuty przed treningiem
        allowCustomTime: true,
        minTime: 5,      // minimum 5 minut przed
        maxTime: 1440    // maksimum 24 godziny przed
      }
    },
    motivational_message: {
      category: 'marketing',
      priority: 'normal',
      channels: ['push', 'sms'],
      scheduling: {
        frequencies: ['daily', 'weekly', 'never']
      }
    },
    progress_report: {
      category: 'transactional',
      priority: 'normal',
      channels: ['email', 'push'],
      scheduling: {
        frequencies: ['weekly', 'monthly', 'never'],
        preferredDay: 'sunday',
        preferredHour: 18
      }
    },
    system_notification: {
      category: 'system',
      priority: 'high',
      channels: ['email', 'push'],
      scheduling: {
        immediate: true
      }
    },
    achievement: {
      category: 'transactional',
      priority: 'high',
      channels: ['push', 'email'],
      scheduling: {
        immediate: true,
        allowDelay: false
      }
    },
    plan_update: {
      category: 'transactional',
      priority: 'normal',
      channels: ['push', 'email'],
      scheduling: {
        immediate: false,
        delay: 300000 // 5 minut delay
      }
    },
    subscription_reminder: {
      category: 'transactional',
      priority: 'high',
      channels: ['email', 'push'],
      scheduling: {
        daysBeforeExpiry: [7, 3, 1] // przypomnienia 7, 3 i 1 dzień przed wygaśnięciem
      }
    },
    welcome_message: {
      category: 'transactional',
      priority: 'normal',
      channels: ['email', 'push'],
      scheduling: {
        delay: 300000 // 5 minut po rejestracji
      }
    }
  }
};

// Walidacja konfiguracji
const validateConfig = () => {
  const errors = [];
  
  // Sprawdź wymagane zmienne środowiskowe
  const requiredEnvVars = [
    'SMTP_USER',
    'SMTP_PASS',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY'
  ];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Sprawdź konfigurację Twilio jeśli SMS jest włączony
  if (notificationConfig.sms.twilio.accountSid) {
    if (!notificationConfig.sms.twilio.authToken) {
      errors.push('TWILIO_AUTH_TOKEN is required when TWILIO_ACCOUNT_SID is provided');
    }
  }
  
  if (errors.length > 0) {
    console.warn('Notification configuration warnings:', errors);
  }
  
  return errors.length === 0;
};

// Funkcja do pobierania konfiguracji dla konkretnego kanału
const getChannelConfig = (channel) => {
  return notificationConfig[channel] || null;
};

// Funkcja do pobierania konfiguracji dla konkretnego typu powiadomienia
const getNotificationTypeConfig = (type) => {
  return notificationConfig.notificationTypes[type] || null;
};

module.exports = {
  notificationConfig,
  validateConfig,
  getChannelConfig,
  getNotificationTypeConfig
}; 