/**
 * Utility do sprawdzania różnorodności w planach treningowych
 * Wykrywa monotonię i podobieństwa między treningami
 */

/**
 * Sprawdza różnorodność treningów w tygodniu
 * @param {Object} planWeek - Tydzień planu treningowego
 * @returns {Object} Wynik analizy różnorodności
 */
function checkWeekDiversity(planWeek) {
  if (!planWeek || !planWeek.days || planWeek.days.length === 0) {
    return {
      isAcceptable: false,
      diversityScore: 0,
      issues: ['Brak danych treningowych do analizy']
    };
  }

  const workouts = planWeek.days.filter(day => day.workout || day.type);
  
  if (workouts.length < 2) {
    return {
      isAcceptable: true,
      diversityScore: 1,
      issues: []
    };
  }

  const issues = [];
  const similarities = [];
  
  // Sprawdź podobieństwa między treningami
  for (let i = 0; i < workouts.length; i++) {
    for (let j = i + 1; j < workouts.length; j++) {
      const workout1 = workouts[i];
      const workout2 = workouts[j];
      
      const similarity = calculateWorkoutSimilarity(workout1, workout2);
      
      if (similarity.score > 0.7) {
        similarities.push({
          day1: workout1.day_name || workout1.day_of_week,
          day2: workout2.day_name || workout2.day_of_week,
          similarity: similarity.score,
          reasons: similarity.reasons
        });
      }
    }
  }

  // Sprawdź specificzne problemy
  checkDurationVariety(workouts, issues);
  checkDescriptionVariety(workouts, issues);
  checkTypeVariety(workouts, issues);
  
  // Oblicz wskaźnik różnorodności
  const maxSimilarities = (workouts.length * (workouts.length - 1)) / 2;
  const diversityScore = Math.max(0, 1 - (similarities.length / maxSimilarities));
  
  // Dodaj podobieństwa do issues
  similarities.forEach(sim => {
    issues.push(
      `${sim.day1} i ${sim.day2} są zbyt podobne (${Math.round(sim.similarity * 100)}%): ${sim.reasons.join(', ')}`
    );
  });

  return {
    isAcceptable: diversityScore >= 0.4 && issues.length <= 3,
    diversityScore: Math.round(diversityScore * 100) / 100,
    issues,
    similarities,
    analysis: generateDiversityAnalysis(workouts, diversityScore)
  };
}

/**
 * Oblicza podobieństwo między dwoma treningami
 * @param {Object} workout1 - Pierwszy trening
 * @param {Object} workout2 - Drugi trening
 * @returns {Object} Wynik podobieństwa
 */
function calculateWorkoutSimilarity(workout1, workout2) {
  const reasons = [];
  let score = 0;
  
  // Funkcja pomocnicza do pobierania wartości z różnych struktur
  const getValue = (workout, field) => {
    if (workout.workout) {
      // Stara struktura: workout.workout.duration
      return workout.workout[field];
    } else {
      // Nowa struktura: workout.duration_minutes, workout.type, workout.description
      if (field === 'duration') return workout.duration_minutes;
      if (field === 'type') return workout.type;
      if (field === 'description') return workout.description;
    }
    return null;
  };
  
  // Podobieństwo czasu trwania
  const duration1 = getValue(workout1, 'duration');
  const duration2 = getValue(workout2, 'duration');
  if (duration1 === duration2) {
    score += 0.3;
    reasons.push('identyczny czas trwania');
  }
  
  // Podobieństwo opisu
  const description1 = getValue(workout1, 'description');
  const description2 = getValue(workout2, 'description');
  if (description1 === description2) {
    score += 0.5;
    reasons.push('identyczny opis');
  }
  
  // Podobieństwo typu
  const type1 = getValue(workout1, 'type');
  const type2 = getValue(workout2, 'type');
  if (type1 === type2) {
    score += 0.2;
    reasons.push('identyczny typ');
  }
  
  // Podobieństwo wzorców interwałów (wykryj w opisie)
  const intervals1 = extractIntervalPatterns(description1 || '');
  const intervals2 = extractIntervalPatterns(description2 || '');
  
  if (intervals1.length > 0 && intervals2.length > 0) {
    const intervalSimilarity = compareIntervalPatterns(intervals1, intervals2);
    if (intervalSimilarity > 0.8) {
      score += 0.4;
      reasons.push('podobne wzorce interwałów');
    }
  }

  return { score, reasons };
}

/**
 * Wyodrębnia wzorce interwałów z opisu
 * @param {string} description - Opis treningu
 * @returns {Array} Wzorce interwałów
 */
function extractIntervalPatterns(description) {
  const patterns = [];
  
  // Wzorce typu "5x (2 min bieg/3 min marsz)"
  const intervalRegex = /(\d+)x?\s*\(\s*(\d+)\s*min\s+\w+\s*\/\s*(\d+)\s*min\s+\w+\s*\)/gi;
  let match;
  
  while ((match = intervalRegex.exec(description)) !== null) {
    patterns.push({
      repetitions: parseInt(match[1]),
      work: parseInt(match[2]),
      rest: parseInt(match[3])
    });
  }
  
  return patterns;
}

/**
 * Porównuje wzorce interwałów
 * @param {Array} patterns1 - Wzorce pierwszego treningu
 * @param {Array} patterns2 - Wzorce drugiego treningu
 * @returns {number} Podobieństwo (0-1)
 */
function compareIntervalPatterns(patterns1, patterns2) {
  if (patterns1.length !== patterns2.length) {
    return 0;
  }
  
  let similarity = 0;
  
  for (let i = 0; i < patterns1.length; i++) {
    const p1 = patterns1[i];
    const p2 = patterns2[i];
    
    if (p1.repetitions === p2.repetitions && 
        p1.work === p2.work && 
        p1.rest === p2.rest) {
      similarity += 1;
    }
  }
  
  return similarity / patterns1.length;
}

/**
 * Sprawdza różnorodność czasu trwania
 */
function checkDurationVariety(workouts, issues) {
  const durations = workouts.map(w => w.workout ? w.workout.duration : w.duration_minutes);
  const uniqueDurations = [...new Set(durations)];
  
  if (uniqueDurations.length === 1) {
    issues.push('Wszystkie treningi mają identyczny czas trwania');
  } else if (uniqueDurations.length < workouts.length * 0.7) {
    issues.push('Zbyt mała różnorodność czasu trwania treningów');
  }
}

/**
 * Sprawdza różnorodność opisów
 */
function checkDescriptionVariety(workouts, issues) {
  const descriptions = workouts.map(w => w.workout ? w.workout.description : w.description);
  const uniqueDescriptions = [...new Set(descriptions)];
  
  if (uniqueDescriptions.length === 1) {
    issues.push('Wszystkie treningi mają identyczne opisy');
  } else if (uniqueDescriptions.length < workouts.length) {
    issues.push('Niektóre treningi mają identyczne opisy');
  }
}

/**
 * Sprawdza różnorodność typów treningów
 */
function checkTypeVariety(workouts, issues) {
  const types = workouts.map(w => w.workout ? w.workout.type : w.type);
  const uniqueTypes = [...new Set(types)];
  
  if (uniqueTypes.length === 1 && workouts.length > 2) {
    issues.push('Wszystkie treningi mają identyczny typ');
  }
}

/**
 * Generuje analizę różnorodności
 */
function generateDiversityAnalysis(workouts, diversityScore) {
  const analysis = {
    totalWorkouts: workouts.length,
    diversityScore,
    status: diversityScore >= 0.8 ? 'Wysoka różnorodność' : 
            diversityScore >= 0.4 ? 'Średnia różnorodność' : 
            'Niska różnorodność',
    recommendations: []
  };
  
  if (diversityScore < 0.4) {
    analysis.recommendations.push('Zwiększ różnorodność czasów trwania treningów');
    analysis.recommendations.push('Użyj różnych wzorców interwałów dla każdego dnia');
    analysis.recommendations.push('Napisz unikalne opisy dla każdego treningu');
  }
  
  return analysis;
}

/**
 * Szybkie sprawdzenie czy plan jest monotonny
 * @param {Object} plan - Cały plan treningowy
 * @returns {boolean} True jeśli plan jest monotonny
 */
function isMonotonous(plan) {
  if (!plan.plan_weeks || plan.plan_weeks.length === 0) {
    return false;
  }
  
  const firstWeek = plan.plan_weeks[0];
  const result = checkWeekDiversity(firstWeek);
  
  return result.diversityScore < 0.3;
}

module.exports = {
  checkWeekDiversity,
  isMonotonous,
  calculateWorkoutSimilarity,
  extractIntervalPatterns
};