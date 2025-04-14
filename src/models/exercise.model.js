const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nazwa ćwiczenia jest wymagana'],
    trim: true,
    unique: true
  },
  
  description: {
    type: String,
    required: [true, 'Opis ćwiczenia jest wymagany'],
    trim: true
  },
  
  // Kategoria ćwiczenia
  category: {
    type: String,
    enum: ['injury_prevention', 'strengthening', 'technique', 'mobility', 'warm_up', 'cool_down'],
    required: [true, 'Kategoria ćwiczenia jest wymagana']
  },
  
  // Subcategoria ćwiczenia bardziej szczegółowa
  subcategory: {
    type: String,
    enum: [
      // Prewencja kontuzji
      'ITBS', 'plantar_fasciitis', 'achilles_tendonitis', 'runners_knee', 'shin_splints',
      // Wzmacnianie
      'core', 'legs', 'upper_body', 'glutes', 'hips', 'ankles',
      // Technika biegowa
      'stability', 'economy', 'coordination', 'posture', 'running_form',
      // Mobilność
      'dynamic_stretching', 'static_stretching', 'foam_rolling', 
      // Rozgrzewka/Wyciszenie
      'general', 'specific'
    ],
    required: [true, 'Subkategoria ćwiczenia jest wymagana']
  },
  
  // Poziom trudności
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Poziom trudności jest wymagany']
  },
  
  // Parametry wykonywania
  defaultSets: {
    type: Number,
    default: 3
  },
  defaultReps: {
    type: Number,
    default: 10
  },
  defaultDuration: {
    type: Number,  // w sekundach
    default: 0
  },
  
  // Informacje o ćwiczeniu
  targetMuscles: [{
    type: String,
    enum: [
      'quadriceps', 'hamstrings', 'calves', 'glutes', 'hip_flexors', 
      'adductors', 'abductors', 'core', 'lower_back', 'upper_back',
      'chest', 'shoulders', 'triceps', 'biceps', 'forearms', 'ankles'
    ]
  }],
  
  benefits: [String],
  
  contraindications: [String],
  
  // Materiały pomocnicze
  imageUrl: String,
  videoUrl: String,
  
  // Metadane
  isActive: {
    type: Boolean,
    default: true
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

// Indeks dla wyszukiwania ćwiczeń
exerciseSchema.index({ name: 'text', description: 'text' });

// Middleware aktualizacji pola updatedAt przy każdej modyfikacji
exerciseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Metoda statyczna do wyszukiwania ćwiczeń wg kategorii
exerciseSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort('name');
};

// Metoda statyczna do wyszukiwania ćwiczeń wg subkategorii
exerciseSchema.statics.findBySubcategory = function(subcategory) {
  return this.find({ subcategory, isActive: true }).sort('name');
};

// Metoda statyczna do wyszukiwania ćwiczeń dla kontuzji
exerciseSchema.statics.findForInjury = function(injuryType) {
  return this.find({ 
    category: 'injury_prevention',
    subcategory: injuryType,
    isActive: true
  }).sort('name');
};

// Metoda statyczna do wyszukiwania ćwiczeń po poziomie trudności
exerciseSchema.statics.findByLevel = function(level) {
  return this.find({ 
    difficultyLevel: level,
    isActive: true
  }).sort('name');
};

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise; 