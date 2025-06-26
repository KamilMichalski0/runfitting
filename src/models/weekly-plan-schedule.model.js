const mongoose = require('mongoose');

/**
 * Model harmonogramu dostarczania planów tygodniowych
 * Przechowuje informacje o cyklicznym generowaniu planów dla użytkowników
 */
const weeklyPlanScheduleSchema = new mongoose.Schema({
  // Podstawowe informacje
  userId: {
    type: String,
    required: [true, 'ID użytkownika jest wymagane'],
    index: true
  },
  
  // Dane profilu użytkownika dla generowania planów
  userProfile: {
    name: {
      type: String,
      required: [true, 'Imię użytkownika jest wymagane']
    },
    age: {
      type: Number,
      required: [true, 'Wiek jest wymagany'],
      min: [10, 'Wiek musi być większy niż 10'],
      max: [100, 'Wiek musi być mniejszy niż 100']
    },
    level: {
      type: String,
      required: [true, 'Poziom zaawansowania jest wymagany'],
      enum: ['początkujący', 'średnio-zaawansowany', 'zaawansowany']
    },
    goal: {
      type: String,
      required: [true, 'Cel treningowy jest wymagany']
    },
    daysPerWeek: {
      type: Number,
      required: [true, 'Liczba dni treningowych w tygodniu jest wymagana'],
      min: [1, 'Minimum 1 dzień treningowy'],
      max: [7, 'Maksimum 7 dni treningowych']
    },
    weeklyDistance: {
      type: Number,
      required: [true, 'Tygodniowy dystans jest wymagany'],
      min: [0, 'Tygodniowy dystans nie może być ujemny']
    },
    hasInjuries: {
      type: Boolean,
      default: false
    },
    heartRate: Number,
    description: String
  },
  
  // Konfiguracja harmonogramu
  deliveryFrequency: {
    type: String,
    required: [true, 'Częstotliwość dostarczania jest wymagana'],
    enum: ['weekly', 'biweekly'], // co tydzień lub co 2 tygodnie
    default: 'weekly'
  },
  
  deliveryDay: {
    type: String,
    required: [true, 'Dzień dostarczania jest wymagany'],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    default: 'sunday' // domyślnie w niedzielę dostarcza plan na kolejny tydzień
  },
  
  deliveryTime: {
    type: String,
    required: [true, 'Godzina dostarczania jest wymagana'],
    default: '18:00' // 18:00 w strefie czasowej użytkownika
  },
  
  timezone: {
    type: String,
    required: [true, 'Strefa czasowa jest wymagana'],
    default: 'Europe/Warsaw'
  },
  
  // Status harmonogramu
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Historia dostarczania
  lastDeliveryDate: {
    type: Date,
    default: null
  },
  
  nextDeliveryDate: {
    type: Date,
    required: [true, 'Data następnego dostarczania jest wymagana']
  },
  
  // Statystyki progresji
  progressTracking: {
    weekNumber: {
      type: Number,
      default: 1
    },
    totalWeeksDelivered: {
      type: Number,
      default: 0
    },
    currentPhase: {
      type: String,
      enum: ['base', 'build', 'peak', 'recovery'],
      default: 'base'
    },
    lastWeeklyDistance: {
      type: Number,
      default: 0
    },
    progressionRate: {
      type: Number,
      default: 1.05 // 5% wzrost tygodniowo jako domyślny
    }
  },
  
  // Kontekst długoterminowy
  longTermGoal: {
    targetEvent: String,
    targetDate: Date,
    targetTime: String,
    remainingWeeks: Number
  },
  
  // Konfiguracja dostosowań
  adaptationSettings: {
    allowAutoAdjustments: {
      type: Boolean,
      default: true
    },
    maxWeeklyIncrease: {
      type: Number,
      default: 0.1 // maksymalny 10% wzrost tygodniowo
    },
    minRecoveryWeeks: {
      type: Number,
      default: 4 // co 4 tygodnie tydzień regeneracyjny
    }
  },
  
  // Ostatnie generowane plany (cache)
  recentPlans: [{
    weekNumber: Number,
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingPlan'
    },
    deliveryDate: Date,
    wasCompleted: {
      type: Boolean,
      default: false
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  }],
  
  // Notatki i feedback
  notes: String,
  pausedUntil: Date, // możliwość wstrzymania na określony czas
  
}, {
  timestamps: true
});

// Indeksy dla optymalizacji
weeklyPlanScheduleSchema.index({ userId: 1, isActive: 1 });
weeklyPlanScheduleSchema.index({ nextDeliveryDate: 1, isActive: 1 });
weeklyPlanScheduleSchema.index({ deliveryDay: 1, deliveryTime: 1, isActive: 1 });

// Metoda do obliczenia następnej daty dostarczania
weeklyPlanScheduleSchema.methods.calculateNextDeliveryDate = function() {
  const now = new Date();
  const daysMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
  const targetDay = daysMap[this.deliveryDay];
  const [hours, minutes] = this.deliveryTime.split(':').map(Number);
  
  // Znajdź następny dzień dostarczania
  let nextDelivery = new Date();
  nextDelivery.setHours(hours, minutes, 0, 0);
  
  // Oblicz ile dni do następnego dnia dostarczania
  let daysUntilTarget = (targetDay - nextDelivery.getDay() + 7) % 7;
  
  // Jeśli dzisiaj jest dzień dostarczania ale godzina już minęła
  if (daysUntilTarget === 0 && nextDelivery <= now) {
    daysUntilTarget = this.deliveryFrequency === 'weekly' ? 7 : 14;
  }
  
  // Jeśli dostarczanie co 2 tygodnie i nie jest to właściwy tydzień
  if (this.deliveryFrequency === 'biweekly' && daysUntilTarget < 14) {
    daysUntilTarget += 7;
  }
  
  nextDelivery.setDate(nextDelivery.getDate() + daysUntilTarget);
  
  this.nextDeliveryDate = nextDelivery;
  return nextDelivery;
};

// Metoda do aktualizacji progresji
weeklyPlanScheduleSchema.methods.updateProgress = function(weeklyData) {
  this.progressTracking.weekNumber += 1;
  this.progressTracking.totalWeeksDelivered += 1;
  this.lastDeliveryDate = new Date();
  
  if (weeklyData) {
    this.progressTracking.lastWeeklyDistance = weeklyData.completedDistance || 0;
    
    // Automatyczne dostosowanie tempa progresji na podstawie ukończenia
    if (weeklyData.completionRate) {
      if (weeklyData.completionRate > 0.8) {
        // Wysoka realizacja - można zwiększyć tempo
        this.progressTracking.progressionRate = Math.min(1.1, this.progressTracking.progressionRate + 0.01);
      } else if (weeklyData.completionRate < 0.6) {
        // Niska realizacja - zmniejsz tempo
        this.progressTracking.progressionRate = Math.max(0.95, this.progressTracking.progressionRate - 0.02);
      }
    }
  }
  
  // Automatyczne przejście faz treningowych
  const weeksInPhase = 4;
  if (this.progressTracking.weekNumber % weeksInPhase === 0) {
    const phases = ['base', 'build', 'peak', 'recovery'];
    const currentIndex = phases.indexOf(this.progressTracking.currentPhase);
    this.progressTracking.currentPhase = phases[(currentIndex + 1) % phases.length];
  }
  
  // Oblicz następną datę dostarczania
  this.calculateNextDeliveryDate();
};

// Metoda sprawdzająca czy harmonogram wymaga dostarczania
weeklyPlanScheduleSchema.methods.needsDelivery = function() {
  if (!this.isActive || this.pausedUntil > new Date()) {
    return false;
  }
  
  return new Date() >= this.nextDeliveryDate;
};

// Statyczna metoda do znajdowania harmonogramów wymagających dostarczania
weeklyPlanScheduleSchema.statics.findDueForDelivery = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    nextDeliveryDate: { $lte: now },
    $or: [
      { pausedUntil: { $exists: false } },
      { pausedUntil: { $lte: now } }
    ]
  });
};

const WeeklyPlanSchedule = mongoose.model('WeeklyPlanSchedule', weeklyPlanScheduleSchema);

module.exports = WeeklyPlanSchedule; 