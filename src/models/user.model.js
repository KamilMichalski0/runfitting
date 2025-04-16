const mongoose = require('mongoose');

/**
 * Schema użytkownika aplikacji
 */
const userSchema = new mongoose.Schema({
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
  restingHeartRate: {
    type: Number,
    min: [30, 'Tętno spoczynkowe musi być co najmniej 30 uderzeń na minutę'],
    max: [100, 'Tętno spoczynkowe nie może przekraczać 100 uderzeń na minutę']
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