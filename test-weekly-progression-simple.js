const { checkWeekDiversity } = require('./src/utils/plan-diversity-checker');

/**
 * Uproszczony test progresji tygodniowej z symulacją AI
 * Bez połączenia z bazą danych - tylko logika progresji
 */
function testWeeklyProgressionSimple() {
  console.log('=== UPROSZCZONY TEST PROGRESJI TYGODNIOWEJ ===\n');
  
  // Profil użytkownika
  const user = {
    name: 'Anna Kowalski',
    age: 32,
    level: 'beginner',
    goal: '5K race in 30:00',
    weekNumber: 1,
    phase: 'initial',
    progressionRate: 1.0,
    recentFeedback: []
  };
  
  // Scenariusze feedback
  const feedbackScenarios = [
    { week: 1, completion: 0.8, difficulty: 'easy', preference: 'slightly_harder' },
    { week: 2, completion: 0.9, difficulty: 'appropriate', preference: 'harder' },
    { week: 3, completion: 0.6, difficulty: 'too_hard', preference: 'easier' },
    { week: 4, completion: 0.85, difficulty: 'appropriate', preference: 'maintain' },
    { week: 5, completion: 0.95, difficulty: 'easy', preference: 'much_harder' },
    { week: 6, completion: 0.7, difficulty: 'appropriate', preference: 'easier', injury: true },
    { week: 7, completion: 0.8, difficulty: 'appropriate', preference: 'slightly_harder' },
    { week: 8, completion: 1.0, difficulty: 'appropriate', preference: 'maintain' }
  ];
  
  const generatedPlans = [];
  
  for (let week = 1; week <= 8; week++) {
    console.log(`\n🏃‍♀️ === TYDZIEŃ ${week} ===`);
    
    // Zmiana fazy
    if (week <= 3) user.phase = 'initial';
    else if (week <= 6) user.phase = 'build';
    else user.phase = 'peak';
    
    console.log(`📊 Faza: ${user.phase}`);
    console.log(`📈 Progression Rate: ${user.progressionRate.toFixed(2)}`);
    
    // Poprzedni feedback
    if (week > 1) {
      const prevFeedback = feedbackScenarios.find(f => f.week === week - 1);
      console.log(`📋 Poprzednia realizacja: ${prevFeedback.completion * 100}%`);
      console.log(`🎯 Trudność: ${prevFeedback.difficulty}`);
      if (prevFeedback.injury) console.log(`🏥 Kontuzja: Tak`);
    }
    
    // Generuj plan na podstawie aktualnego stanu
    const plan = generateWeeklyPlan(user, week);
    
    // Sprawdź różnorodność
    const diversity = checkWeekDiversity(plan);
    console.log(`✅ Plan wygenerowany - ID: ${plan.id}`);
    console.log(`🎯 Różnorodność: ${diversity.diversityScore} (${diversity.analysis.status})`);
    
    // Pokaż treningi
    console.log(`📊 Treningi:`);
    plan.days.forEach((day, i) => {
      const duration = day.workout ? day.workout.duration : day.duration_minutes;
      const type = day.workout ? day.workout.type : day.type;
      console.log(`   ${i+1}. ${day.day_name || day.day_of_week}: ${duration}min - ${type}`);
    });
    
    // Zapisz plan
    generatedPlans.push({
      week: week,
      plan: plan,
      phase: user.phase,
      diversity: diversity
    });
    
    // Symuluj feedback i aktualizuj użytkownika
    const feedback = feedbackScenarios.find(f => f.week === week);
    if (feedback) {
      console.log(`\n💬 Feedback użytkownika:`);
      console.log(`   Realizacja: ${feedback.completion * 100}%`);
      console.log(`   Trudność: ${feedback.difficulty}`);
      console.log(`   Preferencja: ${feedback.preference}`);
      
      // Aktualizuj progression rate na podstawie feedback
      if (feedback.completion > 0.9) {
        user.progressionRate *= 1.1; // Zwiększ trudność
      } else if (feedback.completion < 0.7) {
        user.progressionRate *= 0.9; // Zmniejsz trudność
      }
      
      user.recentFeedback.push(feedback);
      if (user.recentFeedback.length > 3) {
        user.recentFeedback = user.recentFeedback.slice(-3);
      }
    }
    
    user.weekNumber = week + 1;
  }
  
  // Podsumowanie
  console.log('\n📈 === PODSUMOWANIE PROGRESJI ===');
  console.log(`Wygenerowanych planów: ${generatedPlans.length}`);
  
  // Analiza faz
  const phases = generatedPlans.reduce((acc, p) => {
    acc[p.phase] = (acc[p.phase] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n🔄 Fazy:');
  Object.entries(phases).forEach(([phase, count]) => {
    console.log(`   ${phase}: ${count} tygodni`);
  });
  
  // Analiza różnorodności
  const diversityScores = generatedPlans.map(p => p.diversity.diversityScore);
  const avgDiversity = diversityScores.reduce((a, b) => a + b, 0) / diversityScores.length;
  
  console.log('\n🎯 Analiza różnorodności:');
  console.log(`   Średnia: ${avgDiversity.toFixed(2)}`);
  console.log(`   Wysokiej różnorodności (>0.8): ${diversityScores.filter(s => s > 0.8).length}/${diversityScores.length}`);
  
  // Analiza progresji trudności
  console.log('\n📊 Progresja trudności:');
  generatedPlans.forEach(p => {
    const avgDuration = p.plan.days.reduce((sum, day) => {
      const duration = day.workout ? day.workout.duration : day.duration_minutes;
      return sum + duration;
    }, 0) / p.plan.days.length;
    console.log(`   Tydzień ${p.week}: ${avgDuration.toFixed(0)}min średnio`);
  });
  
  // Analiza adaptacji
  console.log('\n🎯 Analiza adaptacji do feedback:');
  let adaptations = 0;
  for (let i = 1; i < generatedPlans.length; i++) {
    const prevFeedback = feedbackScenarios.find(f => f.week === i);
    const currentPlan = generatedPlans[i];
    const prevPlan = generatedPlans[i-1];
    
    if (prevFeedback && currentPlan && prevPlan) {
      const adapted = analyzeAdaptation(prevFeedback, prevPlan, currentPlan);
      if (adapted) adaptations++;
      console.log(`   Tydzień ${i+1}: ${adapted ? '✅ Dostosowano' : '❌ Brak adaptacji'}`);
    }
  }
  
  console.log(`\n✅ Pomyślnych adaptacji: ${adaptations}/${generatedPlans.length - 1}`);
  console.log('\n🎉 Test zakończony pomyślnie!');
}

/**
 * Symuluje generowanie planu tygodniowego
 */
function generateWeeklyPlan(user, week) {
  const baseDurations = {
    'initial': [15, 20, 25],
    'build': [20, 25, 30],
    'peak': [25, 30, 35]
  };
  
  const baseTypes = {
    'initial': ['bieg interwałowy z krótkim wysiłkiem', 'bieg interwałowy z umiarkowanym wysiłkiem', 'bieg progresywny'],
    'build': ['bieg tempowy', 'interwały średnie', 'bieg długi'],
    'peak': ['interwały szybkie', 'bieg z akcentami', 'bieg wyścigowy']
  };
  
  const durations = baseDurations[user.phase];
  const types = baseTypes[user.phase];
  
  // Dostosuj trudność na podstawie progression rate
  const adjustedDurations = durations.map(d => Math.round(d * user.progressionRate));
  
  // Dostosuj na podstawie ostatniego feedback
  if (user.recentFeedback.length > 0) {
    const lastFeedback = user.recentFeedback[user.recentFeedback.length - 1];
    if (lastFeedback.difficulty === 'too_hard') {
      adjustedDurations.forEach((d, i) => adjustedDurations[i] = Math.max(15, d - 5));
    } else if (lastFeedback.difficulty === 'easy') {
      adjustedDurations.forEach((d, i) => adjustedDurations[i] = d + 5);
    }
  }
  
  return {
    id: `plan_${user.name.replace(' ', '_').toLowerCase()}_week_${week}`,
    days: [
      {
        day_name: 'poniedziałek',
        duration_minutes: adjustedDurations[0],
        type: types[0],
        description: `${types[0]} w fazie ${user.phase} - ${adjustedDurations[0]} minut treningowej aktywności`
      },
      {
        day_name: 'środa',
        duration_minutes: adjustedDurations[1],
        type: types[1],
        description: `${types[1]} w fazie ${user.phase} - ${adjustedDurations[1]} minut treningowej aktywności`
      },
      {
        day_name: 'piątek',
        duration_minutes: adjustedDurations[2],
        type: types[2],
        description: `${types[2]} w fazie ${user.phase} - ${adjustedDurations[2]} minut treningowej aktywności`
      }
    ]
  };
}

/**
 * Analizuje czy plan został dostosowany do feedback
 */
function analyzeAdaptation(feedback, prevPlan, currentPlan) {
  const prevAvgDuration = prevPlan.plan.days.reduce((sum, day) => sum + day.duration_minutes, 0) / prevPlan.plan.days.length;
  const currentAvgDuration = currentPlan.plan.days.reduce((sum, day) => sum + day.duration_minutes, 0) / currentPlan.plan.days.length;
  
  // Sprawdź czy trudność została dostosowana
  if (feedback.difficulty === 'too_hard' && currentAvgDuration < prevAvgDuration) {
    return true; // Zmniejszono trudność
  }
  
  if (feedback.difficulty === 'easy' && currentAvgDuration > prevAvgDuration) {
    return true; // Zwiększono trudność
  }
  
  if (feedback.completion < 0.7 && currentAvgDuration <= prevAvgDuration) {
    return true; // Nie zwiększano trudności przy niskiej realizacji
  }
  
  if (feedback.completion > 0.9 && currentAvgDuration >= prevAvgDuration) {
    return true; // Zwiększono lub utrzymano trudność przy dobrej realizacji
  }
  
  return false;
}

// Uruchom test
if (require.main === module) {
  testWeeklyProgressionSimple();
}

module.exports = { testWeeklyProgressionSimple };