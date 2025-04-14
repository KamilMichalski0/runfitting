/**
 * Moduł do obliczania tempa biegowego
 * Implementuje różne metody obliczania i szacowania temp biegowych na różnych dystansach
 */

/**
 * Konwertuje czas w sekundach na format "mm:ss" lub "h:mm:ss"
 * @param {number} timeInSeconds - Czas w sekundach
 * @returns {string} Sformatowany czas
 */
const formatTime = (timeInSeconds) => {
  if (!timeInSeconds) return '00:00';
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Konwertuje tempo (mm:ss/km) na sekundy na kilometr
 * @param {string} paceString - Tempo w formacie "mm:ss"
 * @returns {number} Tempo w sekundach na kilometr
 */
const paceToSeconds = (paceString) => {
  if (!paceString) return 0;
  
  const parts = paceString.split(':');
  if (parts.length !== 2) {
    throw new Error('Nieprawidłowy format tempa. Oczekiwany format to "mm:ss".');
  }
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds)) {
    throw new Error('Nieprawidłowa wartość liczbowa w tempie.');
  }
  
  return minutes * 60 + seconds;
};

/**
 * Konwertuje tempo w sekundach na kilometr na format "mm:ss/km"
 * @param {number} paceInSeconds - Tempo w sekundach na kilometr
 * @returns {string} Sformatowane tempo
 */
const secondsToPace = (paceInSeconds) => {
  if (!paceInSeconds) return '00:00';
  
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = Math.floor(paceInSeconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}/km`;
};

/**
 * Oblicza VDOT (wskaźnik wydolności) według metody Jacka Danielsa
 * na podstawie czasu na danym dystansie
 * @param {number} distance - Dystans w kilometrach
 * @param {number} timeInSeconds - Czas w sekundach
 * @returns {number} Wartość VDOT
 */
const calculateVDOT = (distance, timeInSeconds) => {
  // Walidacja danych wejściowych
  if (!distance || distance <= 0) {
    throw new Error('Nieprawidłowa wartość dystansu.');
  }
  
  if (!timeInSeconds || timeInSeconds <= 0) {
    throw new Error('Nieprawidłowa wartość czasu.');
  }
  
  // Prędkość w m/s
  const speedInMps = (distance * 1000) / timeInSeconds;
  
  // Obliczenie VO2max z prędkości (przybliżona formuła Danielsa)
  // VO2 = -4.60 + 0.182258 * (prędkość / 0.44704) + 0.000104 * (prędkość / 0.44704)^2
  // Gdzie prędkość jest w m/min, więc musimy przekonwertować
  const speedInMpm = speedInMps * 60;
  const speedInMilesPerMinute = speedInMpm / 1609.344;
  
  // Zastosowanie formuły Danielsa
  const percentVO2max = -4.60 + 0.182258 * (speedInMilesPerMinute * 1609.344 / 0.44704) 
                        + 0.000104 * Math.pow(speedInMilesPerMinute * 1609.344 / 0.44704, 2);
  
  // Przybliżenie wartości VDOT na podstawie % VO2max
  const vdot = Math.round(percentVO2max * (timeInSeconds / 60) / (distance * 0.6214));
  
  return Math.min(Math.max(vdot, 30), 85); // Ograniczamy do sensownego zakresu
};

/**
 * Oblicza tempa treningowe na podstawie VDOT
 * @param {number} vdot - Wartość VDOT biegacza
 * @returns {Object} Zestaw zalecanych temp treningowych
 */
const calculateTrainingPaces = (vdot) => {
  // Walidacja danych wejściowych
  if (!vdot || vdot < 30 || vdot > 85) {
    throw new Error('Nieprawidłowa wartość VDOT. Wartość musi mieścić się w zakresie 30-85.');
  }
  
  // Przybliżone formuły dla temp treningowych na podstawie VDOT
  // Wszystkie tempa są w sekundach na kilometr
  
  // Tempo łatwego biegu (Easy Pace) - (ograniczamy do sensownego zakresu 4:00-8:00 min/km)
  const easyPaceInSeconds = Math.max(Math.min(Math.round(8.4 * (60 / Math.pow(vdot, 0.25))), 480), 240);
  
  // Tempo maratońskie (Marathon Pace)
  const marathonPaceInSeconds = Math.round(7.5 * (60 / Math.pow(vdot, 0.25)));
  
  // Tempo progu mleczanowego (Threshold Pace)
  const thresholdPaceInSeconds = Math.round(6.9 * (60 / Math.pow(vdot, 0.25)));
  
  // Tempo interwałów (Interval Pace) - ~3K-5K pace
  const intervalPaceInSeconds = Math.round(6.3 * (60 / Math.pow(vdot, 0.25)));
  
  // Tempo powtórzeń (Repetition Pace) - Mile pace
  const repetitionPaceInSeconds = Math.round(5.9 * (60 / Math.pow(vdot, 0.25)));
  
  return {
    easy: {
      paceInSeconds: easyPaceInSeconds,
      paceFormatted: secondsToPace(easyPaceInSeconds),
      description: 'Tempo łatwych biegów (70-75% VO2max)'
    },
    marathon: {
      paceInSeconds: marathonPaceInSeconds,
      paceFormatted: secondsToPace(marathonPaceInSeconds),
      description: 'Tempo maratońskie (75-80% VO2max)'
    },
    threshold: {
      paceInSeconds: thresholdPaceInSeconds,
      paceFormatted: secondsToPace(thresholdPaceInSeconds),
      description: 'Tempo progu mleczanowego (83-88% VO2max)'
    },
    interval: {
      paceInSeconds: intervalPaceInSeconds,
      paceFormatted: secondsToPace(intervalPaceInSeconds),
      description: 'Tempo interwałów (95-100% VO2max)'
    },
    repetition: {
      paceInSeconds: repetitionPaceInSeconds,
      paceFormatted: secondsToPace(repetitionPaceInSeconds),
      description: 'Tempo powtórzeń (105-110% VO2max)'
    }
  };
};

/**
 * Szacuje tempo na różnych dystansach na podstawie wyników z danego dystansu
 * @param {number} knownDistance - Znany dystans w kilometrach
 * @param {number} knownTimeInSeconds - Znany czas w sekundach
 * @param {number} targetDistance - Docelowy dystans w kilometrach
 * @returns {number} Szacowany czas na docelowym dystansie w sekundach
 */
const predictTimeForDistance = (knownDistance, knownTimeInSeconds, targetDistance) => {
  // Walidacja danych wejściowych
  if (!knownDistance || knownDistance <= 0) {
    throw new Error('Nieprawidłowa wartość znanego dystansu.');
  }
  
  if (!knownTimeInSeconds || knownTimeInSeconds <= 0) {
    throw new Error('Nieprawidłowa wartość znanego czasu.');
  }
  
  if (!targetDistance || targetDistance <= 0) {
    throw new Error('Nieprawidłowa wartość docelowego dystansu.');
  }
  
  // Obliczenie VDOT
  const vdot = calculateVDOT(knownDistance, knownTimeInSeconds);
  
  // Różne korekty dla różnych dystansów
  let correctionFactor = 1.0;
  
  // Korekty dla dłuższych dystansów
  if (targetDistance > knownDistance) {
    if (targetDistance > 21.1 && knownDistance < 10) {
      correctionFactor = 1.05; // Większa korekta dla półmaratonu przy predykcji z krótszych dystansów
    } else if (targetDistance > 42.2 && knownDistance < 21.1) {
      correctionFactor = 1.08; // Większa korekta dla maratonu przy predykcji z krótszych dystansów
    } else {
      correctionFactor = 1.02; // Standardowa korekta dla dłuższego dystansu
    }
  }
  
  // Wzór Riegel'a: T2 = T1 * (D2/D1)^1.06
  // gdzie:
  // T1 - znany czas
  // D1 - znany dystans
  // T2 - przewidywany czas
  // D2 - docelowy dystans
  // 1.06 - współczynnik korekcji (może być modyfikowany)
  
  // Współczynnik zależy od poziomu zawodnika (VDOT)
  let riegelExponent = 1.06;
  if (vdot > 65) {
    riegelExponent = 1.05; // Dla zaawansowanych biegaczy
  } else if (vdot < 40) {
    riegelExponent = 1.08; // Dla początkujących biegaczy
  }
  
  // Obliczenie przewidywanego czasu
  const predictedTime = knownTimeInSeconds * Math.pow(targetDistance / knownDistance, riegelExponent) * correctionFactor;
  
  return Math.round(predictedTime);
};

/**
 * Generuje pełne tempo dla różnych dystansów
 * @param {Object} personalBests - Rekordy życiowe zawodnika ({fiveK, tenK, halfMarathon, marathon})
 * @returns {Object} Zestaw temp na różne dystanse
 */
const generateRacePaces = (personalBests) => {
  // Walidacja danych wejściowych
  if (!personalBests || Object.keys(personalBests).length === 0) {
    throw new Error('Brak danych o rekordach życiowych.');
  }
  
  // Znajduje najlepszy dostępny wynik do wyliczenia VDOT
  let bestDistance = 0;
  let bestTime = 0;
  
  if (personalBests.fiveK) {
    bestDistance = 5;
    bestTime = personalBests.fiveK;
  }
  
  if (personalBests.tenK) {
    bestDistance = 10;
    bestTime = personalBests.tenK;
  }
  
  if (personalBests.halfMarathon) {
    bestDistance = 21.1;
    bestTime = personalBests.halfMarathon;
  }
  
  if (personalBests.marathon) {
    bestDistance = 42.2;
    bestTime = personalBests.marathon;
  }
  
  if (bestDistance === 0 || bestTime === 0) {
    throw new Error('Brak ważnych danych o rekordach życiowych.');
  }
  
  // Oblicza VDOT na podstawie najlepszego wyniku
  const vdot = calculateVDOT(bestDistance, bestTime);
  
  // Generuje tempa treningowe
  const trainingPaces = calculateTrainingPaces(vdot);
  
  // Generuje przewidywane czasy na dystansach
  const raceTimes = {
    '5K': personalBests.fiveK || predictTimeForDistance(bestDistance, bestTime, 5),
    '10K': personalBests.tenK || predictTimeForDistance(bestDistance, bestTime, 10),
    'HalfMarathon': personalBests.halfMarathon || predictTimeForDistance(bestDistance, bestTime, 21.1),
    'Marathon': personalBests.marathon || predictTimeForDistance(bestDistance, bestTime, 42.2)
  };
  
  // Oblicza tempa na km dla każdego dystansu
  const racePaces = {
    '5K': {
      timeInSeconds: raceTimes['5K'],
      timeFormatted: formatTime(raceTimes['5K']),
      paceInSeconds: Math.round(raceTimes['5K'] / 5),
      paceFormatted: secondsToPace(Math.round(raceTimes['5K'] / 5))
    },
    '10K': {
      timeInSeconds: raceTimes['10K'],
      timeFormatted: formatTime(raceTimes['10K']),
      paceInSeconds: Math.round(raceTimes['10K'] / 10),
      paceFormatted: secondsToPace(Math.round(raceTimes['10K'] / 10))
    },
    'HalfMarathon': {
      timeInSeconds: raceTimes['HalfMarathon'],
      timeFormatted: formatTime(raceTimes['HalfMarathon']),
      paceInSeconds: Math.round(raceTimes['HalfMarathon'] / 21.1),
      paceFormatted: secondsToPace(Math.round(raceTimes['HalfMarathon'] / 21.1))
    },
    'Marathon': {
      timeInSeconds: raceTimes['Marathon'],
      timeFormatted: formatTime(raceTimes['Marathon']),
      paceInSeconds: Math.round(raceTimes['Marathon'] / 42.2),
      paceFormatted: secondsToPace(Math.round(raceTimes['Marathon'] / 42.2))
    }
  };
  
  return {
    vdot,
    trainingPaces,
    raceTimes,
    racePaces
  };
};

/**
 * Oblicza tempo treningowe dla zadanego typu treningu
 * @param {Object} paces - Tempa treningowe użytkownika
 * @param {string} workoutType - Typ treningu ('easy', 'tempo', 'intervals', 'long', etc.)
 * @returns {Object} Zalecane tempo dla tego typu treningu
 */
const getTargetPaceForWorkout = (paces, workoutType) => {
  if (!paces || !paces.trainingPaces) {
    throw new Error('Tempa treningowe nie zostały zdefiniowane.');
  }
  
  const { trainingPaces } = paces;
  
  switch (workoutType) {
    case 'recovery':
      return {
        minPace: Math.round(trainingPaces.easy.paceInSeconds * 1.1),
        maxPace: Math.round(trainingPaces.easy.paceInSeconds * 1.2),
        name: 'Regeneracja',
        description: 'Tempo regeneracyjne, wolniejsze od łatwego tempa'
      };
    case 'easy':
      return {
        minPace: trainingPaces.easy.paceInSeconds,
        maxPace: Math.round(trainingPaces.easy.paceInSeconds * 1.1),
        name: trainingPaces.easy.description,
        description: 'Łatwe tempo treningowe'
      };
    case 'long':
      return {
        minPace: trainingPaces.easy.paceInSeconds,
        maxPace: Math.round(trainingPaces.marathon.paceInSeconds * 1.1),
        name: 'Długi bieg',
        description: 'Tempo dla długich biegów, między łatwym a maratońskim'
      };
    case 'tempo':
      return {
        minPace: trainingPaces.threshold.paceInSeconds,
        maxPace: Math.round(trainingPaces.threshold.paceInSeconds * 1.05),
        name: trainingPaces.threshold.description,
        description: 'Tempo dla biegów tempowych'
      };
    case 'intervals':
      return {
        minPace: trainingPaces.interval.paceInSeconds,
        maxPace: trainingPaces.interval.paceInSeconds,
        name: trainingPaces.interval.description,
        description: 'Tempo dla interwałów'
      };
    case 'fartlek':
      return {
        minPace: trainingPaces.easy.paceInSeconds,
        maxPace: trainingPaces.interval.paceInSeconds,
        name: 'Fartlek',
        description: 'Zmienne tempo od łatwego do interwałowego'
      };
    case 'hills':
      return {
        minPace: Math.round(trainingPaces.threshold.paceInSeconds * 0.9),
        maxPace: trainingPaces.threshold.paceInSeconds,
        name: 'Podbiegi',
        description: 'Tempo dla podbiegów (nieco szybsze niż tempo progowe)'
      };
    case 'race':
      return {
        minPace: paces.racePaces['5K'].paceInSeconds,
        maxPace: paces.racePaces['5K'].paceInSeconds,
        name: 'Tempo wyścigowe',
        description: 'Tempo na zawody'
      };
    case 'rest':
      return {
        minPace: 0,
        maxPace: 0,
        name: 'Odpoczynek',
        description: 'Dzień odpoczynku bez treningu biegowego'
      };
    default:
      return {
        minPace: trainingPaces.easy.paceInSeconds,
        maxPace: Math.round(trainingPaces.easy.paceInSeconds * 1.1),
        name: 'Standard',
        description: 'Standardowe tempo treningowe'
      };
  }
};

module.exports = {
  formatTime,
  paceToSeconds,
  secondsToPace,
  calculateVDOT,
  calculateTrainingPaces,
  predictTimeForDistance,
  generateRacePaces,
  getTargetPaceForWorkout
}; 