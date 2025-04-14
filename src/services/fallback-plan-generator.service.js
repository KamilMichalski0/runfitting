const { logInfo, logError } = require('../utils/logger');
const AppError = require('../utils/app-error');
const TrainingAlgorithms = require('../algorithms/training-parameters');
const planTemplates = require('../templates/plan-templates');

/**
 * Zapasowy serwis do generowania planów treningowych, gdy API Gemini jest niedostępne
 */
class FallbackPlanGeneratorService {
  /**
   * Generuje plan treningowy na podstawie danych użytkownika
   * wykorzystując proste szablony i reguły
   * @param {Object} userData - Dane użytkownika z formularza
   * @returns {Object} Wygenerowany plan treningowy
   */
  async generateFallbackPlan(userData) {
    try {
      logInfo('Używanie zapasowego generatora planów treningowych');
      
      // Pobieranie danych w obu formatach
      const firstName = userData.firstName || userData.name || 'Biegacz';
      const experienceLevel = userData.experienceLevel || userData.level || 'początkujący';
      const mainGoal = userData.mainGoal || userData.goal || 'poprawa kondycji';
      const trainingDaysPerWeek = userData.trainingDaysPerWeek || userData.daysPerWeek || 3;
      
      // Generowanie planu na podstawie poziomu doświadczenia i celu
      const plan = this.generatePlanByTemplate(experienceLevel, mainGoal, trainingDaysPerWeek);
      
      return {
        userName: firstName,
        userLevel: experienceLevel,
        mainGoal: mainGoal,
        description: `Plan treningowy dla biegacza ${experienceLevel}, cel: ${mainGoal}`,
        weeks: plan.weeks,
        tips: plan.tips,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logError('Błąd podczas generowania zapasowego planu treningowego', error);
      throw new AppError('Nie udało się wygenerować planu treningowego', 500);
    }
  }

  /**
   * Generuje plan treningowy w oparciu o szablon
   * @param {string} level - Poziom doświadczenia
   * @param {string} goal - Główny cel
   * @param {number} daysPerWeek - Liczba dni treningowych w tygodniu
   * @returns {Object} Wygenerowany plan treningowy
   */
  generatePlanByTemplate(level, goal, daysPerWeek) {
    // Przygotowanie podstawowego planu
    const weeks = [];
    const tips = this.getTipsByLevel(level);
    
    // Dopasowanie szablonu do poziomu i celu
    let weeklyTemplate;
    
    if (level.toLowerCase().includes('początkujący')) {
      weeklyTemplate = this.getBeginnerTemplate(goal, daysPerWeek);
    } else if (level.toLowerCase().includes('średni') || level.toLowerCase().includes('średnio')) {
      weeklyTemplate = this.getIntermediateTemplate(goal, daysPerWeek);
    } else {
      weeklyTemplate = this.getAdvancedTemplate(goal, daysPerWeek);
    }
    
    // Generowanie 6 tygodni planu
    for (let weekNumber = 1; weekNumber <= 6; weekNumber++) {
      const weekPlan = {
        week: weekNumber,
        days: this.generateWeekPlan(weeklyTemplate, weekNumber, daysPerWeek)
      };
      
      weeks.push(weekPlan);
    }
    
    return { weeks, tips };
  }

  /**
   * Generuje plan na pojedynczy tydzień
   * @param {Array} template - Szablon tygodniowy
   * @param {number} weekNumber - Numer tygodnia
   * @param {number} daysPerWeek - Liczba dni treningowych w tygodniu
   * @returns {Array} Plan na tydzień
   */
  generateWeekPlan(template, weekNumber, daysPerWeek) {
    const weekPlan = [];
    const availableTemplate = template.slice(0, daysPerWeek);
    
    // Dodajemy progresję wraz z kolejnymi tygodniami
    const progressFactor = 1 + (weekNumber - 1) * 0.1;
    
    for (let day = 1; day <= availableTemplate.length; day++) {
      const trainingDay = availableTemplate[day - 1];
      
      // Progresja dystansu/czasu
      let distance = trainingDay.distance;
      if (distance && distance.includes('km')) {
        const baseDistance = parseFloat(distance);
        if (!isNaN(baseDistance)) {
          const newDistance = Math.round(baseDistance * progressFactor * 10) / 10;
          distance = `${newDistance} km`;
        }
      }
      
      let time = trainingDay.time;
      if (time && time.includes('min')) {
        const baseTime = parseInt(time);
        if (!isNaN(baseTime)) {
          const newTime = Math.round(baseTime * progressFactor);
          time = `${newTime} min`;
        }
      }
      
      weekPlan.push({
        day,
        type: trainingDay.type,
        distance: distance,
        time: time,
        intensity: trainingDay.intensity,
        goal: trainingDay.goal
      });
    }
    
    return weekPlan;
  }

  /**
   * Zwraca szablon dla początkujących
   * @param {string} goal - Główny cel
   * @param {number} daysPerWeek - Liczba dni treningowych w tygodniu
   * @returns {Array} Szablon treningowy
   */
  getBeginnerTemplate(goal, daysPerWeek) {
    const templates = [
      {
        type: 'Łagodny bieg',
        distance: '3 km',
        time: '20 min',
        intensity: 'Niska (strefa 2)',
        goal: 'Budowanie bazy wytrzymałościowej'
      },
      {
        type: 'Bieg interwałowy',
        distance: '2.5 km',
        time: '25 min',
        intensity: 'Zmienne tempo',
        goal: 'Poprawa wydolności sercowo-naczyniowej'
      },
      {
        type: 'Odpoczynek aktywny',
        distance: '',
        time: '30 min',
        intensity: 'Bardzo niska',
        goal: 'Regeneracja'
      },
      {
        type: 'Marsz/Bieg',
        distance: '4 km',
        time: '40 min',
        intensity: 'Niska (strefa 1-2)',
        goal: 'Budowanie wytrzymałości'
      },
      {
        type: 'Długi bieg',
        distance: '5 km',
        time: '35 min',
        intensity: 'Niska do średniej',
        goal: 'Zwiększanie wytrzymałości'
      },
      {
        type: 'Trening siłowy',
        distance: '',
        time: '30 min',
        intensity: 'Średnia',
        goal: 'Wzmacnianie mięśni'
      },
      {
        type: 'Pełny odpoczynek',
        distance: '',
        time: '',
        intensity: 'Brak',
        goal: 'Regeneracja'
      }
    ];
    
    // Dostosowanie do celu
    if (goal.toLowerCase().includes('maraton') || goal.toLowerCase().includes('półmaraton')) {
      templates[0].distance = '4 km';
      templates[4].distance = '6 km';
    } else if (goal.toLowerCase().includes('5k') || goal.toLowerCase().includes('10k')) {
      templates[1].type = 'Bieg tempowy';
      templates[1].intensity = 'Średnia (strefa 3)';
    }
    
    return templates;
  }

  /**
   * Zwraca szablon dla średnio zaawansowanych
   * @param {string} goal - Główny cel
   * @param {number} daysPerWeek - Liczba dni treningowych w tygodniu
   * @returns {Array} Szablon treningowy
   */
  getIntermediateTemplate(goal, daysPerWeek) {
    const templates = [
      {
        type: 'Bieg tempowy',
        distance: '5 km',
        time: '30 min',
        intensity: 'Średnia (strefa 3)',
        goal: 'Poprawa tempa'
      },
      {
        type: 'Interwały',
        distance: '6 km',
        time: '40 min',
        intensity: 'Wysoka (strefa 4)',
        goal: 'Poprawa VO2max'
      },
      {
        type: 'Bieg regeneracyjny',
        distance: '4 km',
        time: '25 min',
        intensity: 'Niska (strefa 2)',
        goal: 'Regeneracja'
      },
      {
        type: 'Fartlek',
        distance: '8 km',
        time: '45 min',
        intensity: 'Zmienna',
        goal: 'Urozmaicenie treningu'
      },
      {
        type: 'Długi bieg',
        distance: '12 km',
        time: '70 min',
        intensity: 'Niska do średniej',
        goal: 'Budowanie wytrzymałości'
      },
      {
        type: 'Trening siłowy',
        distance: '',
        time: '45 min',
        intensity: 'Średnia do wysokiej',
        goal: 'Wzmacnianie mięśni'
      },
      {
        type: 'Odpoczynek',
        distance: '',
        time: '',
        intensity: 'Brak',
        goal: 'Regeneracja'
      }
    ];
    
    // Dostosowanie do celu
    if (goal.toLowerCase().includes('maraton')) {
      templates[4].distance = '16 km';
      templates[4].time = '90 min';
    } else if (goal.toLowerCase().includes('półmaraton')) {
      templates[4].distance = '14 km';
      templates[4].time = '80 min';
    } else if (goal.toLowerCase().includes('5k')) {
      templates[1].distance = '5 km';
      templates[1].intensity = 'Bardzo wysoka (strefa 5)';
    }
    
    return templates;
  }

  /**
   * Zwraca szablon dla zaawansowanych
   * @param {string} goal - Główny cel
   * @param {number} daysPerWeek - Liczba dni treningowych w tygodniu
   * @returns {Array} Szablon treningowy
   */
  getAdvancedTemplate(goal, daysPerWeek) {
    const templates = [
      {
        type: 'Bieg tempowy',
        distance: '8 km',
        time: '40 min',
        intensity: 'Tempo wyścigu',
        goal: 'Utrzymanie tempa wyścigowego'
      },
      {
        type: 'Interwały',
        distance: '10 km',
        time: '50 min',
        intensity: 'Maksymalna (strefa 5)',
        goal: 'Poprawa VO2max i progów'
      },
      {
        type: 'Bieg regeneracyjny',
        distance: '6 km',
        time: '30 min',
        intensity: 'Niska (strefa 2)',
        goal: 'Regeneracja'
      },
      {
        type: 'Długie interwały/powtórzenia',
        distance: '12 km',
        time: '60 min',
        intensity: 'Wysoka/Zmienna',
        goal: 'Budowanie wytrzymałości szybkościowej'
      },
      {
        type: 'Długi bieg',
        distance: '20 km',
        time: '100 min',
        intensity: 'Średnia (strefa 3)',
        goal: 'Budowanie wytrzymałości'
      },
      {
        type: 'Trening siłowy i stabilizacyjny',
        distance: '',
        time: '60 min',
        intensity: 'Średnia do wysokiej',
        goal: 'Wzmacnianie mięśni i prewencja kontuzji'
      },
      {
        type: 'Odpoczynek lub bieg regeneracyjny',
        distance: '4 km',
        time: '25 min',
        intensity: 'Bardzo niska',
        goal: 'Regeneracja'
      }
    ];
    
    // Dostosowanie do celu
    if (goal.toLowerCase().includes('maraton')) {
      templates[4].distance = '30 km';
      templates[4].time = '150 min';
    } else if (goal.toLowerCase().includes('półmaraton')) {
      templates[4].distance = '22 km';
      templates[4].time = '110 min';
    } else if (goal.toLowerCase().includes('5k') || goal.toLowerCase().includes('10k')) {
      templates[1].type = 'Krótkie interwały';
      templates[1].intensity = 'Maksymalna (strefa 5)';
      templates[4].distance = '15 km';
    }
    
    return templates;
  }

  /**
   * Zwraca wskazówki treningowe odpowiednie dla poziomu
   * @param {string} level - Poziom doświadczenia
   * @returns {string} Wskazówki treningowe
   */
  getTipsByLevel(level) {
    if (level.toLowerCase().includes('początkujący')) {
      return `
1. Zwiększaj dystans stopniowo, maksymalnie o 10% tygodniowo.
2. Słuchaj swojego ciała i nie ignoruj sygnałów zmęczenia.
3. Inwestuj w dobre buty biegowe - to Twoja najważniejsza inwestycja.
4. Pamiętaj o nawodnieniu przed, w trakcie i po treningu.
5. Dni odpoczynku są równie ważne jak dni treningowe.
6. Rozgrzewka i rozciąganie po treningu pomogą zapobiec kontuzjom.`;
    } else if (level.toLowerCase().includes('średni') || level.toLowerCase().includes('średnio')) {
      return `
1. Wprowadź różnorodność w swoje treningi - interwały, tempa, długie biegi.
2. Zwracaj uwagę na technikę biegu, szczególnie przy wyższych intensywnościach.
3. Włącz trening siłowy 1-2 razy w tygodniu dla wzmocnienia mięśni.
4. Monitoruj swoje tętno podczas różnych typów treningów.
5. Zaplanuj mniejsze zawody jako sprawdziany formy.
6. Regeneracja jest kluczowa - rozważ rolowanie, masaż i pracę z fizjoterapeutą.`;
    } else {
      return `
1. Potraktuj trening jako całość - równie ważne są odżywianie, regeneracja i sen.
2. Periodyzacja treningu pomoże osiągnąć szczyt formy na najważniejsze zawody.
3. Rozważ zaawansowaną diagnostykę (badania wydolnościowe, analiza składu ciała).
4. Monitoruj oznaki przetrenowania - spadek wydolności, zmęczenie, pogorszenie snu.
5. Wprowadź trening uzupełniający - pływanie, rower, trening funkcjonalny.
6. Zwróć uwagę na dietę przedstartową i strategie żywienia podczas zawodów.`;
    }
  }

  /**
   * Przekształca poziom zaawansowania na przyjazną dla użytkownika nazwę
   * @param {string} level - Poziom zaawansowania (beginner, intermediate, advanced)
   * @returns {string} - Nazwa poziomu po polsku
   */
  getLevelName(level) {
    switch(level.toLowerCase()) {
      case 'beginner':
        return 'dla początkujących';
      case 'intermediate':
        return 'dla średnio zaawansowanych';
      case 'advanced':
        return 'dla zaawansowanych';
      default:
        return 'treningowy';
    }
  }

  /**
   * Przekształca cel treningowy na przyjazną dla użytkownika nazwę
   * @param {string} goal - Cel treningowy (np. 5k, 10k, half_marathon)
   * @returns {string} - Nazwa celu po polsku
   */
  getGoalName(goal) {
    switch(goal.toLowerCase()) {
      case '5k':
        return '5 km';
      case '10k':
        return '10 km';
      case 'half_marathon':
        return 'półmaraton';
      case 'marathon':
        return 'maraton';
      case 'trail':
        return 'bieg terenowy';
      case 'speed':
        return 'poprawa szybkości';
      case 'endurance':
        return 'budowanie wytrzymałości';
      case 'weight_loss':
        return 'redukcja wagi';
      default:
        return goal;
    }
  }

  /**
   * Określa liczbę tygodni planu na podstawie celu treningowego
   * @param {string} goal - Cel treningowy
   * @returns {number} - Liczba tygodni planu
   */
  getWeekCountForGoal(goal) {
    switch(goal.toLowerCase()) {
      case '5k':
        return 8;
      case '10k':
        return 10;
      case 'half_marathon':
        return 12;
      case 'marathon':
        return 16;
      case 'ultra_marathon':
        return 20;
      case 'trail':
        return 12;
      case 'speed':
      case 'endurance':
      case 'weight_loss':
        return 8;
      default:
        return 12;
    }
  }

  /**
   * Generuje opis dla danego tygodnia planu
   * @param {number} weekNumber - Numer tygodnia
   * @param {number} totalWeeks - Całkowita liczba tygodni
   * @param {string} goal - Cel treningowy
   * @returns {string} - Opis tygodnia
   */
  getWeekDescription(weekNumber, totalWeeks, goal) {
    // Określ fazę treningu
    let phase;
    const weekPercentage = weekNumber / totalWeeks;
    
    if (weekPercentage <= 0.3) {
      phase = 'początkowa';
    } else if (weekPercentage <= 0.7) {
      phase = 'budowania';
    } else if (weekPercentage <= 0.9) {
      phase = 'szczytowa';
    } else {
      phase = 'tapering';
    }
    
    // Generuj opis w zależności od fazy i celu
    if (phase === 'początkowa') {
      return `Tydzień wprowadzający. Celem jest aklimatyzacja organizmu do regularnego treningu i budowanie podstaw.`;
    } else if (phase === 'budowania') {
      if (goal.toLowerCase().includes('maraton') || goal.toLowerCase().includes('półmaraton')) {
        return `Tydzień budowania wytrzymałości. Nacisk na rozwój zdolności do długotrwałego wysiłku.`;
      } else if (goal.toLowerCase().includes('5k') || goal.toLowerCase().includes('10k')) {
        return `Tydzień budowania szybkości. Skupienie na tempowych treningach i interwałach.`;
      } else {
        return `Tydzień budowania kluczowych zdolności. Równowaga między wytrzymałością a szybkością.`;
      }
    } else if (phase === 'szczytowa') {
      return `Tydzień szczytowy. Największa objętość i intensywność treningów, ostatnie szlify przed fazą tapering.`;
    } else {
      return `Tydzień tapering. Zmniejszona objętość treningu, zachowana intensywność, przygotowanie do zawodów/testu.`;
    }
  }

  /**
   * Generuje treningi na konkretny tydzień
   * @param {Array} template - Szablon treningowy
   * @param {number} weekNumber - Numer tygodnia
   * @param {number} totalWeeks - Całkowita liczba tygodni
   * @param {Object} formData - Dane z formularza
   * @returns {Array} - Lista treningów
   */
  generateWorkoutsForWeek(template, weekNumber, totalWeeks, formData) {
    const workouts = [];
    const progressFactor = 1 + (weekNumber - 1) * 0.1;
    
    // Generuj treningi na podstawie szablonu
    for (let i = 0; i < Math.min(template.length, formData.trainingDaysPerWeek); i++) {
      const baseWorkout = template[i];
      
      // Oblicz progres dystansu
      let distance = baseWorkout.distance;
      if (distance && distance.includes('km')) {
        const baseDistance = parseFloat(distance);
        if (!isNaN(baseDistance)) {
          const adjustedDistance = Math.round(baseDistance * progressFactor * 10) / 10;
          distance = `${adjustedDistance} km`;
        }
      }
      
      // Dostosuj czas treningu
      let time = baseWorkout.time;
      if (time && time.includes('min')) {
        const baseTime = parseInt(time);
        if (!isNaN(baseTime)) {
          const adjustedTime = Math.round(baseTime * progressFactor);
          time = `${adjustedTime} min`;
        }
      }
      
      // Stwórz obiekt treningu
      workouts.push({
        day: i + 1,
        type: baseWorkout.type,
        description: `${baseWorkout.type} - ${baseWorkout.goal}`,
        distance: distance,
        duration: time,
        intensity: baseWorkout.intensity,
        completed: false
      });
    }
    
    return workouts;
  }

  /**
   * Generuje zalecenia dotyczące ćwiczeń uzupełniających
   * @param {Object} formData - Dane z formularza
   * @returns {Array} - Lista ćwiczeń uzupełniających
   */
  generateSupplementaryExercises(formData) {
    const exercises = [
      {
        name: "Plank",
        description: "Utrzymaj pozycję deski, napinając brzuch i pośladki. Utrzymuj ciało w linii prostej.",
        frequency: "3 serie po 30-60 sekund, 2-3 razy w tygodniu"
      },
      {
        name: "Przysiady",
        description: "Wykonaj przysiady z ciężarem ciała, utrzymując proste plecy i kolana nad stopami.",
        frequency: "3 serie po 15 powtórzeń, 2-3 razy w tygodniu"
      },
      {
        name: "Wypady",
        description: "Wykonaj wykroki do przodu, utrzymując tułów w pionie i kolano tylnej nogi blisko podłoża.",
        frequency: "3 serie po 10 powtórzeń na każdą nogę, 2 razy w tygodniu"
      }
    ];
    
    // Dodaj dodatkowe ćwiczenia w zależności od celu
    if (formData.mainGoal && formData.mainGoal.toLowerCase().includes('maraton')) {
      exercises.push({
        name: "Wzmacnianie łydek",
        description: "Wspięcia na palce stojąc na krawędzi stopnia. Powolny ruch w górę i w dół.",
        frequency: "3 serie po 20 powtórzeń, 2 razy w tygodniu"
      });
    }
    
    // Dodaj ćwiczenia zapobiegające kontuzjom, jeśli użytkownik miał kontuzje
    if (formData.hasInjuries) {
      exercises.push({
        name: "Rolowanie mięśni",
        description: "Użyj wałka do masażu, aby rozluźnić napięte mięśnie nóg, zwłaszcza łydki, uda i pasmo biodrowo-piszczelowe.",
        frequency: "5-10 minut po każdym treningu"
      });
    }
    
    return exercises;
  }

  /**
   * Generuje plan awaryjny, gdy Gemini API jest niedostępne
   * @param {Object} formData - Dane z formularza biegowego
   * @returns {Object} - Wygenerowany plan treningowy
   */
  async generateFallbackPlan(formData) {
    try {
      logInfo('Generowanie planu zapasowego', { userId: formData.userId });
      
      // Walidacja danych wejściowych
      if (!formData.experienceLevel || !formData.mainGoal || !formData.trainingDaysPerWeek) {
        throw new AppError('Brak wymaganych danych do wygenerowania planu', 400);
      }
      
      // Podstawowe dane planu
      const planData = {
        name: `Plan treningowy dla ${formData.firstName || 'biegacza'}`,
        description: `Plan ${this.getLevelName(formData.experienceLevel)} z celem: ${this.getGoalName(formData.mainGoal)}`,
        type: formData.mainGoal,
        weeks: [],
        userId: formData.userId
      };
      
      // Wybór szablonu w zależności od poziomu zaawansowania
      let template;
      
      switch(formData.experienceLevel) {
        case 'beginner':
          template = this.getBeginnerTemplate(formData.mainGoal, formData.trainingDaysPerWeek);
          break;
        case 'intermediate':
          template = this.getIntermediateTemplate(formData.mainGoal, formData.trainingDaysPerWeek);
          break;
        case 'advanced':
          template = this.getAdvancedTemplate(formData.mainGoal, formData.trainingDaysPerWeek);
          break;
        default:
          template = this.getBeginnerTemplate(formData.mainGoal, formData.trainingDaysPerWeek);
      }
      
      // Generowanie tygodni treningowych
      const weekCount = this.getWeekCountForGoal(formData.mainGoal);
      
      for (let i = 0; i < weekCount; i++) {
        const weekNumber = i + 1;
        const weekData = {
          weekNumber,
          title: `Tydzień ${weekNumber}`,
          description: this.getWeekDescription(weekNumber, weekCount, formData.mainGoal),
          workouts: this.generateWorkoutsForWeek(template, weekNumber, weekCount, formData)
        };
        
        planData.weeks.push(weekData);
      }
      
      // Dodanie zaleceń dotyczących ćwiczeń uzupełniających
      planData.supplementaryExercises = this.generateSupplementaryExercises(formData);
      
      return planData;
    } catch (error) {
      logError('Błąd generowania planu zapasowego', error);
      throw error;
    }
  }
  
  /**
   * Formatuje tygodnie treningu
   * @param {Array} weeks - Tygodnie z szablonu
   * @returns {Array} - Sformatowane tygodnie
   */
  _formatWeeks(weeks) {
    return weeks.map((week, index) => {
      return {
        week_num: index + 1,
        focus: week.focus,
        days: week.days.map(day => {
          return {
            day_name: day.dayName,
            workout: day.workout,
            completed: false
          };
        })
      };
    });
  }
  
  /**
   * Dostosowuje szablon do użytkownika
   * @param {Object} template - Szablon planu
   * @param {Object} userData - Dane użytkownika
   * @param {Object} calculatedParams - Obliczone parametry
   * @returns {Object} - Dostosowany szablon
   */
  _adaptTemplate(template, userData, calculatedParams) {
    // Kopia szablonu
    const adaptedTemplate = JSON.parse(JSON.stringify(template));
    
    // Dostosowanie długości planu
    if (adaptedTemplate.weeks.length > 12) {
      adaptedTemplate.weeks = adaptedTemplate.weeks.slice(0, 12);
    }
    
    // Dostosowanie intensywności/objętości treningów
    adaptedTemplate.weeks.forEach(week => {
      week.days.forEach(day => {
        // Zastępowanie zmiennych w opisie treningu
        if (day.workout.includes("[DISTANCE]")) {
          const baseDistance = userData.weeklyKilometers / userData.trainingDays;
          
          if (day.type === "long") {
            day.workout = day.workout.replace("[DISTANCE]", Math.round(baseDistance * 1.5) + " km");
          } else if (day.type === "easy") {
            day.workout = day.workout.replace("[DISTANCE]", Math.round(baseDistance * 0.8) + " km");
          } else {
            day.workout = day.workout.replace("[DISTANCE]", Math.round(baseDistance) + " km");
          }
        }
        
        // Dostosowanie stref tętna, jeśli są dostępne
        if (day.workout.includes("[HEART_RATE_ZONE]") && calculatedParams.heartRateZones) {
          const zones = calculatedParams.heartRateZones;
          
          if (day.type === "easy") {
            day.workout = day.workout.replace("[HEART_RATE_ZONE]", `${zones.zone2.min}-${zones.zone2.max} uderzeń/min`);
          } else if (day.type === "tempo") {
            day.workout = day.workout.replace("[HEART_RATE_ZONE]", `${zones.zone3.min}-${zones.zone3.max} uderzeń/min`);
          } else if (day.type === "interval") {
            day.workout = day.workout.replace("[HEART_RATE_ZONE]", `${zones.zone4.min}-${zones.zone4.max} uderzeń/min`);
          } else {
            day.workout = day.workout.replace("[HEART_RATE_ZONE]", "");
          }
        } else {
          day.workout = day.workout.replace("[HEART_RATE_ZONE]", "");
        }
      });
    });
    
    return adaptedTemplate;
  }
  
  /**
   * Przygotowuje ćwiczenia wspomagające na podstawie danych użytkownika
   * @param {Object} formData - Dane z formularza
   * @returns {Object} - Ćwiczenia wspomagające
   */
  _getSupportExercises(formData) {
    const basicExercises = [
      { 
        name: "Plank", 
        description: "Utrzymaj pozycję deski, opierając się na przedramionach i palcach stóp. Utrzymuj proste plecy i napięty brzuch.", 
        sets_reps: "3 x 30-60 sekund" 
      },
      { 
        name: "Przysiady", 
        description: "Wykonaj przysiad, utrzymując ciężar na piętach i kolana w linii ze stopami.", 
        sets_reps: "3 x 15 powtórzeń" 
      },
      { 
        name: "Mostek biodrowy", 
        description: "Leżąc na plecach, unieś biodra w górę, napinając pośladki.", 
        sets_reps: "3 x 12 powtórzeń" 
      }
    ];
    
    const preventiveExercises = [];
    
    // Dodaj ćwiczenia rehabilitacyjne, jeśli są potrzebne
    if (formData.hasInjuries) {
      if (formData.pastInjuries && formData.pastInjuries.length > 0) {
        formData.pastInjuries.forEach(injury => {
          if (injury.type === 'itbs') {
            preventiveExercises.push(
              { 
                name: "Odwodzenie nogi w leżeniu bokiem", 
                description: "Leżąc na boku, unieś wyprostowaną górną nogę do góry, kontrolując ruch.", 
                sets_reps: "3 x 15 powtórzeń na każdą stronę" 
              },
              { 
                name: "Muszla z gumą", 
                description: "Usiądź z kolanami złączonymi, stopami rozstawionymi, z gumą powyżej kolan. Otwieraj kolana na boki, pokonując opór gumy.", 
                sets_reps: "3 x 15 powtórzeń" 
              }
            );
          } else if (injury.type === 'runners_knee') {
            preventiveExercises.push(
              { 
                name: "Step-down", 
                description: "Stojąc na podwyższeniu na jednej nodze, wykonaj powolne opuszczanie drugiej nogi do podłoża.", 
                sets_reps: "3 x 10 powtórzeń na każdą nogę" 
              },
              { 
                name: "Wzmacnianie VMO", 
                description: "Wykonaj półprzysiad z piłką między kolanami, ściskając ją podczas ruchu.", 
                sets_reps: "3 x 15 powtórzeń" 
              }
            );
          } else if (injury.type === 'achilles_issues') {
          preventiveExercises.push(
              { 
                name: "Excentric heel drops", 
                description: "Stojąc na krawędzi stopnia, unieś się na palcach, a następnie powoli opuść pięty poniżej poziomu stopnia.", 
                sets_reps: "3 x 15 powtórzeń" 
              },
              { 
                name: "Rozciąganie łydek", 
                description: "Oprzyj się o ścianę, wystawiając nogę do tyłu z wyprostowanym kolanem. Utrzymuj piętę na podłodze.", 
                sets_reps: "3 x 30 sekund na każdą nogę" 
              }
            );
          } else if (injury.type === 'plantar_fasciitis') {
          preventiveExercises.push(
              { 
                name: "Rolowanie stopy", 
                description: "Roluj stopę na piłce tenisowej lub specjalnym wałku przez 2-3 minuty.", 
                sets_reps: "2-3 minuty na każdą stopę" 
              },
              { 
                name: "Zginanie palców stóp", 
                description: "Zbieraj ręcznik palcami stóp, przyciągając go do siebie.", 
                sets_reps: "3 x 15 powtórzeń na każdą stopę" 
              }
            );
          }
        });
      }
      
      if (formData.currentPain && formData.currentPain.exists) {
        preventiveExercises.push({ 
          name: "Mobilizacja stawów", 
          description: "Wykonaj delikatne krążenia i ruchy mobilizujące we wszystkich stawach przed treningiem.", 
          sets_reps: "1-2 minuty na każdy staw" 
        });
      }
    }
    
    // Dodaj ćwiczenia na technikę biegową, jeśli użytkownik ma takie cele
    if (formData.runningTechniqueGoals && formData.runningTechniqueGoals.length > 0) {
      formData.runningTechniqueGoals.forEach(goal => {
        if (goal.type === 'cadence') {
          preventiveExercises.push({ 
            name: "Bieg w miejscu z wysokim unoszeniem kolan", 
            description: "Biegnij w miejscu koncentrując się na szybkim unoszeniu kolan i stawianiu stóp.", 
            sets_reps: "3 x 30 sekund" 
          });
        } else if (goal.type === 'arm_movement') {
          preventiveExercises.push({ 
            name: "Izolowane ruchy ramion", 
            description: "Stojąc, wykonuj prawidłowe ruchy ramion jak podczas biegu, trzymając łokcie pod kątem około 90 stopni.", 
            sets_reps: "3 x 30 sekund" 
          });
        }
      });
    }
    
    // Połącz wszystkie ćwiczenia
    const allExercises = [...basicExercises, ...preventiveExercises];
    
    // Ogranicz do maksymalnie 6 ćwiczeń
    const selectedExercises = allExercises.slice(0, 6);
    
    return {
      frequency: formData.trainingDaysPerWeek <= 3 ? "Po każdym treningu" : "2-3 razy w tygodniu",
      list: selectedExercises
    };
  }
  
  /**
   * Przygotowuje zalecenia żywieniowe
   * @param {Object} formData - Dane z formularza
   * @returns {Object} - Zalecenia żywieniowe
   */
  _getNutritionRecommendations(formData) {
    const recommendations = {
      general: "Zadbaj o zbilansowaną dietę bogatą w węglowodany złożone, białko, zdrowe tłuszcze oraz owoce i warzywa.",
      pre_workout: "1-2 godziny przed treningiem zjedz lekki posiłek bogaty w węglowodany, np. owsiankę, banana lub kanapkę z dżemem.",
      during_workout: "Dla treningów >60 minut, uzupełniaj węglowodany (30-60g/h) i elektrolity. Możesz używać żeli, izotoników lub naturalnych alternatyw.",
      post_workout: "W ciągu 30-60 minut po treningu zjedz posiłek lub przekąskę zawierającą białko i węglowodany w stosunku około 1:3.",
      hydration: "Pij regularnie w ciągu dnia. Wypij 400-600ml płynów 2-3 godziny przed treningiem i uzupełniaj płyny podczas i po treningu."
    };
    
    // Dostosuj zalecenia na podstawie celów żywieniowych
    if (formData.dietGoals) {
      formData.dietGoals.forEach(goal => {
        if (goal.type === 'weight_loss') {
          recommendations.general += " Dla redukcji masy ciała, utrzymuj deficyt kaloryczny około 300-500 kcal dziennie, ale nigdy nie schodź poniżej 1500 kcal.";
        } else if (goal.type === 'gi_issues_prevention') {
          recommendations.pre_workout += " Wybieraj produkty, które dobrze tolerujesz. Unikaj produktów wysokobłonnikowych, tłustych i potencjalnie drażniących jelita przed treningiem.";
          recommendations.during_workout += " Testuj różne produkty podczas lżejszych treningów, zanim użyjesz ich podczas ważniejszych sesji.";
        }
      });
    }
    
    // Dostosuj zalecenia na podstawie ograniczeń dietetycznych
    if (formData.dietaryRestrictions) {
      formData.dietaryRestrictions.forEach(restriction => {
        if (restriction.type === 'vegan') {
          recommendations.general += " Jako weganin, zwracaj szczególną uwagę na odpowiednią podaż białka (rośliny strączkowe, tofu, tempeh, seitan), żelaza, wapnia, witaminy B12 i omega-3.";
          recommendations.post_workout = "Po treningu wybieraj roślinne źródła białka jak koktajl z białkiem grochu/ryżu/konopi, tofu lub roślinny jogurt z owocami i orzechami.";
        } else if (restriction.type === 'gluten_free') {
          recommendations.pre_workout += " Jako źródła węglowodanów wybieraj bezglutenowe opcje jak ryż, komosa ryżowa, gryka, ziemniaki czy banany.";
        }
      });
    }
    
    // Uwzględnij aktualne nawyki użytkownika, jeśli są podane
    if (formData.nutritionHabits) {
      const habits = formData.nutritionHabits;
      
      if (habits.preworkout && habits.preworkout.length > 5) {
        recommendations.pre_workout += ` Twój obecny wybór (${habits.preworkout}) jest dobrym punktem wyjścia, jeśli dobrze się z nim czujesz podczas treningu.`;
      }
      
      if (habits.duringWorkout && habits.duringWorkout.length > 5) {
        recommendations.during_workout += ` Twój obecny wybór (${habits.duringWorkout}) jest dobrym punktem wyjścia, jeśli dobrze się z nim czujesz podczas treningu.`;
      }
    }
    
    return recommendations;
  }
  
  /**
   * Przygotowuje ćwiczenia techniki biegowej
   * @param {Object} formData - Dane z formularza
   * @returns {Array} - Ćwiczenia techniki biegowej
   */
  _getTechniqueDrills(formData) {
    const basicDrills = [
      {
        name: "A-Skip",
        description: "Bieg w miejscu z wysokim unoszeniem kolan, akcentując ułożenie stopy pod biodrem.",
        frequency: "Przed każdym treningiem, 2-3 serie po 20m"
      }
    ];
    
    const techniqueDrills = [];
    
    // Dodaj ćwiczenia w zależności od celów technicznych
    if (formData.runningTechniqueGoals && formData.runningTechniqueGoals.length > 0) {
      formData.runningTechniqueGoals.forEach(goal => {
        if (goal.type === 'cadence') {
          techniqueDrills.push({
            name: "Dreptanie",
            description: "Bieg z bardzo krótkimi krokami, koncentrując się na szybkim rytmie. Cel: 180+ kroków na minutę.",
            frequency: "2 razy w tygodniu, 3-4 serie po 30 sekund"
          });
        } else if (goal.type === 'posture') {
          techniqueDrills.push({
            name: "Bieg z kijem",
            description: "Trzymaj kij na plecach, dotykając głowy, górnej części pleców i pośladków. Biegnij zachowując kontakt z kijem w tych trzech punktach.",
            frequency: "1-2 razy w tygodniu, 3-4 serie po 100m"
          });
        } else if (goal.type === 'arm_movement') {
          techniqueDrills.push({
            name: "Ruchy ramion",
            description: "Stojąc w miejscu, wykonuj prawidłowe ruchy ramion jak podczas biegu, trzymając łokcie pod kątem około 90 stopni.",
            frequency: "Przed każdym treningiem, 2-3 serie po 30 sekund"
          });
        } else if (goal.type === 'foot_strike') {
          techniqueDrills.push({
            name: "Bieg boso po trawie",
            description: "Krótkie odcinki biegu boso po miękkim podłożu, koncentrując się na miękkim lądowaniu na śródstopiu.",
            frequency: "1 raz w tygodniu, 4-6 serii po 50m"
          });
        }
      });
    }
    
    // Połącz podstawowe ćwiczenia z dodatkowymi
    return [...basicDrills, ...techniqueDrills];
  }
}

module.exports = FallbackPlanGeneratorService; 