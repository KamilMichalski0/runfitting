const axios = require('axios');
const geminiConfig = require('../config/gemini.config'); 
const openaiConfig = require('../config/openai.config'); 
const { OpenAI } = require('openai'); 
const AppError = require('../utils/app-error');
const config = require('../config/gemini.config');
const { getExamplePlanTemplate } = require('../templates/plan-template-selector');
const correctiveExercisesKnowledgeBase = require('../knowledge/corrective-knowledge-base'); // Corrected path

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

    // Check Gemini API key and set preference
    this.isGemini = !!this.geminiApiKey;
    if (!this.geminiApiKey) {
      console.warn('⚠️  WARNING: GEMINI_API_KEY is not set. GeminiService will attempt OpenAI fallback or use default responses.');
    }

    // Initialize OpenAI client
    this.openaiApiKey = openaiConfig.apiKey;
    if (!this.openaiApiKey) {
      console.warn('⚠️  WARNING: OPENAI_API_KEY is not set. OpenAI fallback will not be available.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey: this.openaiApiKey });
      this.openaiModel = openaiConfig.model;
      this.openaiTemperature = openaiConfig.temperature;
      this.openaiMaxTokens = openaiConfig.maxTokens;
      this.openaiTopP = openaiConfig.topP;
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
        // REMOVED: OpenAI and emergency fallback methods bindings - no longer needed 
    this._generateCorrectiveExercises = this._generateCorrectiveExercises.bind(this);
    this._createCorrectiveExercisesPrompt = this._createCorrectiveExercisesPrompt.bind(this);

    // Remove decorator calls
    this.generateTrainingPlan = this.generateTrainingPlan.bind(this);
    this.log = this.log.bind(this); 
    this.error = this.error.bind(this); 
  }

  // Method for standardized logging within the service
  log(message, data) {
    console.log(message, data !== undefined ? data : '');
  }

  // Method for standardized error logging within the service
  error(message, errorData) {
    console.error(message, errorData !== undefined ? errorData : '');
  }

  async generateTrainingPlan(userData) {
    // Logowanie otrzymanych danych użytkownika na początku metody
    console.log('GeminiService otrzymał dane użytkownika:', JSON.stringify(userData, null, 2));

    this.log('\n=== ROZPOCZĘCIE GENEROWANIA PLANU TRENINGOWEGO ===');
    this.log('1. Dane wejściowe użytkownika:', userData);

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
        this.log(`\n--- PRÓBA ${attempt}/${maxRetries} WYGENEROWANIA PLANU PRZEZ GEMINI ---`);
        this.log('\n2. Tworzenie promptu dla Gemini...');
        const prompt = this._createPrompt(userData);
        
        // Logowanie promptu
        this.log('Wygenerowany prompt:');
        this.log('----------------------------------------');
        this.log(prompt);
        this.log('----------------------------------------');

        const requestUrl = `${this.geminiApiUrl}/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

        this.log('\n3. Konfiguracja żądania do Gemini API:');
        this.log(`- Model: ${this.geminiModel}`);
        this.log(`- URL: ${requestUrl}`);

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

        this.log('\n4. Konfiguracja generowania Gemini:');
        this.log(`- Temperature: ${this.geminiGenerationConfig.temperature}`);
        this.log(`- TopK: ${this.geminiGenerationConfig.topK}`);
        this.log(`- TopP: ${this.geminiGenerationConfig.topP}`);
        this.log(`- MaxTokens: ${this.geminiGenerationConfig.maxOutputTokens}`);

        this.log('\n5. Wysyłanie żądania do Gemini API...');

        const response = await this.axiosClient.post(requestUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000, // 30 sekund timeout
        });

        this.log('\n6. Otrzymano odpowiedź z Gemini API.');
        this.log('\n7. Parsowanie odpowiedzi Gemini...');
        const trainingPlan = this._parseResponse(response.data); 

        this.log('\n8. Zwalidowano i sparsowano plan treningowy z Gemini.');
        this.log('\n=== ZAKOŃCZONO GENEROWANIE PLANU (GEMINI) ===');
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
    
    // Timeout błędy
    if (error.message && error.message.includes('timeout')) {
      return true;
    }
    
    return false;
  }

  _createPrompt(userData) {
    // Logowanie surowych danych wejściowych dotyczących dat
    this.log('GeminiService._createPrompt - Otrzymane dane wejściowe userData:', JSON.stringify(userData, null, 2));
    this.log(`GeminiService._createPrompt - Surowa wartość planStartDate: ${userData.planStartDate}`);
    this.log(`GeminiService._createPrompt - Surowa wartość raceDate: ${userData.raceDate}`);

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
                // race on Monday, start on Monday of same week = 0 days diff -> 1 week plan.
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) +1; // +1 to ensure race week is part of duration
                planDuration = Math.max(1, Math.ceil(diffDays / 7));
                raceDateInfo = `Data zawodów docelowych: ${raceDateString}. Plan zostanie dostosowany, aby zakończyć się w tygodniu zawodów.`;
            } else {
                raceDateInfo = `Data zawodów docelowych: ${raceDateString} (Uwaga: data zawodów jest w przeszłości lub zbyt blisko daty startu. Czas trwania planu zostanie obliczony domyślnie).`;
            }
        } else {
            raceDateInfo = `Data zawodów docelowych: ${raceDateString} (Uwaga: nieprawidłowy format daty. Czas trwania planu zostanie obliczony domyślnie).`;
        }
    }

    if (planDuration === undefined) {
        const mainGoal = userData.glownyCel;
        // Użyj zmiennej o zmienionej nazwie
        const targetDistanceGoal = userData.dystansDocelowy; 
        planDuration = 8; // default
        switch (mainGoal) {
            case 'redukcja_masy_ciala':
            case 'aktywny_tryb_zycia':
            case 'zmiana_nawykow':
            case 'powrot_po_kontuzji':
            case 'poprawa_kondycji':
            case 'inny_cel':
                planDuration = 8;
                break;
            case 'zaczac_biegac':
                planDuration = 6;
                break;
            case 'przebiegniecie_dystansu':
                // Użyj zmiennej o zmienionej nazwie
                switch (targetDistanceGoal) {
                    case '5km': planDuration = 6; break;
                    case '10km': planDuration = 8; break;
                    case 'polmaraton': planDuration = 12; break;
                    case 'maraton': planDuration = 16; break;
                    default: planDuration = 8; break;
                }
                break;
            default:
                planDuration = 8;
                break;
        }
    }

    const planDurationInfo = `Planowany czas trwania planu: ${planDuration} tygodni`;
    
    let healthInfo = [];
    
    if (userData.kontuzje) {
      healthInfo.push('Użytkownik ma kontuzje');
      if (userData.opisKontuzji) {
        healthInfo.push(`Opis kontuzji: ${userData.opisKontuzji}`);
      }
      if (userData.lokalizacjaBolu) {
        healthInfo.push(`Lokalizacja bólu: ${userData.lokalizacjaBolu}`);
      }
      if (userData.charakterBolu) {
        healthInfo.push(`Charakter bólu: ${userData.charakterBolu}`);
      }
      if (userData.skalaBolu) {
        healthInfo.push(`Skala bólu (0-10): ${userData.skalaBolu}`);
      }
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

    // Pobranie przykładowego planu - PRZENIESIONE TUTAJ
    const examplePlan = getExamplePlanTemplate(templateMatcherUserData); // Użyj zmapowanych danych
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

    return `Jesteś ekspertem w tworzeniu planów treningowych dla biegaczy. Stwórz spersonalizowany plan treningowy na podstawie poniższych informacji o użytkowniku i dostępnej bazie wiedzy.

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

${cooperTestInfo}
${examplePlanSection}
${knowledgeBaseInfo}

### WYMAGANA STRUKTURA ODPOWIEDZI:
Plan musi być zwrócony w następującym formacie JSON.

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
          "date": string (YYYY-MM-DD, data treningu - WAŻNE: oblicz na podstawie daty startu planu i dnia tygodnia),
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
      maxHR = Math.round(208 - (0.7 * userData.wiek)); 
    }

    // Użyj restingHr z nowego schematu lub domyślnej wartości
    const restingHR = userData.restingHr || 60;

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
      
      // Ulepszona walidacja i naprawa planu
      plan = this._validateAndRepairPlan(plan);
      
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
          plan.plan_weeks = this._createDefaultWeeks();
        }
      } else {
        plan.plan_weeks = this._createDefaultWeeks();
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
  _createDefaultWeeks() {
    const weeks = [];
    for (let i = 1; i <= 6; i++) {
      weeks.push({
        week_num: i,
        focus: i <= 2 ? "Budowanie bazy" : i <= 4 ? "Rozwój wytrzymałości" : "Intensyfikacja",
        days: [
          {
            day_name: "poniedziałek",
            date: new Date(Date.now() + (i-1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            workout: {
              type: "easy_run",
              description: "Łagodny bieg budujący bazę wytrzymałościową",
              distance: 3 + i * 0.5,
              duration: 25 + i * 5,
              target_heart_rate: { min: 120, max: 150, zone: "Strefa 2" },
              support_exercises: []
            }
          }
        ]
      });
    }
    return weeks;
  }

  /**
   * Waliduje i naprawia plan treningowy
   * @param {Object} plan - Plan do walidacji
   * @returns {Object} - Naprawiony plan
   */
  _validateAndRepairPlan(plan) {
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
      plan.plan_weeks = this._createDefaultWeeks();
    }

    // Walidacja i naprawa tygodni
    plan.plan_weeks = plan.plan_weeks.map((week, index) => {
      if (!week || typeof week !== 'object') {
        return this._createDefaultWeek(index + 1);
      }

      if (!week.week_num) week.week_num = index + 1;
      if (!week.focus) week.focus = "Trening ogólnorozwojowy";
      
      if (!week.days || !Array.isArray(week.days)) {
        week.days = this._createDefaultDays(index + 1);
      } else {
        // Walidacja dni
        week.days = week.days.map((day, dayIndex) => {
          return this._validateAndRepairDay(day, dayIndex);
        });
      }

      return week;
    });

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
          plan.plan_weeks = this._adjustWeeksCount(plan.plan_weeks, expectedDuration);
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
   * @returns {Object} - Naprawiony dzień
   */
  _validateAndRepairDay(day, dayIndex) {
    const defaultDays = ['poniedziałek', 'środa', 'piątek', 'niedziela', 'wtorek', 'czwartek', 'sobota'];
    
    if (!day || typeof day !== 'object') {
      return this._createDefaultDay(defaultDays[dayIndex % defaultDays.length]);
    }

    if (!day.day_name) {
      day.day_name = defaultDays[dayIndex % defaultDays.length];
    }

    if (!day.date) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + dayIndex);
      day.date = futureDate.toISOString().split('T')[0];
    }

    if (!day.workout || typeof day.workout !== 'object') {
      day.workout = this._createDefaultWorkout();
    } else {
      // Walidacja i naprawa workout
      if (!day.workout.type) day.workout.type = "easy_run";
      if (!day.workout.description) day.workout.description = "Trening biegowy";
      if (typeof day.workout.distance !== 'number') day.workout.distance = 5;
      if (typeof day.workout.duration !== 'number') day.workout.duration = 30;
      
      if (!day.workout.target_heart_rate) {
        day.workout.target_heart_rate = { min: 120, max: 150, zone: "Strefa 2" };
      }
      
      if (!day.workout.support_exercises) {
        day.workout.support_exercises = [];
      }
    }

    return day;
  }

  /**
   * Tworzy domyślny dzień treningowy
   * @param {string} dayName - Nazwa dnia
   * @returns {Object} - Domyślny dzień
   */
  _createDefaultDay(dayName) {
    return {
      day_name: dayName,
      date: new Date().toISOString().split('T')[0],
      workout: this._createDefaultWorkout()
    };
  }

  /**
   * Tworzy domyślny trening
   * @returns {Object} - Domyślny trening
   */
  _createDefaultWorkout() {
    return {
      type: "easy_run",
      description: "Łagodny bieg budujący bazę wytrzymałościową",
      distance: 5,
      duration: 30,
      target_heart_rate: { min: 120, max: 150, zone: "Strefa 2" },
      support_exercises: []
    };
  }

  /**
   * Dostosowuje liczbę tygodni w planie
   * @param {Array} weeks - Obecne tygodnie
   * @param {number} targetCount - Docelowa liczba tygodni
   * @returns {Array} - Dostosowane tygodnie
   */
  _adjustWeeksCount(weeks, targetCount) {
    if (weeks.length === targetCount) return weeks;
    
    if (weeks.length > targetCount) {
      return weeks.slice(0, targetCount);
    } else {
      const newWeeks = [...weeks];
      for (let i = weeks.length + 1; i <= targetCount; i++) {
        newWeeks.push(this._createDefaultWeek(i));
      }
      return newWeeks;
    }
  }

  /**
   * Tworzy domyślny tydzień
   * @param {number} weekNum - Numer tygodnia
   * @returns {Object} - Domyślny tydzień
   */
  _createDefaultWeek(weekNum) {
    return {
      week_num: weekNum,
      focus: weekNum <= 2 ? "Budowanie bazy" : weekNum <= 4 ? "Rozwój wytrzymałości" : "Intensyfikacja",
      days: this._createDefaultDays(weekNum)
    };
  }

  /**
   * Tworzy domyślne dni dla tygodnia
   * @param {number} weekNum - Numer tygodnia
   * @returns {Array} - Tablica dni
   */
  _createDefaultDays(weekNum) {
    const defaultDays = ['poniedziałek', 'środa', 'piątek'];
    return defaultDays.map((dayName, index) => ({
      day_name: dayName,
      date: this._calculateDate(weekNum, index),
      workout: {
        type: index === 0 ? "easy_run" : index === 1 ? "tempo_run" : "long_run",
        description: index === 0 ? "Łagodny bieg" : index === 1 ? "Trening tempowy" : "Długi bieg",
        distance: 3 + weekNum * 0.5 + index,
        duration: 25 + weekNum * 2 + index * 5,
        target_heart_rate: { 
          min: 120 + index * 10, 
          max: 150 + index * 10, 
          zone: `Strefa ${index + 2}` 
        },
        support_exercises: []
      }
    }));
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



  // Nowa metoda do generowania planu przy użyciu OpenAI
  // REMOVED: _generatePlanWithOpenAI - no longer needed, only Gemini is used

  // REMOVED: _parseOpenAIResponse - no longer needed, only Gemini is used

  // REMOVED: _createDefaultTrainingPlan - no longer needed, only Gemini is used

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
        this.log(`\n--- PRÓBA ${attempt}/${maxRetries} WYGENEROWANIA PLANU TYGODNIOWEGO PRZEZ GEMINI ---`);
        
        const prompt = this.prepareWeeklyPlanPrompt(weeklyData);
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
        return this.parseWeeklyPlanResponse(response, weeklyData);

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
    
    return `Wygeneruj plan treningowy na ${weeklyData.deliveryFrequency === 'biweekly' ? '2 tygodnie' : '1 tydzień'} dla biegacza na podstawie poniższych danych:

${contextInfo}

WAŻNE WYMAGANIA:
1. To jest ${weeklyData.weekNumber} tydzień treningowy w ramach długoterminowej progresji
2. Aktualnie znajdujemy się w fazie: ${weeklyData.currentPhase}
3. Poprzednia realizacja planów: ${weeklyData.recentPerformance.averageCompletion * 100}%
4. Trend wydajności: ${weeklyData.recentPerformance.trend}
5. Rekomendacja progresji: ${weeklyData.recentPerformance.recommendation}

DOSTOSOWANIA:
- Jeśli realizacja była niska (<60%), zmniejsz intensywność i objętość
- Jeśli realizacja była wysoka (>80%), można delikatnie zwiększyć wyzwanie
- Uwzględnij fazę treningową: ${weeklyData.currentPhase}
- Tempo progresji: ${((weeklyData.progressionRate - 1) * 100).toFixed(1)}% tygodniowo

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
    let context = `PROFIL BIEGACZA:
- Imię: ${weeklyData.name}
- Wiek: ${weeklyData.age} lat
- Poziom: ${weeklyData.level}
- Cel: ${weeklyData.goal}
- Dni treningowe w tygodniu: ${weeklyData.daysPerWeek}
- Aktualny tygodniowy dystans: ${weeklyData.weeklyDistance} km
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
      const planData = this._parseResponse(response.data);

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
}

module.exports = GeminiService;