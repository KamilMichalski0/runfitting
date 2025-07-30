/**
 * Profesjonalna struktura treningów na podstawie utytułowanego trenera
 * Zawiera szczegółowe strefy HR, RPE, i progresję
 */

const HEART_RATE_ZONES = {
  recovery: {
    percentage: "50-60%",
    rpe: "1-2/10",
    description: "Spokojny marsz",
    purpose: "Regeneracja i rozgrzewka"
  },
  easy: {
    percentage: "65-70%",
    rpe: "2-3/10", 
    description: "Żywy marsz",
    purpose: "Aktywna regeneracja"
  },
  aerobic: {
    percentage: "75-85%",
    rpe: "4-6/10",
    description: "Trucht",
    purpose: "Budowanie bazy aerobowej"
  },
  comfortable: {
    percentage: "80-85%",
    rpe: "5-6/10",
    description: "Swobodny bieg",
    purpose: "Komfortowe tempo biegowe"
  },
  moderate: {
    percentage: "85-90%",
    rpe: "7/10",
    description: "Żywy bieg",
    purpose: "Praca nad tempem"
  },
  hard: {
    percentage: "90-95%",
    rpe: "8/10",
    description: "Mocniejszy bieg",
    purpose: "Praca nad mocą i szybkością"
  }
};

const TRAINING_COMPONENTS = {
  warmup: {
    duration: "10-15 min",
    structure: "trucht z przerwami na spokojny marsz",
    example: "10 min(4 min trucht/1 min spokojny marsz)"
  },
  stretching: {
    duration: "5 min",
    description: "Gimnastyka rozciągająca",
    timing: "Po rozgrzewce, przed głównym treningiem"
  },
  cooldown: {
    duration: "10-15 min",
    structure: "trucht z przejściem w spokojny marsz",
    example: "10 min(4 min trucht/1 min spokojny marsz)"
  }
};

const BEGINNER_PROGRESSION_PATTERN = {
  weeks_1_2: {
    maxDuration: 20,
    structure: "walk_run_intervals",
    heartRateZones: ["aerobic", "easy"],
    pattern: "1 min trucht / 1-2 min żywy marsz"
  },
  weeks_3_4: {
    maxDuration: 30,
    structure: "progressive_intervals",
    heartRateZones: ["aerobic", "easy"],
    pattern: "Progresywne interwały 1-4 min"
  },
  weeks_5_6: {
    maxDuration: 30,
    structure: "structured_intervals",
    heartRateZones: ["aerobic", "easy"],
    pattern: "Strukturalne interwały z krótkimi przerwami"
  },
  weeks_7_8: {
    maxDuration: 35,
    structure: "speed_introduction",
    heartRateZones: ["aerobic", "easy", "moderate"],
    pattern: "Wprowadzenie żywego biegu 20 sek"
  },
  weeks_9_10: {
    maxDuration: 45,
    structure: "mixed_training",
    heartRateZones: ["aerobic", "easy", "moderate", "hard"],
    pattern: "Mieszane treningi z progresją"
  },
  weeks_11_12: {
    maxDuration: 45,
    structure: "advanced_intervals",
    heartRateZones: ["aerobic", "comfortable", "moderate", "hard"],
    pattern: "Zaawansowane interwały i dłuższe biegi"
  }
};

/**
 * Generuje szczegółowy trening na podstawie tygodnia i numeru treningu
 */
function generateDetailedWorkout(week, workoutNumber, userLevel = 'beginner') {
  const weekKey = `weeks_${Math.ceil(week / 2) * 2 - 1}_${Math.ceil(week / 2) * 2}`;
  const progression = BEGINNER_PROGRESSION_PATTERN[weekKey];
  
  if (!progression) {
    return generateDefaultWorkout(week, workoutNumber);
  }
  
  return generateWorkoutByWeek(week, workoutNumber, progression);
}

/**
 * Generuje szczegółowy trening na podstawie konkretnego tygodnia
 */
function generateWorkoutByWeek(week, workoutNumber, progression) {
  const workouts = {
    1: {
      1: {
        name: "Trening interwałowy marsz-trucht",
        duration: 15,
        structure: "1 min trucht (75-85% HR MAX) / 2 min żywy marsz (70% HR MAX)",
        description: "Łagodne wprowadzenie do biegania",
        heartRateZones: ["aerobic", "easy"],
        rpeGuidance: "Trucht 4-6/10, Żywy marsz 2-3/10",
        intervals: [
          { type: "trucht", duration: 60, heartRate: "75-85%", rpe: "4-6/10" },
          { type: "żywy_marsz", duration: 120, heartRate: "70%", rpe: "2-3/10" }
        ],
        repetitions: 5,
        totalDuration: 15
      },
      2: {
        name: "Trening interwałowy marsz-trucht",
        duration: 20,
        structure: "1 min trucht (75-85% HR MAX) / 1 min żywy marsz (70% HR MAX)",
        description: "Skrócenie przerw, wydłużenie treningu",
        heartRateZones: ["aerobic", "easy"],
        rpeGuidance: "Trucht 4-6/10, Żywy marsz 2-3/10",
        intervals: [
          { type: "trucht", duration: 60, heartRate: "75-85%", rpe: "4-6/10" },
          { type: "żywy_marsz", duration: 60, heartRate: "70%", rpe: "2-3/10" }
        ],
        repetitions: 10,
        totalDuration: 20
      }
    },
    2: {
      1: {
        name: "Trening progresywny",
        duration: 20,
        structure: "1 min trucht/1 min żywy marsz/2 min trucht/1 min żywy marsz/3 min trucht/2 min żywy marsz - powtórz 2x",
        description: "Progresywne wydłużanie interwałów truchu",
        heartRateZones: ["aerobic", "easy"],
        rpeGuidance: "Trucht 4-6/10, Żywy marsz 2-3/10",
        intervals: [
          { type: "trucht", duration: 60, heartRate: "75-85%", rpe: "4-6/10" },
          { type: "żywy_marsz", duration: 60, heartRate: "70%", rpe: "2-3/10" },
          { type: "trucht", duration: 120, heartRate: "75-85%", rpe: "4-6/10" },
          { type: "żywy_marsz", duration: 60, heartRate: "70%", rpe: "2-3/10" },
          { type: "trucht", duration: 180, heartRate: "75-85%", rpe: "4-6/10" },
          { type: "żywy_marsz", duration: 120, heartRate: "70%", rpe: "2-3/10" }
        ],
        repetitions: 2,
        totalDuration: 20
      },
      2: {
        name: "Trening równy",
        duration: 20,
        structure: "3 min trucht/2 min żywy marsz - powtórz 4x",
        description: "Równe interwały 3-minutowe",
        heartRateZones: ["aerobic", "easy"],
        rpeGuidance: "Trucht 4-6/10, Żywy marsz 2-3/10",
        intervals: [
          { type: "trucht", duration: 180, heartRate: "75-85%", rpe: "4-6/10" },
          { type: "żywy_marsz", duration: 120, heartRate: "70%", rpe: "2-3/10" }
        ],
        repetitions: 4,
        totalDuration: 20
      }
    },
    7: {
      1: {
        name: "Trening z wprowadzeniem żywego biegu",
        duration: 45,
        structure: "Rozgrzewka + rozciąganie + 8x(20 sek żywy bieg/1 min spokojny marsz) + wyciszenie",
        description: "Pierwsze wprowadzenie wyższej intensywności",
        heartRateZones: ["aerobic", "easy", "moderate", "recovery"],
        rpeGuidance: "Żywy bieg 7/10, Trucht 4-6/10, Żywy marsz 2-3/10, Spokojny marsz 1-2/10",
        components: [
          {
            phase: "rozgrzewka",
            duration: 12,
            structure: "3 min trucht/1 min spokojny marsz - powtórz 3x",
            intervals: [
              { type: "trucht", duration: 180, heartRate: "75-85%", rpe: "4-6/10" },
              { type: "spokojny_marsz", duration: 60, heartRate: "60%", rpe: "1-2/10" }
            ]
          },
          {
            phase: "rozciąganie",
            duration: 5,
            structure: "Gimnastyka rozciągająca",
            description: "Dynamiczne rozciąganie"
          },
          {
            phase: "główny_trening",
            duration: 16,
            structure: "8x(20 sek żywy bieg/1 min spokojny marsz)",
            intervals: [
              { type: "żywy_bieg", duration: 20, heartRate: "90-95%", rpe: "7/10" },
              { type: "spokojny_marsz", duration: 60, heartRate: "60%", rpe: "1-2/10" }
            ],
            repetitions: 8
          },
          {
            phase: "wyciszenie",
            duration: 12,
            structure: "2 min trucht/1 min żywy marsz - powtórz 4x",
            intervals: [
              { type: "trucht", duration: 120, heartRate: "75-85%", rpe: "4-6/10" },
              { type: "żywy_marsz", duration: 60, heartRate: "70%", rpe: "2-3/10" }
            ]
          }
        ],
        totalDuration: 45
      }
    },
    12: {
      1: {
        name: "Zaawansowany trening interwałowy",
        duration: 45,
        structure: "Rozgrzewka + rozciąganie + 8x(2 min żywy bieg/1 min spokojny marsz) + wyciszenie",
        description: "Zaawansowany trening z długimi interwałami",
        heartRateZones: ["aerobic", "comfortable", "moderate", "recovery"],
        rpeGuidance: "Żywy bieg 7/10, Trucht 4/10, Spokojny marsz 1-2/10",
        components: [
          {
            phase: "rozgrzewka",
            duration: 10,
            structure: "10 min trucht",
            intervals: [
              { type: "trucht", duration: 600, heartRate: "75-80%", rpe: "4/10" }
            ]
          },
          {
            phase: "rozciąganie",
            duration: 5,
            structure: "Gimnastyka rozciągająca",
            description: "Dynamiczne rozciąganie"
          },
          {
            phase: "główny_trening",
            duration: 24,
            structure: "8x(2 min żywy bieg/1 min spokojny marsz)",
            intervals: [
              { type: "żywy_bieg", duration: 120, heartRate: "90-95%", rpe: "7/10" },
              { type: "spokojny_marsz", duration: 60, heartRate: "50-60%", rpe: "1-2/10" }
            ],
            repetitions: 8
          },
          {
            phase: "wyciszenie",
            duration: 10,
            structure: "10 min trucht",
            intervals: [
              { type: "trucht", duration: 600, heartRate: "75-80%", rpe: "4/10" }
            ]
          }
        ],
        totalDuration: 49
      }
    }
  };
  
  return workouts[week]?.[workoutNumber] || generateDefaultWorkout(week, workoutNumber);
}

/**
 * Generuje domyślny trening jeśli nie ma szczegółowej definicji
 */
function generateDefaultWorkout(week, workoutNumber) {
  const duration = Math.min(15 + week * 2, 45);
  
  return {
    name: `Trening ${workoutNumber} - Tydzień ${week}`,
    duration,
    structure: "Trening interwałowy marsz-trucht",
    description: "Standardowy trening progresywny",
    heartRateZones: ["aerobic", "easy"],
    rpeGuidance: "Trucht 4-6/10, Żywy marsz 2-3/10",
    intervals: [
      { type: "trucht", duration: 60, heartRate: "75-85%", rpe: "4-6/10" },
      { type: "żywy_marsz", duration: 90, heartRate: "70%", rpe: "2-3/10" }
    ],
    repetitions: Math.floor(duration / 2.5),
    totalDuration: duration
  };
}

/**
 * Formatuje trening do czytelnego opisu
 */
function formatWorkoutDescription(workout) {
  let description = `**${workout.name}** (${workout.duration} min)\n\n`;
  
  if (workout.structure) {
    description += `**Struktura:** ${workout.structure}\n\n`;
  }
  
  if (workout.description) {
    description += `**Opis:** ${workout.description}\n\n`;
  }
  
  if (workout.rpeGuidance) {
    description += `**Wytyczne intensywności:** ${workout.rpeGuidance}\n\n`;
  }
  
  if (workout.components) {
    description += `**Szczegóły treningu:**\n`;
    workout.components.forEach(component => {
      description += `• **${component.phase}** (${component.duration} min): ${component.structure}\n`;
    });
  }
  
  if (workout.intervals && !workout.components) {
    description += `**Interwały:**\n`;
    workout.intervals.forEach(interval => {
      description += `• ${interval.type}: ${interval.duration}s w ${interval.heartRate} HR MAX (RPE ${interval.rpe})\n`;
    });
    if (workout.repetitions) {
      description += `• Powtórz ${workout.repetitions} razy\n`;
    }
  }
  
  return description;
}

module.exports = {
  HEART_RATE_ZONES,
  TRAINING_COMPONENTS,
  BEGINNER_PROGRESSION_PATTERN,
  generateDetailedWorkout,
  formatWorkoutDescription
};