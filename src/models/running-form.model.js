const mongoose = require('mongoose');

/**
 * Schema formularza biegowego
 */
const runningFormSchema = new mongoose.Schema({
  // Sekcja 0 - Dane podstawowe (wymagane)
  firstName: {
    type: String,
    required: [true, 'Imię jest wymagane'],
    trim: true,
    minlength: [2, 'Imię musi mieć co najmniej 2 znaki']
  },
  age: {
    type: Number,
    required: [true, 'Wiek jest wymagany'],
    min: [15, 'Wiek musi być co najmniej 15 lat'],
    max: [120, 'Wiek nie może przekraczać 120 lat']
  },
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Proszę podać prawidłowy adres email']
  },

  // Sekcja I - Podstawowe Informacje Biegowe (wymagane)
  experienceLevel: {
    type: String,
    required: [true, 'Poziom zaawansowania jest wymagany'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  mainGoal: {
    type: String,
    required: [true, 'Cel treningowy jest wymagany'],
    enum: [
      'general_fitness', 
      'run_5k', 
      'run_10k', 
      'half_marathon', 
      'marathon', 
      'ultra_marathon', 
      'speed_improvement', 
      'endurance_improvement', 
      'other'
    ]
  },
  customGoal: {
    type: String,
    trim: true
  },
  weeklyKilometers: {
    type: Number,
    required: [true, 'Liczba kilometrów tygodniowo jest wymagana'],
    min: [0, 'Liczba kilometrów nie może być ujemna']
  },
  trainingDaysPerWeek: {
    type: Number,
    required: [true, 'Liczba dni treningowych jest wymagana'],
    min: [1, 'Minimum 1 dzień treningowy'],
    max: [7, 'Maksimum 7 dni treningowych']
  },

  // Sekcja II - Poziom Wytrenowania i Parametry Fizjologiczne (opcjonalne)
  cooperTestDistance: {
    type: Number,
    min: [0, 'Dystans nie może być ujemny']
  },
  hasCooperTestResult: {
    type: Boolean,
    default: false
  },
  personalBests: {
    fiveKm: {
      minutes: { type: Number, min: 0 },
      seconds: { type: Number, min: 0, max: 59 }
    },
    tenKm: {
      hours: { type: Number, min: 0 },
      minutes: { type: Number, min: 0, max: 59 },
      seconds: { type: Number, min: 0, max: 59 }
    },
    halfMarathon: {
      hours: { type: Number, min: 0 },
      minutes: { type: Number, min: 0, max: 59 },
      seconds: { type: Number, min: 0, max: 59 }
    },
    marathon: {
      hours: { type: Number, min: 0 },
      minutes: { type: Number, min: 0, max: 59 },
      seconds: { type: Number, min: 0, max: 59 }
    }
  },
  vo2max: {
    value: { type: Number, min: 0 },
    known: { type: Boolean, default: false }
  },
  maxHeartRate: {
    value: { type: Number, min: 0 },
    measured: { type: Boolean, default: false },
    estimated: { type: Boolean, default: false }
  },
  restingHeartRate: {
    value: { type: Number, min: 0 },
    known: { type: Boolean, default: false }
  },

  // Sekcja III - Historia Kontuzji i Ograniczenia Zdrowotne (opcjonalne, ale zalecane)
  hasInjuries: {
    type: Boolean,
    default: false
  },
  currentPain: {
    exists: { type: Boolean, default: false },
    location: { type: String, trim: true },
    description: { type: String, trim: true },
    intensity: { type: Number, min: 0, max: 10 },
    circumstances: { type: String, trim: true }
  },
  recentInjury: {
    exists: { type: Boolean, default: false },
    type: { type: String, trim: true },
    date: { type: Date },
    rehabilitationStatus: { type: String, trim: true }
  },
  pastInjuries: [{
    type: { 
      type: String, 
      enum: [
        'runners_knee', 'jumpers_knee', 'itbs', 'lateral_patellar_compression', 
        'shin_splints', 'achilles_issues', 'plantar_fasciitis', 'ankle_issues',
        'muscle_strain', 'stress_fractures', 'hip_pain', 'fai', 'snapping_hip',
        'lower_back_pain', 'post_surgery', 'other'
      ]
    },
    details: { type: String, trim: true }
  }],
  medicalConditions: [{
    type: { 
      type: String, 
      enum: [
        'advanced_osteoarthritis', 'cardiovascular_disease', 'significant_obesity',
        'chronic_inflammatory', 'diabetes', 'exercise_induced_asthma', 'other', 'none'
      ]
    },
    details: { type: String, trim: true }
  }],

  // Sekcja IV - Technika Biegu (opcjonalne)
  runningTechniqueGoals: [{
    type: { 
      type: String, 
      enum: [
        'posture', 'arm_movement', 'cadence', 'overstriding', 
        'foot_strike', 'dynamic_running', 'stability', 'other', 'none'
      ]
    },
    details: { type: String, trim: true }
  }],

  // Sekcja V - Dieta, Odżywianie i Nawodnienie (opcjonalne)
  dietGoals: [{
    type: { 
      type: String, 
      enum: [
        'maintain_weight', 'weight_loss', 'weight_gain', 
        'energy_management', 'recovery_improvement', 'gi_issues_prevention', 'none'
      ]
    }
  }],
  dietaryRestrictions: [{
    type: { 
      type: String, 
      enum: [
        'vegetarian', 'vegan', 'gluten_free', 
        'lactose_free', 'allergies', 'other', 'none'
      ]
    },
    details: { type: String, trim: true }
  }],
  giIssuesFrequency: {
    type: String,
    enum: ['rarely', 'sometimes', 'often'],
    default: 'rarely'
  },
  giIssuesTriggers: {
    type: String,
    trim: true
  },
  typicalTrainingWeek: {
    type: String,
    trim: true
  },
  nutritionHabits: {
    preworkout: { type: String, trim: true },
    duringWorkout: { type: String, trim: true },
    postWorkout: { type: String, trim: true },
    testedProducts: { type: String, trim: true }
  },
  hydrationHabits: {
    type: String,
    trim: true
  },

  // Informacje systemowe
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'error'],
    default: 'pending'
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingPlan'
  }
}, {
  timestamps: true
});

// Indeksy dla optymalizacji zapytań
runningFormSchema.index({ userId: 1, status: 1 });
runningFormSchema.index({ email: 1 });

const RunningForm = mongoose.model('RunningForm', runningFormSchema);

module.exports = RunningForm; 