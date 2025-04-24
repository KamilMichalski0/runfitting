/**
 * Moduł do generowania planów treningowych
 * Implementuje logikę wyboru i dostosowania planów treningowych dla biegaczy
 */

const heartRateCalculator = require('./heart-rate-calculator');
const paceCalculator = require('./pace-calculator');
const AppError = require('../utils/app-error');

/**
 * Określa poziom zaawansowania biegacza na podstawie danych treningowych
 * @param {Object} user - Dane użytkownika
 * @returns {string} Poziom zaawansowania ('beginner', 'intermediate', 'advanced')
 */
const determineRunnerLevel = (user) => {
  if (!user || !user.trainingHistory) {
    return 'beginner';
  }
  
  // Jeśli użytkownik jawnie określił swój poziom, użyj go
  if (user.trainingHistory.runningExperience) {
    return user.trainingHistory.runningExperience;
  }
  
  // W przeciwnym razie oszacuj na podstawie innych danych
  const weeklyDistance = user.trainingHistory.weeklyDistance || 0;
  const hasMarathon = user.trainingHistory.personalBests && user.trainingHistory.personalBests.marathon;
  const hasHalfMarathon = user.trainingHistory.personalBests && user.trainingHistory.personalBests.halfMarathon;
  
  if (weeklyDistance >= 50 || hasMarathon) {
    return 'advanced';
  } else if (weeklyDistance >= 20 || hasHalfMarathon) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
};

/**
 * Wybiera odpowiedni szablon planu na podstawie celu i poziomu zaawansowania
 * @param {string} goalType - Typ celu ('5k', '10k', 'half_marathon', 'marathon', 'ultra')
 * @param {string} level - Poziom zaawansowania ('beginner', 'intermediate', 'advanced')
 * @returns {string} Identyfikator szablonu planu
 */
const selectPlanTemplate = (goalType, level) => {
  const templates = {
    '5k': {
      beginner: 'beginner_5k_12weeks',
      intermediate: 'intermediate_5k_10weeks',
      advanced: 'advanced_5k_8weeks'
    },
    '10k': {
      beginner: 'beginner_10k_12weeks',
      intermediate: 'intermediate_10k_10weeks',
      advanced: 'advanced_10k_8weeks'
    },
    'half_marathon': {
      beginner: 'beginner_half_16weeks',
      intermediate: 'intermediate_half_14weeks',
      advanced: 'advanced_half_12weeks'
    },
    'marathon': {
      beginner: 'beginner_marathon_20weeks',
      intermediate: 'intermediate_marathon_16weeks',
      advanced: 'advanced_marathon_14weeks'
    },
    'ultra': {
      beginner: 'beginner_ultra_24weeks',
      intermediate: 'intermediate_ultra_20weeks',
      advanced: 'advanced_ultra_16weeks'
    }
  };
  
  if (!templates[goalType] || !templates[goalType][level]) {
    throw new AppError(`Nie znaleziono odpowiedniego szablonu dla celu ${goalType} i poziomu ${level}`, 400);
  }
  
  return templates[goalType][level];
};

/**
 * Oblicza daty rozpoczęcia i zakończenia planu na podstawie celu i poziomu
 * @param {Date} targetDate - Data docelowego wydarzenia
 * @param {string} goalType - Typ celu ('5k', '10k', 'half_marathon', 'marathon', 'ultra')
 * @param {string} level - Poziom zaawansowania ('beginner', 'intermediate', 'advanced')
 * @returns {Object} Daty rozpoczęcia i zakończenia planu
 */
const calculatePlanDates = (targetDate, goalType, level) => {
  if (!targetDate) {
    throw new AppError('Data docelowa jest wymagana', 400);
  }
  
  // Mapowanie liczby tygodni planów
  const weeksByGoalAndLevel = {
    '5k': { beginner: 12, intermediate: 10, advanced: 8 },
    '10k': { beginner: 12, intermediate: 10, advanced: 8 },
    'half_marathon': { beginner: 16, intermediate: 14, advanced: 12 },
    'marathon': { beginner: 20, intermediate: 16, advanced: 14 },
    'ultra': { beginner: 24, intermediate: 20, advanced: 16 },
  };
  
  // Domyślnie 12 tygodni, jeśli nie ma określonego czasu dla danego celu/poziomu
  const weeks = weeksByGoalAndLevel[goalType]?.[level] || 12;
  
  // Konwersja do właściwego obiektu Date
  const target = new Date(targetDate);
  
  // Obliczenie daty rozpoczęcia (targetDate - weeks*7 dni)
  const startDate = new Date(target);
  startDate.setDate(target.getDate() - (weeks * 7));
  
  // Obliczenie daty zakończenia (dzień przed targetDate)
  const endDate = new Date(target);
  endDate.setDate(target.getDate() - 1);
  
  return {
    startDate,
    endDate,
    weeks
  };
};

/**
 * Generuje podstawowy plan tygodniowy dla biegacza
 * @param {string} level - Poziom zaawansowania ('beginner', 'intermediate', 'advanced')
 * @param {string} goalType - Typ celu ('5k', '10k', 'half_marathon', 'marathon', 'ultra')
 * @param {number} weeklyDistance - Bieżący tygodniowy dystans w kilometrach
 * @returns {Object} Plan tygodniowy z rozkładem dystansów i typów treningów
 */
const generateWeeklyPlan = (level, goalType, weeklyDistance = 0) => {
  // Ustalenie docelowej tygodniowej objętości (w kilometrach)
  let targetWeeklyDistance;
  
  switch (level) {
    case 'beginner':
      targetWeeklyDistance = Math.max(20, weeklyDistance * 1.1);
      break;
    case 'intermediate':
      targetWeeklyDistance = Math.max(40, weeklyDistance * 1.15);
      break;
    case 'advanced':
      targetWeeklyDistance = Math.max(60, weeklyDistance * 1.2);
      break;
    default:
      targetWeeklyDistance = Math.max(20, weeklyDistance * 1.1);
  }
  
  // Korekta objętości w zależności od celu
  const distanceMultiplier = {
    '5k': 0.8,
    '10k': 1.0,
    'half_marathon': 1.2,
    'marathon': 1.5,
    'ultra': 1.8
  };
  
  targetWeeklyDistance *= (distanceMultiplier[goalType] || 1.0);
  
  // Zaokrąglenie do pełnych kilometrów
  targetWeeklyDistance = Math.round(targetWeeklyDistance);
  
  // Ustalenie rozkładu treningów w tygodniu
  const weeklyWorkouts = {
    beginner: [
      { day: 0, type: 'rest', distancePercent: 0 },
      { day: 1, type: 'easy', distancePercent: 0.15 },
      { day: 2, type: 'rest', distancePercent: 0 },
      { day: 3, type: 'easy', distancePercent: 0.2 },
      { day: 4, type: 'rest', distancePercent: 0 },
      { day: 5, type: 'easy', distancePercent: 0.15 },
      { day: 6, type: 'long', distancePercent: 0.5 }
    ],
    intermediate: [
      { day: 0, type: 'rest', distancePercent: 0 },
      { day: 1, type: 'easy', distancePercent: 0.15 },
      { day: 2, type: 'tempo', distancePercent: 0.15 },
      { day: 3, type: 'easy', distancePercent: 0.15 },
      { day: 4, type: 'rest', distancePercent: 0 },
      { day: 5, type: 'intervals', distancePercent: 0.15 },
      { day: 6, type: 'long', distancePercent: 0.4 }
    ],
    advanced: [
      { day: 0, type: 'recovery', distancePercent: 0.1 },
      { day: 1, type: 'intervals', distancePercent: 0.15 },
      { day: 2, type: 'easy', distancePercent: 0.15 },
      { day: 3, type: 'tempo', distancePercent: 0.15 },
      { day: 4, type: 'easy', distancePercent: 0.1 },
      { day: 5, type: 'hills', distancePercent: 0.15 },
      { day: 6, type: 'long', distancePercent: 0.3 }
    ]
  };
  
  // Wybór domyślnego rozkładu dla poziomu
  const workoutPlan = weeklyWorkouts[level] || weeklyWorkouts.beginner;
  
  // Obliczenie dystansu dla każdego treningu
  workoutPlan.forEach(workout => {
    workout.distance = Math.round(targetWeeklyDistance * workout.distancePercent);
  });
  
  return {
    totalDistance: targetWeeklyDistance,
    workouts: workoutPlan
  };
};

/**
 * Dostosowuje tempa treningowe na podstawie danych użytkownika
 * @param {Object} user - Dane użytkownika
 * @returns {Object} Tempa treningowe
 */
const calculateTrainingPaces = (user) => {
  if (!user || !user.trainingHistory || !user.trainingHistory.personalBests) {
    throw new AppError('Brak wystarczających danych o użytkowniku do obliczenia temp treningowych', 400);
  }
  
  const { personalBests } = user.trainingHistory;
  
  // Sprawdza, czy istnieje przynajmniej jeden wynik
  if (!personalBests.fiveK && !personalBests.tenK && !personalBests.halfMarathon && !personalBests.marathon) {
    // Jeśli brak wyników, oszacuj na podstawie poziomu
    return estimatePacesByLevel(user.trainingHistory.runningExperience || 'beginner');
  }
  
  // Oblicz tempa na podstawie najlepszych wyników
  return paceCalculator.generateRacePaces(personalBests);
};

/**
 * Szacuje tempa treningowe na podstawie poziomu zaawansowania
 * @param {string} level - Poziom zaawansowania ('beginner', 'intermediate', 'advanced')
 * @returns {Object} Szacowane tempa treningowe
 */
const estimatePacesByLevel = (level) => {
  // Domyślne wartości VDOT dla różnych poziomów
  const defaultVdot = {
    beginner: 35,
    intermediate: 45,
    advanced: 55
  };
  
  const vdot = defaultVdot[level] || defaultVdot.beginner;
  
  // Generowanie temp treningowych na podstawie przybliżonego VDOT
  const trainingPaces = paceCalculator.calculateTrainingPaces(vdot);
  
  // Szacowanie czasów wyścigowych na podstawie VDOT
  const estimatedRaceTimes = {
    '5K': paceCalculator.secondsToPace(trainingPaces.interval.paceInSeconds) * 5,
    '10K': paceCalculator.secondsToPace(trainingPaces.threshold.paceInSeconds) * 10,
    'HalfMarathon': paceCalculator.secondsToPace(trainingPaces.marathon.paceInSeconds) * 21.1,
    'Marathon': paceCalculator.secondsToPace(trainingPaces.easy.paceInSeconds) * 42.2
  };
  
  return {
    vdot,
    trainingPaces,
    raceTimes: estimatedRaceTimes,
    racePaces: {
      '5K': {
        paceInSeconds: trainingPaces.interval.paceInSeconds,
        paceFormatted: trainingPaces.interval.paceFormatted
      },
      '10K': {
        paceInSeconds: trainingPaces.threshold.paceInSeconds,
        paceFormatted: trainingPaces.threshold.paceFormatted
      },
      'HalfMarathon': {
        paceInSeconds: trainingPaces.marathon.paceInSeconds,
        paceFormatted: trainingPaces.marathon.paceFormatted
      },
      'Marathon': {
        paceInSeconds: trainingPaces.easy.paceInSeconds,
        paceFormatted: trainingPaces.easy.paceFormatted
      }
    }
  };
};

/**
 * Generuje pełny plan treningowy
 * @param {Object} user - Dane użytkownika
 * @param {Object} goal - Cel treningowy (typ, data, czas)
 * @returns {Object} Kompletny plan treningowy
 */
const generateTrainingPlan = (user, goal) => {
  if (!user || !goal) {
    throw new AppError('Brak wymaganych danych użytkownika lub celu treningowego', 400);
  }
  
  // Określenie poziomu zaawansowania
  const level = determineRunnerLevel(user);
  
  // Wybór szablonu planu
  const templateId = selectPlanTemplate(goal.type, level);
  
  // Obliczenie dat planu
  const planDates = calculatePlanDates(goal.targetDate, goal.type, level);
  
  // Obliczenie temp treningowych
  const paces = calculateTrainingPaces(user);
  
  // Obliczenie stref tętna
  let heartRateZones = null;
  if (user.age && user.restingHeartRate) {
    heartRateZones = heartRateCalculator.calculateHeartRateZones(user.age, user.restingHeartRate);
  }
  
  // Generowanie struktury planu
  const plan = {
    user: user._id,
    name: `Plan ${goal.type.toUpperCase()} - ${level}`,
    goal: {
      type: goal.type,
      targetTime: goal.targetTime,
      targetDate: goal.targetDate
    },
    startDate: planDates.startDate,
    endDate: planDates.endDate,
    template: templateId,
    level: level,
    stats: {
      totalDistance: 0,
      totalTime: 0,
      completedWorkouts: 0,
      totalWorkouts: 0
    },
    weeks: [],
    status: 'active',
    isModified: false,
    keyWorkouts: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Bieżący dystans tygodniowy użytkownika
  const currentWeeklyDistance = user.trainingHistory?.weeklyDistance || 0;
  
  // Generowanie tygodni treningowych
  for (let weekNumber = 1; weekNumber <= planDates.weeks; weekNumber++) {
    const weekStartDate = new Date(planDates.startDate);
    weekStartDate.setDate(planDates.startDate.getDate() + (weekNumber - 1) * 7);
    
    // Określenie fazy treningu
    let focus;
    const weekPercent = weekNumber / planDates.weeks;
    
    if (weekPercent < 0.25) {
      focus = 'base';
    } else if (weekPercent < 0.6) {
      focus = 'build';
    } else if (weekPercent < 0.85) {
      focus = 'peak';
    } else if (weekPercent < 0.95) {
      focus = 'taper';
    } else {
      focus = 'recovery';
    }
    
    // Progresja objętości
    let volumeMultiplier;
    
    if (focus === 'base') {
      volumeMultiplier = 0.8 + (0.2 * (weekNumber / (planDates.weeks * 0.25)));
    } else if (focus === 'build') {
      volumeMultiplier = 1.0 + (0.3 * ((weekNumber - (planDates.weeks * 0.25)) / (planDates.weeks * 0.35)));
    } else if (focus === 'peak') {
      volumeMultiplier = 1.3;
    } else if (focus === 'taper') {
      volumeMultiplier = 1.3 - (0.7 * ((weekNumber - (planDates.weeks * 0.85)) / (planDates.weeks * 0.1)));
    } else { // recovery
      volumeMultiplier = 0.6;
    }
    
    // Generowanie tygodniowego planu z uwzględnieniem progresji
    const weeklyPlan = generateWeeklyPlan(level, goal.type, currentWeeklyDistance * volumeMultiplier);
    
    // Struktura tygodnia
    const week = {
      weekNumber,
      focus,
      targetDistance: weeklyPlan.totalDistance,
      notes: `Tydzień ${weekNumber}: Faza ${focus}`,
      days: []
    };
    
    // Generowanie dni treningowych w tygodniu
    weeklyPlan.workouts.forEach(workout => {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + workout.day);
      
      // Domyślny czas trwania treningu (na potrzeby szacowania)
      let estimatedDuration = 0;
      
      if (workout.type !== 'rest') {
        // Szacowanie czasu treningu na podstawie dystansu i tempa
        const workoutPace = paceCalculator.getTargetPaceForWorkout(paces, workout.type);
        estimatedDuration = Math.round((workout.distance * workoutPace.minPace) / 60); // w minutach
      }
      
      // Dodaj dzień do tygodnia
      week.days.push({
        dayOfWeek: workout.day,
        date: dayDate,
        workout: {
          type: workout.type,
          plannedDistance: workout.distance,
          plannedDuration: estimatedDuration
        }
      });
    });
    
    // Dodaj tydzień do planu
    plan.weeks.push(week);
    
    // Sumuj statystyki planu
    plan.stats.totalDistance += weeklyPlan.totalDistance;
    plan.stats.totalWorkouts += weeklyPlan.workouts.filter(w => w.type !== 'rest').length;
  }
  
  // Szacowanie łącznego czasu treningu
  const averagePace = paces.trainingPaces.easy.paceInSeconds;
  plan.stats.totalTime = Math.round((plan.stats.totalDistance * averagePace) / 60); // w minutach
  
  return plan;
};

module.exports = {
  determineRunnerLevel,
  selectPlanTemplate,
  calculatePlanDates,
  generateWeeklyPlan,
  calculateTrainingPaces,
  generateTrainingPlan
}; 