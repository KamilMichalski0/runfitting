const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
  password: {
    type: String,
    required: [true, 'Hasło jest wymagane'],
    minlength: [8, 'Hasło musi mieć co najmniej 8 znaków'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Prosimy o potwierdzenie hasła'],
    validate: {
      // Działa tylko na CREATE i SAVE
      validator: function(el) {
        return el === this.password;
      },
      message: 'Hasła nie są identyczne'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
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

// Middleware - przed zapisem dokumentu
userSchema.pre('save', async function(next) {
  // Jeśli hasło nie zostało zmodyfikowane, przejdź dalej
  if (!this.isModified('password')) return next();

  // Hashowanie hasła
  this.password = await bcrypt.hash(this.password, 12);

  // Usunięcie pola passwordConfirm
  this.passwordConfirm = undefined;

  // Jeśli to nowy dokument, nie ustawiaj passwordChangedAt
  if (this.isNew) return next();

  // Ustawienie czasu zmiany hasła
  this.passwordChangedAt = Date.now() - 1000; // -1s dla pewności, że token został wygenerowany po zmianie hasła
  next();
});

// Middleware - przed wykonaniem find - nie pokazuj nieaktywnych użytkowników
userSchema.pre(/^find/, function(next) {
  // this odnosi się do aktualnego zapytania
  this.find({ active: { $ne: false } });
  next();
});

/**
 * Metoda sprawdzająca poprawność hasła
 * @param {string} candidatePassword - Hasło do sprawdzenia
 * @param {string} userPassword - Zahashowane hasło użytkownika
 * @returns {Promise<boolean>} - Czy hasła są zgodne
 */
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * Sprawdza czy hasło zostało zmienione po wygenerowaniu tokenu JWT
 * @param {number} JWTTimestamp - Czas wygenerowania tokenu
 * @returns {boolean} - Czy hasło zostało zmienione
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  // False oznacza, że hasło NIE zostało zmienione
  return false;
};

/**
 * Generuje token resetowania hasła
 * @returns {string} - Token resetowania hasła
 */
userSchema.methods.createPasswordResetToken = function() {
  // Generuj losowy token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hashowanie tokenu do przechowywania w bazie
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Czas ważności tokenu - 10 minut
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Zwróć niezahaszowany token (do wysłania w e-mailu)
  return resetToken;
};

// Utworzenie modelu z schematu
const User = mongoose.model('User', userSchema);

module.exports = User; 