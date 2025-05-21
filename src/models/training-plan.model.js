const mongoose = require('mongoose');

const trainingPlanSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'ID planu jest wymagane'],
    unique: true
  },
  metadata: {
    discipline: {
      type: String,
      required: [true, 'Dyscyplina jest wymagana']
    },
    target_group: {
      type: String,
      required: [true, 'Grupa docelowa jest wymagana']
    },
    target_goal: {
      type: String,
      required: [true, 'Cel treningowy jest wymagany']
    },
    level_hint: {
      type: String,
      required: [true, 'Poziom zaawansowania jest wymagany']
    },
    days_per_week: {
      type: String,
      required: [true, 'Liczba dni treningowych jest wymagana']
    },
    duration_weeks: {
      type: Number,
      required: [true, 'Czas trwania planu jest wymagany']
    },
    description: {
      type: String,
      required: [true, 'Opis planu jest wymagany']
    },
    author: {
      type: String,
      required: [true, 'Autor planu jest wymagany']
    }
  },
  plan_weeks: [{
    week_num: {
      type: Number,
      required: [true, 'Numer tygodnia jest wymagany']
    },
    focus: {
      type: String,
      required: [true, 'Cel tygodnia jest wymagany']
    },
    days: [{
      day_name: {
        type: String,
        required: [true, 'Nazwa dnia jest wymagana'],
        enum: ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']
      },
      date: {
        type: String,
        required: [true, 'Data treningu jest wymagana']
      },
      workout: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Trening jest wymagany']
      }
    }]
  }],
  corrective_exercises: {
    frequency: {
      type: String
    },
    list: [{
      name: {
        type: String,
        required: [true, 'Nazwa ćwiczenia jest wymagana']
      },
      description: {
        type: String,
        required: [true, 'Opis ćwiczenia jest wymagany']
      },
      sets: {
        type: Number,
        required: [true, 'Liczba serii jest wymagana']
      },
      reps: {
        type: Number
      },
      duration: {
        type: Number
      }
    }]
  },
  pain_monitoring: {
    scale: {
      type: String
    },
    rules: [{
      type: String,
      required: [true, 'Zasady monitorowania bólu są wymagane']
    }]
  },
  notes: [{
    type: String,
    required: [true, 'Uwagi są wymagane']
  }],
  userId: {
    type: String,
    required: [true, 'Plan musi być przypisany do użytkownika'],
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  progress: {
    completedWorkouts: {
      type: Number,
      default: 0
    },
    totalWorkouts: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indeksy dla optymalizacji zapytań
trainingPlanSchema.index({ userId: 1, isActive: 1 });
trainingPlanSchema.index({ id: 1 }, { unique: true });

// Metoda do obliczania postępu
trainingPlanSchema.methods.calculateProgress = function() {
  let completedWorkouts = 0;
  let totalWorkouts = 0;

  this.plan_weeks.forEach(week => {
    week.days.forEach(day => {
      totalWorkouts++;
      if (day.completed) {
        completedWorkouts++;
      }
    });
  });

  this.progress = {
    completedWorkouts,
    totalWorkouts
  };

  return this.progress;
};

// Metoda do sprawdzania, czy plan jest aktualny
trainingPlanSchema.methods.isCurrent = function() {
  const now = new Date();
  return now >= this.createdAt && now <= new Date(this.createdAt.getTime() + (this.metadata.duration_weeks * 7 * 24 * 60 * 60 * 1000));
};

// Metoda do pobierania aktualnego tygodnia
trainingPlanSchema.methods.getCurrentWeek = function() {
  if (!this.isCurrent()) {
    return null;
  }

  const now = new Date();
  const startDate = new Date(this.createdAt);
  const diffTime = Math.abs(now - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  return this.plan_weeks.find(week => week.week_num === weekNumber);
};

const TrainingPlan = mongoose.model('TrainingPlan', trainingPlanSchema);

module.exports = TrainingPlan; 