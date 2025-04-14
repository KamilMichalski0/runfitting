const TrainingAlgorithms = require('../algorithms/training-parameters');
const planTemplates = require('../templates/plan-templates');

class FallbackPlanGeneratorService {
  /**
   * Generuje plan awaryjny, gdy Gemini API jest niedostępne
   * @param {Object} userData - Dane użytkownika
   * @param {Object} calculatedParams - Obliczone parametry treningowe
   * @returns {Object} - Wygenerowany plan treningowy
   */
  generateFallbackPlan(userData, calculatedParams) {
    // Wybierz odpowiedni szablon planu
    const templateKey = `${userData.goalType}_${userData.level}_${userData.trainingDays}days`;
    let template = planTemplates[templateKey];
    
    // Jeśli nie ma dokładnego dopasowania, użyj najbardziej zbliżonego szablonu
    if (!template) {
      // Logika wyboru najbardziej zbliżonego szablonu
      const fallbackKey = Object.keys(planTemplates).find(key => 
        key.includes(userData.goalType) && key.includes(userData.level)
      ) || Object.keys(planTemplates)[0];
      
      template = planTemplates[fallbackKey];
    }
    
    // Dostosuj szablon do użytkownika
    const plan = this._adaptTemplateToPlan(template, userData, calculatedParams);
    
    return {
      summary: `Ten plan został wygenerowany automatycznie dla biegacza na poziomie ${userData.level}, 
                przygotowującego się do ${userData.goalType}, z ${userData.trainingDays} dniami treningowymi w tygodniu.`,
      plan: plan,
      recommendations: {
        technique: "Skup się na utrzymaniu prawidłowej postawy i techniki biegowej, szczególnie gdy czujesz zmęczenie.",
        nutrition: "Zadbaj o odpowiednie nawodnienie i odżywianie, szczególnie przed i po dłuższych treningach.",
        recovery: "Dbaj o regenerację - sen, rolowanie, stretching są kluczowe dla progresu."
      }
    };
  }
  
  /**
   * Adaptuje szablon planu do indywidualnych parametrów użytkownika
   * @private
   * @param {Object} template - Szablon planu
   * @param {Object} userData - Dane użytkownika
   * @param {Object} calculatedParams - Obliczone parametry treningowe
   * @returns {Array} - Tablice tygodni planu
   */
  _adaptTemplateToPlan(template, userData, calculatedParams) {
    // Tu implementujemy logikę dostosowania szablonu do użytkownika
    // Np. skalowanie dystansów, dostosowanie temp, dodanie ćwiczeń prewencyjnych
    
    return template.weeks.map((week, index) => {
      // Dostosuj całkowity dystans tygodniowy
      const scaleFactor = userData.weeklyDistance / week.baseDistance;
      
      return {
        weekNumber: index + 1,
        totalDistance: Math.round(week.baseDistance * scaleFactor),
        days: week.days.map(day => {
          // Określ strefę tętna na podstawie rodzaju treningu
          const hrZone = this._getHeartRateZoneForWorkoutType(day.workoutType, calculatedParams.heartRateZones);
          
          // Określ tempo na podstawie rodzaju treningu
          const pace = this._getPaceForWorkoutType(day.workoutType, calculatedParams.trainingPaces);
          
          // Dobierz ćwiczenia wspomagające
          const supportExercises = this._getSupportExercisesForUser(userData, day.workoutType);
          
          return {
            dayOfWeek: day.dayOfWeek,
            workoutType: day.workoutType,
            description: day.description,
            distance: Math.round(day.distance * scaleFactor * 10) / 10,
            duration: day.duration,
            targetPace: pace,
            targetHeartRate: hrZone,
            supportExercises: supportExercises
          };
        })
      };
    });
  }
  
  // Pomocnicze metody do dostosowywania planu...
  
  _getHeartRateZoneForWorkoutType(workoutType, zones) {
    // Mapowanie typów treningów na strefy tętna
    const workoutToZone = {
      easy: zones.zone2,
      recovery: zones.zone1,
      tempo: zones.zone3,
      threshold: zones.zone4,
      interval: zones.zone5,
      long: zones.zone2
    };
    
    return workoutToZone[workoutType] || zones.zone2;
  }
  
  _getPaceForWorkoutType(workoutType, paces) {
    // Mapowanie typów treningów na tempa
    const workoutToPace = {
      easy: paces.easy,
      recovery: { minPerKm: paces.easy.minPerKm, secPerKm: paces.easy.secPerKm + 30 },
      tempo: paces.threshold,
      threshold: paces.threshold,
      interval: paces.interval,
      long: { minPerKm: paces.easy.minPerKm, secPerKm: paces.easy.secPerKm + 15 }
    };
    
    return workoutToPace[workoutType] || paces.easy;
  }
  
  _getSupportExercisesForUser(userData, workoutType) {
    // Podstawowy zestaw ćwiczeń wspomagających
    const basicExercises = [
      { name: "Przysiady", sets: 3, reps: 12 },
      { name: "Plank", sets: 3, duration: 30 }
    ];
    
    // Dodatkowe ćwiczenia prewencyjne na podstawie historii kontuzji
    const preventiveExercises = [];
    if (userData.injuries && userData.injuries.length > 0) {
      userData.injuries.forEach(injury => {
        if (injury.type === 'ITBS') {
          preventiveExercises.push(
            { name: "Odwodzenie nogi w leżeniu bokiem", sets: 3, reps: 15 },
            { name: "Muszla z gumą", sets: 3, reps: 15 }
          );
        } else if (injury.type === 'AchillesTendonitis') {
          preventiveExercises.push(
            { name: "Wspięcia na palce", sets: 3, reps: 15 },
            { name: "Rozciąganie łydek", sets: 3, duration: 30 }
          );
        }
        // Więcej warunków dla innych typów kontuzji
      });
    }
    
    // Połączenie podstawowych ćwiczeń z prewencyjnymi
    return [...basicExercises, ...preventiveExercises];
  }
}

module.exports = new FallbackPlanGeneratorService(); 