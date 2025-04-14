/**
 * Szablony planów treningowych dla różnych celów i poziomów zaawansowania
 */

// Opis typu treningu
const workoutTypeDescriptions = {
  easy: {
    title: 'Łatwy bieg',
    description: 'Spokojny bieg w tempie konwersacyjnym. Powinieneś być w stanie rozmawiać bez zadyszki.'
  },
  long: {
    title: 'Długi bieg',
    description: 'Dłuższy bieg w łatwym tempie, budujący wytrzymałość aerobową i odporność psychiczną.'
  },
  tempo: {
    title: 'Bieg tempowy',
    description: 'Bieg w tempie zbliżonym do progu mleczanowego, poprawiający wytrzymałość tempową.'
  },
  intervals: {
    title: 'Interwały',
    description: 'Powtórzenia szybkich odcinków przedzielane odpoczynkiem, poprawiające pułap tlenowy i szybkość.'
  },
  hills: {
    title: 'Podbiegi',
    description: 'Trening na wzniesieniach, poprawiający siłę biegową i ekonomię biegu.'
  },
  fartlek: {
    title: 'Fartlek',
    description: 'Zabawa szybkością - przeplatanie szybkich i wolnych odcinków w sposób nieregularny.'
  },
  recovery: {
    title: 'Bieg regeneracyjny',
    description: 'Bardzo łatwy, krótki bieg, wspierający regenerację po ciężkich treningach.'
  },
  rest: {
    title: 'Odpoczynek',
    description: 'Dzień odpoczynku bez treningu biegowego. Możesz wykonać lekkie ćwiczenia rozciągające lub cross-training o niskiej intensywności.'
  },
  cross_training: {
    title: 'Cross-training',
    description: 'Aktywność fizyczna inna niż bieganie, np. rower, pływanie, elipsa, zapewniająca odpoczynek od biegania przy zachowaniu treningu wytrzymałościowego.'
  }
};

// Szablony interwałów
const intervalTemplates = {
  beginner_5k: [
    { distance: 400, repeats: 6, rest: 200, description: '6 x 400m z odpoczynkiem truchtem 200m' },
    { distance: 800, repeats: 4, rest: 400, description: '4 x 800m z odpoczynkiem truchtem 400m' },
    { distance: 1000, repeats: 3, rest: 400, description: '3 x 1000m z odpoczynkiem truchtem 400m' }
  ],
  intermediate_5k: [
    { distance: 400, repeats: 10, rest: 200, description: '10 x 400m z odpoczynkiem truchtem 200m' },
    { distance: 800, repeats: 6, rest: 400, description: '6 x 800m z odpoczynkiem truchtem 400m' },
    { distance: 1200, repeats: 4, rest: 400, description: '4 x 1200m z odpoczynkiem truchtem 400m' }
  ],
  advanced_5k: [
    { distance: 400, repeats: 12, rest: 200, description: '12 x 400m z odpoczynkiem truchtem 200m' },
    { distance: 800, repeats: 8, rest: 400, description: '8 x 800m z odpoczynkiem truchtem 400m' },
    { distance: 1600, repeats: 4, rest: 400, description: '4 x 1600m z odpoczynkiem truchtem 400m' }
  ],
  beginner_10k: [
    { distance: 800, repeats: 5, rest: 400, description: '5 x 800m z odpoczynkiem truchtem 400m' },
    { distance: 1000, repeats: 4, rest: 400, description: '4 x 1000m z odpoczynkiem truchtem 400m' },
    { distance: 1600, repeats: 2, rest: 800, description: '2 x 1600m z odpoczynkiem truchtem 800m' }
  ],
  intermediate_10k: [
    { distance: 800, repeats: 8, rest: 400, description: '8 x 800m z odpoczynkiem truchtem 400m' },
    { distance: 1000, repeats: 6, rest: 400, description: '6 x 1000m z odpoczynkiem truchtem 400m' },
    { distance: 1600, repeats: 4, rest: 800, description: '4 x 1600m z odpoczynkiem truchtem 800m' }
  ],
  advanced_10k: [
    { distance: 1000, repeats: 8, rest: 400, description: '8 x 1000m z odpoczynkiem truchtem 400m' },
    { distance: 1600, repeats: 5, rest: 800, description: '5 x 1600m z odpoczynkiem truchtem 800m' },
    { distance: 2000, repeats: 4, rest: 800, description: '4 x 2000m z odpoczynkiem truchtem 800m' }
  ],
  beginner_half: [
    { distance: 1000, repeats: 5, rest: 400, description: '5 x 1000m z odpoczynkiem truchtem 400m' },
    { distance: 1600, repeats: 3, rest: 800, description: '3 x 1600m z odpoczynkiem truchtem 800m' },
    { distance: 2000, repeats: 2, rest: 800, description: '2 x 2000m z odpoczynkiem truchtem 800m' }
  ],
  intermediate_half: [
    { distance: 1600, repeats: 5, rest: 800, description: '5 x 1600m z odpoczynkiem truchtem 800m' },
    { distance: 2000, repeats: 4, rest: 800, description: '4 x 2000m z odpoczynkiem truchtem 800m' },
    { distance: 3200, repeats: 2, rest: 1600, description: '2 x 3200m z odpoczynkiem truchtem 1600m' }
  ],
  advanced_half: [
    { distance: 1600, repeats: 6, rest: 800, description: '6 x 1600m z odpoczynkiem truchtem 800m' },
    { distance: 2000, repeats: 5, rest: 800, description: '5 x 2000m z odpoczynkiem truchtem 800m' },
    { distance: 3200, repeats: 3, rest: 1600, description: '3 x 3200m z odpoczynkiem truchtem 1600m' }
  ],
  beginner_marathon: [
    { distance: 1600, repeats: 4, rest: 800, description: '4 x 1600m z odpoczynkiem truchtem 800m' },
    { distance: 2000, repeats: 3, rest: 800, description: '3 x 2000m z odpoczynkiem truchtem 800m' },
    { distance: 3200, repeats: 2, rest: 1600, description: '2 x 3200m z odpoczynkiem truchtem 1600m' }
  ],
  intermediate_marathon: [
    { distance: 1600, repeats: 6, rest: 800, description: '6 x 1600m z odpoczynkiem truchtem 800m' },
    { distance: 2000, repeats: 5, rest: 800, description: '5 x 2000m z odpoczynkiem truchtem 800m' },
    { distance: 3200, repeats: 3, rest: 1600, description: '3 x 3200m z odpoczynkiem truchtem 1600m' }
  ],
  advanced_marathon: [
    { distance: 1600, repeats: 8, rest: 800, description: '8 x 1600m z odpoczynkiem truchtem 800m' },
    { distance: 2000, repeats: 6, rest: 800, description: '6 x 2000m z odpoczynkiem truchtem 800m' },
    { distance: 3200, repeats: 4, rest: 1600, description: '4 x 3200m z odpoczynkiem truchtem 1600m' }
  ]
};

// Szablony podbiegów
const hillTemplates = {
  beginner: {
    repeats: 4,
    duration: 30, // w sekundach
    rest: 60, // w sekundach
    description: '4 x 30s podbiegi z powrotem truchtem w dół i 60s odpoczynku'
  },
  intermediate: {
    repeats: 6,
    duration: 45, // w sekundach
    rest: 60, // w sekundach
    description: '6 x 45s podbiegi z powrotem truchtem w dół i 60s odpoczynku'
  },
  advanced: {
    repeats: 8,
    duration: 60, // w sekundach
    rest: 60, // w sekundach
    description: '8 x 60s podbiegi z powrotem truchtem w dół i 60s odpoczynku'
  }
};

// Szablony treningów tempowych
const tempoTemplates = {
  beginner_5k: {
    duration: 15, // w minutach
    description: '15 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  intermediate_5k: {
    duration: 20, // w minutach
    description: '20 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  advanced_5k: {
    duration: 25, // w minutach
    description: '25 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  beginner_10k: {
    duration: 20, // w minutach
    description: '20 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  intermediate_10k: {
    duration: 25, // w minutach
    description: '25 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  advanced_10k: {
    duration: 30, // w minutach
    description: '30 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  beginner_half: {
    duration: 25, // w minutach
    description: '25 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  intermediate_half: {
    duration: 35, // w minutach
    description: '35 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  advanced_half: {
    duration: 45, // w minutach
    description: '45 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  beginner_marathon: {
    duration: 30, // w minutach
    description: '30 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  intermediate_marathon: {
    duration: 40, // w minutach
    description: '40 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  },
  advanced_marathon: {
    duration: 50, // w minutach
    description: '50 minut biegu tempowego (około 85-90% maksymalnego wysiłku)'
  }
};

// Zalecane ćwiczenia dla różnych poziomów i celów
const recommendedExercises = {
  beginner: {
    '5k': ['core_basic', 'glute_bridges', 'squats', 'lunges', 'calf_raises'],
    '10k': ['core_basic', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks'],
    'half_marathon': ['core_intermediate', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength'],
    'marathon': ['core_intermediate', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'leg_strength']
  },
  intermediate: {
    '5k': ['core_intermediate', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'plyometrics_basic'],
    '10k': ['core_intermediate', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'plyometrics_basic'],
    'half_marathon': ['core_advanced', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'leg_strength', 'plyometrics_intermediate'],
    'marathon': ['core_advanced', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'leg_strength', 'single_leg_exercises']
  },
  advanced: {
    '5k': ['core_advanced', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'plyometrics_advanced', 'strides'],
    '10k': ['core_advanced', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'plyometrics_advanced', 'strides', 'tempo_drills'],
    'half_marathon': ['core_advanced', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'leg_strength', 'plyometrics_advanced', 'single_leg_exercises'],
    'marathon': ['core_advanced', 'glute_bridges', 'squats', 'lunges', 'calf_raises', 'planks', 'hip_strength', 'leg_strength', 'single_leg_exercises', 'endurance_routines']
  }
};

// Zalecane ćwiczenia dla różnych kontuzji
const injuryPreventionExercises = {
  'ITBS': ['foam_rolling_it_band', 'hip_abductor_strengthening', 'glute_medius_exercises', 'lateral_leg_raises', 'clamshells'],
  'plantar_fasciitis': ['foot_arch_exercises', 'calf_raises', 'foot_rolling', 'toe_curls', 'towel_scrunches'],
  'achilles_tendonitis': ['eccentric_heel_drops', 'calf_raises', 'calf_stretches', 'ankle_mobility', 'balance_exercises'],
  'runners_knee': ['quad_strengthening', 'hamstring_strengthening', 'hip_strengthening', 'patellar_mobility', 'glute_activation'],
  'shin_splints': ['calf_raises', 'foot_dorsiflexion', 'shin_stretches', 'balance_exercises', 'toe_taps']
};

/**
 * Generuje opis treningu na podstawie typu i szablonu
 * @param {string} workoutType - Typ treningu (easy, tempo, intervals, etc.)
 * @param {string} level - Poziom zaawansowania (beginner, intermediate, advanced)
 * @param {string} goalType - Typ celu (5k, 10k, half_marathon, marathon)
 * @param {number} week - Numer tygodnia
 * @param {number} totalWeeks - Całkowita liczba tygodni
 * @returns {Object} Opis treningu z tytułem i szczegółami
 */
const generateWorkoutDescription = (workoutType, level, goalType, week, totalWeeks) => {
  const baseDescription = workoutTypeDescriptions[workoutType]?.description || 'Trening biegowy';
  const baseTitle = workoutTypeDescriptions[workoutType]?.title || 'Trening';
  
  // Określenie fazy treningu
  const weekPercent = week / totalWeeks;
  let phase;
  
  if (weekPercent < 0.25) {
    phase = 'bazowa';
  } else if (weekPercent < 0.6) {
    phase = 'budująca';
  } else if (weekPercent < 0.85) {
    phase = 'szczytowa';
  } else if (weekPercent < 0.95) {
    phase = 'tapering';
  } else {
    phase = 'regeneracyjna';
  }
  
  let details = '';
  
  switch (workoutType) {
    case 'easy':
      details = `${baseDescription} W fazie ${phase} skupiamy się na budowaniu aerobowej bazy.`;
      break;
    
    case 'long':
      // Progresja długich biegów
      let longRunProgressionDesc = '';
      if (weekPercent < 0.25) {
        longRunProgressionDesc = 'Początkowy długi bieg, należy utrzymać łatwe tempo przez cały czas trwania.';
      } else if (weekPercent < 0.6) {
        longRunProgressionDesc = 'Bieg budujący wytrzymałość, ostatnie 10-15 minut możesz przyspieszyć do tempa maratońskiego.';
      } else if (weekPercent < 0.85) {
        longRunProgressionDesc = 'Długi bieg z elementami tempa wyścigowego. Środkowe 30-40% biegu wykonaj w docelowym tempie wyścigowym.';
      } else {
        longRunProgressionDesc = 'Krótszy długi bieg w stabilnym tempie jako przygotowanie do wyścigu.';
      }
      
      details = `${baseDescription} ${longRunProgressionDesc}`;
      break;
    
    case 'tempo':
      // Pobierz odpowiedni szablon tempa
      const tempoKey = `${level}_${goalType.replace('half_marathon', 'half').replace('marathon', 'marathon')}`;
      const tempoTemplate = tempoTemplates[tempoKey] || tempoTemplates[`intermediate_${goalType.replace('half_marathon', 'half').replace('marathon', 'marathon')}`];
      
      // Progresja tempa w zależności od fazy
      let tempoDuration = tempoTemplate.duration;
      if (weekPercent < 0.25) {
        tempoDuration = Math.round(tempoDuration * 0.7);
      } else if (weekPercent < 0.6) {
        tempoDuration = Math.round(tempoDuration * 0.9);
      } else if (weekPercent < 0.85) {
        tempoDuration = tempoDuration;
      } else {
        tempoDuration = Math.round(tempoDuration * 0.8);
      }
      
      details = `${baseDescription} Wykonaj rozgrzewkę, następnie ${tempoDuration} minut biegu w tempie progowym (trudno, ale kontrolowanym), a następnie schłodzenie.`;
      break;
    
    case 'intervals':
      // Pobierz odpowiedni szablon interwałów
      const intervalKey = `${level}_${goalType.replace('half_marathon', 'half').replace('marathon', 'marathon')}`;
      const intervalOptions = intervalTemplates[intervalKey] || intervalTemplates[`intermediate_${goalType.replace('half_marathon', 'half').replace('marathon', 'marathon')}`];
      
      // Wybierz typ interwału w zależności od fazy
      let intervalIndex;
      if (weekPercent < 0.25) {
        intervalIndex = 0; // Krótsze interwały na początku
      } else if (weekPercent < 0.6) {
        intervalIndex = Math.min(1, intervalOptions.length - 1); // Średnie interwały w fazie budowania
      } else if (weekPercent < 0.85) {
        intervalIndex = Math.min(2, intervalOptions.length - 1); // Dłuższe interwały w fazie szczytowej
      } else {
        intervalIndex = 0; // Powrót do krótszych interwałów w fazie taperingu
      }
      
      const selectedInterval = intervalOptions[intervalIndex];
      details = `${baseDescription} Po rozgrzewce wykonaj: ${selectedInterval.description} w tempie około 5k. Zakończ schłodzeniem.`;
      break;
    
    case 'hills':
      const hillTemplate = hillTemplates[level] || hillTemplates.intermediate;
      details = `${baseDescription} Po rozgrzewce wykonaj: ${hillTemplate.description}. Zakończ schłodzeniem.`;
      break;
    
    case 'fartlek':
      details = `${baseDescription} Po rozgrzewce wykonaj serię przyspieszeń o różnej długości (od 30s do 3min) przeplatanych łatwym biegiem. Całkowity czas szybszych odcinków powinien wynosić około 15-20 minut.`;
      break;
    
    case 'recovery':
      details = `${baseDescription} W tym dniu ważne jest utrzymanie bardzo łatwego tempa przez cały czas trwania biegu.`;
      break;
    
    case 'rest':
      details = `${baseDescription} Ten dzień jest przeznaczony na regenerację. Wykonaj ćwiczenia rozciągające lub lekki cross-training jeśli czujesz się na to gotowy.`;
      break;
    
    case 'cross_training':
      details = `${baseDescription} Zalecane aktywności to pływanie, rower, elipsa lub inna aktywność o niskim obciążeniu stawów. Utrzymaj średnią intensywność przez 30-45 minut.`;
      break;
    
    default:
      details = baseDescription;
  }
  
  // Dodaj informację o zalecanych ćwiczeniach uzupełniających
  let exerciseInfo = '';
  if (workoutType !== 'rest' && weekPercent < 0.9) { // Nie dodawaj ćwiczeń w ostatnich tygodniach
    exerciseInfo = '\n\nPo treningu zalecane są ćwiczenia wzmacniające: ';
    
    // Wybierz odpowiednie ćwiczenia dla poziomu i celu
    const exerciseList = recommendedExercises[level]?.[goalType] || recommendedExercises.intermediate[goalType] || ['core_basic', 'squats', 'lunges'];
    
    // Wybierz 2-3 ćwiczenia losowo
    const exerciseCount = Math.min(3, exerciseList.length);
    const selectedExercises = [];
    
    while (selectedExercises.length < exerciseCount) {
      const randomIndex = Math.floor(Math.random() * exerciseList.length);
      const exercise = exerciseList[randomIndex];
      
      if (!selectedExercises.includes(exercise)) {
        selectedExercises.push(exercise);
      }
    }
    
    exerciseInfo += selectedExercises.join(', ').replace(/_/g, ' ');
  }
  
  return {
    title: `${baseTitle} (Tydzień ${week}, Faza ${phase})`,
    description: details + exerciseInfo
  };
};

/**
 * Generuje plan treningowy dla konkretnego szablonu
 * @param {string} templateId - Identyfikator szablonu
 * @param {Object} user - Dane użytkownika
 * @param {Object} goal - Cel treningowy
 * @param {number} weeklyDistance - Tygodniowy dystans
 * @returns {Object} Struktura planu treningowego
 */
const getTemplateStructure = (templateId, user, goal, weeklyDistance) => {
  // Wyciągnij poziom i cel z ID szablonu
  const [level, goalType, weeksDuration] = templateId.split('_');
  const totalWeeks = parseInt(weeksDuration.replace('weeks', ''));
  
  // Tu możesz umieścić logikę generowania struktury szablonu
  // Na razie zwracamy pusty obiekt, ponieważ ta funkcja wymaga bardziej rozbudowanej implementacji
  return {
    templateId,
    level,
    goalType,
    totalWeeks,
    weeklyDistance
  };
};

module.exports = {
  workoutTypeDescriptions,
  intervalTemplates,
  hillTemplates,
  tempoTemplates,
  recommendedExercises,
  injuryPreventionExercises,
  generateWorkoutDescription,
  getTemplateStructure
}; 