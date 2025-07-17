const mongoose = require('mongoose');

/**
 * Schema użytkownika aplikacji
 */
const userSchema = new mongoose.Schema({
  supabaseId: {
    type: String,
    required: [true, 'Identyfikator Supabase jest wymagany.'],
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Imię jest wymagane'],
    trim: true,
    minlength: [2, 'Imię musi mieć co najmniej 2 znaki']
  },
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Proszę podać prawidłowy adres email']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'coach'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  // --- Pola subskrypcji i Stripe ---
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  subscriptionValidUntil: {
    type: Date
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true, // Umożliwia wiele null, ale unikalne wartości, gdy istnieją
    index: true
  },
  stripeSubscriptionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  monthlyModificationsUsed: {
    daily: {
      type: Number,
      default: 0
    },
    weekly: {
      type: Number,
      default: 0
    }
  },
  freemiumModificationUsed: {
    type: Boolean,
    default: false
  },
  modificationCountersResetDate: {
    type: Date
  },
  // --- Koniec pól subskrypcji i Stripe ---
  hasFilledRunningForm: { // Nowe pole
    type: Boolean,
    default: false
  },
  // Dane profilowe użytkownika
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  age: {
    type: Number,
    min: [15, 'Wiek musi być co najmniej 15 lat'],
    max: [120, 'Wiek nie może przekraczać 120 lat']
  },
  weight: {
    type: Number,
    min: [30, 'Waga musi być co najmniej 30 kg'],
    max: [300, 'Waga nie może przekraczać 300 kg']
  },
  height: {
    type: Number,
    min: [100, 'Wzrost musi być co najmniej 100 cm'],
    max: [250, 'Wzrost nie może przekraczać 250 cm']
  },
  phoneNumber: {
    type: String,
    trim: true,
    // Można dodać walidację formatu numeru telefonu, jeśli jest potrzebna
    // match: [/^[+]?[0-9]{9,15}$/, 'Proszę podać prawidłowy numer telefonu']
  },
  waistCircumference: {
    type: Number,
    min: [30, 'Obwód talii musi wynosić co najmniej 30 cm'],
    max: [200, 'Obwód talii nie może przekraczać 200 cm']
  },
  restingHeartRate: {
    type: Number,
    min: [30, 'Tętno spoczynkowe musi być co najmniej 30 uderzeń na minutę'],
    max: [100, 'Tętno spoczynkowe nie może przekraczać 100 uderzeń na minutę']
  },
  maxHeartRate: { // Dodane z formularza
    type: Number,
    min: [100, 'Tętno maksymalne musi być co najmniej 100 uderzeń na minutę'],
    max: [250, 'Tętno maksymalne nie może przekraczać 250 uderzeń na minutę']
  },
  experienceLevel: { // Dodane z formularza (poziomZaawansowania)
    type: String,
    enum: ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany']
  },
  currentActivityLevel: { // Dodane z formularza (obecnaAktywnosc)
    type: String,
    enum: ['siedzacy', 'lekko_aktywny', 'umiarkowanie_aktywny', 'aktywny']
  },
  chronotype: { // Dodane z formularza
    type: String,
    enum: ['ranny_ptaszek', 'nocny_marek', 'posredni']
  },
  preferredTrainingTime: { // Dodane z formularza
    type: String,
    enum: ['rano', 'poludnie', 'wieczor', 'dowolnie']
  },
  availableEquipment: [{ // Dodane z formularza
    type: String
  }],
  hasCurrentInjuries: { // Dodane z formularza (kontuzje)
    type: Boolean,
    default: false
  },
  hasHealthRestrictions: { // Dodane z formularza (ograniczeniaZdrowotne)
    type: Boolean,
    default: false
  },
  hasAllergies: { // Dodane z formularza (alergie)
    type: Boolean,
    default: false
  },
  mainFitnessGoal: { // Dodane z formularza (glownyCel)
    type: String,
    enum: [
      'redukcja_masy_ciala',
      'przebiegniecie_dystansu',
      'zaczac_biegac',
      'aktywny_tryb_zycia',
      'zmiana_nawykow',
      'powrot_po_kontuzji',
      'poprawa_kondycji',
      'inny_cel',
    ]
  },
  // Cele treningowe
  fitnessGoals: [{
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness']
  }],
  // Statystyki treningowe
  totalWorkouts: {
    type: Number,
    default: 0
  },
  totalDistance: {
    type: Number,
    default: 0 // w metrach
  },
  totalDuration: {
    type: Number,
    default: 0 // w sekundach
  },
  totalCaloriesBurned: {
    type: Number,
    default: 0
  },
  // Preferencje powiadomień
  notificationPreferences: {
    // Kanały powiadomień
    channels: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        verified: {
          type: Boolean,
          default: false
        }
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false
        },
        verified: {
          type: Boolean,
          default: false
        }
      },
      push: {
        enabled: {
          type: Boolean,
          default: true
        },
        subscriptions: [{
          endpoint: String,
          keys: {
            p256dh: String,
            auth: String
          },
          deviceInfo: {
            userAgent: String,
            platform: String
          },
          createdAt: {
            type: Date,
            default: Date.now
          }
        }]
      }
    },
    // Typy powiadomień
    types: {
      trainingReminders: {
        enabled: {
          type: Boolean,
          default: true
        },
        channels: [{
          type: String,
          enum: ['email', 'sms', 'push'],
          default: 'push'
        }],
        timing: {
          beforeTraining: {
            type: Number,
            default: 60 // minuty przed treningiem
          }
        }
      },
      motivationalMessages: {
        enabled: {
          type: Boolean,
          default: true
        },
        channels: [{
          type: String,
          enum: ['email', 'sms', 'push'],
          default: 'push'
        }],
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'never'],
          default: 'weekly'
        }
      },
      progressReports: {
        enabled: {
          type: Boolean,
          default: true
        },
        channels: [{
          type: String,
          enum: ['email', 'sms', 'push'],
          default: 'email'
        }],
        frequency: {
          type: String,
          enum: ['weekly', 'monthly', 'never'],
          default: 'weekly'
        }
      },
      systemNotifications: {
        enabled: {
          type: Boolean,
          default: true
        },
        channels: [{
          type: String,
          enum: ['email', 'sms', 'push'],
          default: 'email'
        }]
      },
      achievements: {
        enabled: {
          type: Boolean,
          default: true
        },
        channels: [{
          type: String,
          enum: ['email', 'sms', 'push'],
          default: 'push'
        }]
      }
    },
    // Czas preferowanych powiadomień
    preferredTimes: {
      morning: {
        hour: {
          type: Number,
          min: 0,
          max: 23,
          default: 8
        },
        minute: {
          type: Number,
          min: 0,
          max: 59,
          default: 0
        }
      },
      evening: {
        hour: {
          type: Number,
          min: 0,
          max: 23,
          default: 18
        },
        minute: {
          type: Number,
          min: 0,
          max: 59,
          default: 0
        }
      }
    },
    // Strefa czasowa użytkownika
    timezone: {
      type: String,
      default: 'Europe/Warsaw'
    }
  },
  // Wyciszenia powiadomień (Do Not Disturb)
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
        default: 22
      },
      minute: {
        type: Number,
        min: 0,
        max: 59,
        default: 0
      }
    },
    end: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
        default: 7
      },
      minute: {
        type: Number,
        min: 0,
        max: 59,
        default: 0
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtualne pole - BMI (Body Mass Index)
userSchema.virtual('bmi').get(function() {
  if (!this.weight || !this.height) return null;
  // BMI = waga(kg) / (wzrost(m) * wzrost(m))
  const heightInMeters = this.height / 100;
  return (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
});

// Middleware - przed wykonaniem find - nie pokazuj nieaktywnych użytkowników
userSchema.pre(/^find/, function(next) {
  // this odnosi się do aktualnego zapytania
  this.find({ active: { $ne: false } });
  next();
});

// Utworzenie modelu z schematu
const User = mongoose.model('User', userSchema);

module.exports = User; 