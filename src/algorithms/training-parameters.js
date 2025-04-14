/**
 * Oblicza maksymalne tętno na podstawie wieku
 * @param {number} age - Wiek w latach
 * @returns {number} - Szacowane maksymalne tętno
 */
function calculateMaxHeartRate(age) {
  if (!age || age < 10 || age > 100) {
    throw new Error('Nieprawidłowa wartość wieku');
  }
  return Math.round(208 - 0.7 * age); // Metoda Tanaka
}

/**
 * Oblicza strefy tętna na podstawie maksymalnego tętna i tętna spoczynkowego
 * @param {number} maxHR - Maksymalne tętno
 * @param {number} restingHR - Tętno spoczynkowe
 * @returns {Object} - Strefy tętna
 */
function calculateHeartRateZones(maxHR, restingHR) {
  if (!maxHR || !restingHR || maxHR <= restingHR) {
    throw new Error('Nieprawidłowe wartości tętna');
  }

  const hrr = maxHR - restingHR; // Heart Rate Reserve

  return {
    zone1: {
      min: restingHR,
      max: Math.round(restingHR + 0.6 * hrr)
    },
    zone2: {
      min: Math.round(restingHR + 0.6 * hrr) + 1,
      max: Math.round(restingHR + 0.7 * hrr)
    },
    zone3: {
      min: Math.round(restingHR + 0.7 * hrr) + 1,
      max: Math.round(restingHR + 0.8 * hrr)
    },
    zone4: {
      min: Math.round(restingHR + 0.8 * hrr) + 1,
      max: Math.round(restingHR + 0.9 * hrr)
    },
    zone5: {
      min: Math.round(restingHR + 0.9 * hrr) + 1,
      max: maxHR
    }
  };
}

/**
 * Szacuje VDOT na podstawie czasu na danym dystansie
 * @param {number} distance - Dystans w kilometrach
 * @param {number} timeInMinutes - Czas w minutach
 * @returns {number} - Szacowany VDOT
 */
function estimateVDOT(distance, timeInMinutes) {
  if (!distance || !timeInMinutes || distance <= 0 || timeInMinutes <= 0) {
    throw new Error('Nieprawidłowe wartości dystansu lub czasu');
  }

  // Uproszczona formuła VDOT
  const pace = timeInMinutes / distance; // min/km
  return Math.round(1000 / (pace * 0.2));
}

/**
 * Oblicza zalecane tempa treningowe na podstawie VDOT
 * @param {number} vdot - Wartość VDOT
 * @returns {Object} - Zalecane tempa treningowe
 */
function calculateTrainingPaces(vdot) {
  if (!vdot || vdot <= 0) {
    throw new Error('Nieprawidłowa wartość VDOT');
  }

  // Obliczanie tempa na podstawie VDOT
  const easyPace = 1000 / (vdot * 0.2) * 1.2; // 20% wolniej niż tempo VDOT
  const thresholdPace = 1000 / (vdot * 0.2) * 0.9; // 10% szybciej niż tempo VDOT
  const intervalPace = 1000 / (vdot * 0.2) * 0.8; // 20% szybciej niż tempo VDOT

  return {
    easy: {
      minPerKm: Math.floor(easyPace),
      secPerKm: Math.round((easyPace - Math.floor(easyPace)) * 60)
    },
    threshold: {
      minPerKm: Math.floor(thresholdPace),
      secPerKm: Math.round((thresholdPace - Math.floor(thresholdPace)) * 60)
    },
    interval: {
      minPerKm: Math.floor(intervalPace),
      secPerKm: Math.round((intervalPace - Math.floor(intervalPace)) * 60)
    }
  };
}

/**
 * Oblicza przewidywany czas na docelowym dystansie
 * @param {number} vdot - Wartość VDOT
 * @param {number} targetDistance - Docelowy dystans w kilometrach
 * @returns {Object} - Przewidywany czas
 */
function predictRaceTime(vdot, targetDistance) {
  if (!vdot || !targetDistance || vdot <= 0 || targetDistance <= 0) {
    throw new Error('Nieprawidłowe wartości VDOT lub dystansu');
  }

  const pace = 1000 / (vdot * 0.2); // min/km
  const totalMinutes = pace * targetDistance;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  return {
    hours,
    minutes,
    totalMinutes: Math.round(totalMinutes)
  };
}

/**
 * Oblicza zalecany kilometraż tygodniowy
 * @param {string} level - Poziom zaawansowania (beginner, intermediate, advanced)
 * @param {number} targetDistance - Docelowy dystans w kilometrach
 * @returns {Object} - Zalecany kilometraż
 */
function calculateWeeklyMileage(level, targetDistance) {
  if (!level || !targetDistance || targetDistance <= 0) {
    throw new Error('Nieprawidłowe wartości poziomu lub dystansu');
  }

  const baseMileage = {
    beginner: targetDistance * 2,
    intermediate: targetDistance * 3,
    advanced: targetDistance * 4
  };

  return {
    min: Math.round(baseMileage[level] * 0.8),
    max: Math.round(baseMileage[level] * 1.2),
    recommended: Math.round(baseMileage[level])
  };
}

module.exports = {
  calculateMaxHeartRate,
  calculateHeartRateZones,
  estimateVDOT,
  calculateTrainingPaces,
  predictRaceTime,
  calculateWeeklyMileage
}; 