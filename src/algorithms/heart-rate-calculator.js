/**
 * Moduł do obliczania stref tętna dla biegaczy
 * Implementuje różne metody obliczania stref tętna używane w treningu biegowym
 */

/**
 * Oblicza maksymalne tętno metodą Tanaka
 * @param {number} age - Wiek użytkownika w latach
 * @returns {number} Szacowane maksymalne tętno
 */
const calculateMaxHeartRate = (age) => {
  // Walidacja danych wejściowych
  if (!age || age < 10 || age > 100) {
    throw new Error('Nieprawidłowa wartość wieku. Wiek musi być pomiędzy 10 a 100 lat.');
  }
  
  // Metoda Tanaka: HRmax = 208 - 0.7 * wiek
  // Uznawana za dokładniejszą niż starsza formuła 220 - wiek
  return Math.round(208 - 0.7 * age);
};

/**
 * Oblicza strefy tętna według metody Karvonena (Heart Rate Reserve)
 * @param {number} age - Wiek użytkownika w latach
 * @param {number} restingHR - Tętno spoczynkowe użytkownika
 * @returns {Object} Strefy tętna od 1 do 5
 */
const calculateHeartRateZones = (age, restingHR) => {
  // Walidacja danych wejściowych
  if (!age || age < 10 || age > 100) {
    throw new Error('Nieprawidłowa wartość wieku. Wiek musi być pomiędzy 10 a 100 lat.');
  }
  
  if (!restingHR || restingHR < 30 || restingHR > 100) {
    throw new Error('Nieprawidłowa wartość tętna spoczynkowego. Tętno musi być pomiędzy 30 a 100 uderzeń na minutę.');
  }
  
  // Obliczenia
  const maxHR = calculateMaxHeartRate(age);
  const hrr = maxHR - restingHR; // Heart Rate Reserve
  
  // Strefy tętna według metody Karvonena (% rezerwy tętna + tętno spoczynkowe)
  return {
    zone1: { // Regeneracja/bardzo łatwe (50-60% HRR)
      min: restingHR, 
      max: Math.round(restingHR + 0.6 * hrr),
      name: 'Regeneracja',
      description: 'Bardzo łatwe tempo, idealne dla treningów regeneracyjnych i rozgrzewki'
    },
    zone2: { // Łatwe/aerobowe (60-70% HRR)
      min: Math.round(restingHR + 0.6 * hrr) + 1, 
      max: Math.round(restingHR + 0.7 * hrr),
      name: 'Aerobowy łatwy',
      description: 'Tempo konwersacyjne, bazowe dla treningów wytrzymałościowych'
    },
    zone3: { // Umiarkowane/aerobowe (70-80% HRR)
      min: Math.round(restingHR + 0.7 * hrr) + 1, 
      max: Math.round(restingHR + 0.8 * hrr),
      name: 'Aerobowy umiarkowany',
      description: 'Komfortowe tempo, idealne dla długich biegów'
    },
    zone4: { // Próg anaerobowy (80-90% HRR)
      min: Math.round(restingHR + 0.8 * hrr) + 1, 
      max: Math.round(restingHR + 0.9 * hrr),
      name: 'Próg anaerobowy',
      description: 'Tempo na granicy komfortu, używane do treningów tempa i progowych'
    },
    zone5: { // Maksymalny wysiłek (90-100% HRR)
      min: Math.round(restingHR + 0.9 * hrr) + 1, 
      max: maxHR,
      name: 'Maksymalny wysiłek',
      description: 'Wysokie tempo używane dla krótkich interwałów i sprintów'
    }
  };
};

/**
 * Oblicza strefy tętna metodą procentową od tętna maksymalnego
 * @param {number} age - Wiek użytkownika w latach
 * @returns {Object} Strefy tętna od 1 do 5
 */
const calculateHeartRateZonesByPercentage = (age) => {
  // Walidacja danych wejściowych
  if (!age || age < 10 || age > 100) {
    throw new Error('Nieprawidłowa wartość wieku. Wiek musi być pomiędzy 10 a 100 lat.');
  }
  
  // Obliczenia
  const maxHR = calculateMaxHeartRate(age);
  
  // Strefy tętna jako procent HRmax
  return {
    zone1: { // Regeneracja (50-60% HRmax)
      min: Math.round(maxHR * 0.5), 
      max: Math.round(maxHR * 0.6),
      name: 'Regeneracja',
      description: 'Bardzo łatwe tempo, idealne dla treningów regeneracyjnych i rozgrzewki'
    },
    zone2: { // Łatwe/aerobowe (60-70% HRmax)
      min: Math.round(maxHR * 0.6) + 1, 
      max: Math.round(maxHR * 0.7),
      name: 'Aerobowy łatwy',
      description: 'Tempo konwersacyjne, bazowe dla treningów wytrzymałościowych'
    },
    zone3: { // Umiarkowane/aerobowe (70-80% HRmax)
      min: Math.round(maxHR * 0.7) + 1, 
      max: Math.round(maxHR * 0.8),
      name: 'Aerobowy umiarkowany',
      description: 'Komfortowe tempo, idealne dla długich biegów'
    },
    zone4: { // Próg anaerobowy (80-90% HRmax)
      min: Math.round(maxHR * 0.8) + 1, 
      max: Math.round(maxHR * 0.9),
      name: 'Próg anaerobowy',
      description: 'Tempo na granicy komfortu, używane do treningów tempa i progowych'
    },
    zone5: { // Maksymalny wysiłek (90-100% HRmax)
      min: Math.round(maxHR * 0.9) + 1, 
      max: maxHR,
      name: 'Maksymalny wysiłek',
      description: 'Wysokie tempo używane dla krótkich interwałów i sprintów'
    }
  };
};

/**
 * Oblicza tętno treningowe dla zadanego typu treningu
 * @param {Object} zones - Strefy tętna użytkownika
 * @param {string} workoutType - Typ treningu ('easy', 'tempo', 'intervals', 'long', etc.)
 * @returns {Object} Zalecane minimum i maksimum tętna dla tego typu treningu
 */
const getTargetHeartRateForWorkout = (zones, workoutType) => {
  if (!zones) {
    throw new Error('Strefy tętna nie zostały zdefiniowane.');
  }
  
  switch (workoutType) {
    case 'recovery':
      return zones.zone1;
    case 'easy':
      return {
        min: zones.zone2.min,
        max: zones.zone2.max,
        name: zones.zone2.name,
        description: zones.zone2.description
      };
    case 'long':
      return {
        min: zones.zone2.min,
        max: zones.zone3.max,
        name: 'Długi bieg',
        description: 'Łączony zakres stref 2-3 dla długich biegów'
      };
    case 'tempo':
      return {
        min: zones.zone3.min,
        max: zones.zone4.max,
        name: 'Tempo',
        description: 'Zakres stref 3-4 używany do biegów tempowych'
      };
    case 'intervals':
      return {
        min: zones.zone4.min,
        max: zones.zone5.max,
        name: 'Interwały',
        description: 'Wyższe strefy (4-5) używane do treningów interwałowych'
      };
    case 'fartlek':
      return {
        min: zones.zone2.min,
        max: zones.zone4.max,
        name: 'Fartlek',
        description: 'Zmienne strefy od 2 do 4 w zależności od fazy fartleka'
      };
    case 'hills':
      return {
        min: zones.zone3.min,
        max: zones.zone5.max,
        name: 'Podbiegi',
        description: 'Wyższe strefy (3-5) używane do treningów podbiegowych'
      };
    case 'rest':
      return {
        min: 0,
        max: 0,
        name: 'Odpoczynek',
        description: 'Dzień odpoczynku bez treningu biegowego'
      };
    default:
      return {
        min: zones.zone2.min,
        max: zones.zone3.max,
        name: 'Standard',
        description: 'Standardowy zakres treningowy'
      };
  }
};

module.exports = {
  calculateMaxHeartRate,
  calculateHeartRateZones,
  calculateHeartRateZonesByPercentage,
  getTargetHeartRateForWorkout
}; 