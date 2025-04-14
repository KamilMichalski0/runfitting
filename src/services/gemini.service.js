const axios = require('axios');
const config = require('../config/gemini.config');
const AppError = require('../utils/app-error');

class GeminiService {
  constructor() {
    this.apiKey = config.apiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com';
    this.model = config.model;
    this.axiosClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
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
      
      // Wywołanie API zgodnie z najnowszą dokumentacją Gemini dla modelu 2.5
      const url = `/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      console.log(`Wysyłanie zapytania do Gemini API, model: ${this.model}`);
      
      // Poprawiona struktura żądania zgodnie z dokumentacją Gemini 2.5
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: config.temperature,
          topK: config.topK,
          topP: config.topP,
          maxOutputTokens: config.maxTokens,
          responseMimeType: "application/json"
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      };
      
      console.log('Strukturę żądania:', JSON.stringify(requestBody, null, 2).substring(0, 500) + '...');
      
      const response = await this.axiosClient.post(url, requestBody);

      console.log(`Otrzymano odpowiedź z Gemini API, status: ${response.status}`);
      console.log(`Pełna struktura odpowiedzi:`, JSON.stringify(response.data, null, 2));
      
      return this._parseResponse(response.data);
    } catch (error) {
      console.error('Błąd podczas generowania planu przez Gemini:', error.response?.data || error.message);
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
    
WAŻNE: Musisz zwrócić prawidłowy obiekt JSON z niepustą tablicą plan_weeks. Każdy tydzień musi mieć week_num i tablicę days.

Plan powinien być w formacie JSON dokładnie zgodnym z następującą strukturą:
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
    "author": "RunFitting AI"
  },
  "plan_weeks": [
    {
      "week_num": 1,
      "focus": "Adaptacja",
      "days": [
        {
          "day_name": "Pon",
          "workout": "Trening wprowadzający - 20-30 minut lekkiego biegu"
        },
        {
          "day_name": "Śr",
          "workout": "Trening tempowy - 3-4 km w tempie konwersacyjnym"
        },
        {
          "day_name": "Sob",
          "workout": "Długi bieg - 5-6 km w wolnym tempie"
        }
      ]
    },
    {
      "week_num": 2,
      "focus": "Budowanie bazy",
      "days": [
        {
          "day_name": "Pon",
          "workout": "Trening wprowadzający - 25-35 minut lekkiego biegu"
        },
        {
          "day_name": "Śr",
          "workout": "Trening tempowy - 4-5 km w tempie konwersacyjnym"
        },
        {
          "day_name": "Sob",
          "workout": "Długi bieg - 6-7 km w wolnym tempie"
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
    "scale": "0-10",
    "rules": [
      "[zasady monitorowania bólu]"
    ]
  },
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
7. Być realistyczny i możliwy do zrealizowania.

PAMIĘTAJ: Zwróć tylko prawidłowy obiekt JSON zgodny z powyższą strukturą. Nie dodawaj żadnego tekstu przed lub po obiekcie JSON.`;
  }

  /**
   * Parsuje odpowiedź z Gemini API
   * @param {Object} response - Odpowiedź z API
   * @returns {Object} Sformatowany plan treningowy
   */
  _parseResponse(response) {
    try {
      console.log('Struktura odpowiedzi API:', JSON.stringify(Object.keys(response), null, 2));
      console.log('Pełna odpowiedź API (pierwsze 1000 znaków):', JSON.stringify(response).substring(0, 1000));
      
      // Sprawdzanie, czy odpowiedź zawiera informację o błędzie lub blokadzie
      if (response.error) {
        console.error('API zwróciło błąd:', response.error);
        throw new Error(`Błąd API Gemini: ${response.error.message || 'Nieznany błąd'}`);
      }
      
      if (response.promptFeedback && response.promptFeedback.blockReason) {
        console.error('Zapytanie zostało zablokowane:', response.promptFeedback.blockReason);
        throw new Error(`Zapytanie zablokowane: ${response.promptFeedback.blockReason}`);
      }
      
      // Sprawdzanie powodu zakończenia generowania
      if (response.candidates && response.candidates[0] && response.candidates[0].finishReason) {
        const finishReason = response.candidates[0].finishReason;
        console.log(`Powód zakończenia generowania: ${finishReason}`);
        
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION' || finishReason === 'BLOCKED') {
          throw new Error(`Generowanie zostało przerwane z powodu: ${finishReason}`);
        }
      }
      
      let content;
      
      // Obsługa różnych formatów odpowiedzi API Gemini
      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        console.log('Używam formatu candidates[0].content');
        content = response.candidates[0].content.parts[0].text;
      } else if (response.content && response.content.parts && response.content.parts[0]) {
        console.log('Używam formatu content.parts[0]');
        content = response.content.parts[0].text;
      } else if (response.text) {
        console.log('Używam formatu text');
        content = response.text;
      } else if (response.candidates && response.candidates[0] && response.candidates[0].text) {
        console.log('Używam formatu candidates[0].text');
        content = response.candidates[0].text;
      } else if (response.generations && response.generations[0]) {
        console.log('Używam formatu generations[0]');
        content = response.generations[0].text || response.generations[0].content;
      } else if (response.choices && response.choices[0]) {
        console.log('Używam formatu choices[0]');
        content = response.choices[0].text || response.choices[0].message?.content;
      } else if (response.result) {
        console.log('Używam formatu result');
        content = response.result;
      } else if (response.promptFeedback && response.promptFeedback.safetyRatings) {
        console.log('Otrzymano blokadę bezpieczeństwa od API');
        throw new Error('Zapytanie zostało zablokowane przez filtry bezpieczeństwa Gemini API');
      } else if (response.usageMetadata && response.modelVersion) {
        // Format specyficzny dla tego modelu Gemini 2.5 - brak odpowiedzi
        console.log('Otrzymano tylko metadane bez treści odpowiedzi');
        
        // Tworzymy domyślny plan treningowy
        return this._createDefaultTrainingPlan();
      } else {
        console.error('Nieznany format odpowiedzi API:', response);
        throw new Error('Nieobsługiwany format odpowiedzi API');
      }
      
      if (!content) {
        console.error('Nie znaleziono treści w odpowiedzi API:', response);
        throw new Error('Pusta odpowiedź z API - brak treści');
      }
      
      console.log('Odpowiedź z Gemini API (surowa):', content.substring(0, 500) + '...');
      
      let plan;
      try {
        plan = JSON.parse(content);
        console.log('Plan po parsowaniu:', JSON.stringify({
          id: plan.id,
          hasMetadata: !!plan.metadata,
          hasPlanWeeks: !!plan.plan_weeks,
          planWeeksLength: plan.plan_weeks ? plan.plan_weeks.length : 0,
          metadata: plan.metadata
        }, null, 2));
        
      } catch (jsonError) {
        console.error('Błąd parsowania JSON:', jsonError);
        console.log('Próba oczyszczenia tekstu i ponownego parsowania...');
        
        // Próba wyodręnbienia JSON z tekstu (często API zwraca tekst wokół JSON)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            plan = JSON.parse(jsonMatch[0]);
            console.log('Plan po czyszczeniu i parsowaniu:', JSON.stringify({
              id: plan.id,
              hasMetadata: !!plan.metadata,
              hasPlanWeeks: !!plan.plan_weeks,
              planWeeksLength: plan.plan_weeks ? plan.plan_weeks.length : 0,
              metadata: plan.metadata
            }, null, 2));
          } catch (error) {
            console.error('Błąd parsowania oczyszczonego tekstu:', error);
            throw new Error('Nieprawidłowy format odpowiedzi z API');
          }
        } else {
          throw new Error('Nie można odnaleźć prawidłowego formatu JSON w odpowiedzi');
        }
      }
      
      // Walidacja podstawowej struktury
      if (!plan.id || !plan.metadata || !plan.plan_weeks) {
        console.error('Brakujące pola w planie:', {
          hasId: !!plan.id,
          hasMetadata: !!plan.metadata,
          hasPlanWeeks: !!plan.plan_weeks
        });
        throw new Error('Nieprawidłowa struktura planu - brakujące wymagane pola');
      }
      
      if (!plan.plan_weeks || plan.plan_weeks.length === 0) {
        console.log('Plan ma pustą tablicę plan_weeks, używam tablicy zastępczej');
        plan.plan_weeks = [
          {
            week_num: 1,
            focus: "Wprowadzenie do biegania",
            days: [
              {
                day_name: "Pon",
                workout: "Trening wprowadzający - 20-30 minut lekkiego biegu"
              },
              {
                day_name: "Śr",
                workout: "Trening tempowy - 3-4 km w tempie konwersacyjnym"
              },
              {
                day_name: "Sob",
                workout: "Długi bieg - 5-6 km w wolnym tempie"
              }
            ]
          }
        ];
      }

      return plan;
    } catch (error) {
      console.error('Błąd podczas parsowania odpowiedzi:', error);
      throw new AppError('Nieprawidłowa odpowiedź z API: ' + error.message, 500);
    }
  }
  
  /**
   * Tworzy domyślny plan treningowy w przypadku braku odpowiedzi z API
   * @returns {Object} Domyślny plan treningowy
   */
  _createDefaultTrainingPlan() {
    console.log('Tworzenie domyślnego planu treningowego');
    
    return {
      id: `running_plan_default_${Date.now()}`,
      metadata: {
        discipline: "running",
        target_group: "Biegacze początkujący",
        target_goal: "Poprawa ogólnej kondycji",
        level_hint: "początkujący",
        days_per_week: "3",
        duration_weeks: 8,
        description: "Podstawowy plan biegowy (domyślny) - został wygenerowany awaryjnie",
        author: "RunFitting AI"
      },
      plan_weeks: [
        {
          week_num: 1,
          focus: "Wprowadzenie do biegania",
          days: [
            {
              day_name: "Pon",
              workout: "Trening wprowadzający - 20-30 minut lekkiego biegu"
            },
            {
              day_name: "Śr",
              workout: "Trening tempowy - 3-4 km w tempie konwersacyjnym"
            },
            {
              day_name: "Sob",
              workout: "Długi bieg - 5-6 km w wolnym tempie"
            }
          ]
        },
        {
          week_num: 2,
          focus: "Budowanie bazy",
          days: [
            {
              day_name: "Pon",
              workout: "Trening wprowadzający - 25-35 minut lekkiego biegu"
            },
            {
              day_name: "Śr",
              workout: "Trening tempowy - 4-5 km w tempie konwersacyjnym"
            },
            {
              day_name: "Sob",
              workout: "Długi bieg - 6-7 km w wolnym tempie"
            }
          ]
        }
      ],
      corrective_exercises: {
        frequency: "2-3 razy w tygodniu",
        list: [
          {
            name: "Rozciąganie łydek",
            description: "Stań w wykroku, tylna noga wyprostowana, przednia zgięta. Przytrzymaj 30 sekund.",
            sets_reps: "2 serie po 30 sekund na każdą nogę"
          },
          {
            name: "Wzmacnianie mięśni głębokich",
            description: "Napnij mięśnie brzucha i utrzymaj napięcie przez 10 sekund.",
            sets_reps: "3 serie po 10 powtórzeń"
          }
        ]
      },
      pain_monitoring: {
        scale: "0-10",
        rules: [
          "Przerwij trening przy bólu powyżej 5/10",
          "Skonsultuj się z lekarzem przy utrzymującym się bólu"
        ]
      },
      notes: [
        "Dostosuj plan do swoich możliwości",
        "Pamiętaj o nawodnieniu",
        "Ten plan jest planem awaryjnym i może wymagać dostosowania"
      ]
    };
  }
}

module.exports = new GeminiService(); 