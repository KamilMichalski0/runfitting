const axios = require('axios');
const config = require('../config/gemini.config');
const AppError = require('../utils/app-error');

class GeminiService {
  constructor() {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.model = config.model;
    this.axiosClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }

  /**
   * Generuje plan treningowy przy użyciu Gemini API
   * @param {Object} userData - Dane użytkownika
   * @returns {Promise<Object>} Wygenerowany plan treningowy
   */
  async generateTrainingPlan(userData) {
    try {
      const prompt = this._createPrompt(userData);
      
      const response = await this.axiosClient.post('/v1/models/gemini-pro:generateContent', {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: config.temperature,
          topK: config.topK,
          topP: config.topP,
          maxOutputTokens: config.maxTokens
        }
      });

      return this._parseResponse(response.data);
    } catch (error) {
      console.error('Błąd podczas generowania planu przez Gemini:', error);
      throw new AppError('Nie udało się wygenerować planu treningowego', 500);
    }
  }

  /**
   * Tworzy prompt dla Gemini API
   * @param {Object} userData - Dane użytkownika
   * @returns {String} Sformatowany prompt
   */
  _createPrompt(userData) {
    // Przygotowanie danych z formularza
    const ageInfo = `Wiek: ${userData.age} lat`;
    
    // Sekcja I - Informacje biegowe
    const levelMap = {
      'beginner': 'Początkujący (biegam nieregularnie, zaczynam przygodę z bieganiem)',
      'intermediate': 'Średniozaawansowany (biegam regularnie od kilku miesięcy/lat)',
      'advanced': 'Zaawansowany (biegam regularnie od lat, startuję w zawodach)'
    };
    
    const goalMap = {
      'general_fitness': 'Poprawa ogólnej kondycji / Dla zdrowia',
      'run_5k': 'Przygotowanie do biegu na 5 km',
      'run_10k': 'Przygotowanie do biegu na 10 km',
      'half_marathon': 'Przygotowanie do półmaratonu',
      'marathon': 'Przygotowanie do maratonu',
      'ultra_marathon': 'Przygotowanie do ultramaratonu',
      'speed_improvement': 'Poprawa prędkości na określonym dystansie',
      'endurance_improvement': 'Zwiększenie wytrzymałości ogólnej',
      'other': userData.customGoal || 'Inny cel (niesprecyzowany)'
    };
    
    const levelInfo = `Poziom zaawansowania: ${levelMap[userData.experienceLevel] || userData.experienceLevel}`;
    const goalInfo = `Główny cel: ${goalMap[userData.mainGoal] || userData.mainGoal}`;
    const weeklyDistanceInfo = `Kilometraż tygodniowy: ${userData.weeklyKilometers} km`;
    const trainingDaysInfo = `Dni treningowe w tygodniu: ${userData.trainingDaysPerWeek}`;
    
    // Sekcja II - Parametry fizjologiczne (opcjonalnie)
    let physiologicalParams = [];
    
    if (userData.hasCooperTestResult && userData.cooperTestDistance) {
      physiologicalParams.push(`Wynik testu Coopera: ${userData.cooperTestDistance} metrów`);
    }
    
    if (userData.personalBests) {
      const pbs = userData.personalBests;
      
      if (pbs.fiveKm && pbs.fiveKm.minutes !== undefined) {
        physiologicalParams.push(`Rekord 5km: ${pbs.fiveKm.minutes}:${String(pbs.fiveKm.seconds || 0).padStart(2, '0')}`);
      }
      
      if (pbs.tenKm && pbs.tenKm.minutes !== undefined) {
        const hours = pbs.tenKm.hours || 0;
        physiologicalParams.push(
          `Rekord 10km: ${hours > 0 ? hours + ':' : ''}${String(pbs.tenKm.minutes).padStart(2, '0')}:${String(pbs.tenKm.seconds || 0).padStart(2, '0')}`
        );
      }
      
      if (pbs.halfMarathon && pbs.halfMarathon.hours !== undefined) {
        physiologicalParams.push(
          `Rekord półmaraton: ${pbs.halfMarathon.hours}:${String(pbs.halfMarathon.minutes || 0).padStart(2, '0')}:${String(pbs.halfMarathon.seconds || 0).padStart(2, '0')}`
        );
      }
      
      if (pbs.marathon && pbs.marathon.hours !== undefined) {
        physiologicalParams.push(
          `Rekord maraton: ${pbs.marathon.hours}:${String(pbs.marathon.minutes || 0).padStart(2, '0')}:${String(pbs.marathon.seconds || 0).padStart(2, '0')}`
        );
      }
    }
    
    if (userData.vo2max && userData.vo2max.known && userData.vo2max.value) {
      physiologicalParams.push(`VO2max: ${userData.vo2max.value} ml/kg/min`);
    }
    
    if (userData.maxHeartRate && (userData.maxHeartRate.measured || userData.maxHeartRate.estimated) && userData.maxHeartRate.value) {
      physiologicalParams.push(`Tętno maksymalne: ${userData.maxHeartRate.value} uderzeń/min (${userData.maxHeartRate.measured ? 'zmierzone' : 'szacowane'})`);
    }
    
    if (userData.restingHeartRate && userData.restingHeartRate.known && userData.restingHeartRate.value) {
      physiologicalParams.push(`Tętno spoczynkowe: ${userData.restingHeartRate.value} uderzeń/min`);
    }
    
    // Sekcja III - Historia kontuzji i ograniczenia
    let injuryHistory = [];
    
    if (userData.hasInjuries) {
      injuryHistory.push('Użytkownik zgłasza problemy zdrowotne/kontuzje.');
      
      if (userData.currentPain && userData.currentPain.exists) {
        injuryHistory.push(`Aktualny ból: Lokalizacja - ${userData.currentPain.location}, Opis - ${userData.currentPain.description}, Intensywność - ${userData.currentPain.intensity}/10, Okoliczności - ${userData.currentPain.circumstances}`);
      }
      
      if (userData.recentInjury && userData.recentInjury.exists) {
        const injuryDate = userData.recentInjury.date ? new Date(userData.recentInjury.date).toLocaleDateString('pl-PL') : 'data nieznana';
        injuryHistory.push(`Niedawna kontuzja/operacja: ${userData.recentInjury.type}, Data: ${injuryDate}, Status rehabilitacji: ${userData.recentInjury.rehabilitationStatus}`);
      }
      
      if (userData.pastInjuries && userData.pastInjuries.length > 0) {
        const pastInjuriesList = userData.pastInjuries.map(injury => 
          `${injury.type}${injury.details ? ` (${injury.details})` : ''}`
        ).join(', ');
        
        injuryHistory.push(`Historia kontuzji: ${pastInjuriesList}`);
      }
      
      if (userData.medicalConditions && userData.medicalConditions.length > 0) {
        const conditionsList = userData.medicalConditions
          .filter(condition => condition.type !== 'none')
          .map(condition => 
            `${condition.type}${condition.details ? ` (${condition.details})` : ''}`
          ).join(', ');
        
        if (conditionsList) {
          injuryHistory.push(`Schorzenia i problemy zdrowotne: ${conditionsList}`);
        }
      }
    } else {
      injuryHistory.push('Użytkownik nie zgłasza problemów zdrowotnych/kontuzji.');
    }
    
    // Sekcja IV - Technika biegu
    let techniqueInfo = [];
    
    if (userData.runningTechniqueGoals && userData.runningTechniqueGoals.length > 0) {
      const techniqueGoals = userData.runningTechniqueGoals
        .filter(goal => goal.type !== 'none')
        .map(goal => 
          `${goal.type}${goal.details ? ` (${goal.details})` : ''}`
        ).join(', ');
      
      if (techniqueGoals) {
        techniqueInfo.push(`Cele dotyczące techniki biegowej: ${techniqueGoals}`);
      }
    } else {
      techniqueInfo.push('Brak konkretnych celów dotyczących techniki biegowej.');
    }
    
    // Sekcja V - Dieta i nawodnienie
    let dietInfo = [];
    
    if (userData.dietGoals && userData.dietGoals.length > 0) {
      const goals = userData.dietGoals
        .filter(goal => goal.type !== 'none')
        .map(goal => goal.type).join(', ');
      
      if (goals) {
        dietInfo.push(`Cele żywieniowe: ${goals}`);
      }
    }
    
    if (userData.dietaryRestrictions && userData.dietaryRestrictions.length > 0) {
      const restrictions = userData.dietaryRestrictions
        .filter(restriction => restriction.type !== 'none')
        .map(restriction => 
          `${restriction.type}${restriction.details ? ` (${restriction.details})` : ''}`
        ).join(', ');
      
      if (restrictions) {
        dietInfo.push(`Ograniczenia żywieniowe: ${restrictions}`);
      }
    }
    
    if (userData.giIssuesFrequency && userData.giIssuesFrequency !== 'rarely') {
      dietInfo.push(`Problemy żołądkowo-jelitowe: ${userData.giIssuesFrequency}${userData.giIssuesTriggers ? ` (Możliwe przyczyny: ${userData.giIssuesTriggers})` : ''}`);
    }
    
    if (userData.typicalTrainingWeek) {
      dietInfo.push(`Typowy tydzień treningowy: ${userData.typicalTrainingWeek}`);
    }
    
    if (userData.nutritionHabits) {
      const habits = userData.nutritionHabits;
      if (habits.preworkout) dietInfo.push(`Odżywianie przed treningiem: ${habits.preworkout}`);
      if (habits.duringWorkout) dietInfo.push(`Odżywianie podczas treningu: ${habits.duringWorkout}`);
      if (habits.postWorkout) dietInfo.push(`Odżywianie po treningu: ${habits.postWorkout}`);
      if (habits.testedProducts) dietInfo.push(`Sprawdzone/niesprawdzone produkty: ${habits.testedProducts}`);
    }
    
    if (userData.hydrationHabits) {
      dietInfo.push(`Nawyki nawodnienia: ${userData.hydrationHabits}`);
    }
    
    // Formatowanie całości
    return `Wygeneruj kompleksowy plan biegowy dla użytkownika na podstawie poniższych danych:

DANE PODSTAWOWE:
${ageInfo}

INFORMACJE BIEGOWE:
${levelInfo}
${goalInfo}
${weeklyDistanceInfo}
${trainingDaysInfo}

${physiologicalParams.length > 0 ? `PARAMETRY FIZJOLOGICZNE:
${physiologicalParams.join('\n')}` : ''}

HISTORIA KONTUZJI I OGRANICZENIA:
${injuryHistory.join('\n')}

${techniqueInfo.length > 0 ? `TECHNIKA BIEGU:
${techniqueInfo.join('\n')}` : ''}

${dietInfo.length > 0 ? `DIETA I NAWODNIENIE:
${dietInfo.join('\n')}` : ''}
    
    Plan powinien być w formacie JSON zgodnym z następującą strukturą:
    {
  "id": "running_plan_[cel]_[poziom]_[dni]_[tygodnie]",
      "metadata": {
        "discipline": "running",
    "target_group": "Biegacze [poziom]",
    "target_goal": "[cel]",
        "level_hint": "[poziom]",
    "days_per_week": "[liczba dni]",
    "duration_weeks": [liczba tygodni],
        "description": "[szczegółowy opis planu]",
    "author": "Generator RunFitting AI"
      },
      "plan_weeks": [
        {
          "week_num": [numer],
          "focus": "[cel tygodnia]",
          "days": [
            {
              "day_name": "[dzień]",
          "workout": "[szczegółowy opis treningu]"
            }
          ]
        }
      ],
      "corrective_exercises": {
        "frequency": "[częstotliwość]",
        "list": [
          {
            "name": "[nazwa]",
            "description": "[opis]",
            "sets_reps": "[serie i powtórzenia]"
          }
        ]
      },
      "pain_monitoring": {
        "scale": "Używaj skali bólu 0-10 (0 = brak bólu, 10 = ból nie do zniesienia)",
        "rules": [
          "[zasady monitorowania bólu]"
        ]
      },
  "nutrition_recommendations": {
    "general": "[ogólne zalecenia żywieniowe]",
    "pre_workout": "[zalecenia przed treningiem]",
    "during_workout": "[zalecenia podczas treningu, jeśli trening >60 min]",
    "post_workout": "[zalecenia po treningu]",
    "hydration": "[zalecenia dotyczące nawodnienia]"
  },
  "techniques_drills": [
    {
      "name": "[nazwa]",
      "description": "[opis]",
      "frequency": "[częstotliwość]"
    }
  ],
      "notes": [
        "[uwagi]"
      ]
    }
    
    Plan powinien być:
1. Bezpieczny i dostosowany do poziomu zaawansowania użytkownika.
2. Zawierać odpowiednią progresję obciążeń.
3. Uwzględniać historię kontuzji i ograniczenia zdrowotne (jeśli istnieją).
4. Zawierać konkretne zalecenia treningowe, w tym tempo, dystans, i typ treningu.
5. Uwzględniać odpowiednią rozgrzewkę i schłodzenie.
6. Zawierać konkretne ćwiczenia wspomagające specyficzne dla potrzeb użytkownika.
7. Zawierać wskazówki dotyczące techniki biegu (jeśli użytkownik ma takie cele).
8. Zawierać spersonalizowane zalecenia żywieniowe i nawodnienia.
9. Być realistyczny i możliwy do zrealizowania.`;
  }

  /**
   * Parsuje odpowiedź z Gemini API
   * @param {Object} response - Odpowiedź z API
   * @returns {Object} Sformatowany plan treningowy
   */
  _parseResponse(response) {
    try {
      const content = response.candidates[0].content.parts[0].text;
      const plan = JSON.parse(content);
      
      // Walidacja podstawowej struktury
      if (!plan.id || !plan.metadata || !plan.plan_weeks) {
        throw new Error('Nieprawidłowa struktura planu');
      }

      return plan;
    } catch (error) {
      console.error('Błąd podczas parsowania odpowiedzi:', error);
      throw new AppError('Nieprawidłowa odpowiedź z API', 500);
    }
  }
}

module.exports = new GeminiService(); 