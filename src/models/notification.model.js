const mongoose = require('mongoose');

/**
 * Schema powiadomienia
 * Przechowuje historię wszystkich wysłanych powiadomień
 */
const notificationSchema = new mongoose.Schema({
  // ID użytkownika, do którego wysłano powiadomienie
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID użytkownika jest wymagane'],
    index: true
  },
  // Typ powiadomienia
  type: {
    type: String,
    enum: [
      'training_reminder',
      'motivational_message', 
      'progress_report',
      'system_notification',
      'achievement',
      'plan_update',
      'subscription_reminder',
      'welcome_message'
    ],
    required: [true, 'Typ powiadomienia jest wymagany']
  },
  // Kanał przez który wysłano powiadomienie
  channel: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: [true, 'Kanał powiadomienia jest wymagany']
  },
  // Status powiadomienia
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'clicked', 'opened'],
    default: 'pending',
    index: true
  },
  // Priorytet powiadomienia
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Zawartość powiadomienia
  content: {
    // Tytuł powiadomienia
    title: {
      type: String,
      required: [true, 'Tytuł powiadomienia jest wymagany'],
      maxlength: [200, 'Tytuł nie może przekraczać 200 znaków']
    },
    // Treść powiadomienia
    body: {
      type: String,
      required: [true, 'Treść powiadomienia jest wymagana'],
      maxlength: [2000, 'Treść nie może przekraczać 2000 znaków']
    },
    // Dodatkowe dane dla różnych kanałów
    metadata: {
      // Dla email
      htmlBody: String,
      subject: String,
      fromEmail: String,
      // Dla SMS
      smsBody: String,
      // Dla push notifications
      icon: String,
      image: String,
      badge: String,
      actions: [{
        action: String,
        title: String,
        icon: String
      }],
      // Dane kontekstowe
      trainingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingPlan'
      },
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingPlan'
      },
      achievementId: String,
      actionUrl: String
    }
  },
  // Dane docelowe dla różnych kanałów
  targetData: {
    // Dla email
    email: String,
    // Dla SMS
    phoneNumber: String,
    // Dla push notifications
    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    }
  },
  // Dane o próbach wysłania
  attempts: [{
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true
    },
    error: {
      code: String,
      message: String,
      details: mongoose.Schema.Types.Mixed
    },
    externalId: String, // ID z zewnętrznych serwisów (Twilio, SendGrid, etc.)
    responseData: mongoose.Schema.Types.Mixed
  }],
  // Dane dotyczące dostarczenia
  deliveryData: {
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    bouncedAt: Date,
    failedAt: Date,
    externalId: String,
    providerResponse: mongoose.Schema.Types.Mixed
  },
  // Zaplanowany czas wysłania
  scheduledFor: {
    type: Date,
    index: true
  },
  // Czy powiadomienie ma być wysłane tylko raz
  isOneTime: {
    type: Boolean,
    default: true
  },
  // Czy powiadomienie wygasa
  expiresAt: {
    type: Date,
    index: true
  },
  // Kategoria powiadomienia dla grupowania
  category: {
    type: String,
    enum: ['reminder', 'marketing', 'transactional', 'system'],
    default: 'system'
  },
  // Segmentacja użytkowników
  userSegment: {
    type: String,
    enum: ['all', 'premium', 'free', 'inactive', 'new_users', 'returning_users']
  },
  // Konfiguracja dla A/B testów
  abTestVariant: {
    testId: String,
    variant: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indeksy złożone dla optymalizacji zapytań
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ type: 1, scheduledFor: 1 });
notificationSchema.index({ channel: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtualne pole - czy powiadomienie jest aktywne
notificationSchema.virtual('isActive').get(function() {
  return this.status !== 'failed' && 
         this.status !== 'bounced' && 
         (!this.expiresAt || this.expiresAt > new Date());
});

// Virtualne pole - czas od wysłania
notificationSchema.virtual('timeSinceSent').get(function() {
  if (!this.deliveryData?.sentAt) return null;
  return Date.now() - this.deliveryData.sentAt.getTime();
});

// Metoda instancji - oznacz jako wysłane
notificationSchema.methods.markAsSent = function(externalId, responseData) {
  this.status = 'sent';
  this.deliveryData.sentAt = new Date();
  if (externalId) this.deliveryData.externalId = externalId;
  if (responseData) this.deliveryData.providerResponse = responseData;
  return this.save();
};

// Metoda instancji - oznacz jako dostarczone
notificationSchema.methods.markAsDelivered = function(deliveredAt) {
  this.status = 'delivered';
  this.deliveryData.deliveredAt = deliveredAt || new Date();
  return this.save();
};

// Metoda instancji - oznacz jako otwarte
notificationSchema.methods.markAsOpened = function(openedAt) {
  this.status = 'opened';
  this.deliveryData.openedAt = openedAt || new Date();
  return this.save();
};

// Metoda instancji - oznacz jako kliknięte
notificationSchema.methods.markAsClicked = function(clickedAt) {
  this.status = 'clicked';
  this.deliveryData.clickedAt = clickedAt || new Date();
  return this.save();
};

// Metoda instancji - oznacz jako nieudane
notificationSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.deliveryData.failedAt = new Date();
  
  // Dodaj próbę do historii
  this.attempts.push({
    status: 'failed',
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error.details || error
    }
  });
  
  return this.save();
};

// Metoda instancji - dodaj próbę wysłania
notificationSchema.methods.addAttempt = function(status, error, externalId, responseData) {
  this.attempts.push({
    status,
    error,
    externalId,
    responseData
  });
  return this.save();
};

// Metoda statyczna - znajdź powiadomienia do wysłania
notificationSchema.statics.findPendingNotifications = function(limit = 100) {
  return this.find({
    status: 'pending',
    $or: [
      { scheduledFor: { $lte: new Date() } },
      { scheduledFor: { $exists: false } }
    ],
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } }
    ]
  })
  .populate('userId', 'name email phoneNumber notificationPreferences')
  .limit(limit)
  .sort({ priority: -1, scheduledFor: 1 });
};

// Metoda statyczna - statystyki powiadomień dla użytkownika
notificationSchema.statics.getUserNotificationStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
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
};

// Middleware - walidacja przed zapisem
notificationSchema.pre('save', function(next) {
  // Sprawdź czy target data są zgodne z kanałem
  if (this.channel === 'email' && !this.targetData.email) {
    return next(new Error('Email jest wymagany dla kanału email'));
  }
  if (this.channel === 'sms' && !this.targetData.phoneNumber) {
    return next(new Error('Numer telefonu jest wymagany dla kanału SMS'));
  }
  if (this.channel === 'push' && !this.targetData.pushSubscription) {
    return next(new Error('Push subscription jest wymagana dla kanału push'));
  }
  
  // Ustaw domyślny scheduledFor jeśli nie ustawiony
  if (!this.scheduledFor) {
    this.scheduledFor = new Date();
  }
  
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 