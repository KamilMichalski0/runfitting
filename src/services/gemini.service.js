const axios = require('axios');
const geminiConfig = require('../config/gemini.config'); 
 
const AppError = require('../utils/app-error');
const config = require('../config/gemini.config');
const { getExamplePlanTemplate, selectRandomizedPlanTemplate } = require('../templates/plan-template-selector');
const correctiveExercisesKnowledgeBase = require('../knowledge/corrective-knowledge-base'); // Corrected path
const { 
  HEART_RATE_ZONES, 
  TRAINING_COMPONENTS, 
  BEGINNER_PROGRESSION_PATTERN,
  generateDetailedWorkout,
  formatWorkoutDescription 
} = require('../templates/professional-training-structure');
const { checkWeekDiversity, isMonotonous } = require('../utils/plan-diversity-checker');

class GeminiService {
  constructor(knowledgeBase, correctiveExercisesKnowledgeBase) {
    // Load Gemini config
    this.geminiApiKey = geminiConfig.apiKey;
    this.geminiModel = geminiConfig.model;
    this.geminiApiUrl = geminiConfig.apiUrl; 

    // Build Gemini generationConfig object from flat config
    this.geminiGenerationConfig = {
      temperature: geminiConfig.temperature,
      topK: geminiConfig.topK,
      topP: geminiConfig.topP,
      maxOutputTokens: geminiConfig.maxTokens, 
      responseMimeType: 'application/json',
    };

    // Check Gemini API key - required for operation
    this.isGemini = !!this.geminiApiKey;
    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is required. This service uses only Gemini AI.');
    }

    // Initialize Axios for Gemini
    this.axiosClient = axios.create();

    // Inject dependency
    if (!knowledgeBase) {
      throw new Error('Knowledge base dependency is required for GeminiService.');
    }
    this.knowledgeBase = knowledgeBase; 
    this.correctiveExercisesKnowledgeBase = correctiveExercisesKnowledgeBase;

    // Bind methods
    this._createPrompt = this._createPrompt.bind(this);
    this._parseResponse = this._parseResponse.bind(this); 
 
    this._generateCorrectiveExercises = this._generateCorrectiveExercises.bind(this);
    this._createCorrectiveExercisesPrompt = this._createCorrectiveExercisesPrompt.bind(this);

    // Remove decorator calls
    this.generateTrainingPlan = this.generateTrainingPlan.bind(this);
    this.log = this.log.bind(this); 
    this.error = this.error.bind(this); 
  }

  // Method for standardized logging within the service
  log(message, data) {
    // Loguj tylko komunikaty związane z generowaniem planów
    if (message.includes('GEMINI') || message.includes('PROMPT') || message.includes('ODPOWIEDŹ') || 
        message.includes('===') || message.includes('Plan') || message.includes('parsowania')) {
      console.log(message, data !== undefined ? data : '');
    }
  }

  // Method for standardized error logging within the service
  error(message, errorData) {
    console.error(message, errorData !== undefined ? errorData : '');
  }

  async generateTrainingPlan(userData) {
    this.log('Rozpoczęcie generowania planu treningowego dla użytkownika:', userData.userId);

    // Sprawdź czy Gemini API jest skonfigurowane
    if (!this.geminiApiKey) {
      throw new AppError('Gemini API nie jest skonfigurowane. Skontaktuj się z administratorem.', 500);
    }

    // Konfiguracja retry
    const maxRetries = 3;
    const baseDelay = 1000; // 1 sekunda
    
    // Spróbuj wygenerować plan używając Gemini API z retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this._createPrompt(userData);
        const requestUrl = `${this.geminiApiUrl}/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

        const requestBody = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: this.geminiGenerationConfig,
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        };

        const response = await this.axiosClient.post(requestUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000, // 30 sekund timeout
        });

        const trainingPlan = this._parseResponse(response.data); 
        this.log('Plan treningowy wygenerowany pomyślnie przez Gemini');
        return trainingPlan;

      } catch (geminiError) {
        this.error(`\n⚠️ Błąd podczas próby ${attempt}/${maxRetries} generowania planu przez Gemini:`, {
          message: geminiError.message,
          status: geminiError.response?.status,
          data: geminiError.response?.data,
          stack: geminiError.stack
        });
        
        // Sprawdź czy to błąd, który może się powieść przy ponownej próbie
        const isRetryableError = this._isRetryableError(geminiError);
        
        if (attempt < maxRetries && isRetryableError) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Eksponencjalny backoff
          this.log(`Czekanie ${delay}ms przed kolejną próbą...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Spróbuj ponownie
        }
        
        // Jeśli to ostatnia próba lub błąd nie nadaje się do retry, rzuć błąd
        throw new AppError(
          `Nie udało się wygenerować planu treningowego po ${maxRetries} próbach. Spróbuj ponownie za kilka minut.`, 
          geminiError.response?.status || 500
        );
      }
    }
  }

  /**
   * Sprawdza czy błąd nadaje się do ponownej próby
   * @param {Error} error - Błąd do sprawdzenia
   * @returns {boolean} - True jeśli błąd nadaje się do retry
   */
  _isRetryableError(error) {
    // Błędy sieciowe
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }
    
    // Błędy HTTP 5xx (serwer)
    if (error.response && error.response.status >= 500) {
      return true;
    }
    
    // Rate limiting (429)
    if (error.response && error.response.status === 429) {
      return true;
    }
    
    // Monotonny plan (422) - wymagane ponowne generowanie
    if (error.response && error.response.status === 422) {
      return true;
    }
    
    // Timeout błędy
    if (error.message && error.message.includes('timeout')) {
      return true;
    }
    
    // Błąd monotonii w wiadomości
    if (error.message && error.message.includes('monotonous')) {
      return true;
    }
    
    return false;
  }

  _createPrompt(userData) {

    // Definicja funkcji safeGet na początku metody
    const safeGet = (obj, path, defaultValue = 'nie określono') => {
      try {
        const value = path.split('.').reduce((o, i) => o[i], obj);
        return value || defaultValue;
      } catch (e) {
        return defaultValue;
      }
    };
    
    const heartRateZones = this._calculateHeartRateZones(userData);
    
    let trainingPaces = null;
    // Użyj pola wynikTestuCoopera z nowego schematu formularza
    if (userData.wynikTestuCoopera) {
      trainingPaces = this._calculateTrainingPaces(userData.wynikTestuCoopera);
    }

    // Mapowanie celu użytkownika na rodzaj wiedzy
    const goalToKnowledgeMap = {
      'redukcja_masy_ciala': 'weight_loss_running', // Dedykowana baza dla redukcji wagi
      'przebiegniecie_dystansu': this._mapDistanceToKnowledgeBase(userData.dystansDocelowy || '5km'),
      'zaczac_biegac': 'beginner_specialized', // Specjalna baza dla początkujących
      'aktywny_tryb_zycia': 'lifestyle_fitness', // Dedykowana dla stylu życia
      'zmiana_nawykow': 'habit_building', // Dedykowana dla budowania nawyków
      'powrot_po_kontuzji': 'injury_recovery', // Dedykowana dla powrotu po kontuzji
      'poprawa_kondycji': 'fitness_improvement', // Dedykowana dla poprawy kondycji
      'inny_cel': 'general_fitness'
    };

    // Informacje o użytkowniku w nowym formacie
    const ageInfo = `Wiek: ${userData.wiek || 'nie podano'} lat`;
    
    // Mapowanie poziomu zaawansowania z nowego schematu
    const levelMap = {
      'poczatkujacy': 'Początkujący (biegam nieregularnie, zaczynam przygodę z bieganiem)',
      'sredniozaawansowany': 'Średniozaawansowany (biegam regularnie od kilku miesięcy/lat)',
      'zaawansowany': 'Zaawansowany (biegam regularnie od lat, startuję w zawodach)'
    };
    
    // Mapowanie celu z nowego schematu
    const goalMap = {
      'redukcja_masy_ciala': 'Redukcja masy ciała',
      'przebiegniecie_dystansu': `Przebiegniecie dystansu ${userData.dystansDocelowy || '5km'}`,
      'zaczac_biegac': 'Rozpoczęcie regularnych treningów biegowych',
      'aktywny_tryb_zycia': 'Prowadzenie aktywnego trybu życia',
      'zmiana_nawykow': 'Zmiana nawyków',
      'powrot_po_kontuzji': 'Powrót do formy po kontuzji',
      'poprawa_kondycji': 'Poprawa kondycji fizycznej',
      'inny_cel': userData.innyCelOpis || 'Inny cel (niesprecyzowany)'
    };
    
    const levelInfo = `Poziom zaawansowania: ${levelMap[userData.poziomZaawansowania] || userData.poziomZaawansowania || 'nie podano'}`;
    const goalInfo = `Główny cel: ${goalMap[userData.glownyCel] || userData.glownyCel || 'nie podano'}`;
    
    const daysPerWeekInfo = `Preferowana liczba dni treningowych w tygodniu: ${userData.dniTreningowe ? userData.dniTreningowe.length : 'nie podano'}`;
    const weeklyKilometersInfo = `Obecny tygodniowy kilometraż: ${userData.aktualnyKilometrTygodniowy || 'nie podano'} km`;
    
    // Określenie czasu trwania planu - NOWA LOGIKA
    const raceDateString = userData.raceDate;
    const planStartDateString = userData.planStartDate;

    let planDuration; // in weeks
    let raceDateInfo = '';
    let planStartDateInfo = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let effectivePlanStartDate = today;
    if (planStartDateString) {
        const parsedPlanStartDate = new Date(planStartDateString);
        parsedPlanStartDate.setHours(0,0,0,0);
        if (!isNaN(parsedPlanStartDate.getTime())) {
            planStartDateInfo = `Preferowana data rozpoczęcia planu: ${planStartDateString}.`;
            if (parsedPlanStartDate >= today) {
                effectivePlanStartDate = parsedPlanStartDate;
            } else {
                planStartDateInfo += ` (Uwaga: podana data rozpoczęcia jest w przeszłości, plan rozpocznie się od najbliższego możliwego terminu).`;
            }
        } else {
            planStartDateInfo = `Preferowana data rozpoczęcia planu: ${planStartDateString} (Uwaga: nieprawidłowy format daty).`;
        }
    }

    if (raceDateString) {
        const parsedRaceDate = new Date(raceDateString);
        parsedRaceDate.setHours(0,0,0,0);
        if (!isNaN(parsedRaceDate.getTime())) {
            if (parsedRaceDate > effectivePlanStartDate) {
                const diffTime = parsedRaceDate.getTime() - effectivePlanStartDate.getTime();
                // Add 1 day to diffDays to ensure the week of the race is included.
                // Example: race on Sunday, start on Monday of the same week = 6 days diff -> 1 week plan.
            }
        }
    }

    // Oblicz spersonalizowane strefy tętna
    const personalizedZones = this._calculateHeartRateZones(userData);
    
    // Przejdź przez wszystkie tygodnie i dni treningowe
    const updatedPlan = JSON.parse(JSON.stringify(plan)); // Deep copy
    
    updatedPlan.plan_weeks.forEach(week => {
      if (week.days && Array.isArray(week.days)) {
        week.days.forEach(day => {
          if (day.workout && day.workout.target_heart_rate) {
            const currentHR = day.workout.target_heart_rate;
            
            // Mapuj zakres tętna do odpowiedniej strefy
            let targetZone;
            if (currentHR.min >= 100 && currentHR.max <= 120) {
              targetZone = personalizedZones.zone1; // Regeneracja
            } else if (currentHR.min >= 115 && currentHR.max <= 135) {
              targetZone = personalizedZones.zone2; // Łatwe tempo
            } else if (currentHR.min >= 130 && currentHR.max <= 150) {
              targetZone = personalizedZones.zone2; // Łatwe tempo (często używane)
            } else if (currentHR.min >= 120 && currentHR.max <= 140) {
              targetZone = personalizedZones.zone2; // Łatwe tempo
            } else if (currentHR.min >= 125 && currentHR.max <= 145) {
              targetZone = personalizedZones.zone2; // Łatwe tempo
            } else {
              // Domyślnie użyj strefy 2 dla większości treningów
              targetZone = personalizedZones.zone2;
            }
            
            // Aktualizuj tylko jeśli mamy spersonalizowane strefy
            if (targetZone) {
              day.workout.target_heart_rate = {
                min: targetZone.min,
                max: targetZone.max
              };
            } else {
              throw new AppError('Nie udało się spersonalizować stref tętna', 500);
            }
          }
        });
      }
    });

    // Informacje o bólu użytkownika
    if (userData.lokalizacjaBolu) {
      healthInfo.push(`Lokalizacja bólu: ${userData.lokalizacjaBolu}`);
    }
    if (userData.charakterBolu) {
      healthInfo.push(`Charakter bólu: ${userData.charakterBolu}`);
    }
    if (userData.skalaBolu) {
      healthInfo.push(`Skala bólu (0-10): ${userData.skalaBolu}`);
    }
    
    if (userData.hasPrzewlekleChorby && userData.chorobyPrzewlekle && userData.chorobyPrzewlekle.length > 0) {
      healthInfo.push(`Choroby przewlekłe: ${userData.chorobyPrzewlekle.join(', ')}`);
      if (userData.opisChorobPrzewleklych) {
        healthInfo.push(`Szczegóły chorób przewlekłych: ${userData.opisChorobPrzewleklych}`);
      }
    }
    
    if (userData.alergie && userData.opisAlergii) {
      healthInfo.push(`Alergie: ${userData.opisAlergii}`);
    }

    if (userData.lekiStale && userData.opisLekowStalych) {
      healthInfo.push(`Leki stałe: ${userData.opisLekowStalych}`);
    }
    
    if (userData.problemyZoladkowe === 'tak' && userData.opisProblemowZoladkowych) {
      healthInfo.push(`Problemy żołądkowe: ${userData.opisProblemowZoladkowych}`);
    }
    
    const healthInfoText = healthInfo.length > 0 
      ? healthInfo.join('\\n')
      : 'Brak zgłoszonych problemów zdrowotnych';
    
    let goalsInfo = [];
    
    if (userData.poprawaTechnikiBiegu) {
      goalsInfo.push(`Cel: Poprawa techniki biegu`);
      if (userData.aspektyDoPoprawy && userData.aspektyDoPoprawy.length > 0) {
        goalsInfo.push(`Aspekty techniczne do poprawy: ${userData.aspektyDoPoprawy.join(', ')}`);
      }
    }
    
    if (userData.wsparcieDietetyczne) {
      goalsInfo.push(`Cel: Wsparcie dietetyczne`);
      if (userData.celeDietetyczne && userData.celeDietetyczne.length > 0) {
        goalsInfo.push(`Cele dietetyczne: ${userData.celeDietetyczne.join(', ')}`);
      }
      if (userData.ograniczeniaZywieniowe && Array.isArray(userData.ograniczeniaZywieniowe) && userData.ograniczeniaZywieniowe.length > 0) {
        goalsInfo.push(`Ograniczenia dietetyczne: ${userData.ograniczeniaZywieniowe.join(', ')}`);
        if (userData.opisOgraniczen) {
          goalsInfo.push(`Szczegóły ograniczeń: ${userData.opisOgraniczen}`);
        }
      }
    }
    
    if (userData.coMotywuje && userData.coMotywuje.length > 0) {
      goalsInfo.push(`Motywacja: ${userData.coMotywuje.join(', ')}`);
    }
    
    if (userData.gotowoscDoWyzwan) {
      goalsInfo.push(`Gotowość do wyzwań (1-10): ${userData.gotowoscDoWyzwan}`);
    }
    
    const goalsInfoText = goalsInfo.length > 0 
      ? goalsInfo.join('\\n')
      : 'Brak dodatkowych celów i preferencji';

    // Przygotowanie danych dla getExamplePlanTemplate
    const templateMatcherUserData = {
      experienceLevel: userData.poziomZaawansowania, // Mapowanie z polskiego na angielski
      mainGoal: userData.glownyCel,               // Mapowanie z polskiego na angielski
      daysPerWeek: userData.dniTreningowe ? userData.dniTreningowe.length : undefined, // Liczba dni
      injuries: userData.kontuzje,                // Bezpośrednie użycie
      // Dodaj inne pola, jeśli getExamplePlanTemplate ich używa
      // np. dystansDocelowy, jeśli jest relevantny dla wyboru szablonu
      dystansDocelowy: userData.dystansDocelowy 
    };
    this.log('Dane przekazywane do getExamplePlanTemplate:', templateMatcherUserData);

    // Pobranie przykładowego planu z RANDOMIZACJĄ - PRZENIESIONE TUTAJ
    const examplePlan = selectRandomizedPlanTemplate(templateMatcherUserData, {
      excludedVariants: [], // Można później dodać historię użytkownika
      forceRandomization: true
    });
    let examplePlanSection = ''; 
    if (examplePlan) {
      try {
        // Można rozważyć skrócenie przykładu, np. tylko pierwszy tydzień
        // const examplePlanPart = { ...examplePlan, plan_weeks: [examplePlan.plan_weeks[0]] };
        const examplePlanJson = JSON.stringify(examplePlan, null, 2); // Użyj pełnego planu na razie
        examplePlanSection = `

### PRZYKŁADOWY PLAN TRENINGOWY (DO WGLĄDU):
${examplePlanJson}`;
      } catch (error) {
        console.error("Błąd podczas serializacji przykładowego planu:", error);
        examplePlanSection = `

### PRZYKŁADOWY PLAN TRENINGOWY (DO WGLĄDU):
(Błąd podczas generowania przykładu)`;
      }
    }

    let cooperTestInfo = '';
    if (trainingPaces) {
      cooperTestInfo = `

### TEMPA TRENINGOWE (na podstawie testu Coopera):
- Tempo progowe: ${trainingPaces.threshold.min}:${trainingPaces.threshold.sec.toString().padStart(2, '0')} min/km
- Tempo maratońskie: ${trainingPaces.marathon.min}:${trainingPaces.marathon.sec.toString().padStart(2, '0')} min/km
- Tempo interwałowe: ${trainingPaces.interval.min}:${trainingPaces.interval.sec.toString().padStart(2, '0')} min/km
- Tempo regeneracyjne: ${trainingPaces.recovery.min}:${trainingPaces.recovery.sec.toString().padStart(2, '0')} min/km`;
    }

    // Określenie dystansu docelowego z nowego schematu
    const targetDistanceKnowledgeKey = goalToKnowledgeMap[userData.glownyCel] || 'general_fitness';
    const distanceKnowledge = safeGet(this.knowledgeBase, `distances.${targetDistanceKnowledgeKey}`, {}); 
    const userLevel = userData.poziomZaawansowania || 'poczatkujacy';

    const knowledgeBaseInfo = `
### BAZA WIEDZY DLA DYSTANSU ${targetDistanceKnowledgeKey.toUpperCase()}:
- Fokus treningowy: ${safeGet(distanceKnowledge, 'focus', []).join(', ')}
- Kluczowe typy treningów: ${safeGet(distanceKnowledge, 'keyTrainingTypes', []).join(', ')}
- Typowa długość planu: ${safeGet(distanceKnowledge, `typicalPlanLength.${userLevel}`, '8-12 tygodni')}
- Tapering: ${safeGet(distanceKnowledge, 'tapering.duration', '7-10 dni')} (redukcja objętości: ${safeGet(distanceKnowledge, 'tapering.volumeReduction', '20-50%')})
- Emfaza treningowa dla poziomu ${userLevel}: ${safeGet(distanceKnowledge, `trainingEmphasis.${userLevel}`, []).join(', ')}

### ZASADY TRENINGOWE:
${Object.entries(safeGet(this.knowledgeBase, 'principles', {})).map(([key, value]) => `
- ${safeGet(value, 'description', key)}:
  * ${safeGet(value, 'explanation', 'brak wyjaśnienia')}
  * Zastosowanie: ${safeGet(value, 'application', []).join(', ')}
`).join('\\n')}

### FAZY TRENINGOWE:
${Object.entries(safeGet(this.knowledgeBase, 'phases', {})).map(([key, value]) => `
- Faza ${key}:
  * Fokus: ${safeGet(value, 'focus', []).join(', ')}
  * Czas trwania: ${safeGet(value, 'duration', 'nie określono')}
  * Komponenty: ${safeGet(value, 'keyComponents', []).join(', ')}
  * Progresja: ${safeGet(value, 'progression', []).join(', ')}
`).join('\\n')}

### ZAPOBIEGANIE KONTUZJOM:
${Object.entries(safeGet(this.knowledgeBase, 'injuryPrevention.commonInjuries', {})).map(([key, value]) => `
- ${key}:
  * Opis: ${safeGet(value, 'description', 'brak opisu')}
  * Zapobieganie: ${safeGet(value, 'prevention', []).join(', ')}
`).join('\\n')}

### ZALECENIA ŻYWIENIOWE:
- Przed treningiem: ${safeGet(safeGet(this.knowledgeBase, 'nutrition', {}), 'preRun.guidelines', []).join(', ')}
- Podczas treningu: ${safeGet(safeGet(this.knowledgeBase, 'nutrition', {}), 'duringRun.guidelines', []).join(', ')}
- Po treningu: ${safeGet(safeGet(this.knowledgeBase, 'nutrition', {}), 'postRun.guidelines', []).join(', ')}

### ZALECENIA NAWODNIENIA:
- Przed treningiem: ${safeGet(safeGet(this.knowledgeBase, 'hydration', {}), 'preRun.guidelines', []).join(', ')}
- Podczas treningu: ${safeGet(safeGet(this.knowledgeBase, 'hydration', {}), 'duringRun.guidelines', []).join(', ')}
- Po treningu: ${safeGet(safeGet(this.knowledgeBase, 'hydration', {}), 'postRun.guidelines', []).join(', ')}

### ĆWICZENIA UZUPEŁNIAJĄCE:
${Object.entries(safeGet(this.knowledgeBase, 'complementaryExercises', {})).map(([category, data]) => `
#### ${category.toUpperCase()}:
${data.description}
${Object.entries(safeGet(data, 'exercises', {})).map(([exercise, details]) => `
- ${exercise}:
  * Opis: ${safeGet(details, 'description', 'brak opisu')}
  * Technika: ${safeGet(details, 'technique', 'brak techniki')}
  * Warianty: ${safeGet(details, 'variations', []).join(', ')}
  * Mięśnie docelowe: ${safeGet(details, 'targetMuscles', []).join(', ')}
  * Progresja: ${safeGet(details, 'progression', []).join(', ')}
  * Intensywność: ${safeGet(details, 'intensity', 'nie określono')}
  * Korzyści: ${safeGet(details, 'benefits', []).join(', ')}
`).join('\\n')}
`).join('\\n')}

### ĆWICZENIA KOREKCYJNE (dla biegaczy po kontuzjach lub z ryzykiem urazów):
${(() => {
  // This section will now be handled by a separate call, so we can simplify or remove it from the main prompt's knowledge base dump.
  // For now, let's indicate it's handled separately.
  return 'Sekcja ćwiczeń korekcyjnych zostanie wygenerowana osobno, jeśli użytkownik zgłosił kontuzje.';
})()}

### CZĘSTOTLIWOŚĆ ĆWICZEŃ (dla poziomu ${userLevel}):
${Object.entries(safeGet(this.knowledgeBase, 'exerciseFrequency', {})[userLevel] || {}).map(([type, frequency]) => `
- ${type}: ${frequency}
`).join('\\n')}

### ZASADY PROGRESJI ĆWICZEŃ:
${safeGet(this.knowledgeBase, 'exerciseProgression.principles', []).map(principle => `- ${principle}`).join('\\n')}

### CZYNNIKI PROGRESJI:
${Object.entries(safeGet(this.knowledgeBase, 'exerciseProgression.progressionFactors', {})).map(([factor, values]) => `
- ${factor}: ${values.join(', ')}
`).join('\\n')}`;

    // Dodaj randomizację do promptu dla zwiększenia różnorodności
    const creativityPrompts = [
      "Jesteś ekspertem w tworzeniu planów treningowych dla biegaczy. Stwórz spersonalizowany plan z kreatywnym podejściem, używając różnorodnych nazw treningów i motywujących opisów.",
      "Jesteś doświadczonym trenerem biegowym. Zaprojektuj plan z naciskiem na różnorodność i motywację, używając unikowych nazw treningów i angażujących opisów.",
      "Jesteś ekspertem w dziedzinie treningu biegowego. Wygeneruj plan z unikalnymi elementami i ciekawymi wyzwaniami, używając kreatywnych nazw treningów.",
      "Jesteś trenerem personalnym specjalizującym się w bieganiu. Stwórz plan z elementami zabawy i niespodziankami, używając różnorodnych opisów treningów.",
      "Jesteś ekspertem w treningu biegowym z pasją do innowacji. Zaprojektuj plan z odrębnym charakterem i motywującymi elementami."
    ];
    
    const randomPromptIndex = Math.floor(Math.random() * creativityPrompts.length);
    const selectedPrompt = creativityPrompts[randomPromptIndex];
    
    this.log(`🎲 Wybrano kreatywny prompt #${randomPromptIndex + 1}`);
    
    return `${selectedPrompt} Stwórz spersonalizowany plan treningowy na podstawie poniższych informacji o użytkowniku i dostępnej bazie wiedzy.

### DANE UŻYTKOWNIKA:
${ageInfo}
${levelInfo}
${goalInfo}
${daysPerWeekInfo}
${weeklyKilometersInfo}
${planDurationInfo}
${planStartDateInfo}
${raceDateInfo}

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

### PROFESJONALNA STRUKTURA TRENINGOWA:
**STREFY TĘTNA PROFESJONALNE:**
${Object.entries(HEART_RATE_ZONES).map(([key, zone]) => `
- ${zone.description} (${zone.percentage} HR MAX): RPE ${zone.rpe} - ${zone.purpose}`).join('')}

**KOMPONENTY TRENINGOWE:**
${Object.entries(TRAINING_COMPONENTS).map(([component, details]) => `
- ${component}: ${details.duration} - ${details.description || details.structure}
  ${details.example ? `Przykład: ${details.example}` : ''}
  ${details.timing ? `Timing: ${details.timing}` : ''}`).join('')}

**PROGRESJA DLA POCZĄTKUJĄCYCH:**
${Object.entries(BEGINNER_PROGRESSION_PATTERN).map(([period, progression]) => `
- ${period}: ${progression.maxDuration} min, ${progression.pattern}
  Strefy HR: ${progression.heartRateZones.join(', ')}
  Struktura: ${progression.structure}`).join('')}

**PRZYKŁADOWE TRENINGI PROFESJONALNE:**
${(() => {
  const examples = [
    generateDetailedWorkout(1, 1, 'beginner'),
    generateDetailedWorkout(7, 1, 'beginner'),
    generateDetailedWorkout(12, 1, 'beginner')
  ];
  return examples.map(workout => `
Tydzień ${workout.name.includes('1') ? '1' : workout.name.includes('7') ? '7' : '12'}: ${workout.name}
- Struktura: ${workout.structure}
- Czas: ${workout.duration} min
- RPE: ${workout.rpeGuidance}
- Strefy HR: ${workout.heartRateZones.join(', ')}`).join('');
})()}

**WZORCE RÓŻNORODNYCH TRENINGÓW - UŻYJ JAKO INSPIRACJI:**
Dzień 1 (Poniedziałek): "Gentle Introduction" 
- Rozgrzewka: 8 min dynamiczne rozciąganie + aktywacja core
- Główny: 6x (90 sek trucht RPE 4/10 + 90 sek żywy marsz RPE 2/10)
- Wyciszenie: 7 min spokojny marsz + rozciąganie nóg

Dzień 2 (Środa): "Building Confidence"
- Rozgrzewka: 5 min marsz + mobilność bioder  
- Główny: 4x (3 min trucht RPE 5/10 + 2 min żywy marsz RPE 2/10)
- Wyciszenie: 10 min spokojny marsz + rozciąganie całego ciała

Dzień 3 (Piątek): "Rhythm & Technique Focus"
- Rozgrzewka: 6 min marsz + ćwiczenia techniki biegu
- Główny: 8x (1 min trucht z fokusem na kadencję + 1 min marsz na obserwację) 
- Wyciszenie: 5 min marsz + ćwiczenia równowagi

KAŻDY TRENING MUSI MIEĆ INNĄ STRUKTURĘ I FOKUS!

${cooperTestInfo}
${examplePlanSection}
${knowledgeBaseInfo}

### WYMAGANA STRUKTURA ODPOWIEDZI:
Plan musi być zwrócony w następującym formacie JSON.

🚨 KRYTYCZNE PRZYPOMNIENIE PRZED GENEROWANIEM:
- Sprawdź czy każdy trening w tygodniu ma RÓŻNĄ strukturę interwałów
- Sprawdź czy każdy trening ma RÓŻNY czas trwania głównej części  
- Sprawdź czy każdy trening ma INNY fokus i opis
- Jeśli jakiekolwiek dwa treningi są podobne - PRZEPISZ jeden z nich
- Każdy dzień musi być unikalny i różnorodny!

🔥 ABSOLUTNIE ZABRONIONE - NIGDY NIE RÓB TEGO:
- ❌ NIGDY nie używaj tego samego wzorca interwałów (np. "1 min bieg/2 min marsz") dla różnych dni
- ❌ NIGDY nie powtarzaj identycznego czasu trwania głównej części treningu
- ❌ NIGDY nie używaj identycznych opisów treningów
- ❌ NIGDY nie generuj planów gdzie wszystkie dni mają tę samą strukturę

✅ WYMAGANE RÓŻNICE MIĘDZY DNIAMI:
- Dzień 1: Krótkie interwały (np. 6x 1min bieg/1min marsz) - fokus na rytm
- Dzień 2: Średnie interwały (np. 4x 2min bieg/2min marsz) - fokus na wytrzymałość  
- Dzień 3: Długie interwały (np. 3x 3min bieg/1min marsz) - fokus na progres
- Każdy dzień MUSI mieć inny czas trwania: 20min, 25min, 30min
- Każdy dzień MUSI mieć inny fokus: technika, kondycja, siła mentalna

🎯 KONKRETNE PRZYKŁADY RÓŻNORODNOŚCI:
Poniedziałek: "8x (1min bieg RPE 4/10 + 1min marsz RPE 2/10)" - 20min - fokus na kadencję
Środa: "5x (2min bieg RPE 5/10 + 2min marsz RPE 2/10)" - 25min - fokus na wytrzymałość
Piątek: "4x (3min bieg RPE 4/10 + 1min marsz RPE 2/10)" - 30min - fokus na progres

JEŚLI WYGENERUJESZ IDENTYCZNE TRENINGI = NATYCHMIASTOWE PRZEPISANIE!

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
          "day_name": string (WAŻNE: użyj DOKŁADNIE jednej z wartości: "poniedzialek", "wtorek", "sroda", "czwartek", "piatek", "sobota", "niedziela"),
          "date": string (YYYY-MM-DD, data treningu - WAŻNE: oblicz na podstawie daty startu planu i dnia tygodnia),
          "workout": {
            "type": string (MUSI BYĆ RÓŻNY dla każdego dnia),
            "description": string (MUSI BYĆ UNIKALNY - minimum 20 słów, konkretne interwały, różne wzorce),
            "distance": number lub null,
            "duration": number (MUSI BYĆ RÓŻNY dla każdego dnia - np. 20, 25, 30),
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
  ],
  "corrective_exercises": {
    "frequency": string (np. "2-3 razy w tygodniu w dni nietreningowe"),
    "list": [
      {
        "name": string,
        "sets": number,
        "reps": number lub null,
        "duration": number lub null,
        "description": string (opcjonalny opis/instrukcja)
      }
    ]
  },
  "pain_monitoring": {
    "scale": string (np. "0-10, gdzie 0=brak bólu, 10=ból nie do zniesienia"),
    "rules": [
      string (np. "Przerwij trening, jeśli ból przekroczy 4/10"),
      string (np. "Monitoruj ból przed, w trakcie i po treningu")
    ]
  },
  "notes": [
    string (spersonalizowane notatki dla użytkownika, uwzględniające jego poziom zaawansowania, cele i ograniczenia)
  ]
}

### INSTRUKCJE DOTYCZĄCE NOTATEK:
1. Wygeneruj 5-7 spersonalizowanych notatek dla użytkownika
2. Notatki powinny być konkretne i praktyczne
3. Uwzględnij:
   - Wskazówki dotyczące regeneracji
   - Porady dotyczące monitorowania postępów
   - Wskazówki dotyczące techniki biegu
   - Porady dotyczące odżywiania i nawodnienia
   - Wskazówki dotyczące zapobiegania kontuzjom
   - Specjalne uwagi wynikające z indywidualnych cech użytkownika
4. Notatki powinny być dostosowane do:
   - Poziomu zaawansowania użytkownika
   - Jego celów treningowych
   - Ewentualnych kontuzji lub ograniczeń
   - Częstotliwości treningów
5. Używaj prostego, zrozumiałego języka
6. Każda notatka powinna być konkretna i możliwa do wykonania

KRYTYCZNE WYMAGANIA:
1. Pole day_name MUSI zawierać DOKŁADNIE jedną z wartości: "poniedzialek", "wtorek", "sroda", "czwartek", "piatek", "sobota", "niedziela"
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
13. Wykorzystaj wiedzę z bazy wiedzy do stworzenia optymalnego planu treningowego
14. Uwzględnij fazy treningowe i zasady progresji z bazy wiedzy
15. Dostosuj plan do specyficznych wymagań dystansu docelowego
16. Sekcja \`corrective_exercises\` w odpowiedzi JSON zostanie wypełniona osobno, jeśli użytkownik zgłosił kontuzję. W głównym planie można zostawić ją jako pustą strukturę lub pominąć, jeśli model ma tendencję do jej wypełniania. Dla pewności, instruuję, aby główny model jej nie wypełniał.
17. Długość tablicy \`plan_weeks\` (liczba faktycznie wygenerowanych tygodni w planie) MUSI być zgodna z wartością podaną w \`Planowany czas trwania planu: X tygodni\` w sekcji \`DANE UŻYTKOWNIKA\`. Pole \`metadata.duration_weeks\` również musi odzwierciedlać tę liczbę. Nie skracaj planu bez wyraźnego powodu wynikającego z innych ograniczeń.
18. Jeśli podano 'Data zawodów docelowych', plan MUSI być tak skonstruowany, aby zakończyć się w tygodniu tych zawodów, uwzględniając odpowiedni tapering w ostatnich 1-3 tygodniach, w zależności od długości planu i dystansu. Ostatni tydzień planu powinien być tygodniem startowym.
19. Jeśli podano 'Preferowana data rozpoczęcia planu', pierwszy tydzień planu powinien być interpretowany jako rozpoczynający się w okolicach tej daty.
20. Dla każdego dnia treningowego w \`plan_weeks.days\` MUSISZ wygenerować poprawne pole \`date\` w formacie YYYY-MM-DD. Oblicz daty sekwencyjnie, zaczynając od \`effectivePlanStartDate\` (informacja o niej będzie w \`DANE UŻYTKOWNIKA\` jako \`Preferowana data rozpoczęcia planu\` lub domyślnie dzisiejsza data, jeśli nie podano inaczej). Pamiętaj, że \`day_name\` określa dzień tygodnia dla danego treningu.
21. Plan musi być zróżnicowany, zawierać różne typy treningów i ćwiczeń, aby zachęcić użytkownika do regularnego treningu.

WAŻNE: Wygeneruj nowy, unikalny plan treningowy bazując na powyższym przykładzie, ale dostosowany do profilu użytkownika i wykorzystujący wiedzę z bazy wiedzy. Odpowiedz WYŁĄCZNIE w formacie JSON. Nie dodawaj żadnego tekstu przed ani po strukturze JSON. Nie używaj cudzysłowów w nazwach pól.
Pamiętaj, że sekcja 'PRZYKŁADOWY PLAN TRENINGOWY' służy WYŁĄCZNIE jako wzór struktury JSON. NIE KOPIUJ zawartości tego przykładu. Wygeneruj całkowicie nowy, unikalny plan dostosowany do danych użytkownika.

### KLUCZOWE WYMAGANIA RÓŻNORODNOŚCI:
21. Plan MUSI być maksymalnie zróżnicowany i zawierać różne typy treningów i ćwiczeń, aby zachęcić użytkownika do regularnego treningu i uniknąć monotonii.

22. **SPECJALNE ZASADY DLA POCZĄTKUJĄCYCH (poziom: poczatkujacy, absolute_beginner):**
    - Wprowadzaj STOPNIOWO różne typy aktywności: spacery, marsz-bieg, aktywna regeneracja, mobilność
    - W pierwszych tygodniach używaj RÓŻNYCH formatów treningu każdego dnia
    - Przykłady typów treningów dla początkujących: 'walk_run', 'mobility_walk', 'active_recovery', 'endurance_building', 'walk_run_intervals', 'technique_focus'
    - Każdy trening powinien mieć INNY charakter i INNE ćwiczenia uzupełniające
    - Dodawaj elementy zabawy i variacji (np. "weekend challenge", "fitness spacer", "trening techniki")

23. **RÓŻNORODNOŚĆ OPISÓW I INSTRUKCJI:**
    - Każdy trening musi mieć UNIKALNY i SZCZEGÓŁOWY opis (minimum 10-15 słów)
    - Unikaj powtarzania tych samych fraz - każdy opis powinien być świeży i motywujący
    - Używaj różnorodnych terminów: "intervals", "fartlek", "tempo run", "recovery jog", "long slow distance"
    - Dla początkujących używaj opisów typu: "eksploracja różnych temp", "nauka rytmu", "budowanie pewności"

24. **RÓŻNORODNOŚĆ ĆWICZEŃ UZUPEŁNIAJĄCYCH:**
    - Każdy dzień treningowy powinien mieć RÓŻNE ćwiczenia support_exercises
    - Rotuj między: rozciąganiem, wzmacnianiem, mobilnością, równowagą, techniką
    - Używaj konkretnych nazw: "Wzmacnianie core", "Mobilność bioder", "Dynamiczne rozciąganie", "Ćwiczenia równowagi", "Aktywacja pośladków"
    - Dla początkujących wprowadzaj ćwiczenia progresywnie od najprostszych

25. **PROGRESYWNE WPROWADZANIE ELEMENTÓW:**
    - Tydzień 1-2: podstawy (marsz-bieg, spacery z ćwiczeniami)
    - Tydzień 3-4: wprowadzanie variacji tempa i różnych formatów
    - Tydzień 5+: większa różnorodność i złożoność treningu
    - Każdy tydzień powinien mieć INNY focus i INNE podejście do treningu

26. **KREATYWNOŚĆ W NAZWACH I PODEJŚCIU:**
    - Używaj motywujących nazw treningów jak "Morning energizer", "Weekend warrior", "Midweek challenge"
    - Variuj miejsca i scenariusze: park, ścieżki, boisko, okolice domu
    - Dodawaj elementy mentalne: "focus na oddychaniu", "świadomość techniki", "listening to your body"

27. **WYKORZYSTANIE PROFESJONALNEJ STRUKTURY TRENINGOWEJ:**
    - Używaj PROFESJONALNYCH STREF TĘTNA z sekcji "PROFESJONALNA STRUKTURA TRENINGOWA"
    - Stosuj RPE (Rate of Perceived Exertion) w opisach treningów (skala 1-10/10)
    - Dla początkujących stosuj progresję zgodną z "PROGRESJĄ DLA POCZĄTKUJĄCYCH"
    - Wprowadzaj elementy rozgrzewki, rozciągania i wyciszenia zgodnie z "KOMPONENTAMI TRENINGOWYMI"
    - Używaj terminologii z przykładów profesjonalnych: "trucht", "żywy marsz", "żywy bieg", "spokojny marsz"
    - Strukturyzuj treningi w fazach: rozgrzewka → rozciąganie → główny trening → wyciszenie
    - Dla początkujących stosuj interwały marsz-bieg zgodnie z wzorcami profesjonalnymi

28. **KRYTYCZNE WYMAGANIA ANTY-MONOTONICZNOŚCI:**
    - KAŻDY TRENING W TYGODNIU MUSI BYĆ INNY
    - NIGDY nie powtarzaj tej samej struktury treningu w tym samym tygodniu
    - Variuj długość interwałów: 1 min/1 min, 2 min/2 min, 3 min/1 min, 1 min/2 min, 4 min/2 min
    - Różnicuj typy treningów:
      * Dzień 1: Krótkie interwały (np. 8x 1 min bieg/1 min marsz)
      * Dzień 2: Średnie interwały (np. 5x 2 min bieg/2 min marsz)  
      * Dzień 3: Długie interwały (np. 3x 4 min bieg/2 min marsz)
    - Zmieniaj fokus każdego treningu:
      * "Fokus na rytmie i technice"
      * "Fokus na wytrzymałości" 
      * "Fokus na pewności siebie"
    - Używaj RÓŻNYCH opisów rozgrzewki i wyciszenia
    - Variuj czas rozgrzewki: 5-10 min, czas głównego treningu: 20-30 min
    - Dodawaj unikalne elementy do każdego treningu (np. ćwiczenia równowagi, aktywacja mięśni)

29. **PRZYKŁADY RÓŻNORODNYCH TRENINGÓW DLA POCZĄTKUJĄCYCH:**
    - Trening A: "Eksploracja różnych temp" - 6x (90 sek bieg/90 sek marsz)
    - Trening B: "Budowanie pewności" - 4x (3 min bieg/2 min marsz) 
    - Trening C: "Praca nad techniką" - 8x (1 min bieg/1 min marsz) + ćwiczenia techniki
    - Trening D: "Weekend challenge" - 3x (4 min bieg/2 min marsz)
    - Trening E: "Fitness spacer plus" - 20 min marsz + 5x (30 sek bieg/30 sek marsz)

30. **OBOWIĄZKOWE SPRAWDZENIE RÓŻNORODNOŚCI:**
    - Przed zwróceniem planu sprawdź czy wszystkie treningi w tygodniu są różne
    - Jeśli jakiekolwiek dwa treningi mają identyczną strukturę - PRZEPISZ jeden z nich
    - Żaden trening nie może mieć identycznych interwałów co inny w tym samym tygodniu
    - Każdy opis treningu musi być unikalny i szczegółowy (min 15 słów)

31. **SYSTEM KONTROLI JAKOŚCI RÓŻNORODNOŚCI:**
    - Po wygenerowaniu planu wykonaj KONTROLĘ JAKOŚCI:
    - Sprawdź czy duration_minutes każdego dnia jest RÓŻNY
    - Sprawdź czy wzorce interwałów są RÓŻNE (np. 1min/2min vs 2min/2min vs 3min/1min)
    - Sprawdź czy opisy treningów są RÓŻNE
    - Sprawdź czy fokusy treningów są RÓŻNE
    - JEŚLI ZNAJDZIESZ PODOBIEŃSTWA - PRZEPISZ NATYCHMIAST!

32. **ALGORYTM GENEROWANIA RÓŻNORODNYCH TRENINGÓW:**
    - Krok 1: Ustal różne czasy trwania (np. 20, 25, 30 min)
    - Krok 2: Ustal różne wzorce interwałów (1min/1min, 2min/2min, 3min/1min)
    - Krok 3: Ustal różne fokusy (technika, wytrzymałość, progres)
    - Krok 4: Napisz różne opisy dla każdego dnia
    - Krok 5: Sprawdź czy wszystko jest różne - jeśli nie, popraw!

🚨🚨🚨 ULTIMATUM - ABSOLUTNY NAKAZ! 🚨🚨🚨
PRZECZYTAJ TO UWAŻNIE PRZED WYGENEROWANIEM PLANU:

1. Każdy dzień treningowy MUSI mieć INNY wzorzec interwałów
2. Każdy dzień treningowy MUSI mieć INNY czas trwania
3. Każdy dzień treningowy MUSI mieć INNY opis (minimum 20 słów)
4. Każdy dzień treningowy MUSI mieć INNY fokus

PRZYKŁAD POPRAWNEGO PLANU:
- Poniedziałek: 6x (1min bieg/1min marsz) - 20min - fokus na rytm i kadencję
- Środa: 4x (2min bieg/2min marsz) - 25min - fokus na wytrzymałość aerobową  
- Piątek: 3x (3min bieg/1min marsz) - 30min - fokus na progresję i pewność

PRZYKŁAD BŁĘDNEGO PLANU (NIE RÓB TAK!):
- Poniedziałek: 5x (1min bieg/2min marsz) - 25min
- Środa: 5x (1min bieg/2min marsz) - 25min  
- Piątek: 5x (1min bieg/2min marsz) - 25min

JEŚLI WYGENERUJESZ MONOTONNY PLAN = NATYCHMIASTOWE PRZEPISANIE!
SPRAWDŹ PLAN PRZED WYSŁANIEM - CZY WSZYSTKIE DNI SĄ RÓŻNE?
`;
  }

  // Nowa metoda mapująca dystans na odpowiedni klucz w bazie wiedzy
  _mapDistanceToKnowledgeBase(distance) {
    switch(distance) {
      case '5km': return '5k';
      case '10km': return '10k';
      case 'polmaraton': return 'halfMarathon';
      case 'maraton': return 'marathon';
      case 'inny': return 'general_fitness';
      default: return 'general_fitness';
    }
  }

  _calculateHeartRateZones(userData) {
    // Obliczenie maksymalnego tętna na podstawie wieku
    let maxHR;
    if (userData.maxHr) {
      maxHR = userData.maxHr;
    } else {
      const userAge = userData.wiek || userData.age;
      maxHR = Math.round(208 - (0.7 * userAge)); 
    }

    // Użyj restingHr z nowego schematu lub domyślnej wartości
    const restingHR = userData.restingHr || userData.resting_hr || userData.tetnoSpoczynkowe || 60;

    const hrr = maxHR - restingHR;

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
        max: Math.round(maxHR) 
      }
    };
  }

  _calculateTrainingPaces(cooperTestDistance) {
    const vo2max = (cooperTestDistance - 504.9) / 44.73;

    const thresholdPace = 3600 / (vo2max * 0.85); 

    const marathonPace = 3600 / (vo2max * 0.75);

    const intervalPace = 3600 / (vo2max * 0.95);

    const recoveryPace = 3600 / (vo2max * 0.65);

    return {
      threshold: {
        min: Math.floor(thresholdPace / 60),
        sec: Math.round((thresholdPace % 60))
      },
      marathon: {
        min: Math.floor(marathonPace / 60),
        sec: Math.round((marathonPace % 60))
      },
      interval: {
        min: Math.floor(intervalPace / 60),
        sec: Math.round((intervalPace % 60))
      },
      recovery: {
        min: Math.floor(recoveryPace / 60),
        sec: Math.round((recoveryPace % 60))
      }
    };
  }

  _parseResponse(apiResponse) { 
    this.log('Rozpoczęcie parsowania odpowiedzi Gemini');
    try {
      if (!apiResponse) {
        console.error('Otrzymano pustą odpowiedź z API');
        throw new AppError('Otrzymano pustą odpowiedź z Gemini API', 500);
      }
      
      let plan;
      try {
        if (!apiResponse.candidates || !Array.isArray(apiResponse.candidates) || apiResponse.candidates.length === 0) {
          console.error('Nieprawidłowa struktura odpowiedzi - brak candidates:', apiResponse);
          throw new AppError('Nieprawidłowa struktura odpowiedzi z Gemini API', 500);
        }
        
        const candidate = apiResponse.candidates[0];
        if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
          console.error('Nieprawidłowa struktura candidate - brak parts:', candidate);
          throw new AppError('Nieprawidłowa struktura odpowiedzi z Gemini API', 500);
        }
        
        const textPart = candidate.content.parts[0];
        if (!textPart.text) {
          console.error('Brak tekstu w odpowiedzi:', textPart);
          throw new AppError('Brak tekstu w odpowiedzi z Gemini API', 500);
        }
        
        const candidates = textPart.text;
        console.log('Wyodrębniony tekst z odpowiedzi:', candidates);
        
        // Ulepszone parsowanie JSON z wieloma strategiami naprawy
        plan = this._parseJSONWithFallbacks(candidates);
        
      } catch (error) {
        console.error('Błąd podczas przetwarzania odpowiedzi:', error);
        throw new AppError('Błąd podczas przetwarzania odpowiedzi z Gemini API: ' + error.message, 500);
      }
      
      // USUNIĘTO: Walidacja pełnych planów - są deprecated
      // Jedyna walidacja odbywa się w parseWeeklyPlanResponse() z prawidłowymi trainingDays
      
      // Diversity checking is now handled in parseWeeklyPlanResponse for weekly plans
      // This allows for proper retry logic when plans are too monotonous
      
      return plan;
    } catch (error) {
      console.error('Błąd podczas parsowania odpowiedzi:', error);
      throw new AppError('Nieprawidłowa odpowiedź z API: ' + error.message, 500);
    }
  }

  /**
   * Parsuje JSON z wieloma strategiami fallback
   * @param {string} jsonText - Tekst do parsowania
   * @returns {Object} - Sparsowany obiekt
   */
  _parseJSONWithFallbacks(jsonText) {
    try {
      if (!jsonText) {
        throw new Error('Otrzymano pusty tekst');
      }
      
      if (jsonText.trim().startsWith('null') || jsonText.trim().startsWith('undefined')) {
        throw new Error(`Otrzymano nieprawidłową wartość: ${jsonText.trim().substring(0, 20)}...`);
      }
      
      // Strategia 1: Bezpośrednie parsowanie JSON
      try {
        const plan = JSON.parse(jsonText);
        console.log('Pomyślnie sparsowano JSON bezpośrednio');
        return plan;
      } catch (parseError) {
        console.error('Błąd parsowania JSON z odpowiedzi:', parseError);
      }
      
      // Strategia 2: Wyodrębnienie JSON z tekstu
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonCandidate = jsonMatch[0];
          console.log('Znaleziono potencjalny JSON:', jsonCandidate.substring(0, 100) + '...');
          const plan = JSON.parse(jsonCandidate);
          console.log('Pomyślnie sparsowano wyodrębniony JSON');
          return plan;
        } catch (secondParseError) {
          console.error('Błąd parsowania wyodrębnionego JSON:', secondParseError);
        }
        
        // Strategia 3: Naprawa typowych błędów JSON
        try {
          let fixedJson = jsonMatch[0];
          
          // Naprawa cudzysłowów
          fixedJson = fixedJson.replace(/([\{\[,:]\s*)'([^']*)'(\s*[\}\],:])/g, '$1"$2"$3');
          fixedJson = fixedJson.replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
          
          // Naprawa wielokrotnych przecinków
          fixedJson = fixedJson.replace(/,+/g, ',');
          
          // Naprawa nieprawidłowych wartości null i undefined
          fixedJson = fixedJson.replace(/:\s*undefined/g, ': null');
          fixedJson = fixedJson.replace(/:\s*NaN/g, ': null');
          
          // Naprawa końcowych przecinków
          fixedJson = fixedJson.replace(/,(\s*[\}\]])/g, '$1');
          
          console.log('Próba naprawy JSON:', fixedJson.substring(0, 100) + '...');
          
          const plan = JSON.parse(fixedJson);
          console.log('Pomyślnie sparsowano naprawiony JSON');
          return plan;
        } catch (thirdParseError) {
          console.error('Nie udało się naprawić JSON:', thirdParseError);
        }
        
        // Strategia 4: Częściowe parsowanie kluczowych sekcji
        try {
          const partialPlan = this._parsePartialJSON(jsonMatch[0]);
          if (partialPlan) {
            console.log('Pomyślnie sparsowano częściowy JSON');
            return partialPlan;
          }
        } catch (partialError) {
          console.error('Nie udało się sparsować częściowo:', partialError);
        }
      } else {
        console.error('Nie znaleziono struktury JSON w odpowiedzi');
      }
      
      throw new Error('Nie udało się sparsować JSON żadną ze strategii');
    } catch (error) {
      console.error('Całkowity błąd parsowania:', error);
      throw error;
    }
  }

  /**
   * Parsuje JSON częściowo, wyodrębniając kluczowe sekcje
   * @param {string} jsonText - Tekst JSON do parsowania
   * @returns {Object|null} - Częściowo sparsowany plan lub null
   */
  _parsePartialJSON(jsonText) {
    try {
      const plan = {
        id: this._extractField(jsonText, 'id') || 'default-plan-' + Date.now(),
        metadata: {},
        plan_weeks: [],
        corrective_exercises: { frequency: "codziennie", list: [] },
        pain_monitoring: { 
          scale: "Skala bólu 1-10 (1=brak, 10=nie do zniesienia)",
          rules: [
            "Ból 1-3: Kontynuuj trening normalnie",
            "Ból 4-6: Zmniejsz intensywność", 
            "Ból 7-10: Przerwij trening, skonsultuj się z lekarzem"
          ]
        },
        notes: []
      };
      
      // Wyodrębnij metadata
      const metadataMatch = jsonText.match(/"metadata"\s*:\s*\{[^}]*\}/);
      if (metadataMatch) {
        try {
          plan.metadata = JSON.parse(metadataMatch[0].replace('"metadata":', ''));
        } catch (e) {
          plan.metadata = {
            duration_weeks: 8,
            training_days_per_week: 3,
            goal: "Poprawa kondycji"
          };
        }
      }
      
      // Wyodrębnij plan_weeks (uproszczone)
      const weeksMatch = jsonText.match(/"plan_weeks"\s*:\s*\[[\s\S]*?\]/);
      if (weeksMatch) {
        try {
          const weeksArray = JSON.parse(weeksMatch[0].replace('"plan_weeks":', ''));
          plan.plan_weeks = weeksArray;
        } catch (e) {
          // Użyj domyślnego planu jeśli nie udało się sparsować
          plan.plan_weeks = this._createDefaultWeeks(trainingDays);
        }
      } else {
        plan.plan_weeks = this._createDefaultWeeks(trainingDays);
      }
      
      return plan;
    } catch (error) {
      console.error('Błąd parsowania częściowego:', error);
      return null;
    }
  }

  /**
   * Wyodrębnia wartość pola z tekstu JSON
   * @param {string} text - Tekst do przeszukania
   * @param {string} field - Nazwa pola
   * @returns {string|null} - Wartość pola lub null
   */
  _extractField(text, field) {
    const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Tworzy domyślne tygodnie planu
   * @returns {Array} - Tablica tygodni
   */
  _createDefaultWeeks(trainingDays = null) {
    const weeks = [];
    for (let i = 1; i <= 6; i++) {
      weeks.push(this._createDefaultWeek(i, trainingDays));
    }
    return weeks;
  }

  /**
   * Waliduje i naprawia plan treningowy
   * @param {Object} plan - Plan do walidacji
   * @returns {Object} - Naprawiony plan
   */
  _validateAndRepairPlan(plan, trainingDays = null) {
    if (!plan || typeof plan !== 'object') {
      throw new Error('Plan nie jest prawidłowym obiektem');
    }

    // Naprawa brakujących podstawowych pól
    if (!plan.id) {
      plan.id = 'generated-plan-' + Date.now();
      console.warn('Dodano brakujące ID planu');
    }

    if (!plan.metadata || typeof plan.metadata !== 'object') {
      plan.metadata = {
        duration_weeks: 8,
        training_days_per_week: 3,
        goal: "Poprawa kondycji",
        created_at: new Date().toISOString()
      };
      console.warn('Dodano brakujące metadata');
    }

    if (!plan.plan_weeks || !Array.isArray(plan.plan_weeks)) {
      console.error('Brakujące lub nieprawidłowe plan_weeks, tworzenie domyślnych');
      plan.plan_weeks = this._createDefaultWeeks(trainingDays);
    }

    // 🔧 KRYTYCZNA NAPRAWA: Walidacja i korekta dni treningowych w odpowiedzi AI
    if (trainingDays && Array.isArray(trainingDays) && trainingDays.length > 0) {
      this.log(`🔧 NAPRAWA PLANU: Wymuszanie dni treningowych użytkownika: ${trainingDays.join(', ')}`);
      
      plan.plan_weeks = plan.plan_weeks.map((week, index) => {
        if (!week || typeof week !== 'object') {
          return this._createDefaultWeek(index + 1, trainingDays);
        }

        if (!week.week_num) week.week_num = index + 1;
        if (!week.focus) week.focus = "Trening ogólnorozwojowy";
        
        if (!week.days || !Array.isArray(week.days)) {
          week.days = this._createDefaultDays(index + 1, trainingDays);
        } else {
          // 🚨 GŁÓWNA NAPRAWA: Wymień dni AI na dni użytkownika
          const correctedDays = week.days.map((day, dayIndex) => {
            if (dayIndex < trainingDays.length) {
              const correctedDay = { ...day };
              const originalDayName = day.day || day.day_name;
              correctedDay.day = trainingDays[dayIndex];
              correctedDay.day_name = trainingDays[dayIndex];
              
              // Loguj poprawki
              if (originalDayName !== trainingDays[dayIndex]) {
                this.log(`🔧 NAPRAWA: Zmieniono dzień '${originalDayName}' na '${trainingDays[dayIndex]}'`);
              }
              
              return this._validateAndRepairDay(correctedDay, dayIndex, index + 1, trainingDays);
            }
            return this._validateAndRepairDay(day, dayIndex, index + 1, trainingDays);
          });
          
          // Zachowaj tylko tyle dni ile użytkownik ma treningowych
          week.days = correctedDays.slice(0, trainingDays.length);
          
          this.log(`✅ Tydzień ${week.week_num}: wymuszono dni ${week.days.map(d => d.day || d.day_name).join(', ')}`);
        }

        return week;
      });
    } else {
      // Fallback do starej logiki gdy brak trainingDays
      plan.plan_weeks = plan.plan_weeks.map((week, index) => {
        if (!week || typeof week !== 'object') {
          return this._createDefaultWeek(index + 1, trainingDays);
        }

        if (!week.week_num) week.week_num = index + 1;
        if (!week.focus) week.focus = "Trening ogólnorozwojowy";
        
        if (!week.days || !Array.isArray(week.days)) {
          week.days = this._createDefaultDays(index + 1, trainingDays);
        } else {
          // Walidacja dni
          week.days = week.days.map((day, dayIndex) => {
            return this._validateAndRepairDay(day, dayIndex, index + 1, trainingDays);
          });
        }

        return week;
      });
    }

    // Dodanie brakujących sekcji
    if (!plan.corrective_exercises) {
      plan.corrective_exercises = { frequency: "codziennie", list: [] };
    }

    if (!plan.pain_monitoring) {
      plan.pain_monitoring = {
        scale: "Skala bólu 1-10 (1=brak, 10=nie do zniesienia)",
        rules: [
          "Ból 1-3: Kontynuuj trening normalnie",
          "Ból 4-6: Zmniejsz intensywność",
          "Ból 7-10: Przerwij trening, skonsultuj się z lekarzem"
        ]
      };
    }

    if (!plan.notes) {
      plan.notes = [];
    }

    // Synchronizacja metadata z rzeczywistą zawartością
    if (this.userData && this.userData.planDuration) {
      const expectedDuration = parseInt(this.userData.planDuration, 10);
      if (!isNaN(expectedDuration)) {
        plan.metadata.duration_weeks = expectedDuration;
        
        // Dostosuj liczbę tygodni jeśli potrzeba
        if (plan.plan_weeks.length !== expectedDuration) {
          plan.plan_weeks = this._adjustWeeksCount(plan.plan_weeks, expectedDuration, trainingDays);
        }
      }
    }

    console.log('Plan zwalidowany i naprawiony pomyślnie');
    return plan;
  }

  /**
   * Waliduje i naprawia dzień treningowy
   * @param {Object} day - Dzień do walidacji
   * @param {number} dayIndex - Indeks dnia
   * @param {number} weekNumber - Numer tygodnia
   * @param {Array} trainingDays - Dni treningowe użytkownika (opcjonalne)
   * @returns {Object} - Naprawiony dzień
   */
  _validateAndRepairDay(day, dayIndex, weekNumber = 1, trainingDays = null) {
    // Użyj dni treningowych użytkownika jeśli dostępne, inaczej fallback
    const daysToUse = trainingDays && Array.isArray(trainingDays) && trainingDays.length > 0 
      ? trainingDays 
      : ['poniedzialek', 'sroda', 'piatek', 'niedziela', 'wtorek', 'czwartek', 'sobota'];
    
    if (!day || typeof day !== 'object') {
      const dayName = dayIndex < daysToUse.length ? daysToUse[dayIndex] : daysToUse[dayIndex % daysToUse.length];
      return this._createDefaultDay(dayName, weekNumber, dayIndex);
    }

    // Jeśli nie ma day_name lub jest nieprawidłowy, przypisz z dni użytkownika
    if (!day.day_name) {
      day.day_name = dayIndex < daysToUse.length ? daysToUse[dayIndex] : daysToUse[dayIndex % daysToUse.length];
    }

    if (!day.date) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + dayIndex);
      day.date = futureDate.toISOString().split('T')[0];
    }

    if (!day.workout || typeof day.workout !== 'object') {
      day.workout = this._createDefaultWorkout(weekNumber, dayIndex);
    }
    
    // Przeniesienie danych z nowej struktury Gemini do oczekiwanej struktury frontend
    if (day.day_of_week && typeof day.day_of_week === 'string') {
      day.day_name = day.day_of_week.toLowerCase();
    } else if (day.day && typeof day.day === 'string') {
      day.day_name = day.day.toLowerCase();
    }
    if (day.duration_minutes && typeof day.duration_minutes === 'number') {
      day.workout.duration = day.duration_minutes;
    }
    if (day.type && typeof day.type === 'string') {
      day.workout.type = day.type;
    }
    if (day.description && typeof day.description === 'string') {
      day.workout.description = day.description;
    }
    if (day.focus && typeof day.focus === 'string') {
      day.workout.focus = day.focus;
    }
    if (day.main_workout && typeof day.main_workout === 'string') {
      day.workout.main_workout = day.main_workout;
    }
    
    // Walidacja i naprawa workout z fallbackami
    if (!day.workout.type) day.workout.type = "easy_run";
    if (!day.workout.description) day.workout.description = "Łagodny bieg budujący bazę wytrzymałościową";
    if (typeof day.workout.duration !== 'number') day.workout.duration = 30;
    
    // Inteligentna kalkulacja dystansu na podstawie typu treningu
    if (typeof day.workout.distance !== 'number') {
      const duration = day.workout.duration || 30;
      const workoutType = day.workout.type?.toLowerCase() || 'easy';
      const mainWorkout = day.workout.main_workout || day.main_workout || '';
      
      let estimatedDistance;
      
      if (workoutType.includes('interval') || mainWorkout.includes('x') || mainWorkout.includes('min bieg')) {
        // Dla interwałów - nie podawamy dystansu, bo zależy od tempa użytkownika
        day.workout.distance = null;
        day.workout.distance_note = "Dystans zależy od Twojego tempa";
      } else if (workoutType.includes('tempo')) {
        // Tempo run - szybsze tempo ~5 min/km
        const tempoPaceMinPerKm = 5;
        estimatedDistance = Math.round((duration / tempoPaceMinPerKm) * 10) / 10;
        day.workout.distance = estimatedDistance;
        day.workout.distance_note = "Szacunkowy dystans przy tempie ~5:00 min/km";
      } else if (workoutType.includes('recovery') || workoutType.includes('regeneracja')) {
        // Recovery - wolniejsze tempo ~7 min/km
        const recoveryPaceMinPerKm = 7;
        estimatedDistance = Math.round((duration / recoveryPaceMinPerKm) * 10) / 10;
        day.workout.distance = estimatedDistance;
        day.workout.distance_note = "Szacunkowy dystans przy spokojnym tempie";
      } else {
        // Easy run - średnie tempo 6 min/km
        const easyPaceMinPerKm = 6;
        estimatedDistance = Math.round((duration / easyPaceMinPerKm) * 10) / 10;
        day.workout.distance = estimatedDistance;
        day.workout.distance_note = "Szacunkowy dystans przy komfortowym tempie";
      }
    }
    
    // Inteligentne obliczanie stref tętna na podstawie typu treningu
    if (!day.workout.target_heart_rate) {
      const workoutType = day.workout.type?.toLowerCase() || 'easy';
      let heartRateZone;
      
      if (workoutType.includes('interval') || workoutType.includes('tempo')) {
        heartRateZone = { min: 150, max: 170, zone: "Strefa 4" };
      } else if (workoutType.includes('recovery') || workoutType.includes('regeneracja')) {
        heartRateZone = { min: 110, max: 130, zone: "Strefa 1" };
      } else if (workoutType.includes('long') || workoutType.includes('długi')) {
        heartRateZone = { min: 130, max: 150, zone: "Strefa 3" };
      } else {
        // Default: easy run
        heartRateZone = { min: 120, max: 145, zone: "Strefa 2" };
      }
      
      day.workout.target_heart_rate = heartRateZone;
    }
    
    if (!day.workout.support_exercises) {
      day.workout.support_exercises = [];
    }

    return day;
  }

  /**
   * Tworzy domyślny dzień treningowy
   * @param {string} dayName - Nazwa dnia
   * @param {number} weekNumber - Numer tygodnia
   * @param {number} dayIndex - Indeks dnia w tygodniu (0-6)
   * @returns {Object} - Domyślny dzień
   */
  _createDefaultDay(dayName, weekNumber = 1, dayIndex = 0) {
    // Mapowanie nazwy dnia na indeks
    const dayNameToIndex = {
      'poniedzialek': 0, 'monday': 0,
      'wtorek': 1, 'tuesday': 1,
      'sroda': 2, 'wednesday': 2,
      'czwartek': 3, 'thursday': 3,
      'piatek': 4, 'friday': 4,
      'sobota': 5, 'saturday': 5,
      'niedziela': 6, 'sunday': 6
    };
    
    const calculatedDayIndex = dayNameToIndex[dayName.toLowerCase()] ?? dayIndex;
    
    return {
      day_name: dayName,
      date: new Date().toISOString().split('T')[0],
      workout: this._createDefaultWorkout(weekNumber, calculatedDayIndex)
    };
  }

  /**
   * Tworzy domyślny trening z różnorodnymi dystansami
   * @param {number} weekNumber - Numer tygodnia (dla progresji)
   * @param {number} dayIndex - Indeks dnia w tygodniu (0-6) dla różnorodności
   * @returns {Object} - Domyślny trening
   */
  _createDefaultWorkout(weekNumber = 1, dayIndex = 0) {
    // Różnorodne wzorce dystansów dla każdego dnia tygodnia
    const distancePatterns = [
      2.5,  // Poniedziałek - łagodny start
      4.0,  // Wtorek - średni dystans  
      3.0,  // Środa - krótszy bieg
      5.0,  // Czwartek - dłuższy trening
      2.0,  // Piątek - regeneracyjny
      6.0,  // Sobota - długi bieg
      3.5   // Niedziela - umiarkowany
    ];
    
    // Wzorce typów treningów
    const workoutTypes = [
      { type: "easy_run", description: "Łagodny bieg budujący bazę wytrzymałościową" },
      { type: "tempo", description: "Bieg w tempie progowym poprawiający wytrzymałość" },
      { type: "easy_run", description: "Spokojny bieg regeneracyjny" },
      { type: "interval", description: "Trening interwałowy poprawiający VO2max" },
      { type: "recovery", description: "Bardzo łagodny bieg regeneracyjny" },
      { type: "long", description: "Długi bieg budujący wytrzymałość bazową" },
      { type: "easy_run", description: "Umiarkowany bieg w tempie aerobowym" }
    ];
    
    // Wybierz wzorzec na podstawie dnia tygodnia
    const baseDistance = distancePatterns[dayIndex % distancePatterns.length];
    const workout = workoutTypes[dayIndex % workoutTypes.length];
    
    // Progresja tygodniowa (5-15% wzrost co tydzień)
    const weeklyProgression = 1 + ((weekNumber - 1) * 0.1);
    const finalDistance = Math.round((baseDistance * weeklyProgression) * 10) / 10;
    
    // Dynamiczny czas na podstawie dystansu i typu treningu  
    const paceMultiplier = {
      "easy_run": 6.0,     // 6 min/km
      "tempo": 5.0,        // 5 min/km  
      "interval": 4.5,     // 4:30 min/km
      "long": 6.5,         // 6:30 min/km
      "recovery": 7.0      // 7 min/km
    };
    
    const pace = paceMultiplier[workout.type] || 6.0;
    const duration = Math.round(finalDistance * pace);
    
    // Dynamiczne strefy tętna
    const heartRateZones = {
      "easy_run": { min: 120, max: 150, zone: "Strefa 2" },
      "tempo": { min: 155, max: 175, zone: "Strefa 4" },
      "interval": { min: 175, max: 190, zone: "Strefa 5" },
      "long": { min: 120, max: 145, zone: "Strefa 2" },
      "recovery": { min: 100, max: 130, zone: "Strefa 1" }
    };
    
    return {
      type: workout.type,
      description: workout.description,
      distance: finalDistance,
      duration_minutes: duration,
      target_heart_rate: heartRateZones[workout.type] || heartRateZones["easy_run"],
      support_exercises: [],
      main_workout: `${finalDistance}km w tempie ${workout.type === 'easy_run' ? 'łagodnym' : 
                                                 workout.type === 'tempo' ? 'progowym' :
                                                 workout.type === 'interval' ? 'interwałowym' :
                                                 workout.type === 'long' ? 'długim' : 'regeneracyjnym'}`
    };
  }

  /**
   * Dostosowuje liczbę tygodni w planie
   * @param {Array} weeks - Obecne tygodnie
   * @param {number} targetCount - Docelowa liczba tygodni
   * @returns {Array} - Dostosowane tygodnie
   */
  _adjustWeeksCount(weeks, targetCount, trainingDays = null) {
    if (weeks.length === targetCount) return weeks;
    
    if (weeks.length > targetCount) {
      return weeks.slice(0, targetCount);
    } else {
      const newWeeks = [...weeks];
      for (let i = weeks.length + 1; i <= targetCount; i++) {
        newWeeks.push(this._createDefaultWeek(i, trainingDays));
      }
      return newWeeks;
    }
  }

  /**
   * Tworzy domyślny tydzień
   * @param {number} weekNum - Numer tygodnia
   * @returns {Object} - Domyślny tydzień
   */
  _createDefaultWeek(weekNum, trainingDays = null) {
    return {
      week_num: weekNum,
      focus: weekNum <= 2 ? "Budowanie bazy" : weekNum <= 4 ? "Rozwój wytrzymałości" : "Intensyfikacja",
      days: this._createDefaultDays(weekNum, trainingDays)
    };
  }

  /**
   * Tworzy domyślne dni dla tygodnia
   * @param {number} weekNum - Numer tygodnia
   * @returns {Array} - Tablica dni
   */
  _createDefaultDays(weekNum, trainingDays = null) {
    const defaultDays = trainingDays && trainingDays.length > 0 ? trainingDays : ['poniedzialek', 'sroda', 'piatek'];
    
    // Mapowanie nazw dni na indeksy tygodnia dla lepszej różnorodności
    const dayNameToIndex = {
      'poniedzialek': 0, // Poniedzialek
      'wtorek': 1,       // Wtorek
      'sroda': 2,        // Sroda  
      'czwartek': 3,     // Czwartek
      'piatek': 4,       // Piatek
      'sobota': 5,       // Sobota
      'niedziela': 6     // Niedziela
    };
    
    return defaultDays.map((dayName, index) => {
      const dayIndex = dayNameToIndex[dayName] || index;
      
      return {
        day_name: dayName,
        date: this._calculateDate(weekNum, index),
        workout: this._createDefaultWorkout(weekNum, dayIndex)
      };
    });
  }

  /**
   * Oblicza datę dla dnia treningowego
   * @param {number} weekNum - Numer tygodnia
   * @param {number} dayIndex - Indeks dnia
   * @returns {string} - Data w formacie YYYY-MM-DD
   */
  _calculateDate(weekNum, dayIndex) {
    const baseDate = new Date();
    const dayOffset = (weekNum - 1) * 7 + dayIndex * 2; // Co drugi dzień
    baseDate.setDate(baseDate.getDate() + dayOffset);
    return baseDate.toISOString().split('T')[0];
  }




  // Placeholder for the new method to generate corrective exercises
  async _generateCorrectiveExercises(userData, correctiveKnowledge) {
    this.log('Rozpoczęcie generowania ćwiczeń korekcyjnych...');
    // TODO: Implement logic to create a dedicated prompt and call Gemini API
    // For now, return null to allow testing the main flow
    
    const prompt = this._createCorrectiveExercisesPrompt(userData, correctiveKnowledge);
    if (!prompt) {
        this.error('Nie udało się stworzyć promptu dla ćwiczeń korekcyjnych.');
        return null;
    }

    if (this.geminiApiKey) {
      try {
        this.log('Wysyłanie żądania o ćwiczenia korekcyjne do Gemini API...');
        const requestUrl = `${this.geminiApiUrl}/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
        const requestBody = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { ...this.geminiGenerationConfig, responseMimeType: 'application/json' }, // Ensure JSON response
           safetySettings: [ // Standard safety settings
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        };

        const response = await this.axiosClient.post(requestUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
        });

        this.log('Otrzymano odpowiedź z Gemini API dla ćwiczeń korekcyjnych.');
        // Need a dedicated parser or adapt _parseResponse
        // For now, let's try to parse it simply, expecting the structure { frequency: string, list: [] }
         if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0] && response.data.candidates[0].content.parts[0].text) {
          const rawJson = response.data.candidates[0].content.parts[0].text;
          try {
            const correctiveExercises = JSON.parse(rawJson);
            // Basic validation
            if (correctiveExercises && typeof correctiveExercises.frequency === 'string' && Array.isArray(correctiveExercises.list)) {
              this.log('Pomyślnie sparsowano ćwiczenia korekcyjne.');
              return correctiveExercises;
            } else {
               this.error('Sparsowane ćwiczenia korekcyjne mają nieprawidłową strukturę:', correctiveExercises);
            }
          } catch (parseError) {
            this.error('Błąd parsowania JSON z odpowiedzi Gemini dla ćwiczeń korekcyjnych:', parseError, 'Raw JSON:', rawJson);
          }
        } else {
          this.error('Nieprawidłowa struktura odpowiedzi Gemini dla ćwiczeń korekcyjnych:', response.data);
        }
      } catch (error) {
        this.error('Błąd API Gemini podczas generowania ćwiczeń korekcyjnych:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    } else {
        this.log('Klucz API Gemini nie jest ustawiony, pomijanie generowania ćwiczeń korekcyjnych przez Gemini.');
    }
    
    this.log('Nie udało się wygenerować ćwiczeń korekcyjnych przez API.');
    return null; // Fallback if API call fails
  }

  // Placeholder for the new method to create the prompt for corrective exercises
  _createCorrectiveExercisesPrompt(userData, correctiveKnowledge) {
    this.log('Tworzenie promptu dla ćwiczeń korekcyjnych...');
    if (!userData.kontuzje) {
      return null; // No need for a prompt if no injuries
    }

    let injuryDetails = `Użytkownik zgłosił następujące problemy:\n`;
    if (userData.opisKontuzji) injuryDetails += `- Opis kontuzji: ${userData.opisKontuzji}\n`;
    if (userData.lokalizacjaBolu) injuryDetails += `- Lokalizacja bólu: ${userData.lokalizacjaBolu}\n`;
    if (userData.charakterBolu) injuryDetails += `- Charakter bólu: ${userData.charakterBolu}\n`;
    if (userData.skalaBolu) injuryDetails += `- Skala bólu (0-10): ${userData.skalaBolu}\n`;
    
    if (injuryDetails === `Użytkownik zgłosił następujące problemy:\n` && userData.kontuzje === true) {
        injuryDetails = 'Użytkownik zgłosił kontuzję, ale nie podał szczegółów. Zaproponuj ogólne ćwiczenia korekcyjne dla biegaczy.';
    }

    // Prepare a string representation of the corrective knowledge base for the prompt
    // This is a simplified example; you might want to be more selective or format it differently
    let knowledgeString = "### Wybrana Baza Wiedzy o Ćwiczeniach Korekcyjnych:\n\n";
    if (correctiveKnowledge && correctiveKnowledge.exerciseSections) {
        knowledgeString += "Podstawowe sekcje ćwiczeń:\n";
        for (const sectionKey in correctiveKnowledge.exerciseSections) {
            const section = correctiveKnowledge.exerciseSections[sectionKey];
            knowledgeString += ` - ${section.title}: ${section.description}\n`;
            if (section.areas) {
                 for (const areaKey in section.areas) {
                    const area = section.areas[areaKey];
                    knowledgeString += `    - ${area.title}\n`;
                    area.exercises.forEach(ex => {
                        knowledgeString += `        - ${ex.name}: ${ex.instructions.substring(0,100)}... (Serie/powtórzenia: ${ex.sets_reps || ex.sets_duration || 'N/A'})\n`;
                    });
                }
            } else if (section.exercises) {
                 section.exercises.forEach(ex => {
                    knowledgeString += `    - ${ex.name}: ${ex.instructions.substring(0,100)}... (Serie/powtórzenia: ${ex.sets_reps || ex.sets_duration || 'N/A'})\n`;
                });
            }
        }
        knowledgeString += "\n";
    }
    if (correctiveKnowledge && correctiveKnowledge.implementationPrinciples) {
        knowledgeString += "Zasady wdrażania i adaptacji:\n";
        knowledgeString += `- Dla początkujących: ${correctiveKnowledge.implementationPrinciples.bySkillLevel.beginner.substring(0,150)}...\n`;
        knowledgeString += `- W przypadku bólu: ${correctiveKnowledge.adaptationAndModification.painOrRecurrence.action.substring(0,150)}...\n`;
    }

    const prompt = `
Jesteś ekspertem fizjoterapii sportowej specjalizującym się w kontuzjach biegaczy. Twoim zadaniem jest wygenerowanie zestawu ćwiczeń korekcyjnych.

### INFORMACJE O KONTUZJI UŻYTKOWNIKA:
${injuryDetails}

### BAZA WIEDZY O ĆWICZENIACH KOREKCYJNYCH DLA BIEGACZY (fragmenty):
${knowledgeString} 
// Powyższa baza wiedzy to skrót. Model powinien polegać na swojej ogólnej wiedzy uzupełnionej tymi wskazówkami.

### WYMAGANA STRUKTURA ODPOWIEDZI (JSON):
Odpowiedz WYŁĄCZNIE w formacie JSON, bez żadnego tekstu przed ani po. JSON musi mieć następującą strukturę:
{
  "frequency": "string (np. '2-3 razy w tygodniu w dni nietreningowe', 'Codziennie po 15 minut')",
  "list": [
    {
      "name": "string (nazwa ćwiczenia)",
      "sets": number (liczba serii),
      "reps": number lub null (liczba powtórzeń, jeśli dotyczy),
      "duration": number lub null (czas trwania w sekundach, jeśli dotyczy),
      "description": "string (krótki opis/instrukcja wykonania, max 2-3 zdania)"
    }
    // ... więcej ćwiczeń ...
  ]
}

### INSTRUKCJE:
1.  Przeanalizuj dostarczoną bazę wiedzy oraz informacje o kontuzji użytkownika.
2.  Zaproponuj 3-5 kluczowych ćwiczeń korekcyjnych adekwatnych do opisanych problemów lub, jeśli brak szczegółów, ogólnie korzystnych dla biegaczy z typowymi dolegliwościami.
3.  Każde ćwiczenie powinno zawierać nazwę, liczbę serii, powtórzeń (lub czas trwania) oraz krótki, zrozumiały opis wykonania.
4.  Określ zalecaną częstotliwość wykonywania tych ćwiczeń.
5.  Skup się na ćwiczeniach z bazy wiedzy, które są opisane jako odpowiednie dla problemów użytkownika lub ogólnie dla biegaczy.
6.  Jeśli w bazie wiedzy są informacje o przeciwwskazaniach, uwzględnij je przy doborze ćwiczeń, starając się ich unikać, jeśli dotyczą zgłoszonego problemu.
7.  Pamiętaj, aby opis był zwięzły i praktyczny.
8.  Generuj tylko i wyłącznie obiekt JSON zgodny z podanym schematem.
`;
    return prompt;
  }

  /**
   * Generuje plan tygodniowy na podstawie kontekstu progresji użytkownika
   * @param {Object} weeklyData - Dane dla generowania planu tygodniowego
   * @returns {Object} Plan tygodniowy
   */
  async generateWeeklyTrainingPlan(weeklyData) {
    // FORCE LOG: Test czy metoda jest w ogóle wywoływana
    console.log('🚨 [GEMINI-SERVICE] ROZPOCZĘCIE generateWeeklyTrainingPlan()');
    console.log('🚨 [GEMINI-SERVICE] weeklyData userId:', weeklyData?.userId);
    console.log('🚨 [GEMINI-SERVICE] weekNumber:', weeklyData?.weekNumber);
    
    // DEBUG: Loguj kompletne dane otrzymane w Gemini Service
    this.log('=== GEMINI SERVICE: Otrzymane dane weeklyData ===', {
      weeklyData_keys: Object.keys(weeklyData),
      dniTreningowe: weeklyData.dniTreningowe,
      trainingDays: weeklyData.trainingDays,
      userData: weeklyData.userData ? Object.keys(weeklyData.userData) : null,
      userData_dniTreningowe: weeklyData.userData?.dniTreningowe,
      userData_trainingDays: weeklyData.userData?.trainingDays,
      weekNumber: weeklyData.weekNumber,
      userId: weeklyData.userId,
      // Dodatkowe informacje z formularza
      imie: weeklyData.imie,
      poziomZaawansowania: weeklyData.poziomZaawansowania,
      glownyCel: weeklyData.glownyCel,
      // Sprawdź czy są podstawowe dane formularza
      hasBasicFormData: !!(weeklyData.imie && weeklyData.poziomZaawansowania && weeklyData.glownyCel)
    });
    
    // Sprawdź czy Gemini API jest skonfigurowane
    if (!this.geminiApiKey) {
      throw new AppError('Gemini API nie jest skonfigurowane. Skontaktuj się z administratorem.', 500);
    }

    // KRYTYCZNA WALIDACJA dni treningowych na poziomie AI Service
    const trainingDays = weeklyData.dniTreningowe || weeklyData.trainingDays || weeklyData.userData?.dniTreningowe || weeklyData.userData?.trainingDays;
    if (!trainingDays || !Array.isArray(trainingDays) || trainingDays.length === 0) {
      this.error('CRITICAL AI INPUT VALIDATION FAILED: No training days provided to Gemini Service', {
        weeklyData_keys: Object.keys(weeklyData),
        dniTreningowe: weeklyData.dniTreningowe,
        trainingDays: weeklyData.trainingDays,
        userData_dniTreningowe: weeklyData.userData?.dniTreningowe,
        userData_trainingDays: weeklyData.userData?.trainingDays,
        weekNumber: weeklyData.weekNumber,
        userId: weeklyData.userId
      });
      
      throw new AppError(
        'Brak dni treningowych w danych przekazanych do generatora AI. Nie można wygenerować planu treningowego bez określenia dni treningowych.', 
        400
      );
    }

    this.log(`AI Service: Training days validation passed`, {
      trainingDays: trainingDays,
      daysCount: trainingDays.length,
      weekNumber: weeklyData.weekNumber
    });

    // Konfiguracja retry
    const maxRetries = 3;
    const baseDelay = 1000; // 1 sekunda
    
    // Spróbuj wygenerować plan używając Gemini API z retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`\n--- PRÓBA ${attempt}/${maxRetries} WYGENEROWANIA PLANU TYGODNIOWEGO PRZEZ GEMINI ---`);
        
        const prompt = this.prepareWeeklyPlanPrompt(weeklyData);
        
        // Pełne logowanie promptu dla debugowania
        console.log(`🚨 [GEMINI-SERVICE] FORCE LOG - WYSYŁANIE PROMPTU DO GEMINI`);
        this.log(`\n=== PEŁNY PROMPT WYSYŁANY DO GEMINI ===`);
        this.log(prompt);
        this.log(`=== KONIEC PROMPTU ===\n`);
        
        const requestUrl = `${this.geminiApiUrl}/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
        
        const requestBody = {
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: this.geminiGenerationConfig,
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        };

        const response = await this.axiosClient.post(requestUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000, // 30 sekund timeout
        });

        this.log('Otrzymano odpowiedź z Gemini API dla planu tygodniowego.');
        
        // Loguj surową odpowiedź z Gemini
        this.log(`\n=== SUROWA ODPOWIEDŹ Z GEMINI ===`);
        this.log(JSON.stringify(response.data, null, 2));
        this.log(`=== KONIEC ODPOWIEDZI ===\n`);
        
        const plan = await this.parseWeeklyPlanResponse(response, weeklyData);
        
        // WYŁĄCZONE: Personalizacja stref tętna - Gemini sam powinien decydować o strefach HR
        // try {
        //   const personalizedPlan = this._applyPersonalizedHeartRateZones(plan, weeklyData.userData);
        //   this.log('Pomyślnie spersonalizowano strefy tętna');
        //   return personalizedPlan;
        // } catch (personalizationError) {
        //   this.error('Błąd personalizacji stref tętna, używam planu bez personalizacji:', {
        //     message: personalizationError.message
        //   });
        //   return plan; // Zwróć plan bez personalizacji
        // }
        
        // Zwracaj plan bezpośrednio z Gemini bez dodatkowej normalizacji
        this.log('Używam planu z Gemini bez normalizacji stref tętna');
        return plan;

      } catch (geminiError) {
        this.error(`\n⚠️ Błąd podczas próby ${attempt}/${maxRetries} generowania planu tygodniowego przez Gemini:`, {
          message: geminiError.message,
          status: geminiError.response?.status,
          data: geminiError.response?.data,
          stack: geminiError.stack
        });
        
        // Sprawdź czy to błąd, który może się powieść przy ponownej próbie
        const isRetryableError = this._isRetryableError(geminiError);
        
        if (attempt < maxRetries && isRetryableError) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Eksponencjalny backoff
          this.log(`Czekanie ${delay}ms przed kolejną próbą...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Spróbuj ponownie
        }
        
        // Jeśli to ostatnia próba lub błąd nie nadaje się do retry, rzuć błąd
        throw new AppError(
          `Nie udało się wygenerować planu tygodniowego po ${maxRetries} próbach. Spróbuj ponownie za kilka minut.`, 
          geminiError.response?.status || 500
        );
      }
    }
  }

  /**
   * Przygotowuje prompt dla generowania planu tygodniowego
   * @param {Object} weeklyData - Dane tygodniowe
   * @returns {string} Prompt
   */
  prepareWeeklyPlanPrompt(weeklyData) {
    const contextInfo = this.buildWeeklyContext(weeklyData);
    
    // Pobierz dni treningowe z różnych możliwych miejsc
    const trainingDays = weeklyData.dniTreningowe || weeklyData.trainingDays || weeklyData.userData?.dniTreningowe || weeklyData.userData?.trainingDays;
    
    return `Wygeneruj plan treningowy na ${weeklyData.deliveryFrequency === 'biweekly' ? '2 tygodnie' : '1 tydzień'} dla biegacza na podstawie poniższych danych:

${contextInfo}

WAŻNE WYMAGANIA:
1. To jest ${weeklyData.weekNumber} tydzień treningowy w ramach długoterminowej progresji
2. Aktualnie znajdujemy się w fazie: ${weeklyData.currentPhase}
3. Poprzednia realizacja planów: ${weeklyData.recentPerformance.averageCompletion * 100}%
4. Trend wydajności: ${weeklyData.recentPerformance.trend}
5. Rekomendacja progresji: ${weeklyData.recentPerformance.recommendation}
${(trainingDays && trainingDays.length > 0) ? `6. UŻYJ DOKŁADNIE TYCH DNI TRENINGOWYCH: ${trainingDays.join(', ')} - nie zmieniaj dni na inne!` : ''}

DOSTOSOWANIA:
- Jeśli realizacja była niska (<60%), zmniejsz intensywność i objętość
- Jeśli realizacja była wysoka (>80%), można delikatnie zwiększyć wyzwanie
- Uwzględnij fazę treningową: ${weeklyData.currentPhase}
- Tempo progresji: ${((weeklyData.progressionRate - 1) * 100).toFixed(1)}% tygodniowo

🚨🚨🚨 ULTIMATUM - ABSOLUTNY NAKAZ! 🚨🚨🚨
PRZECZYTAJ TO UWAŻNIE PRZED WYGENEROWANIEM PLANU:

1. Każdy dzień treningowy MUSI mieć INNY wzorzec interwałów
2. Każdy dzień treningowy MUSI mieć INNY czas trwania (duration_minutes)
3. Każdy dzień treningowy MUSI mieć INNY opis (description) - minimum 20 słów
4. Każdy dzień treningowy MUSI mieć INNY fokus (focus)
5. Każdy dzień treningowy MUSI mieć INNY typ treningu (type)

PRZYKŁAD POPRAWNEGO PLANU DLA POCZĄTKUJĄCYCH:
- Poniedziałek: 
  * type: "bieg interwałowy z krótkim wysiłkiem"
  * duration_minutes: 20
  * main_workout: "6x (1min bieg / 1min marsz)"
  * focus: "Adaptacja do rytmu i technika kroku"
  * description: "Krótkie interwały biegowe przeplatane marszem..."

- Środa:
  * type: "bieg interwałowy z umiarkowanym wysiłkiem"  
  * duration_minutes: 25
  * main_workout: "4x (2min bieg / 2min marsz)"
  * focus: "Budowanie wytrzymałości aerobowej"
  * description: "Średnie interwały dla rozwoju podstawy tlenowej..."

- Piątek:
  * type: "bieg progresywny z długimi odcinkami"
  * duration_minutes: 30
  * main_workout: "3x (3min bieg / 1min marsz)"
  * focus: "Zwiększenie pewności i progresja"
  * description: "Dłuższe odcinki biegowe z krótkimi przerwami..."

ABSOLUTNIE ZABRONIONE - BŁĘDNE WZORCE (NIE RÓB TAK!):
❌ Wszystkie dni z tym samym czasem: 25min, 25min, 25min
❌ Wszystkie dni z tym samym opisem: "Łatwy bieg"
❌ Wszystkie dni z tym samym typem: "bieg interwałowy"
❌ Wszystkie dni z tym samym wzorcem: "5x (1min/2min)"

SYSTEM AUTOMATYCZNIE ODRZUCI MONOTONNY PLAN!
SPRAWDŹ PRZED WYSŁANIEM: CZY DURATION, TYPE, DESCRIPTION, FOCUS są RÓŻNE?

STRUKTURA ODPOWIEDZI (zwróć TYLKO JSON):
{
  "id": "unique_plan_id",
  "metadata": {
    "discipline": "bieganie",
    "target_group": "adult_runners", 
    "target_goal": "${weeklyData.goal}",
    "level_hint": "${weeklyData.level}",
    "days_per_week": "${weeklyData.daysPerWeek}",
    "duration_weeks": ${weeklyData.deliveryFrequency === 'biweekly' ? 2 : 1},
    "description": "Plan tygodniowy - tydzień ${weeklyData.weekNumber}",
    "author": "RunFitting AI",
    "phase": "${weeklyData.currentPhase}",
    "week_number": ${weeklyData.weekNumber}
  },
  "plan_weeks": [
    {
      "week_num": ${weeklyData.weekNumber},
      "focus": "Cel na ten tydzień w kontekście fazy ${weeklyData.currentPhase}",
      "days": [
        // ${weeklyData.daysPerWeek} dni treningowych z detalami
      ]
    }${weeklyData.deliveryFrequency === 'biweekly' ? `,
    {
      "week_num": ${weeklyData.weekNumber + 1},
      "focus": "Cel na kolejny tydzień",
      "days": [
        // kolejne dni treningowe
      ]
    }` : ''}
  ],
  "corrective_exercises": {
    "frequency": "daily",
    "list": [
      {
        "name": "Plank (deska)",
        "description": "Wzmacnia mięśnie głębokie brzucha i stabilizatory tułowia",
        "sets": 3,
        "duration": 30
      },
      {
        "name": "Bird-dog",
        "description": "Poprawia stabilizację i koordynację",
        "sets": 3,
        "reps": 10
      }
    ]
  },
  "notes": [
    "Notatki dotyczące tego okresu treningowego",
    "Wskazówki dotyczące monitorowania postępów",
    "Zalecenia żywieniowe i regeneracyjne"
  ]
}

WAŻNE: W sekcji corrective_exercises używaj TYLKO pól: "name", "description", "sets", "reps" (dla powtórzeń), "duration" (dla czasu w sekundach). NIE używaj pól takich jak "sets_reps" - są nieprawidłowe!

Pamiętaj o dostosowaniu planu do:
- Bieżącej formy użytkownika (${weeklyData.recentPerformance.trend})
- Fazy treningowej (${weeklyData.currentPhase})
- Długoterminowego celu: ${weeklyData.longTermGoal?.targetEvent || 'brak określonego'}
- Poprzednich wyników realizacji planów`;
  }

  /**
   * Buduje kontekst tygodniowy dla promptu
   * @param {Object} weeklyData - Dane tygodniowe
   * @returns {string} Kontekst
   */
  buildWeeklyContext(weeklyData) {
    // Znajdź dni treningowe
    
    const trainingDays = weeklyData.dniTreningowe || weeklyData.trainingDays || weeklyData.userData?.dniTreningowe || weeklyData.userData?.trainingDays;
    
    let context = `PROFIL BIEGACZA:
- Imię: ${weeklyData.imieNazwisko || weeklyData.name || 'Nie określono'}
- Wiek: ${weeklyData.wiek || weeklyData.age || 'Nie określono'} lat
- Poziom: ${weeklyData.poziomZaawansowania || weeklyData.level || 'Nie określono'}
- Cel: ${weeklyData.glownyCel || weeklyData.goal || 'Nie określono'}
- Dni treningowe w tygodniu: ${weeklyData.daysPerWeek || (trainingDays && trainingDays.length) || 'Nie określono'}`;

    // Dodaj konkretne dni treningowe jeśli są dostępne
    if (trainingDays && Array.isArray(trainingDays) && trainingDays.length > 0) {
      context += `\n- Wybrane dni treningowe: ${trainingDays.join(', ')}`;
    }

    context += `\n- Aktualny tygodniowy dystans: ${weeklyData.weeklyDistance} km
- Kontuzje: ${weeklyData.hasInjuries ? 'Tak' : 'Nie'}`;

    if (weeklyData.heartRate) {
      context += `\n- Tętno spoczynkowe: ${weeklyData.heartRate} bpm`;
    }

    if (weeklyData.description) {
      context += `\n- Dodatkowe informacje: ${weeklyData.description}`;
    }

    context += `\n\nKONTEKST PROGRESJI:
- Tydzień numer: ${weeklyData.weekNumber}
- Łącznie dostarczonych tygodni: ${weeklyData.totalWeeksDelivered}
- Aktualna faza: ${weeklyData.currentPhase}
- Ostatni tygodniowy dystans: ${weeklyData.lastWeeklyDistance} km
- Tempo progresji: ${weeklyData.progressionRate}`;

    if (weeklyData.longTermGoal) {
      context += `\n\nCEL DŁUGOTERMINOWY:
- Wydarzenie: ${weeklyData.longTermGoal.targetEvent || 'Nie określono'}
- Data: ${weeklyData.longTermGoal.targetDate || 'Nie określono'}
- Docelowy czas: ${weeklyData.longTermGoal.targetTime || 'Nie określono'}`;
    }

    context += `\n\nWYDAJNOŚĆ Z OSTATNICH TYGODNI:
- Średnia realizacja: ${(weeklyData.recentPerformance.averageCompletion * 100).toFixed(1)}%
- Trend: ${weeklyData.recentPerformance.trend}
- Rekomendacja: ${weeklyData.recentPerformance.recommendation}`;

    return context;
  }

  /**
   * Parsuje odpowiedź dla planu tygodniowego
   * @param {Object} response - Odpowiedź z API
   * @param {Object} weeklyData - Dane tygodniowe
   * @returns {Object} Sparsowany plan
   */
  parseWeeklyPlanResponse(response, weeklyData) {
    try {
      // Parsuj odpowiedź z Gemini API
      let planData = this._parseResponse(response.data);

      // Wyciągnij dni treningowe z weeklyData i przekaż do walidacji
      const trainingDays = weeklyData.dniTreningowe || weeklyData.trainingDays || weeklyData.userData?.dniTreningowe || weeklyData.userData?.trainingDays;
      
      this.log(`\n=== PRZED WALIDACJĄ I NAPRAWĄ ===`);
      this.log('Dni treningowe do użycia:', trainingDays);
      this.log('Plan przed naprawą - dni z pierwszego tygodnia:', planData?.plan_weeks?.[0]?.days?.map(d => d.day || d.day_name));
      this.log(`================================\n`);
      
      // Ulepszona walidacja i naprawa planu z rzeczywistymi dniami treningowymi
      planData = this._validateAndRepairPlan(planData, trainingDays);
      
      this.log(`\n=== PO WALIDACJI I NAPRAWIE ===`);
      this.log('Plan po naprawie - dni z pierwszego tygodnia:', planData?.plan_weeks?.[0]?.days?.map(d => d.day_name));
      this.log(`===============================\n`);

      // Sprawdź różnorodność planu PRZED finalizacją
      if (planData.plan_weeks && planData.plan_weeks.length > 0) {
        const diversityResult = checkWeekDiversity(planData.plan_weeks[0]);
        
        if (!diversityResult.isAcceptable) {
          this.log('🚨 WYKRYTO MONOTONNY PLAN W WEEKLY PARSER - RZUCANIE BŁĘDU DLA RETRY!');
          this.log('Diversity Score:', diversityResult.diversityScore);
          this.log('Problemy:', diversityResult.issues);
          
          // Rzuć błąd który spowoduje retry całego procesu generowania
          throw new AppError('Generated plan is too monotonous, retrying...', 422);
        }
      }

      // Dodaj metadane specyficzne dla planu tygodniowego
      planData.planType = 'weekly';
      planData.weekNumber = weeklyData.weekNumber;
      planData.deliveryFrequency = weeklyData.deliveryFrequency;
      planData.generatedFor = {
        phase: weeklyData.currentPhase,
        progressionRate: weeklyData.progressionRate,
        recentPerformance: weeklyData.recentPerformance
      };

      // Dodaj unikalne ID planu
      if (!planData.id) {
        planData.id = `weekly_${weeklyData.weekNumber}_${Date.now()}`;
      }

      this.log(`Wygenerowano plan tygodniowy: tydzień ${weeklyData.weekNumber}, faza ${weeklyData.currentPhase}`);
      return planData;
    } catch (error) {
      this.log('Błąd parsowania odpowiedzi planu tygodniowego: ' + error.message);
      throw new AppError('Błąd przetwarzania wygenerowanego planu tygodniowego', 500);
    }
  }

  /**
   * Aktualizuje strefy tętna w planie treningowym na podstawie spersonalizowanych obliczeń
   * @param {Object} plan - Plan treningowy do aktualizacji
   * @param {Object} userData - Dane użytkownika zawierające wiek i tętno spoczynkowe
   * @returns {Object} - Plan z zaktualizowanymi strefami tętna
   * @throws {AppError} - Rzuca błąd gdy brak danych do spersonalizowania
   */
  _applyPersonalizedHeartRateZones(plan, userData) {
    if (!plan || !plan.plan_weeks) {
      throw new AppError('Nieprawidłowy plan treningowy', 400);
    }

    if (!userData) {
      throw new AppError('Brak danych użytkownika do spersonalizacji stref tętna', 400);
    }

    this.log('Rozpoczęcie personalizacji stref tętna', {
      userId: userData.supabaseId || 'unknown',
      hasAge: !!(userData.wiek || userData.age),
      hasRestingHr: !!(userData.restingHr || userData.resting_hr || userData.tetnoSpoczynkowe),
      availableFields: Object.keys(userData)
    });

    // Walidacja wymaganych danych użytkownika
    const userAge = userData.wiek || userData.age;
    if (!userAge || userAge < 10 || userAge > 100) {
      throw new AppError('Nieprawidłowa wartość wieku. Wiek musi być pomiędzy 10 a 100 lat.', 400);
    }

    const restingHr = userData.restingHr || userData.resting_hr || userData.tetnoSpoczynkowe || 60;
    if (restingHr < 30 || restingHr > 100) {
      throw new AppError('Nieprawidłowa wartość tętna spoczynkowego. Tętno musi być pomiędzy 30 a 100 uderzeń na minutę.', 400);
    }

    // Oblicz spersonalizowane strefy tętna
    const personalizedZones = this._calculateHeartRateZones(userData);
    
    console.log('🎯 [DEBUG] Obliczone strefy tętna dla użytkownika:', personalizedZones);
    
    // Przejdź przez wszystkie tygodnie i dni treningowe
    const updatedPlan = JSON.parse(JSON.stringify(plan)); // Deep copy
    
    console.log('🎯 [DEBUG] Plan przed personalizacją stref tętna:', JSON.stringify(plan.plan_weeks[0]?.days?.map(d => ({
      day: d.day_name,
      type: d.workout?.type,
      original_hr: d.workout?.target_heart_rate
    })), null, 2));
    
    updatedPlan.plan_weeks.forEach(week => {
      if (week.days && Array.isArray(week.days)) {
        week.days.forEach(day => {
          if (day.workout && day.workout.target_heart_rate) {
            const currentHR = day.workout.target_heart_rate;
            
            // Mapuj zakres tętna do odpowiedniej strefy
            let targetZone;
            let zoneUsed;
            if (currentHR.min >= 100 && currentHR.max <= 120) {
              targetZone = personalizedZones.zone1; // Regeneracja
              zoneUsed = 'zone1';
            } else if (currentHR.min >= 115 && currentHR.max <= 135) {
              targetZone = personalizedZones.zone2; // Łatwe tempo
              zoneUsed = 'zone2';
            } else if (currentHR.min >= 130 && currentHR.max <= 150) {
              targetZone = personalizedZones.zone2; // Łatwe tempo (często używane)
              zoneUsed = 'zone2';
            } else if (currentHR.min >= 120 && currentHR.max <= 140) {
              targetZone = personalizedZones.zone2; // Łatwe tempo
              zoneUsed = 'zone2';
            } else if (currentHR.min >= 125 && currentHR.max <= 145) {
              targetZone = personalizedZones.zone2; // Łatwe tempo
              zoneUsed = 'zone2';
            } else {
              // Domyślnie użyj strefy 2 dla większości treningów
              targetZone = personalizedZones.zone2;
              zoneUsed = 'zone2 (default)';
            }
            
            console.log(`🎯 [DEBUG] Mapowanie HR dla ${day.day_name} - ${day.workout?.type}:`, {
              original: currentHR,
              mapped_to: zoneUsed,
              new_hr: { min: targetZone.min, max: targetZone.max }
            });
            
            // Aktualizuj tylko jeśli mamy spersonalizowane strefy
            if (targetZone) {
              day.workout.target_heart_rate = {
                min: targetZone.min,
                max: targetZone.max
              };
            }
          }
        });
      }
    });

    console.log('🎯 [DEBUG] Plan po personalizacji stref tętna:', JSON.stringify(updatedPlan.plan_weeks[0]?.days?.map(d => ({
      day: d.day_name,
      type: d.workout?.type,
      final_hr: d.workout?.target_heart_rate
    })), null, 2));

    this.log('Pomyślnie spersonalizowano strefy tętna');
    return updatedPlan;
  }
}

module.exports = GeminiService;