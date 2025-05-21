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

    // Check Gemini API key
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
    this._parseOpenAIResponse = this._parseOpenAIResponse.bind(this); 
    this._createDefaultTrainingPlan = this._createDefaultTrainingPlan.bind(this);
    this._generatePlanWithOpenAI = this._generatePlanWithOpenAI.bind(this); 
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

    // 1. Try Gemini API first
    if (this.geminiApiKey) {
      try {
        this.log('\n--- PRÓBA WYGENEROWANIA PLANU PRZEZ GEMINI ---');
        this.log('\n2. Tworzenie promptu dla Gemini...');
        const prompt = this._createPrompt(userData);
        
        // Odkomentowanie i rozszerzenie logowania promptu
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
        // this.log('Request body:', requestBody); 

        const response = await this.axiosClient.post(requestUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
        });

        this.log('\n6. Otrzymano odpowiedź z Gemini API.');
        // this.log('Odpowiedź API:', response.data); 

        this.log('\n7. Parsowanie odpowiedzi Gemini...');
        const trainingPlan = this._parseResponse(response.data); 

        this.log('\n8. Zwalidowano i sparsowano plan treningowy z Gemini.');
        // this.log('Sparsowany plan:', trainingPlan);

        this.log('\n=== ZAKOŃCZONO GENEROWANIE PLANU (GEMINI) ===');
        return trainingPlan;

      } catch (geminiError) {
        this.error('\n⚠️ Błąd podczas generowania planu przez Gemini:', {
          message: geminiError.message,
          status: geminiError.response?.status,
          data: geminiError.response?.data,
          stack: geminiError.stack
        });
        // Jeśli Gemini zawiedzie ORAZ OpenAI nie jest dostępne, rzuć błąd
        if (!this.openai) {
          throw new AppError(`Nie udało się wygenerować planu treningowego: ${geminiError.message}`, geminiError.response?.status || 500);
        }
        // W przeciwnym razie, przechodzimy do OpenAI (jeśli skonfigurowane)
      }
    } else {
      this.log('Klucz API Gemini nie jest ustawiony, pomijanie próby Gemini.');
    }

    // 2. Try OpenAI API as fallback
    if (this.openai) {
        try {
            this.log('\n--- PRÓBA WYGENEROWANIA PLANU PRZEZ OPENAI (FALLBACK) ---');
            const prompt = this._createPrompt(userData); 
            const trainingPlan = await this._generatePlanWithOpenAI(userData, prompt);
            this.log('\n=== ZAKOŃCZONO GENEROWANIE PLANU (OPENAI FALLBACK) ===');
            return trainingPlan;
        } catch (openaiError) {
            this.error('\n⚠️ Błąd podczas generowania planu przez OpenAI (fallback):', {
                message: openaiError.message,
                status: openaiError.response?.status,
                data: openaiError.response?.data,
                stack: openaiError.stack
            });
            // Jeśli OpenAI również zawiedzie, rzuć błąd przed przejściem do domyślnego planu
            throw new AppError(`Nie udało się wygenerować planu treningowego po fallbacku do OpenAI: ${openaiError.message}`, openaiError.response?.status || 500);
        }
    } else {
        this.log('OpenAI nie skonfigurowane, pomijanie próby fallbacku OpenAI.');
        // Jeśli Gemini nie zadziałało i OpenAI nie jest skonfigurowane, a doszliśmy tutaj,
        // to znaczy, że błąd Gemini nie został rzucony (bo this.openai było fałszywe w bloku catch Gemini)
        // lub klucz Gemini nie był ustawiony. W tej sytuacji, jeśli nie ma klucza Gemini i nie ma OpenAI,
        // a użytkownik oczekuje planu, rzucenie błędu tutaj może być zbyt wczesne.
        // Logika testu powinna to uwzględnić.
        // Jednak jeśli Gemini API key był, ale zawiódł, i nie ma OpenAI, błąd powinien być już rzucony wyżej.
    }

    // 3. Fallback to default plan if both APIs fail or are not configured
    // Ten kod zostanie osiągnięty tylko jeśli:
    //    a) Klucz Gemini nie jest ustawiony ORAZ OpenAI nie jest skonfigurowane.
    //    b) Poprzednie bloki catch nie rzuciły błędu (co nie powinno się zdarzyć po modyfikacji).
    this.log('\n--- GENEROWANIE PLANU DOMYŚLNEGO (FALLBACK OSTATECZNY) ---');
    let trainingPlan = this._createDefaultTrainingPlan(userData);

    // Generate and merge corrective exercises if injuries are reported
    if (userData.kontuzje && this.correctiveExercisesKnowledgeBase) {
      try {
        this.log('\n--- GENEROWANIE ĆWICZEŃ KOREKCYJNYCH ---');
        const correctiveExercisesData = await this._generateCorrectiveExercises(userData, this.correctiveExercisesKnowledgeBase);
        if (correctiveExercisesData) {
          trainingPlan.corrective_exercises = correctiveExercisesData;
          this.log('Pomyślnie zintegrowano ćwiczenia korekcyjne.');
        } else {
          this.log('Nie udało się wygenerować ćwiczeń korekcyjnych, używam domyślnych z planu awaryjnego.');
          // Fallback to default corrective exercises if generation fails but injuries were reported
          if (!trainingPlan.corrective_exercises || trainingPlan.corrective_exercises.list.length === 0) {
             trainingPlan.corrective_exercises = {
                frequency: "Wykonuj 2-3 razy w tygodniu (zalecenia awaryjne)",
                list: [
                  { name: "Rolowanie piankowe łydek", sets: 1, reps: null, duration: 60, description: "Rozluźnij mięśnie łydek." },
                  { name: "Mostki biodrowe", sets: 3, reps: 15, duration: null, description: "Wzmocnij mięśnie stabilizujące miednicę." }
                ]
              };
          }
        }
      } catch (corrExError) {
        this.error('\n⚠️ Błąd podczas generowania ćwiczeń korekcyjnych:', corrExError);
        // Fallback to default corrective exercises on error
        if (!trainingPlan.corrective_exercises || trainingPlan.corrective_exercises.list.length === 0) {
           trainingPlan.corrective_exercises = {
              frequency: "Wykonuj 2-3 razy w tygodniu (zalecenia awaryjne po błędzie)",
              list: [
                { name: "Rolowanie piankowe łydek", sets: 1, reps: null, duration: 60, description: "Rozluźnij mięśnie łydek." },
                { name: "Mostki biodrowe", sets: 3, reps: 15, duration: null, description: "Wzmocnij mięśnie stabilizujące miednicę." }
              ]
            };
        }
      }
    } else if (!userData.kontuzje) {
      trainingPlan.corrective_exercises = {
        frequency: "Nie dotyczy - brak zgłoszonych kontuzji",
        list: []
      };
    }
    
    return trainingPlan;
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
      'redukcja_masy_ciala': 'general_fitness',
      'przebiegniecie_dystansu': this._mapDistanceToKnowledgeBase(userData.dystansDocelowy || '5km'),
      'zaczac_biegac': 'general_fitness',
      'aktywny_tryb_zycia': 'general_fitness',
      'zmiana_nawykow': 'general_fitness',
      'powrot_po_kontuzji': 'general_fitness',
      'poprawa_kondycji': 'general_fitness',
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

WAŻNE: Wygeneruj nowy, unikalny plan treningowy bazując na powyższym przykładzie, ale dostosowany do profilu użytkownika i wykorzystujący wiedzę z bazy wiedzy. Odpowiedz WYŁĄCZNIE w formacie JSON. Nie dodawaj żadnego tekstu przed ani po strukturze JSON. Nie używaj cudzysłowów w nazwach pól.
Pamiętaj, że sekcja 'PRZYKŁADOWY PLAN TRENINGOWY' służy WYŁĄCZNIE jako wzór struktury JSON. NIE KOPIUJ zawartości tego przykładu. Wygeneruj całkowicie nowy, unikalny plan dostosowany do danych użytkownika.`;
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
        return this._createDefaultTrainingPlan(this.userData);
      }
      
      let plan;
      try {
        if (!apiResponse.candidates || !Array.isArray(apiResponse.candidates) || apiResponse.candidates.length === 0) {
          console.error('Nieprawidłowa struktura odpowiedzi - brak candidates:', apiResponse);
          return this._createDefaultTrainingPlan(this.userData);
        }
        
        const candidate = apiResponse.candidates[0];
        if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
          console.error('Nieprawidłowa struktura candidate - brak parts:', candidate);
          return this._createDefaultTrainingPlan(this.userData);
        }
        
        const textPart = candidate.content.parts[0];
        if (!textPart.text) {
          console.error('Brak tekstu w odpowiedzi:', textPart);
          return this._createDefaultTrainingPlan(this.userData);
        }
        
        const candidates = textPart.text;
        console.log('Wyodrębniony tekst z odpowiedzi:', candidates);
        
        try {
          if (!candidates) {
            throw new Error('Otrzymano pusty tekst');
          }
          
          if (candidates.trim().startsWith('null') || candidates.trim().startsWith('undefined')) {
            throw new Error(`Otrzymano nieprawidłową wartość: ${candidates.trim().substring(0, 20)}...`);
          }
          
          plan = JSON.parse(candidates);
          console.log('Pomyślnie sparsowano JSON bezpośrednio');
        } catch (parseError) {
          console.error('Błąd parsowania JSON z odpowiedzi:', parseError);
          console.log('Próba znalezienia struktury JSON w tekście...');
          
          const jsonMatch = candidates.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const jsonCandidate = jsonMatch[0];
              console.log('Znaleziono potencjalny JSON:', jsonCandidate.substring(0, 100) + '...');
              plan = JSON.parse(jsonCandidate);
              console.log('Pomyślnie sparsowano wyodrębniony JSON');
            } catch (secondParseError) {
              console.error('Błąd parsowania wyodrębnionego JSON:', secondParseError);
              
              try {
                let fixedJson = jsonMatch[0];
                fixedJson = fixedJson.replace(/([\{\[,:]\s*)'([^']*)'(\s*[\}\],:])/g, '$1"$2"$3');
                fixedJson = fixedJson.replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
                console.log('Próba naprawy JSON:', fixedJson.substring(0, 100) + '...');
                
                plan = JSON.parse(fixedJson);
                console.log('Pomyślnie sparsowano naprawiony JSON');
              } catch (thirdParseError) {
                console.error('Nie udało się naprawić JSON:', thirdParseError);
                return this._createDefaultTrainingPlan(this.userData);
              }
            }
          } else {
            console.error('Nie znaleziono struktury JSON w odpowiedzi');
            return this._createDefaultTrainingPlan(this.userData);
          }
        }
      } catch (error) {
        console.error('Błąd podczas przetwarzania odpowiedzi:', error);
        return this._createDefaultTrainingPlan(this.userData);
      }
      
      if (!plan.id || !plan.metadata || !plan.plan_weeks) {
        console.error('Brakujące pola w planie:', {
          hasId: !!plan.id,
          hasMetadata: !!plan.metadata,
          hasPlanWeeks: !!plan.plan_weeks
        });
        throw new Error('Nieprawidłowa struktura planu - brakujące wymagane pola');
      }

      if (this.userData && this.userData.planDuration) {
        const expectedDuration = parseInt(this.userData.planDuration, 10);
        if (!isNaN(expectedDuration)) {
          if (!plan.metadata.duration_weeks) {
            console.warn(`Brak duration_weeks w planie, ustawiam na ${expectedDuration}`);
            plan.metadata.duration_weeks = expectedDuration;
          } else if (plan.metadata.duration_weeks !== expectedDuration) {
            console.warn(`duration_weeks (${plan.metadata.duration_weeks}) nie zgadza się z planDuration (${expectedDuration})`);
            plan.metadata.duration_weeks = expectedDuration;
          }
        }
      }

      const defaultDays = ['poniedziałek', 'środa', 'piątek'];
      
      if (!Array.isArray(plan.plan_weeks)) {
        console.error('plan_weeks nie jest tablicą:', plan.plan_weeks);
        plan.plan_weeks = [];
      }
      
      plan.plan_weeks.forEach((week, weekIndex) => {
        if (!week.days || !Array.isArray(week.days)) {
          console.warn(`Brak dni w tygodniu ${weekIndex + 1} lub nie jest tablicą`);
          week.days = [];
          return;
        }
        
        week.days.forEach((day, dayIndex) => {
          if (!day.day_name) {
            console.warn(`Brak nazwy dnia w tygodniu ${weekIndex + 1}, dzień ${dayIndex + 1}`);
            day.day_name = defaultDays[dayIndex % defaultDays.length];
          } else if (day.day_name.startsWith('Dzień')) {
            day.day_name = defaultDays[dayIndex % defaultDays.length];
          }
        });
      });
      
      return plan;
    } catch (error) {
      console.error('Błąd podczas parsowania odpowiedzi:', error);
      throw new AppError('Nieprawidłowa odpowiedź z API: ' + error.message, 500);
    }
  }

  // Nowa metoda do generowania planu przy użyciu OpenAI
  async _generatePlanWithOpenAI(userData, prompt) {
    if (!this.openai) {
      throw new AppError('OpenAI client is not initialized.', 500);
    }

    this.log('\n2a. Konfiguracja żądania do OpenAI API:');
    this.log(`- Model: ${this.openaiModel}`);
    this.log(`- Temperature: ${this.openaiTemperature}`);
    this.log(`- MaxTokens: ${this.openaiMaxTokens}`);
    this.log(`- TopP: ${this.openaiTopP}`);

    // Dodaję logowanie promptu dla OpenAI
    this.log('\nPrompt wysyłany do OpenAI:');
    this.log('----------------------------------------');
    this.log(prompt);
    this.log('----------------------------------------');

    this.log('\n3a. Wysyłanie żądania do OpenAI API...');

    const messages = [
      {
        role: 'system',
        content: 'Jesteś ekspertem w tworzeniu planów treningowych dla biegaczy. Twoim zadaniem jest wygenerowanie szczegółowego planu w formacie JSON na podstawie danych użytkownika. Zwróć tylko i wyłącznie poprawny obiekt JSON, bez żadnych dodatkowych komentarzy, wstępów czy wyjaśnień.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const requestBody = {
        model: this.openaiModel,
        messages: messages,
        temperature: this.openaiTemperature,
        max_tokens: this.openaiMaxTokens,
        top_p: this.openaiTopP,
        response_format: { type: "json_object" }, 
        frequency_penalty: openaiConfig.frequencyPenalty,
        presence_penalty: openaiConfig.presencePenalty,
    };
    // this.log('OpenAI Request Body:', requestBody); 

    const response = await this.openai.chat.completions.create(requestBody, {
        timeout: openaiConfig.timeout
    });

    this.log('\n4a. Otrzymano odpowiedź z OpenAI API.');
    // this.log('Odpowiedź API OpenAI:', response); 

    this.log('\n5a. Parsowanie odpowiedzi OpenAI...');
    const trainingPlan = this._parseOpenAIResponse(response);

    this.log('\n6a. Zwalidowano i sparsowano plan treningowy z OpenAI.');
    // this.log('Sparsowany plan OpenAI:', trainingPlan);
    return trainingPlan;
  }

  // Nowa metoda do parsowania odpowiedzi z OpenAI
  _parseOpenAIResponse(apiResponse) {
    this.log('Rozpoczęcie parsowania odpowiedzi OpenAI');
    try {
        if (!apiResponse || !apiResponse.choices || apiResponse.choices.length === 0 || !apiResponse.choices[0].message || !apiResponse.choices[0].message.content) {
            console.error('Niekompletna lub pusta odpowiedź OpenAI:', apiResponse);
            throw new AppError('Niekompletna odpowiedź z API OpenAI.', 500);
        }

        const jsonString = apiResponse.choices[0].message.content;
        this.log('Surowy JSON z OpenAI:', jsonString);

        const plan = JSON.parse(jsonString);

        // Dodatkowa walidacja struktury planu (podobna do tej w _parseGeminiResponse)
        if (!plan || typeof plan !== 'object') {
          throw new Error('Odpowiedź nie jest poprawnym obiektem JSON.');
        }

        // Sprawdzenie kluczowych pól, teraz włączając nowe
        const requiredKeys = ['metadata', 'plan_weeks', 'corrective_exercises', 'pain_monitoring', 'notes'];
        for (const key of requiredKeys) {
          if (!plan[key]) {
            console.warn(`Ostrzeżenie: Brakujący klucz '${key}' w odpowiedzi OpenAI.`);
            // Można zdecydować czy rzucić błąd, czy ustawić domyślną wartość
            // Na razie tylko ostrzegamy, ale można dodać domyślne wartości poniżej
            // if (key === 'corrective_exercises') plan[key] = { frequency: "nie określono", list: [] };
            // if (key === 'pain_monitoring') plan[key] = { scale: "nie określono", rules: [] };
          }
        }

        // Podobna logika czyszczenia nazw dni jak w Gemini
        const defaultDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];
        if (plan.plan_weeks && Array.isArray(plan.plan_weeks)) {
            plan.plan_weeks.forEach((week, weekIndex) => {
                if (week.days && Array.isArray(week.days)) {
                    week.days.forEach((day, dayIndex) => {
                        if (!day.day_name || day.day_name.startsWith('Dzień')) {
                            day.day_name = defaultDays[dayIndex % defaultDays.length];
                        }
                    });
                } else {
                     console.warn(`Brak dni w tygodniu ${weekIndex + 1} lub nie jest tablicą (OpenAI)`);
                     week.days = [];
                }
            });
        } else {
             console.warn('plan_weeks nie jest tablicą lub nie istnieje (OpenAI)');
             plan.plan_weeks = [];
        }

        this.log('Parsowanie odpowiedzi OpenAI zakończone sukcesem.');
        return plan;
    } catch (error) {
        console.error('Błąd podczas parsowania odpowiedzi OpenAI:', error, 'Oryginalna odpowiedź:', apiResponse?.choices?.[0]?.message?.content);
        throw new AppError('Nieprawidłowa odpowiedź JSON z API OpenAI: ' + error.message, 500);
    }
  }

  _createDefaultTrainingPlan(userData) {
    console.log('Tworzenie domyślnego planu treningowego');
    const currentData = userData || this.userData || {}; 

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let effectivePlanStartDate = new Date(); // Domyślnie dzisiaj
    effectivePlanStartDate.setHours(0, 0, 0, 0);

    if (currentData.planStartDate) {
      const parsedStartDate = new Date(currentData.planStartDate);
      parsedStartDate.setHours(0,0,0,0);
      if (!isNaN(parsedStartDate.getTime()) && parsedStartDate >= effectivePlanStartDate) {
        effectivePlanStartDate = parsedStartDate;
      }
    } 
  
    // Użyj nowych pól z schematu lub wartości domyślnych
    const imieNazwisko = currentData.imieNazwisko || 'Użytkownik';
    const poziomZaawansowania = currentData.poziomZaawansowania || 'poczatkujacy';

    // Domyślna długość planu zależna od celu użytkownika
    let planDuration = 8; // domyślnie 8 tygodni
    const mainGoal = currentData.glownyCel;
    const targetDistanceGoal = currentData.dystansDocelowy;

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
          case '5km':
            planDuration = 6;
            break;
          case '10km':
            planDuration = 8;
            break;
          case 'polmaraton':
            planDuration = 12;
            break;
          case 'maraton':
            planDuration = 16;
            break;
          default: // inny dystans lub brak
            planDuration = 8;
            break;
        }
        break;
      default:
        planDuration = 8; // Domyślna wartość, jeśli cel nieznany
        break;
    }

    // Tworzenie pustego zestawu tygodni
    const planWeeks = [];
    for (let weekNum = 1; weekNum <= planDuration; weekNum++) {
      const focus = weekNum <= 2 ? "Budowanie bazy" : 
                    weekNum <= 4 ? "Rozwój wytrzymałości" : 
                    weekNum <= planDuration - 2 ? "Intensyfikacja treningów" :
                    "Tapering przed zawodami";

      // Ustal dni treningowe bazując na schemacie lub domyślne
      const treningoweDni = currentData.dniTreningowe || ["poniedziałek", "środa", "sobota"];
      
      // Mapa dni tygodnia dla poprawnej kolejności
      const daysOrder = {
        "poniedziałek": 1,
        "wtorek": 2,
        "środa": 3,
        "czwartek": 4,
        "piątek": 5,
        "sobota": 6,
        "niedziela": 7
      };
      
      // Posortuj dni treningowe według kolejności w tygodniu
      const sortedTreningoweDni = [...treningoweDni].sort((a, b) => daysOrder[a] - daysOrder[b]);
      
      const days = sortedTreningoweDni.map(dayName => {
        let workoutType, description, distance, duration;
        
        // Obliczanie daty dla danego dnia treningowego
        // Zakładamy, że tydzień planu (weekNum) zaczyna się od effectivePlanStartDate
        // i dni są rozłożone w tym tygodniu.
        const dayOffset = daysOrder[dayName] - daysOrder[sortedTreningoweDni[0]]; // Offset względem pierwszego dnia treningowego w tygodniu
        const currentWorkoutDate = new Date(effectivePlanStartDate);
        currentWorkoutDate.setDate(effectivePlanStartDate.getDate() + (weekNum - 1) * 7 + dayOffset);

        // Różnicuj treningi w zależności od dnia tygodnia
        if (dayName === "poniedziałek" || dayName === "piątek") {
          workoutType = "Trening łatwy";
          description = "Bieg w strefie komfortowej, rozwijający bazę tlenową";
          distance = 5 + (weekNum - 1) * 0.5; // Progresja dystansu przez tygodnie
          duration = 30 + (weekNum - 1) * 5; // Progresja czasu przez tygodnie
        } else if (dayName === "środa") {
          workoutType = "Trening tempowy";
          description = "Interwały biegowe ze zmiennym tempem";
          distance = 4 + (weekNum - 1) * 0.3;
          duration = 40 + (weekNum - 1) * 5;
        } else {
          workoutType = "Długi bieg";
          description = "Długi powolny bieg budujący wytrzymałość";
          distance = 8 + (weekNum - 1) * 1;
          duration = 60 + (weekNum - 1) * 10;
        }
        
        return {
          day_name: dayName,
          date: formatDate(currentWorkoutDate),
          workout: {
            type: workoutType,
            description: description,
            distance: parseFloat(distance.toFixed(1)),
            duration: duration,
            target_heart_rate: {
              min: 120,
              max: 150,
              zone: "Strefa 2 (Łatwe tempo)"
            },
            support_exercises: [
              {
                name: "Rozciąganie mięśni nóg",
                sets: 2,
                reps: null,
                duration: 30
              },
              {
                name: "Wzmacnianie core",
                sets: 2,
                reps: 10,
                duration: null
              }
            ]
          }
        };
      });
      
      planWeeks.push({
        week_num: weekNum,
        focus: focus,
        days: days
      });
    }

    // Upewnij się, że treningoweDni jest zdefiniowane również tutaj dla metadanych
    const finalTreningoweDni = currentData.dniTreningowe || ["poniedziałek", "środa", "sobota"];

    return {
      id: `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      metadata: {
        discipline: "running",
        target_group: poziomZaawansowania === "poczatkujacy" ? "Biegacze początkujący" : 
                     poziomZaawansowania === "sredniozaawansowany" ? "Biegacze średniozaawansowani" : 
                     "Biegacze zaawansowani", 
        target_goal: currentData.glownyCel || "poprawa_kondycji", 
        level_hint: poziomZaawansowania, 
        days_per_week: finalTreningoweDni.length.toString(), 
        duration_weeks: planDuration, 
        description: `Plan treningowy dla ${imieNazwisko} (wygenerowany awaryjnie)`,
        author: "RunFitting AI"
      },
      plan_weeks: planWeeks,
      corrective_exercises: {
        frequency: "Nie dotyczy - brak zgłoszonych kontuzji",
        list: []
      },
      pain_monitoring: {
        scale: "0-10",
        rules: ["Przerwij trening przy bólu powyżej 5/10", "Skonsultuj się z lekarzem przy utrzymującym się bólu"]
      },
      notes: [
        "Dostosuj plan do swoich możliwości",
        "Pamiętaj o nawodnieniu przed, w trakcie i po treningu",
        "Rozgrzewka i rozciąganie są niezbędnymi elementami każdego treningu",
        "Monitoruj swoje postępy",
        "Odpoczynek jest równie ważny jak trening",
        "Ten plan jest planem awaryjnym i może wymagać dostosowania",
        "W przypadku kontuzji lub bólu skonsultuj się z lekarzem"
      ]
    };
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
}

module.exports = GeminiService;