const axios = require('axios');
const config = require('../config/gemini.config');
const AppError = require('../utils/app-error');
const { getExamplePlanTemplate } = require('../templates/plan-template-selector');

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
      console.log('\n=== ROZPOCZĘCIE GENEROWANIA PLANU TRENINGOWEGO ===');
      console.log('1. Dane wejściowe użytkownika:', JSON.stringify(userData, null, 2));

      console.log('\n2. Tworzenie promptu...');
      const prompt = this._createPrompt(userData);
      console.log('Wygenerowany prompt:', prompt);
      
      // Wywołanie API zgodnie z najnowszą dokumentacją Gemini dla modelu 2.5
      const url = `/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      console.log('\n3. Konfiguracja żądania do Gemini API:');
      console.log(`- Model: ${this.model}`);
      console.log(`- URL: ${this.apiUrl}${url}`);
      
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
      
      console.log('\n4. Konfiguracja generowania:');
      console.log('- Temperature:', config.temperature);
      console.log('- TopK:', config.topK);
      console.log('- TopP:', config.topP);
      console.log('- MaxTokens:', config.maxTokens);
      
      console.log('\n5. Wysyłanie żądania do API...');
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await this.axiosClient.post(url, requestBody);

      console.log('\n6. Otrzymano odpowiedź z API:');
      console.log(`- Status: ${response.status}`);
      console.log('- Headers:', JSON.stringify(response.headers, null, 2));
      console.log('- Pełna odpowiedź:', JSON.stringify(response.data, null, 2));
      
      console.log('\n7. Parsowanie odpowiedzi...');
      const parsedPlan = this._parseResponse(response.data);
      
      console.log('\n8. Plan po sparsowaniu:');
      console.log('- ID planu:', parsedPlan.id);
      console.log('- Liczba tygodni:', parsedPlan.plan_weeks.length);
      console.log('- Metadane:', JSON.stringify(parsedPlan.metadata, null, 2));
      console.log('- Przykładowy tydzień:', JSON.stringify(parsedPlan.plan_weeks[0], null, 2));
      
      console.log('\n=== ZAKOŃCZONO GENEROWANIE PLANU TRENINGOWEGO ===\n');
      
      return parsedPlan;
    } catch (error) {
      console.error('\n!!! BŁĄD PODCZAS GENEROWANIA PLANU !!!');
      console.error('Szczegóły błędu:', error);
      console.error('Response data:', error.response?.data);
      console.error('Stack trace:', error.stack);
      throw new AppError('Nie udało się wygenerować planu treningowego: ' + (error.response?.data?.error?.message || error.message), 500);
    }
  }

  /**
   * Tworzy prompt dla Gemini API
   * @param {Object} userData - Dane użytkownika
   * @returns {String} Sformatowany prompt
   */
  _createPrompt(userData) {
    // Obliczanie indywidualnych stref tętna
    const heartRateZones = this._calculateHeartRateZones(userData);
    console.log("User data:", userData);
    
    // Przygotowanie danych z formularza
    const ageInfo = `Wiek: ${userData.age || 'nie podano'} lat`;
    
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
    
    const levelInfo = `Poziom zaawansowania: ${levelMap[userData.experienceLevel] || userData.experienceLevel || 'nie podano'}`;
    const goalInfo = `Główny cel: ${goalMap[userData.mainGoal] || userData.mainGoal || 'nie podano'}`;
    
    // Sekcja II - Preferencje treningowe
    const daysPerWeekInfo = `Preferowana liczba dni treningowych w tygodniu: ${userData.trainingDaysPerWeek || 'nie podano'}`;
    const weeklyKilometersInfo = `Obecny tygodniowy kilometraż: ${userData.weeklyKilometers || 'nie podano'} km`;
    
    // Konwersja planDuration na liczbę i walidacja
    const planDuration = parseInt(userData.planDuration, 10);
    const planDurationInfo = `Planowany czas trwania planu: ${!isNaN(planDuration) && planDuration > 0 ? planDuration : 'nie podano'} tygodni`;
    
    // Sekcja III - Informacje o zdrowiu i kontuzjach
    let healthInfo = [];
    
    if (userData.hasInjuries) {
      healthInfo.push('Użytkownik ma kontuzje');
    }
    
    if (userData.pastInjuries && userData.pastInjuries.length > 0) {
      healthInfo.push(`Przeszłe kontuzje: ${userData.pastInjuries.join(', ')}`);
    }
    
    if (userData.medicalConditions && userData.medicalConditions.length > 0) {
      healthInfo.push(`Choroby przewlekłe: ${userData.medicalConditions.join(', ')}`);
    }
    
    if (userData.giIssuesFrequency && userData.giIssuesFrequency !== 'never') {
      healthInfo.push(`Częstotliwość problemów żołądkowych: ${userData.giIssuesFrequency}`);
    }
    
    const healthInfoText = healthInfo.length > 0 
      ? healthInfo.join('\n')
      : 'Brak zgłoszonych problemów zdrowotnych';
    
    // Sekcja IV - Cele i preferencje
    let goalsInfo = [];
    
    if (userData.runningTechniqueGoals && userData.runningTechniqueGoals.length > 0) {
      goalsInfo.push(`Cele techniczne: ${userData.runningTechniqueGoals.join(', ')}`);
    }
    
    if (userData.dietGoals && userData.dietGoals.length > 0) {
      goalsInfo.push(`Cele dietetyczne: ${userData.dietGoals.join(', ')}`);
    }
    
    if (userData.dietaryRestrictions && userData.dietaryRestrictions.length > 0) {
      goalsInfo.push(`Ograniczenia dietetyczne: ${userData.dietaryRestrictions.join(', ')}`);
    }
    
    const goalsInfoText = goalsInfo.length > 0 
      ? goalsInfo.join('\n')
      : 'Brak dodatkowych celów i preferencji';

    // Pobierz przykładowy szablon planu pasujący do danych użytkownika
    const examplePlan = getExamplePlanTemplate(userData);
    const examplePlanJson = JSON.stringify(examplePlan, null, 2);

    return `Jesteś ekspertem w tworzeniu planów treningowych dla biegaczy. Stwórz spersonalizowany plan treningowy na podstawie poniższych informacji o użytkowniku.

### DANE UŻYTKOWNIKA:
${ageInfo}
${levelInfo}
${goalInfo}
${daysPerWeekInfo}
${weeklyKilometersInfo}
${planDurationInfo}

### INFORMACJE O ZDROWIU:
${healthInfoText}

### DODATKOWE CELE I PREFERENCJE:
${goalsInfoText}

### STREFY TĘTNA UŻYTKOWNIKA:
- ${heartRateZones.zone1.name}: min=${heartRateZones.zone1.min}, max=${heartRateZones.zone1.max}
- ${heartRateZones.zone2.name}: min=${heartRateZones.zone2.min}, max=${heartRateZones.zone2.max}
- ${heartRateZones.zone3.name}: min=${heartRateZones.zone3.min}, max=${heartRateZones.zone3.max}
- ${heartRateZones.zone4.name}: min=${heartRateZones.zone4.min}, max=${heartRateZones.zone4.max}
- ${heartRateZones.zone5.name}: min=${heartRateZones.zone5.min}, max=${heartRateZones.zone5.max}

### WYMAGANA STRUKTURA ODPOWIEDZI:
Plan musi być zwrócony w następującym formacie JSON.

### PRZYKŁAD PLANU:
${examplePlanJson}

### SCHEMAT JSON:
{
  "id": string (unikalny identyfikator),
  "metadata": {
    "discipline": "running",
    "target_group": string,
    "target_goal": string,
    "level_hint": string,
    "days_per_week": string,
    "duration_weeks": number,
    "description": string,
    "author": string
  },
  "plan_weeks": [
    {
      "week_num": number,
      "focus": string,
      "days": [
        {
          "day_name": string (WAŻNE: użyj DOKŁADNIE jednej z wartości: "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"),
          "workout": {
            "type": string,
            "description": string,
            "distance": number lub null,
            "duration": number,
            "target_pace": {
              "min_per_km": number,
              "sec_per_km": number
            } lub null,
            "target_heart_rate": {
              "min": number (wymagane, użyj wartości ze stref tętna użytkownika),
              "max": number (wymagane, użyj wartości ze stref tętna użytkownika),
              "zone": string (opcjonalne, np. "Strefa 2 (Łatwe tempo)")
            },
            "support_exercises": [
              {
                "name": string,
                "sets": number,
                "reps": number lub null,
                "duration": number lub null
              }
            ]
          }
        }
      ]
    }
  ]
}

KRYTYCZNE WYMAGANIA:
1. Pole day_name MUSI zawierać DOKŁADNIE jedną z wartości: "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"
2. Nie używaj skrótów ani innych formatów nazw dni
3. Zachowaj dokładnie podaną strukturę JSON dla pola workout
4. Wszystkie pola numeryczne muszą być liczbami, nie stringami
5. Użyj null dla opcjonalnych wartości numerycznych, które nie są określone
6. Plan musi być dostosowany do poziomu zaawansowania, celu i ograniczeń użytkownika
7. Plan musi być realistyczny i uwzględniać stopniowy progres
8. Jeśli użytkownik ma kontuzje, dostosuj plan tak, aby minimalizować ryzyko pogłębienia problemu
9. Uwzględnij dni odpoczynku i regeneracji
10. Dodaj wskazówki dotyczące monitorowania bólu, jeśli użytkownik zgłasza kontuzje
11. Uwzględnij ćwiczenia korekcyjne/uzupełniające, jeśli są potrzebne
12. ZAWSZE używaj stref tętna z sekcji "STREFY TĘTNA UŻYTKOWNIKA" - są one obliczone indywidualnie dla tego użytkownika

WAŻNE: Wygeneruj nowy, unikalny plan treningowy bazując na powyższym przykładzie, ale dostosowany do profilu użytkownika. Odpowiedz WYŁĄCZNIE w formacie JSON. Nie dodawaj żadnego tekstu przed ani po strukturze JSON.`;
  }

  _calculateHeartRateZones(userData) {
    // Obliczanie maksymalnego tętna
    let maxHR;
    if (userData.maxHeartRate?.value && userData.maxHeartRate?.measured) {
      // Jeśli użytkownik podał zmierzone tętno maksymalne, używamy go
      maxHR = userData.maxHeartRate.value;
    } else {
      // W przeciwnym razie obliczamy według wzoru Tanaki
      maxHR = 208 - (0.7 * userData.age);
    }

    // Obliczanie tętna spoczynkowego
    const restingHR = userData.restingHeartRate?.known ? userData.restingHeartRate.value : 60;

    // Obliczanie rezerwy tętna (HRR - Heart Rate Reserve)
    const hrr = maxHR - restingHR;

    // Obliczanie stref tętna według metody Karvonena
    return {
      zone1: {
        name: "Strefa 1 (Regeneracja)",
        min: Math.round(restingHR + (hrr * 0.5)),
        max: Math.round(restingHR + (hrr * 0.6))
      },
      zone2: {
        name: "Strefa 2 (Łatwe tempo)",
        min: Math.round(restingHR + (hrr * 0.6)),
        max: Math.round(restingHR + (hrr * 0.7))
      },
      zone3: {
        name: "Strefa 3 (Tempo)",
        min: Math.round(restingHR + (hrr * 0.7)),
        max: Math.round(restingHR + (hrr * 0.8))
      },
      zone4: {
        name: "Strefa 4 (Próg)",
        min: Math.round(restingHR + (hrr * 0.8)),
        max: Math.round(restingHR + (hrr * 0.9))
      },
      zone5: {
        name: "Strefa 5 (Interwały)",
        min: Math.round(restingHR + (hrr * 0.9)),
        max: maxHR
      }
    };
  }

  /**
   * Parsuje odpowiedź z Gemini API
   * @param {Object} response - Odpowiedź z API
   * @returns {Object} Sformatowany plan treningowy
   */
  _parseResponse(response) {
    try {
      // Próba wyodrębnienia JSON z odpowiedzi
      let plan;
      try {
        const candidates = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidates) {
          console.error('Brak kandydatów w odpowiedzi');
          return this._createDefaultTrainingPlan();
        }
        
        // Próba parsowania JSON z odpowiedzi tekstowej
        try {
          plan = JSON.parse(candidates);
        } catch (parseError) {
          console.error('Błąd parsowania JSON z odpowiedzi:', parseError);
          // Próba znalezienia JSON w tekście
          const jsonMatch = candidates.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              plan = JSON.parse(jsonMatch[0]);
            } catch (secondParseError) {
              console.error('Błąd parsowania wyodrębnionego JSON:', secondParseError);
              return this._createDefaultTrainingPlan();
            }
          } else {
            console.error('Nie znaleziono struktury JSON w odpowiedzi');
            return this._createDefaultTrainingPlan();
          }
        }
      } catch (error) {
        console.error('Błąd podczas przetwarzania odpowiedzi:', error);
        return this._createDefaultTrainingPlan();
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

      // Sprawdzenie czy duration_weeks jest zgodne z planDuration
      if (this.userData && this.userData.planDuration) {
        const expectedDuration = parseInt(this.userData.planDuration, 10);
        if (!isNaN(expectedDuration) && plan.metadata.duration_weeks !== expectedDuration) {
          console.warn(`duration_weeks (${plan.metadata.duration_weeks}) nie zgadza się z planDuration (${expectedDuration})`);
          plan.metadata.duration_weeks = expectedDuration;
        }
      }

      // Mapowanie dni tygodnia
      const defaultDays = ['poniedziałek', 'środa', 'piątek'];
      plan.plan_weeks.forEach((week, weekIndex) => {
        if (week.days) {
          week.days.forEach((day, dayIndex) => {
            // Jeśli dzień jest w formacie "Dzień X", przypisz domyślny dzień
            if (day.day_name.startsWith('Dzień')) {
              day.day_name = defaultDays[dayIndex] || defaultDays[dayIndex % defaultDays.length];
            }
          });
        }
      });
      
      return plan;
    } catch (error) {
      console.error('Błąd podczas parsowania odpowiedzi:', error);
      throw new AppError('Nieprawidłowa odpowiedź z API: ' + error.message, 500);
    }
  }
  
  /**
   * Tworzy domyślny plan treningowy w przypadku braku odpowiedzi z API
   * @param {Object} userData - Dane użytkownika
   * @returns {Object} Domyślny plan treningowy
   */
  _createDefaultTrainingPlan(userData) {
    console.log('Tworzenie domyślnego planu treningowego');
    
    // Pobierz planDuration z danych użytkownika lub użyj domyślnej wartości
    const planDuration = userData && userData.planDuration 
      ? parseInt(userData.planDuration, 10) 
      : 8;
    
    return {
      id: `running_plan_default_${Date.now()}`,
      metadata: {
        discipline: "running",
        target_group: "Biegacze początkujący",
        target_goal: "Poprawa ogólnej kondycji",
        level_hint: "początkujący",
        days_per_week: "3",
        duration_weeks: planDuration,
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