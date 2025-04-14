const mongoose = require('mongoose');

const trainingDaySchema = new mongoose.Schema({
  // Powiązania
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingPlan',
    required: [true, 'Dzień treningowy musi być przypisany do planu']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dzień treningowy musi być przypisany do użytkownika']
  },
  
  // Informacje o dniu
  date: {
    type: Date,
    required: [true, 'Data treningu jest wymagana']
  },
  dayOfWeek: {
    type: Number, // 0-6 (niedziela-sobota)
    required: [true, 'Dzień tygodnia jest wymagany']
  },
  weekNumber: {
    type: Number,
    required: [true, 'Numer tygodnia jest wymagany']
  },
  
  // Typ treningu
  type: {
    type: String,
    enum: ['easy', 'tempo', 'intervals', 'long', 'rest', 'cross_training', 'hills', 'fartlek', 'recovery'],
    required: [true, 'Typ treningu jest wymagany']
  },
  
  // Parametry treningu
  plannedDistance: {
    type: Number,  // w kilometrach
    min: [0, 'Dystans nie może być ujemny']
  },
  plannedDuration: {
    type: Number,  // w minutach
    min: [0, 'Czas nie może być ujemny']
  },
  plannedPace: {
    type: Number,  // czas na kilometr w sekundach
    min: [0, 'Tempo nie może być ujemne']
  },
  targetHeartRateZone: {
    min: {
      type: Number,
      min: [40, 'Minimalne tętno nie może być niższe niż 40']
    },
    max: {
      type: Number,
      max: [220, 'Maksymalne tętno nie może być wyższe niż 220']
    }
  },
  
  // Szczegóły treningu
  title: {
    type: String,
    required: [true, 'Tytuł treningu jest wymagany'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Opis treningu jest wymagany'],
    trim: true
  },
  
  // Szczegóły treningu interwałowego lub tempa
  intervals: [{
    distance: Number,  // w metrach
    duration: Number,  // w sekundach
    pace: Number,      // czas na kilometr w sekundach
    restDuration: Number, // czas odpoczynku w sekundach
    heartRateZone: {
      min: Number,
      max: Number
    },
    description: String
  }],
  
  // Ćwiczenia wspomagające
  supportingExercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise'
    },
    sets: Number,
    reps: Number,
    duration: Number,  // w sekundach
    notes: String
  }],
  
  // Dane po wykonaniu treningu
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  actualDistance: Number,  // w kilometrach
  actualDuration: Number,  // w minutach
  actualPace: Number,      // czas na kilometr w sekundach
  avgHeartRate: Number,
  perceivedEffort: {
    type: Number,
    min: [1, 'Wartość musi być od 1 do 10'],
    max: [10, 'Wartość musi być od 1 do 10']
  },
  
  // Dane z urządzenia
  gpxData: String,
  splits: [{
    distance: Number,  // w kilometrach
    duration: Number,  // w sekundach
    pace: Number,      // czas na kilometr w sekundach
    heartRate: Number  // uderzenia na minutę
  }],
  
  // Dodatkowe informacje
  notes: String,
  userFeedback: String,
  
  // Status
  status: {
    type: String,
    enum: ['planned', 'completed', 'missed', 'rescheduled'],
    default: 'planned'
  },
  
  isKeyWorkout: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware aktualizacji pola updatedAt przy każdej modyfikacji
trainingDaySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware po zapisie - aktualizacja statystyk planu
trainingDaySchema.post('save', async function() {
  try {
    const TrainingPlan = mongoose.model('TrainingPlan');
    const plan = await TrainingPlan.findById(this.plan);
    if (plan) {
      await plan.updateStats();
      await plan.save();
    }
  } catch (err) {
    console.error('Błąd podczas aktualizacji statystyk planu:', err);
  }
});

// Wirtualne pole do obliczania stosunku wykonanego dystansu do planowanego
trainingDaySchema.virtual('distanceCompletion').get(function() {
  if (!this.plannedDistance || !this.actualDistance) return 0;
  return Math.round((this.actualDistance / this.plannedDistance) * 100);
});

// Metoda instancji do oznaczenia treningu jako ukończony
trainingDaySchema.methods.completeWorkout = function(completionData) {
  this.isCompleted = true;
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Aktualizacja danych o wykonanym treningu
  if (completionData) {
    this.actualDistance = completionData.distance || this.plannedDistance;
    this.actualDuration = completionData.duration || this.plannedDuration;
    this.actualPace = completionData.pace || this.plannedPace;
    this.avgHeartRate = completionData.avgHeartRate;
    this.perceivedEffort = completionData.perceivedEffort;
    this.userFeedback = completionData.feedback;
    this.splits = completionData.splits || [];
    this.gpxData = completionData.gpxData;
  }
  
  return this;
};

// Metoda instancji do oznaczenia treningu jako opuszczony
trainingDaySchema.methods.missWorkout = function(reason) {
  this.status = 'missed';
  this.userFeedback = reason;
  return this;
};

// Metoda statyczna do wyszukiwania treningów na dany dzień
trainingDaySchema.statics.findByDate = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({ 
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).populate('supportingExercises.exercise');
};

const TrainingDay = mongoose.model('TrainingDay', trainingDaySchema);

module.exports = TrainingDay; 