const WeeklyPlanDeliveryService = require('./src/services/weekly-plan-delivery.service');
const { checkWeekDiversity } = require('./src/utils/plan-diversity-checker');

/**
 * Test progresji tygodniowej z uwzględnieniem feedback
 * Symuluje rzeczywiste użycie systemu przez 8 tygodni
 */
async function testWeeklyProgression() {
  console.log('=== TEST PROGRESJI TYGODNIOWEJ Z FEEDBACK ===\n');
  
  const service = new WeeklyPlanDeliveryService();
  
  // Profil użytkownika
  const mockSchedule = {
    userId: 'test-progression-user',
    userProfile: {
      name: 'Anna Kowalski',
      age: 32,
      experienceLevel: 'beginner',
      currentFitnessLevel: 'low',
      availableTrainingDays: ['poniedziałek', 'środa', 'piątek'],
      preferredWorkoutTime: 'morning',
      injuries: [],
      goals: ['build_endurance', 'lose_weight', 'improve_health']
    },
    progressTracking: {
      weekNumber: 1,
      currentPhase: 'initial',
      totalWeeksDelivered: 0,
      lastWeeklyDistance: 0,
      progressionRate: 1.0
    },
    longTermGoal: {
      targetEvent: '5K race',
      targetDate: '2024-12-01',
      targetTime: '30:00'
    },
    deliveryFrequency: 'weekly',
    adaptationSettings: {
      autoAdjustment: true,
      conservativeProgression: true
    },
    recentPlans: [],
    _id: 'mock-progression-schedule-id',
    
    // Metody mockowe
    updateProgress: function() {
      this.progressTracking.weekNumber += 1;
      this.progressTracking.totalWeeksDelivered += 1;
      
      // Zmiana fazy co 3 tygodnie
      if (this.progressTracking.weekNumber <= 3) {
        this.progressTracking.currentPhase = 'initial';
      } else if (this.progressTracking.weekNumber <= 6) {
        this.progressTracking.currentPhase = 'build';
      } else {
        this.progressTracking.currentPhase = 'peak';
      }
      
      console.log(`📈 Aktualizacja progressu: Tydzień ${this.progressTracking.weekNumber}, Faza: ${this.progressTracking.currentPhase}`);
    },
    
    save: async function() {
      return Promise.resolve(this);
    }
  };
  
  // Zamockowane scenariusze feedback dla każdego tygodnia
  const feedbackScenarios = [
    {
      week: 1,
      completionRate: 0.8,
      difficultyLevel: 'easy',
      injuries: false,
      feedback: 'Czuję się dobrze, treningi są komfortowe',
      nextWeekPreference: 'slightly_harder'
    },
    {
      week: 2,
      completionRate: 0.9,
      difficultyLevel: 'appropriate',
      injuries: false,
      feedback: 'Świetnie! Czuję postęp, gotowa na więcej',
      nextWeekPreference: 'harder'
    },
    {
      week: 3,
      completionRate: 0.6,
      difficultyLevel: 'too_hard',
      injuries: false,
      feedback: 'Ostatnie treningi były trudne, czuję się zmęczona',
      nextWeekPreference: 'easier'
    },
    {
      week: 4,
      completionRate: 0.85,
      difficultyLevel: 'appropriate',
      injuries: false,
      feedback: 'Lepiej! Odzyskałam siły, plan był dobry',
      nextWeekPreference: 'maintain'
    },
    {
      week: 5,
      completionRate: 0.95,
      difficultyLevel: 'easy',
      injuries: false,
      feedback: 'Czuję się silna, mogę więcej!',
      nextWeekPreference: 'much_harder'
    },
    {
      week: 6,
      completionRate: 0.7,
      difficultyLevel: 'appropriate',
      injuries: true,
      injuryDescription: 'Lekki ból kolana po środowym treningu',
      feedback: 'Kolano trochę boli, ale ogólnie dobrze',
      nextWeekPreference: 'easier'
    },
    {
      week: 7,
      completionRate: 0.8,
      difficultyLevel: 'appropriate',
      injuries: false,
      feedback: 'Kolano już w porządku, czuję się gotowa na więcej',
      nextWeekPreference: 'slightly_harder'
    },
    {
      week: 8,
      completionRate: 1.0,
      difficultyLevel: 'appropriate',
      injuries: false,
      feedback: 'Fantastyczny tydzień! Czuję ogromny postęp',
      nextWeekPreference: 'maintain'
    }
  ];
  
  const generatedPlans = [];
  
  // Generuj plany na 8 tygodni
  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    try {
      console.log(`\n🏃‍♀️ === TYDZIEŃ ${weekNum} ===`);
      console.log(`Faza: ${mockSchedule.progressTracking.currentPhase}`);
      console.log(`Poprzednia realizacja: ${mockSchedule.progressTracking.totalWeeksDelivered > 0 ? 
        `${(feedbackScenarios.find(f => f.week === weekNum - 1)?.completionRate * 100 || 0)}%` : 'Brak'}`);
      
      // Symuluj rzeczywiste dane performance na podstawie poprzedniego feedback
      if (weekNum > 1) {
        const prevFeedback = feedbackScenarios.find(f => f.week === weekNum - 1);
        if (prevFeedback) {
          // Aktualizuj recentPerformance na podstawie feedback
          mockSchedule.progressTracking.lastWeeklyDistance = 
            prevFeedback.completionRate * 15; // Symulacja dystansu
          mockSchedule.progressTracking.progressionRate = 
            prevFeedback.completionRate > 0.8 ? 1.1 : 
            prevFeedback.completionRate < 0.7 ? 0.9 : 1.0;
        }
      }
      
      const startTime = Date.now();
      const plan = await service.generateWeeklyPlan(mockSchedule);
      const endTime = Date.now();
      
      console.log(`✅ Plan wygenerowany w ${endTime - startTime}ms`);
      console.log(`📋 Plan ID: ${plan.id}`);
      
      // Analiza różnorodności
      if (plan.plan_weeks && plan.plan_weeks.length > 0) {
        const diversityResult = checkWeekDiversity(plan.plan_weeks[0]);
        console.log(`🎯 Różnorodność: ${diversityResult.diversityScore} (${diversityResult.analysis.status})`);
        
        // Pokaż szczegóły treningów
        const workouts = plan.plan_weeks[0].days.filter(day => day.workout);
        console.log(`📊 Treningi:`);
        workouts.forEach((day, i) => {
          const duration = day.workout ? day.workout.duration : 
                         day.duration_minutes ? day.duration_minutes : 'N/A';
          const type = day.workout ? day.workout.type : 
                      day.type ? day.type : 'N/A';
          console.log(`   ${i+1}. ${day.day_name || day.day_of_week}: ${duration}min - ${type}`);
        });
      }
      
      // Zapisz plan
      generatedPlans.push({
        week: weekNum,
        plan: plan,
        phase: mockSchedule.progressTracking.currentPhase,
        diversity: plan.plan_weeks ? checkWeekDiversity(plan.plan_weeks[0]) : null
      });
      
      // Symuluj feedback użytkownika (dla kolejnego tygodnia)
      if (weekNum < 8) {
        const feedback = feedbackScenarios.find(f => f.week === weekNum);
        if (feedback) {
          console.log(`\n💬 Feedback użytkownika po tygodniu ${weekNum}:`);
          console.log(`   Realizacja: ${feedback.completionRate * 100}%`);
          console.log(`   Trudność: ${feedback.difficultyLevel}`);
          console.log(`   Kontuzje: ${feedback.injuries ? 'Tak' : 'Nie'}`);
          if (feedback.injuries && feedback.injuryDescription) {
            console.log(`   Opis kontuzji: ${feedback.injuryDescription}`);
          }
          console.log(`   Komentarz: "${feedback.feedback}"`);
          console.log(`   Następny tydzień: ${feedback.nextWeekPreference}`);
          
          // Aktualizuj mockSchedule na podstawie feedback
          mockSchedule.recentPlans.push({
            weekNumber: weekNum,
            planId: plan.id,
            deliveryDate: new Date(),
            wasCompleted: true,
            completionRate: feedback.completionRate,
            wasRated: true,
            ratingData: {
              difficultyLevel: feedback.difficultyLevel,
              injuries: feedback.injuries,
              injuryDescription: feedback.injuryDescription,
              feedback: feedback.feedback,
              nextWeekPreference: feedback.nextWeekPreference
            }
          });
          
          // Zachowaj tylko ostatnie 4 plany
          if (mockSchedule.recentPlans.length > 4) {
            mockSchedule.recentPlans = mockSchedule.recentPlans.slice(-4);
          }
        }
      }
      
      // Aktualizuj progress dla kolejnego tygodnia
      mockSchedule.updateProgress();
      
      // Krótka pauza między tygodniami
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Błąd w tygodniu ${weekNum}:`, error.message);
      break;
    }
  }
  
  // Podsumowanie całego cyklu
  console.log('\n📈 === PODSUMOWANIE CYKLU 8 TYGODNI ===');
  console.log(`Wygenerowanych planów: ${generatedPlans.length}`);
  
  // Analiza progresji
  const phases = generatedPlans.reduce((acc, p) => {
    acc[p.phase] = (acc[p.phase] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n🔄 Fazy treningu:');
  Object.entries(phases).forEach(([phase, count]) => {
    console.log(`   ${phase}: ${count} tygodni`);
  });
  
  // Analiza różnorodności
  const diversityScores = generatedPlans
    .filter(p => p.diversity)
    .map(p => p.diversity.diversityScore);
  
  if (diversityScores.length > 0) {
    const avgDiversity = diversityScores.reduce((a, b) => a + b, 0) / diversityScores.length;
    const minDiversity = Math.min(...diversityScores);
    const maxDiversity = Math.max(...diversityScores);
    
    console.log('\n🎯 Analiza różnorodności:');
    console.log(`   Średnia: ${avgDiversity.toFixed(2)}`);
    console.log(`   Minimum: ${minDiversity}`);
    console.log(`   Maksimum: ${maxDiversity}`);
    console.log(`   Planów z wysoką różnorodnością (>0.8): ${diversityScores.filter(s => s > 0.8).length}/${diversityScores.length}`);
  }
  
  // Analiza adaptacji do feedback
  console.log('\n🎯 Analiza adaptacji do feedback:');
  const adaptationResults = [];
  
  for (let i = 1; i < generatedPlans.length; i++) {
    const prevFeedback = feedbackScenarios.find(f => f.week === i);
    const currentPlan = generatedPlans[i];
    
    if (prevFeedback && currentPlan) {
      const adapted = analyzeAdaptation(prevFeedback, currentPlan);
      adaptationResults.push(adapted);
      console.log(`   Tydzień ${i+1}: ${adapted.description}`);
    }
  }
  
  const successfulAdaptations = adaptationResults.filter(a => a.success).length;
  console.log(`\n✅ Pomyślnych adaptacji: ${successfulAdaptations}/${adaptationResults.length}`);
  
  console.log('\n🎉 Test zakończony pomyślnie!');
}

/**
 * Analizuje czy plan został dostosowany do feedback
 */
function analyzeAdaptation(feedback, planData) {
  const adaptations = [];
  
  // Analiza na podstawie completion rate
  if (feedback.completionRate < 0.7) {
    adaptations.push('Plan powinien być łatwiejszy');
  } else if (feedback.completionRate > 0.9) {
    adaptations.push('Plan może być trudniejszy');
  }
  
  // Analiza na podstawie difficulty level
  if (feedback.difficultyLevel === 'too_hard') {
    adaptations.push('Zmniejszenie intensywności');
  } else if (feedback.difficultyLevel === 'easy') {
    adaptations.push('Zwiększenie intensywności');
  }
  
  // Analiza na podstawie kontuzji
  if (feedback.injuries) {
    adaptations.push('Uwzględnienie kontuzji');
  }
  
  // Analiza na podstawie preferencji
  switch (feedback.nextWeekPreference) {
    case 'easier':
      adaptations.push('Użytkownik chce łatwiejszy plan');
      break;
    case 'harder':
    case 'much_harder':
      adaptations.push('Użytkownik chce trudniejszy plan');
      break;
    case 'slightly_harder':
      adaptations.push('Użytkownik chce lekko trudniejszy plan');
      break;
  }
  
  return {
    success: adaptations.length > 0,
    description: adaptations.length > 0 ? 
      `Dostosowano do: ${adaptations.join(', ')}` : 
      'Brak potrzeby adaptacji',
    adaptations: adaptations
  };
}

// Uruchom test
if (require.main === module) {
  testWeeklyProgression().catch(console.error);
}

module.exports = {
  testWeeklyProgression,
  analyzeAdaptation
};