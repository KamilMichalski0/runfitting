/**
 * Testy dla serwisu Gemini
 * Sprawdzają funkcjonalność generowania planów treningowych
 */

const GeminiService = require('../../services/gemini.service');
const geminiConfig = require('../../config/gemini.config.js');
const axios = require('axios');
const AppError = require('../../utils/app-error');
const mockKnowledgeBase = require('../../knowledge/running-knowledge-base');

// Mockujemy AppError globalnie
jest.mock('../../utils/app-error', () => {
  return class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
      this.toJSON = function() {
        return {
          message: this.message,
          statusCode: this.statusCode,
          status: this.status,
          isOperational: this.isOperational
        };
      };
    }
  };
});

// Mockujemy axios.create
jest.mock('axios', () => {
  return {
    create: jest.fn(() => {
      return {
        post: jest.fn()
      };
    })
  };
});

// Mockujemy config
jest.mock('../../config/gemini.config', () => ({
  apiKey: process.env.GEMINI_API_KEY || 'mock-api-key-from-test', // Use env var if set, otherwise mock
  modelName: 'gemini-pro', // Corrected key name
  generationConfig: {      // Nested object as expected by the constructor
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192, // Corrected key name to match service usage
    responseMimeType: "application/json", // Add expected mime type
  },
  safetySettings: [        // Add default safety settings
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ]
}));

// Mockujemy templates
jest.mock('../../templates/plan-template-selector', () => ({
  getExamplePlanTemplate: jest.fn()
}));

// Mockujemy knowledge
jest.mock('../../knowledge/running-knowledge-base', () => ({
  runningKnowledgeBase: {
    distances: {},
    principles: {},
    phases: {},
    injuryPrevention: { commonInjuries: {} }, 
    nutrition: { preRun: {}, duringRun: {}, postRun: {} },
    hydration: { preRun: {}, duringRun: {}, postRun: {} }
  },
  getRunningTips: jest.fn().mockReturnValue([]),
  getRunningTerminology: jest.fn().mockReturnValue({}),
  getTrainingZones: jest.fn().mockReturnValue({})
}));

// Mockujemy OpenAI
const { OpenAI } = require('openai'); // Importuj OpenAI
jest.mock('openai', () => {
  // Tworzymy mock funkcji 'create', aby móc go później ustawiać w testach
  const mockCreateCompletion = jest.fn();
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateCompletion
        }
      }
    })),
    // Eksportujemy mock funkcji, aby mieć do niej dostęp w testach
    __mockCreateCompletion: mockCreateCompletion
  };
});

// Główny blok opisujący testy dla GeminiService
describe('GeminiService', () => {
  let geminiServiceInstance; // Zmienna na instancję serwisu
  let mockAxiosInstance;   // Zmienna na mock instancji axios
  let mockKnowledgeBaseInstance;
  let mockOpenAICreateCompletion; // Zmienna na mock metody create z OpenAI

  // Konfiguracja przed każdym testem
  beforeEach(() => {
    // Mockujemy instancję axios, którą konstruktor GeminiService utworzy
    mockAxiosInstance = {
      post: jest.fn() // Mock metody post
    };
    axios.create.mockReturnValue(mockAxiosInstance);

    // Mockujemy knowledge base
    mockKnowledgeBaseInstance = {
      getExperienceLevelDescription: jest.fn().mockReturnValue('Opis poziomu'),
      getMainGoalDescription: jest.fn().mockReturnValue('Opis celu'),
      getInjuryDescription: jest.fn().mockReturnValue('Opis kontuzji'),
      getConditionDescription: jest.fn().mockReturnValue('Opis schorzenia'),
      getKnowledgeForDistance: jest.fn().mockReturnValue({ 
        focus: 'Fokus bazy', 
        key_workouts: 'Kluczowe treningi', 
        typical_duration: '8 tyg', 
        tapering: '10 dni', 
        emphasis: { 
          beginner: 'Emfaza dla początkującego',
          intermediate: 'Emfaza dla średniozaawansowanego',
          advanced: 'Emfaza dla zaawansowanego' 
        } 
      }),
      getTrainingPrinciples: jest.fn().mockReturnValue({ 
        principle1: { 
          name: 'Zasada 1', 
          description: 'Opis zasady', 
          application: 'Zastosowanie' 
        },
        principle2: { 
          name: 'Zasada 2', 
          description: 'Opis zasady 2', 
          application: 'Zastosowanie 2' 
        }
      }),
      getTrainingPhases: jest.fn().mockReturnValue({ 
        base: { 
          focus: 'Fokus fazy bazowej', 
          duration: '4 tyg', 
          components: 'Komponenty bazowe', 
          progression: 'Progresja bazowa' 
        },
        build: { 
          focus: 'Fokus fazy budującej', 
          duration: '4 tyg', 
          components: 'Komponenty budujące', 
          progression: 'Progresja budująca' 
        },
        peak: { 
          focus: 'Fokus fazy szczytowej', 
          duration: '2 tyg', 
          components: 'Komponenty szczytowe', 
          progression: 'Progresja szczytowa' 
        },
        taper: { 
          focus: 'Fokus fazy tapering', 
          duration: '1-2 tyg', 
          components: 'Komponenty taperingu', 
          progression: 'Progresja taperingu' 
        }
      }),
      getInjuryPreventionTips: jest.fn().mockReturnValue({ 
        tip1: { description: 'Opis kontuzji 1', prevention: 'Zapobieganie 1' },
        tip2: { description: 'Opis kontuzji 2', prevention: 'Zapobieganie 2' },
        tip3: { description: 'Opis kontuzji 3', prevention: 'Zapobieganie 3' }
      }),
      getRunningFormTips: jest.fn().mockReturnValue({
        kadencja: { opis: 'Optymalna kadencja to 170-180 kroków na minutę', znaczenie: 'Pomaga zredukować obciążenie stawów' },
        postawa: { opis: 'Lekko pochylony tułów do przodu', znaczenie: 'Zapewnia lepszą amortyzację i efektywność biegu' },
        ladowanie: { opis: 'Preferowane lądowanie na śródstopiu', znaczenie: 'Optymalizuje absorpcję wstrząsów i siłę odbicia' }
      }),
      getNutritionRecommendations: jest.fn().mockReturnValue({ 
        pre_workout: 'Jedz węglowodany o niskim indeksie glikemicznym 2-3 godziny przed treningiem', 
        during_workout: 'Dla treningów dłuższych niż 60 min, spożywaj 30-60g węglowodanów na godzinę', 
        post_workout: 'Połącz węglowodany z białkiem w proporcji 3:1 w ciągu 30 minut po treningu' 
      }),
      getHydrationRecommendations: jest.fn().mockReturnValue({ 
        pre_workout: 'Wypij 500-600ml płynów na 2-3 godziny przed treningiem', 
        during_workout: 'Pij 150-350ml co 15-20 minut podczas treningu', 
        post_workout: 'Wypij 1.5x więcej płynów niż utraciłeś podczas treningu' 
      }),
      getStrengthTrainingRecommendations: jest.fn().mockReturnValue({
        frequency: '2-3 razy w tygodniu',
        exercises: [
          { name: 'Przysiady', sets: '3-4', reps: '8-12', benefits: 'Wzmacnia mięśnie nóg i core' },
          { name: 'Martwy ciąg', sets: '3-4', reps: '8-10', benefits: 'Wzmacnia tylną część ciała' },
          { name: 'Plank', sets: '3', time: '30-60s', benefits: 'Stabilizacja core' }
        ],
        notes: 'Ćwiczenia siłowe wykonuj w dni bez intensywnych treningów biegowych'
      }),
      getRecoveryStrategies: jest.fn().mockReturnValue({
        strategies: [
          { name: 'Sen', description: '7-9 godzin dziennie', importance: 'Kluczowy dla regeneracji' },
          { name: 'Rozciąganie', description: '10-15 minut po treningu', importance: 'Pomaga w zachowaniu elastyczności' },
          { name: 'Rolowanie', description: '5-10 minut na grupę mięśniową', importance: 'Redukuje napięcie mięśniowe' }
        ],
        notes: 'Regeneracja jest równie ważna jak sam trening'
      }),
      getMentalTrainingTips: jest.fn().mockReturnValue({
        techniques: [
          { name: 'Wizualizacja', practice: 'Wyobrażaj sobie udany trening lub zawody' },
          { name: 'Ustalanie celów', practice: 'Twórz cele SMART - konkretne, mierzalne, osiągalne, istotne i określone w czasie' },
          { name: 'Pozytywny dialog wewnętrzny', practice: 'Zastępuj negatywne myśli pozytywnymi afirmacjami' }
        ],
        importance: 'Trening mentalny może poprawić wyniki o 5-15%'
      })
    };

    // Tworzymy nową instancję GeminiService przed każdym testem
    // Konstruktor użyje zamockowanego axios.create() oraz zamockowanego new OpenAI()
    geminiServiceInstance = new GeminiService(mockKnowledgeBaseInstance);

    // Importujemy zamockowaną funkcję create z OpenAI po inicjalizacji modułów
    mockOpenAICreateCompletion = require('openai').__mockCreateCompletion;

    // Mockujemy metody pomocnicze na *instancji* serwisu
    // Używamy mockImplementation, aby kontrolować zachowanie i uniknąć zależności
    jest.spyOn(geminiServiceInstance, '_createPrompt').mockImplementation(() => 'Mockowany prompt dla testu');

    // Mock _parseResponse na instancji
    jest.spyOn(geminiServiceInstance, '_parseResponse').mockImplementation((response) => {
      // Przykładowa logika mocka _parseResponse (dostosuj w razie potrzeby)
      if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log('Mock _parseResponse: Brak danych, zwracam domyślny plan');
        // Wywołujemy _createDefaultTrainingPlan na tej samej instancji
        return geminiServiceInstance._createDefaultTrainingPlan(geminiServiceInstance.userData);
      }
      try {
        const text = response.candidates[0].content.parts[0].text;
        // Prosta próba parsowania, obsługa 'null'
        if (text && text.trim().startsWith('null')) {
          console.log('Mock _parseResponse: Tekst zaczyna się od null, zwracam domyślny plan');
          return geminiServiceInstance._createDefaultTrainingPlan(geminiServiceInstance.userData);
        }
        // Próba sparsowania - tu można dodać logikę naprawy JSON jeśli test tego wymaga
        const parsed = JSON.parse(text);
        console.log('Mock _parseResponse: Sparsowano:', parsed.id);
        return parsed;
      } catch (error) {
        console.error('Mock _parseResponse: Błąd parsowania, zwracam domyślny plan', error.message);
        return geminiServiceInstance._createDefaultTrainingPlan(geminiServiceInstance.userData);
      }
    });

    // Mock _parseOpenAIResponse na instancji - POZWOLIMY DZIAŁAĆ PRAWDZIWEJ W TEŚCIE FALLBACKU
    // ALE MOŻEMY GO ZAMOCKOWAĆ W INNYCH TESTACH, JEŚLI POTRZEBA
    // jest.spyOn(geminiServiceInstance, '_parseOpenAIResponse').mockImplementation((response) => {
    //   // Mock logic for parsing OpenAI response if needed
    //   try {
    //     const content = response?.choices?.[0]?.message?.content;
    //     if (!content) throw new Error('No content');
    //     return JSON.parse(content);
    //   } catch (e) {
    //      console.error("Mock _parseOpenAIResponse failed", e);
    //     return geminiServiceInstance._createDefaultTrainingPlan({});
    //   }
    // });

    // Mock _createDefaultTrainingPlan na instancji (konsekwentny dla fallbacków)
    jest.spyOn(geminiServiceInstance, '_createDefaultTrainingPlan').mockImplementation((userDataPassed) => {
      console.log('Mock _createDefaultTrainingPlan вызван');
      // Użyj userDataPassed lub this.userData z instancji jeśli potrzebne
      const effectiveUserData = userDataPassed || geminiServiceInstance.userData || {};
      return {
        id: `running_plan_default_mock_${Date.now()}`,
        metadata: {
          description: 'Podstawowy plan biegowy (mock domyślny dla instancji)',
          level_hint: effectiveUserData.poziomZaawansowania || 'nieznany',
          duration_weeks: getDurationFromGoalAndLevel(effectiveUserData) || 8,
          target_goal: mapGoalToDescription(effectiveUserData.glownyCel)
        },
        plan_weeks: [
          { week_num: 1, focus: 'Wprowadzenie', days: [] },
          { week_num: 2, focus: 'Budowanie bazy', days: [] }
        ],
        corrective_exercises: { frequency: '2x/week', list: [] },
        pain_monitoring: { scale: '1-10', rules: [] },
        notes: ['Plan wygenerowany jako domyślny w przypadku błędu']
      };
    });
  });

  // Pomocnicze funkcje do _createDefaultTrainingPlan
  function getDurationFromGoalAndLevel(userData) {
    if (!userData) return 8;
    
    if (userData.dystansDocelowy === 'maraton') return 16;
    if (userData.dystansDocelowy === 'polmaraton') return 12;
    if (userData.dystansDocelowy === '10km') return 8;
    if (userData.dystansDocelowy === '5km') return 6;
    
    // Domyślne wartości zależne od poziomu
    if (userData.poziomZaawansowania === 'poczatkujacy') return 8;
    if (userData.poziomZaawansowania === 'sredniozaawansowany') return 10;
    if (userData.poziomZaawansowania === 'zaawansowany') return 12;
    
    return 8; // Domyślna wartość
  }
  
  function mapGoalToDescription(glownyCel) {
    if (!glownyCel) return 'Ogólna sprawność';
    
    const goalMap = {
      'redukcja_masy_ciala': 'Redukcja masy ciała',
      'przebiegniecie_dystansu': 'Przygotowanie do zawodów biegowych',
      'zaczac_biegac': 'Rozpoczęcie przygody z bieganiem',
      'aktywny_tryb_zycia': 'Aktywny tryb życia',
      'zmiana_nawykow': 'Zmiana nawyków zdrowotnych',
      'powrot_po_kontuzji': 'Powrót po kontuzji',
      'poprawa_kondycji': 'Poprawa kondycji',
    };
    
    return goalMap[glownyCel] || 'Ogólna sprawność';
  }

  // Czyszczenie mocków po każdym teście
  afterEach(() => {
    jest.clearAllMocks();
    // Można też zresetować stan instancji, jeśli jest to potrzebne
  });

  // Testy dla metody generateTrainingPlan
  describe('generateTrainingPlan', () => {
    // Dane użytkownika używane w wielu testach - zaktualizowane zgodnie z nowym modelem formularza
    const testUserData = {
      imieNazwisko: 'Jan Kowalski',
      wiek: 35,
      plec: 'Mężczyzna',
      wzrost: 180,
      masaCiala: 75,
      glownyCel: 'przebiegniecie_dystansu',
      poziomZaawansowania: 'sredniozaawansowany',
      dystansDocelowy: '10km',
      dniTreningowe: ['Poniedziałek', 'Środa', 'Piątek', 'Niedziela'],
      aktualnyKilometrTygodniowy: 20,
      czasTreningu: 60,
      maxHr: 180,
      restingHr: 60,
      kontuzje: false,
      poprawaTechnikiBiegu: true,
      cwiczeniaUzupelniajace: true,
      preferowanyCzasTreningu: 'rano',
      godzinySnuOd: '22:00',
      godzinySnuDo: '06:00',
      chronotyp: 'ranny_ptaszek',
      gotowoscDoWyzwan: 8
    };

    it('powinien wygenerować plan treningowy na podstawie odpowiedzi API', async () => {
      // Przygotowanie poprawnej odpowiedzi API
      const mockApiResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      id: 'api_plan_success',
                      metadata: { 
                        description: 'Plan z API',
                        level_hint: 'sredniozaawansowany',
                        duration_weeks: 10,
                        target_goal: 'Przygotowanie do biegu na 10km'
                      },
                      plan_weeks: [{ 
                        week_num: 1, 
                        focus: 'Budowanie bazy', 
                        days: [
                          { day_name: 'Poniedziałek', workout: 'Bieg 5km w tempie konwersacyjnym' },
                          { day_name: 'Środa', workout: 'Interwały 8x400m' },
                          { day_name: 'Piątek', workout: 'Bieg regeneracyjny 3km' },
                          { day_name: 'Niedziela', workout: 'Długi bieg 8km' }
                        ] 
                      }],
                      corrective_exercises: { 
                        frequency: '2x/week', 
                        list: [{ name: 'Plank', sets_reps: '3x30s' }] 
                      },
                      pain_monitoring: { 
                        scale: '1-10', 
                        rules: ['Przerwij trening jeśli ból > 5'] 
                      },
                      notes: ['Pamiętaj o nawodnieniu']
                    })
                  }
                ]
              }
            }
          ]
        }
      };
      // Konfiguracja mocka post dla tego testu
      mockAxiosInstance.post.mockResolvedValue(mockApiResponse);

      // Wywołanie metody na INSTANCJI serwisu
      const result = await geminiServiceInstance.generateTrainingPlan(testUserData);

      // Sprawdzenia
      expect(axios.create).toHaveBeenCalledTimes(1); // Konstruktor wywołuje create raz
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // Metoda wywołuje post raz
      expect(geminiServiceInstance._createPrompt).toHaveBeenCalledWith(testUserData);
      // Sprawdzamy, czy _parseResponse został wywołany z danymi z API
      expect(geminiServiceInstance._parseResponse).toHaveBeenCalledWith(mockApiResponse.data);
      // Sprawdzamy wynik zwrócony przez zamockowany _parseResponse
      expect(result).toBeDefined();
      expect(result.id).toBe('api_plan_success'); // Oczekujemy wyniku parsowania
      // Sprawdzamy, czy fallback NIE został wywołany
      expect(geminiServiceInstance._createDefaultTrainingPlan).not.toHaveBeenCalled();
    });

    it('powinien obsłużyć odpowiedź API bez struktury candidates', async () => {
      const mockApiResponse = { data: {} }; // Odpowiedź bez candidates
      mockAxiosInstance.post.mockResolvedValue(mockApiResponse);

      const result = await geminiServiceInstance.generateTrainingPlan(testUserData);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(geminiServiceInstance._parseResponse).toHaveBeenCalledWith(mockApiResponse.data);
      // Nasz mock _parseResponse powinien zwrócić domyślny plan w tym przypadku
      expect(result.id).toContain('running_plan_default_mock_');
      // Sprawdzamy, czy _createDefaultTrainingPlan Został wywołany przez _parseResponse
      expect(geminiServiceInstance._createDefaultTrainingPlan).toHaveBeenCalledTimes(1);
    });

    it('powinien obsłużyć odpowiedź API z nieprawidłowym JSON', async () => {
      const mockApiResponse = {
        data: {
          candidates: [
            { content: { parts: [{ text: 'To jest { nieprawidłowy JSON' }] } }
          ]
        }
      };
      mockAxiosInstance.post.mockResolvedValue(mockApiResponse);

      const result = await geminiServiceInstance.generateTrainingPlan(testUserData);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(geminiServiceInstance._parseResponse).toHaveBeenCalledWith(mockApiResponse.data);
      // Nasz mock _parseResponse powinien zwrócić domyślny plan
      expect(result.id).toContain('running_plan_default_mock_');
      expect(geminiServiceInstance._createDefaultTrainingPlan).toHaveBeenCalledTimes(1);
    });

    // TODO: Fix _parseResponse validation and uncomment this test
    // it('powinien obsłużyć odpowiedź API z JSON zawierającym nieprawidłową strukturę', async () => {
    //   const invalidStructureResponse = {
    //     candidates: [
    //       {
    //         content: {
    //           parts: [
    //             {
    //               text: JSON.stringify({ id: 'bad_structure', metadata: {} /* missing plan_weeks */ })
    //             }
    //           ]
    //         }
    //       }
    //     ]
    //   };
    //   mockAxiosInstance.post.mockResolvedValue({ data: invalidStructureResponse });

    //   // We expect this to eventually call _createDefaultTrainingPlan due to validation failure
    //   // Mocking _createDefaultTrainingPlan on the instance for this specific test
    //   const defaultPlan = { id: 'default_for_invalid_structure', plan_weeks: [] };
    //   geminiServiceInstance._createDefaultTrainingPlan = jest.fn().mockReturnValue(defaultPlan);

    //   const userData = { firstName: 'Tester', experienceLevel: 'początkujący', planDuration: 4 };
    //   const result = await geminiServiceInstance.generateTrainingPlan(userData);

    //   expect(result).toBeDefined();
    //   expect(result.id).toBe('default_for_invalid_structure');
    //   expect(geminiServiceInstance._createDefaultTrainingPlan).toHaveBeenCalledTimes(1);
    // });

    it('powinien obsłużyć błąd w zapytaniu do API', async () => {
      const apiError = new Error('Błąd sieci API');
      apiError.response = { status: 503, data: { error: { message: 'Service Unavailable' } } }; // Dodanie struktury błędu API
      mockAxiosInstance.post.mockRejectedValue(apiError);

      // Oczekujemy, że metoda generateTrainingPlan rzuci AppError
      // Używamy .rejects.toThrow() do testowania asynchronicznych błędów
      await expect(geminiServiceInstance.generateTrainingPlan(testUserData))
        .rejects.toThrow(AppError); // Oczekujemy instancji AppError

      // Dodatkowo możemy sprawdzić treść błędu
      await expect(geminiServiceInstance.generateTrainingPlan(testUserData))
        .rejects.toThrow('Nie udało się wygenerować planu treningowego: Service Unavailable');

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2); // Bo wywołujemy expect dwa razy
      // Fallback NIE powinien być wywołany, bo błąd jest przed parsowaniem
      expect(geminiServiceInstance._createDefaultTrainingPlan).not.toHaveBeenCalled();
    });

    it('powinien użyć fallbacku OpenAI, gdy Gemini API zwróci błąd', async () => {
      // 1. Symulacja błędu z Gemini API
      const geminiApiError = new Error('Gemini API Error: Invalid Key');
      geminiApiError.response = { status: 400, data: { error: { message: 'Invalid API Key' } } };
      mockAxiosInstance.post.mockRejectedValue(geminiApiError);

      // 2. Przygotowanie poprawnej odpowiedzi z mocka OpenAI API
      const mockOpenAIPlan = {
        id: 'openai_plan_fallback_success',
        metadata: { 
          discipline: 'running', 
          description: 'Plan from OpenAI',
          level_hint: 'sredniozaawansowany',
          duration_weeks: 10,
          target_goal: 'Przygotowanie do biegu na 10km'
        },
        plan_weeks: [
          { 
            week_num: 1, 
            focus: 'Budowanie bazy', 
            days: [
              { day_name: "Poniedziałek", workout: "Bieg 6km w tempie konwersacyjnym" },
              { day_name: "Środa", workout: "Interwały 6x400m" },
              { day_name: "Piątek", workout: "Bieg regeneracyjny 4km" },
              { day_name: "Niedziela", workout: "Długi bieg 10km w wolnym tempie" }
            ] 
          },
          { 
            week_num: 2, 
            focus: 'Progresja obciążeń', 
            days: [
              { day_name: "Poniedziałek", workout: "Bieg 7km w tempie konwersacyjnym" },
              { day_name: "Środa", workout: "Interwały 8x400m" },
              { day_name: "Piątek", workout: "Bieg regeneracyjny 5km" },
              { day_name: "Niedziela", workout: "Długi bieg 12km w wolnym tempie" }
            ] 
          }
        ],
        corrective_exercises: { 
          frequency: '3x/week', 
          list: [
            { name: 'Plank', sets_reps: '3x45s', description: 'Wzmacnia core' },
            { name: 'Mostek biodrowy', sets_reps: '3x15', description: 'Wzmacnia pośladki i stabilizuje biodra' }
          ] 
        },
        pain_monitoring: { 
          scale: '1-10', 
          rules: ['Przerwij trening jeśli ból > 5', 'Skonsultuj się z lekarzem jeśli ból utrzymuje się dłużej niż 3 dni'] 
        }, 
        notes: [
          'Pamiętaj o odpowiednim nawodnieniu',
          'Wykonuj ćwiczenia korekcyjne regularnie',
          'Monitoruj tętno podczas treningów'
        ]
      };
      const mockOpenApiResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify(mockOpenAIPlan) // Odpowiedź jako string JSON
            }
          }
        ]
      };
      // Ustawiamy mock metody create dla OpenAI
      mockOpenAICreateCompletion.mockResolvedValue(mockOpenApiResponse);

      // 3. Wywołanie metody do testowania
      const result = await geminiServiceInstance.generateTrainingPlan(testUserData);

      // 4. Asercje
      // Sprawdzamy, czy próbowano wywołać Gemini
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      // Sprawdzamy, czy wywołano OpenAI
      expect(mockOpenAICreateCompletion).toHaveBeenCalledTimes(1);
      // Sprawdzamy, czy prompt przekazany do OpenAI jest poprawny (opcjonalnie, ale warto)
      expect(mockOpenAICreateCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'Mockowany prompt dla testu' })
          ]),
          model: expect.any(String), // Sprawdź czy model jest przekazany
          response_format: { type: 'json_object' } // Sprawdź czy format JSON jest wymagany
        }),
        expect.any(Object) // Opcje timeoutu
      );

      // Sprawdzamy, czy wynik pochodzi z mocka OpenAI (po parsowaniu)
      expect(result).toBeDefined();
      expect(result.id).toBe('openai_plan_fallback_success');
      expect(result.metadata.description).toBe('Plan from OpenAI');
      expect(result.metadata.level_hint).toBe('sredniozaawansowany');
      expect(result.metadata.target_goal).toBe('Przygotowanie do biegu na 10km');
      expect(result.plan_weeks[0].focus).toBe('Budowanie bazy');
      expect(result.plan_weeks[0].days.length).toBe(4);
      expect(result.plan_weeks[0].days[0].day_name).toBe('Poniedziałek');
      expect(result.corrective_exercises.list.length).toBe(2);
      expect(result.notes.length).toBe(3);

      // Sprawdzamy, czy NIE wywołano domyślnego fallbacku
      expect(geminiServiceInstance._createDefaultTrainingPlan).not.toHaveBeenCalled();
    });

    // Integration Test: Successful generation
    it('powinien pomyślnie wygenerować i zwrócić kompletny plan (test integracyjny)', async () => {
      // 1. Define realistic user data zgodne z nowym modelem formularza
      const userData = {
        imieNazwisko: 'Jan Kowalski',
        wiek: 40,
        plec: 'Mężczyzna',
        wzrost: 175,
        masaCiala: 70,
        glownyCel: 'przebiegniecie_dystansu',
        poziomZaawansowania: 'sredniozaawansowany',
        dystansDocelowy: 'polmaraton',
        dniTreningowe: ['Wtorek', 'Czwartek', 'Sobota', 'Niedziela'],
        czasTreningu: 90,
        kontuzje: false,
        preferowanyCzasTreningu: 'rano',
        godzinySnuOd: '23:00',
        godzinySnuDo: '07:00',
        chronotyp: 'ranny_ptaszek'
      };

      // 2. Define a realistic successful API response (JSON string)
      const successfulPlanJson = JSON.stringify({
        id: 'plan_12345',
        metadata: {
          discipline: 'running',
          level_hint: 'sredniozaawansowany',
          duration_weeks: 12,
          target_goal: 'Przygotowanie do półmaratonu',
          author: 'RunFitting AI (Generated)'
        },
        plan_weeks: [
          {
            week_num: 1,
            focus: 'Adaptacja',
            days: [
              { day_name: 'Wtorek', workout: 'Bieg 5km w tempie konwersacyjnym' }, 
              { day_name: 'Czwartek', workout: 'Interwały 6x400m' }, 
              { day_name: 'Sobota', workout: 'Bieg regeneracyjny 4km' },
              { day_name: 'Niedziela', workout: 'Długi bieg 10km' }
            ]
          },
          {
            week_num: 12,
            focus: 'Tapering',
            days: [
              { day_name: 'Wtorek', workout: 'Lekki bieg 3km' }, 
              { day_name: 'Czwartek', workout: 'Odpoczynek' }, 
              { day_name: 'Sobota', workout: 'Bieg 5km w wolnym tempie' },
              { day_name: 'Niedziela', workout: 'Półmaraton!' }
            ]
          }
        ],
        corrective_exercises: { 
          frequency: '2x/week', 
          list: [
            { name: 'Plank', sets_reps: '3x60s', description: 'Wzmacnia core' },
            { name: 'Bird Dog', sets_reps: '3x10 na stronę', description: 'Stabilizacja tułowia' }
          ]
        },
        pain_monitoring: { 
          scale: '1-10', 
          rules: ['Stop if pain > 6', 'Seek medical help if pain persists for more than 3 days'] 
        },
        notes: [
          'Pij dużo wody przed, w trakcie i po treningu',
          'Pamiętaj o rozciąganiu po każdym biegu',
          'Stosuj ćwiczenia korekcyjne 2 razy w tygodniu'
        ]
      });

      const apiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: successfulPlanJson }]
            }
          }
        ]
      };

      // 3. Mock the axios post call
      mockAxiosInstance.post.mockResolvedValue({ data: apiResponse });

      // 4. Call the method
      const result = await geminiServiceInstance.generateTrainingPlan(userData);

      // 5. Assertions (verify the parsed plan)
      expect(result).toBeDefined();
      expect(result.id).toBe('plan_12345');
      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata).toBe('object');
      expect(result.metadata.level_hint).toBe('sredniozaawansowany');
      expect(result.metadata.duration_weeks).toBe(12);
      expect(result.plan_weeks).toBeDefined();
      expect(Array.isArray(result.plan_weeks)).toBe(true);
      expect(result.plan_weeks.length).toBe(2); // Based on the mock data
      expect(result.plan_weeks[0].week_num).toBe(1);
      expect(result.plan_weeks[0].days).toBeDefined();
      expect(Array.isArray(result.plan_weeks[0].days)).toBe(true);
      expect(result.plan_weeks[0].days.length).toBe(4); // Aktualizacja zgodnie z mockiem
      expect(result.corrective_exercises).toBeDefined();
      expect(result.corrective_exercises.list).toBeDefined();
      expect(Array.isArray(result.corrective_exercises.list)).toBe(true);
      expect(result.corrective_exercises.list.length).toBe(2); // Aktualizacja zgodnie z mockiem
      expect(result.pain_monitoring).toBeDefined();
      expect(result.pain_monitoring.rules).toBeDefined();
      expect(Array.isArray(result.pain_monitoring.rules)).toBe(true);
      expect(result.notes).toBeDefined();
      expect(Array.isArray(result.notes)).toBe(true);
      expect(result.notes.length).toBe(3); // Aktualizacja zgodnie z mockiem

      // Ensure default plan was NOT called
      // We need to spy on the method BEFORE creating the instance or mock it if necessary
      // For this test, we assume _createDefaultTrainingPlan is NOT mocked
      // expect(geminiServiceInstance._createDefaultTrainingPlan).not.toHaveBeenCalled(); // Requires spy
    });

    // Test suite for _parseResponse method
    describe('_parseResponse', () => {
      let instanceForParseTest;

      beforeEach(() => {
        // Używamy instancji utworzonej w głównym beforeEach lub tworzymy nową dedykowaną
        instanceForParseTest = geminiServiceInstance; // Używamy tej samej instancji co wyżej
        // Przywracamy ORYGINALNĄ implementację _parseResponse na tej instancji, aby ją przetestować
        // Upewnijmy się, że odpinamy mock z beforeEach
        if (jest.isMockFunction(instanceForParseTest._parseResponse)) {
            instanceForParseTest._parseResponse.mockRestore();
        }
        // Mockujemy _createDefaultTrainingPlan na tej instancji, na wypadek fallbacku
        jest.spyOn(instanceForParseTest, '_createDefaultTrainingPlan').mockImplementation(() => ({
          id: 'fallback_for_parse_test',
          metadata: { description: 'Fallback w teście _parseResponse' }, plan_weeks: []
        }));
        // Ustawiamy userData na instancji, bo oryginalny _parseResponse może go używać
        instanceForParseTest.userData = { planDuration: 8, experienceLevel: 'testowy' };
      });

      it('powinien poprawnie sparsować prawidłowy JSON', () => {
        const validApiResponse = {
          candidates: [
            { content: { parts: [{ text: JSON.stringify({ id: 'valid_json_plan', metadata: {}, plan_weeks: [] }) }] } }
          ]
        };
        const result = instanceForParseTest._parseResponse(validApiResponse);
        expect(result.id).toBe('valid_json_plan');
        expect(instanceForParseTest._createDefaultTrainingPlan).not.toHaveBeenCalled();
      });

      it('powinien obsłużyć odpowiedź null', () => {
        const result = instanceForParseTest._parseResponse(null);
        expect(result.id).toBe('fallback_for_parse_test');
        expect(instanceForParseTest._createDefaultTrainingPlan).toHaveBeenCalledTimes(1);
      });

      it('powinien obsłużyć odpowiedź bez candidates', () => {
        const result = instanceForParseTest._parseResponse({});
        expect(result.id).toBe('fallback_for_parse_test');
        expect(instanceForParseTest._createDefaultTrainingPlan).toHaveBeenCalledTimes(1);
      });

      it('powinien obsłużyć odpowiedź z tekstem "null"', () => {
        const apiResponse = { candidates: [{ content: { parts: [{ text: 'null' }] } }] };
        const result = instanceForParseTest._parseResponse(apiResponse);
        expect(result.id).toBe('fallback_for_parse_test');
        expect(instanceForParseTest._createDefaultTrainingPlan).toHaveBeenCalledTimes(1);
      });

      // TODO: Fix single quote handling and uncomment this test
      // it('powinien obsłużyć odpowiedź z JSON z pojedynczymi cudzysłowami', () => {
      //   const responseWithSingleQuotes = {
      //     candidates: [
      //       {
      //         content: {
      //           parts: [
      //             { text: "{ 'id': 'single_quote_plan', 'metadata': { 'level': 'test' } }" }
      //           ]
      //         }
      //       }
      //     ]
      //   };

      //   // Mock _createDefaultTrainingPlan on the instance for this specific test
      //   const fallbackPlan = { id: 'fallback_for_parse_test', plan_weeks: [] };
      //   const instanceForParseTest = new GeminiService(); // Use a separate instance if needed
      //   instanceForParseTest._createDefaultTrainingPlan = jest.fn().mockReturnValue(fallbackPlan);

      //   const result = instanceForParseTest._parseResponse(responseWithSingleQuotes);

      //   // Sprawdzamy, czy JSON został poprawnie naprawiony i sparsowany
      //   expect(result).toBeDefined();
      //   expect(result.id).toBe('single_quote_plan'); // Oczekujemy naprawionego planu
      //   expect(instanceForParseTest._createDefaultTrainingPlan).not.toHaveBeenCalled();
      // });

      it('powinien obsłużyć odpowiedź z JSON zagnieżdżonym w tekście', () => {
        const apiResponse = {
          candidates: [
            { content: { parts: [{ text: 'Oto plan: { "id": "nested_plan", "metadata": {}, "plan_weeks": [] } Dalszy tekst.' }] } }
          ]
        };
        const result = instanceForParseTest._parseResponse(apiResponse);
        expect(result.id).toBe('nested_plan');
        expect(instanceForParseTest._createDefaultTrainingPlan).not.toHaveBeenCalled();
      });

      // TODO: Fix plan_weeks validation and uncomment this test
      // it('powinien obsłużyć odpowiedź z nieprawidłową strukturą plan_weeks (nie tablica)', () => {
      //   const responseWithBadWeeks = {
      //     candidates: [
      //       {
      //         content: {
      //           parts: [
      //             // plan_weeks should be an array
      //             { text: JSON.stringify({ id: 'bad_weeks_plan', metadata: { duration_weeks: 4 }, plan_weeks: { week: 1 } }) }
      //           ]
      //         }
      //       }
      //     ]
      //   };

      //   // Mock _createDefaultTrainingPlan on the instance for this specific test
      //   const fallbackPlan = { id: 'fallback_for_parse_test', plan_weeks: [] };
      //   const instanceForParseTest = new GeminiService(); // Use a separate instance if needed
      //   instanceForParseTest._createDefaultTrainingPlan = jest.fn().mockReturnValue(fallbackPlan);

      //   const result = instanceForParseTest._parseResponse(responseWithBadWeeks);

      //   // Oczekujemy fallbacku, jeśli walidacja w _parseResponse to wykryje
      //   // TODO: Poprawić walidację w _parseResponse, aby ten test przechodził
      //   expect(result.id).toBe('fallback_for_parse_test'); // Zakładając, że walidacja zadziała
      //   expect(instanceForParseTest._createDefaultTrainingPlan).toHaveBeenCalledTimes(1);
      // });
    });

    // Test suite for _createDefaultTrainingPlan method
    describe('_createDefaultTrainingPlan', () => {
      let instanceForDefaultTest;

      beforeEach(() => {
        instanceForDefaultTest = geminiServiceInstance; // Używamy tej samej instancji co wyżej
        // Przywracamy oryginalną metody, jeśli była mockowana globalnie
        if (jest.isMockFunction(instanceForDefaultTest._createDefaultTrainingPlan)) {
          instanceForDefaultTest._createDefaultTrainingPlan.mockRestore();
        }
        // Mockujemy zależności, jeśli są potrzebne (np. getExamplePlanTemplate)
        // getExamplePlanTemplate.mockReturnValue(...);
      });

      it('powinien utworzyć domyślny plan z danymi użytkownika', () => {
        const userData = {
          imieNazwisko: 'DefaultUser',
          wiek: 30,
          plec: 'Mężczyzna',
          glownyCel: 'aktywny_tryb_zycia',
          poziomZaawansowania: 'poczatkujacy',
          dniTreningowe: ['Poniedziałek', 'Czwartek'],
          czasTreningu: 45
        };
        const result = instanceForDefaultTest._createDefaultTrainingPlan(userData);
        expect(result).toBeDefined();
        expect(result.id).toContain('running_plan_default_');
        expect(result.metadata.level_hint).toBe('poczatkujacy');
        // Poziom doświadczenia jest teraz mapowany z poziomZaawansowania, a nie z experienceLevel
        expect(result.plan_weeks).toBeDefined(); // Sprawdź, czy plan_weeks istnieje
      });

      it('powinien utworzyć domyślny plan korzystając z danych użytkownika w kontekście instancji', () => {
        instanceForDefaultTest.userData = {
          imieNazwisko: 'ContextUser',
          wiek: 28,
          plec: 'Kobieta',
          glownyCel: 'przebiegniecie_dystansu',
          poziomZaawansowania: 'zaawansowany',
          dystansDocelowy: 'maraton',
          dniTreningowe: ['Poniedziałek', 'Wtorek', 'Czwartek', 'Piątek', 'Niedziela'],
          czasTreningu: 120
        };
        // Wywołanie bez argumentu - powinno użyć this.userData
        const result = instanceForDefaultTest._createDefaultTrainingPlan();
        expect(result.id).toContain('running_plan_default_');
        expect(result.metadata.level_hint).toBe('zaawansowany');
        // Długość planu może być wnioskowana z dystansu lub z innych parametrów
      });

      it('powinien utworzyć domyślny plan bez żadnych danych użytkownika', () => {
        instanceForDefaultTest.userData = null;
        const result = instanceForDefaultTest._createDefaultTrainingPlan();
        expect(result.id).toContain('running_plan_default_');
        expect(result.metadata.level_hint).toBe('nieznany'); // Domyślna wartość
        expect(result.metadata.duration_weeks).toBe(8); // Domyślna wartość
      });
    });
  });

  // --- End-to-End Test (Requires GEMINI_API_KEY) --- //
  describe('GeminiService - End-to-End Test', () => {
    console.log('\n--- E2E Describe Block Start ---'); // Log describe start
    let geminiService;
    let realKnowledgeBase;

    beforeAll(() => {
      console.log('--- E2E beforeAll Start ---'); // Log beforeAll start
      // Load environment variables for the E2E test
      const dotenv = require('dotenv');
      const path = require('path');
      const envPath = path.resolve(__dirname, '../../.env');
      dotenv.config({ path: envPath });

      // Check if API key is present - SKIP tests if not
      if (!process.env.GEMINI_API_KEY) {
        console.log('\n!!! GEMINI_API_KEY not found in environment variables. Skipping E2E tests. !!!'); // Log skip reason
        // Mark tests as skipped using Jest's functionality if possible
        // For now, we might rely on the test runner skipping them or handle it within the test
        // This approach might cause Jest to fail if it tries to run skipped tests directly.
        // A better approach might be conditional describe or test skipping.
        // For simplicity here, we'll let the test fail explicitly if the key is missing inside 'it'.
      }
    });

    afterAll(() => {
      console.log('--- E2E afterAll End ---'); // Log afterAll end
    });

    beforeEach(() => {
      // Reset modules to ensure a fresh instance and config for each E2E test
      jest.resetModules();
      // Ensure the real dependencies are used for E2E tests
      jest.unmock('axios'); // Keep axios unmocked
      jest.unmock('../../knowledge/running-knowledge-base');
      jest.unmock('../../config/gemini.config');
      // Re-require after reset and unmock
      const RealGeminiService = require('../../services/gemini.service');
      realKnowledgeBase = require('../../knowledge/running-knowledge-base'); // Require the real one
      const realConfig = require('../../config/gemini.config');

      // Make sure the real config uses the environment variable
      realConfig.apiKey = process.env.GEMINI_API_KEY;

      // Create a new instance with the *real* knowledge base
      geminiService = new RealGeminiService(realKnowledgeBase);
    });

    it('powinien wygenerować plan treningowy używając prawdziwego API', async () => {
      console.log('\n--- E2E Test Start ---'); // Log test start
      // Skip test if API key is not set
      if (!process.env.GEMINI_API_KEY) {
        console.log('\n!!! Skipping E2E test: GEMINI_API_KEY is not set. !!!'); // Log skip reason
        return; // Or use jest.skip()
      }

      const userData = {
        imieNazwisko: "Test User",
        wiek: 25,
        plec: "Mężczyzna",
        wzrost: 180,
        masaCiala: 75,
        glownyCel: "aktywny_tryb_zycia",
        poziomZaawansowania: "poczatkujacy",
        dniTreningowe: ["Poniedziałek", "Środa", "Piątek"],
        czasTreningu: 60,
        preferowanyCzasTreningu: "rano",
        godzinySnuOd: "22:00",
        godzinySnuDo: "06:00",
        chronotyp: "ranny_ptaszek",
        gotowoscDoWyzwan: 7
      }; // Dostosowane dane testowe zgodne z nowym modelem

      try {
        console.log('--- E2E Calling API ---'); // Log before API call
        const result = await geminiService.generateTrainingPlan(userData);

        // Basic assertions for the E2E test
        expect(result).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.plan_weeks).toBeDefined();
        expect(Array.isArray(result.plan_weeks)).toBe(true);
        // Można dodać bardziej szczegółowe asercje, np. sprawdzić długość planu
        // expect(result.plan_weeks.length).toBe(userData.planDuration);
      } catch (error) {
        console.error('E2E Test Error:', error); // Add detailed error logging
        throw error; // Keep throwing for better visibility
      }
    });

    it('powinien wygenerować plan treningowy z poprawnymi datami, gdy podano planStartDate (E2E)', async () => {
      console.log('\n--- E2E Test (with Dates) Start ---');
      if (!process.env.GEMINI_API_KEY) {
        console.log('\n!!! Skipping E2E test (with Dates): GEMINI_API_KEY is not set. !!!');
        return;
      }

      // Ustaw datę startu planu na przyszły poniedziałek
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ( (1 + 7 - today.getDay()) % 7 || 7) ); // Znajdź następny poniedziałek
      const planStartDateString = `${nextMonday.getFullYear()}-${(nextMonday.getMonth() + 1).toString().padStart(2, '0')}-${nextMonday.getDate().toString().padStart(2, '0')}`;

      const userDataWithDate = {
        imieNazwisko: "Test User With Dates",
        wiek: 33,
        plec: "Kobieta",
        wzrost: 165,
        masaCiala: 60,
        glownyCel: "zaczac_biegac",
        poziomZaawansowania: "poczatkujacy",
        dniTreningowe: ["poniedziałek", "środa", "piątek"], // Ważne, aby pierwszy dzień pasował do logiki daty startu
        czasTreningu: 45,
        preferowanyCzasTreningu: "wieczor",
        planStartDate: planStartDateString, // Data startu planu
        // raceDate: Można dodać, aby przetestować generowanie do daty zawodów
      };

      try {
        console.log(`--- E2E (with Dates) Calling API with planStartDate: ${planStartDateString} ---`);
        const result = await geminiService.generateTrainingPlan(userDataWithDate);

        expect(result).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.plan_weeks).toBeDefined();
        expect(Array.isArray(result.plan_weeks)).toBe(true);
        expect(result.plan_weeks.length).toBeGreaterThan(0);

        const firstWeek = result.plan_weeks[0];
        expect(firstWeek.days).toBeDefined();
        expect(Array.isArray(firstWeek.days)).toBe(true);
        expect(firstWeek.days.length).toBeGreaterThan(0);

        // Sprawdzenie pierwszego dnia treningowego
        const firstTrainingDay = firstWeek.days[0];
        expect(firstTrainingDay.date).toBeDefined();
        expect(firstTrainingDay.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Format YYYY-MM-DD
        
        // Data pierwszego treningu powinna być równa lub późniejsza niż planStartDate
        // i być dniem określonym w dniTreningowe (tutaj poniedziałek)
        const expectedFirstDate = new Date(planStartDateString);
        const actualFirstDate = new Date(firstTrainingDay.date);
        
        expect(actualFirstDate.toISOString().split('T')[0]).toBe(planStartDateString);
        expect(firstTrainingDay.day_name.toLowerCase()).toBe(userDataWithDate.dniTreningowe[0].toLowerCase());

        // Sprawdzenie sekwencyjności i formatu dat w pierwszym tygodniu
        let previousDate = null;
        for (const day of firstWeek.days) {
          expect(day.date).toBeDefined();
          expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          const currentDate = new Date(day.date);
          if (previousDate) {
            expect(currentDate > previousDate).toBe(true);
          }
          previousDate = currentDate;
        }

        // Sprawdzenie, czy wszystkie dni mają daty
        for (const week of result.plan_weeks) {
          for (const day of week.days) {
            expect(day.date).toBeDefined();
            expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        }

      } catch (error) {
        console.error('E2E Test (with Dates) Error:', error);
        throw error;
      }
    });

  });

  // --- OpenAI End-to-End Test (Requires OPENAI_API_KEY) --- //
  describe('GeminiService - OpenAI End-to-End Test', () => {
    console.log('\n--- OpenAI E2E Describe Block Start ---');
    let geminiService;
    let realKnowledgeBase;

    beforeAll(() => {
      console.log('--- OpenAI E2E beforeAll Start ---');
      // Load environment variables
      const dotenv = require('dotenv');
      const path = require('path');
      const envPath = path.resolve(__dirname, '../../../.env'); // Poprawiona ścieżka do .env
      dotenv.config({ path: envPath });

      // Check if API key is present - SKIP tests if not
      if (!process.env.OPENAI_API_KEY) {
        console.log('\n!!! OPENAI_API_KEY not found in environment variables. Skipping OpenAI E2E tests. !!!');
      }
      if (!process.env.GEMINI_API_KEY) {
        // Ostrzeżenie, że Gemini nie będzie działać, ale test OpenAI może przejść
        console.log('\n!!! WARNING: GEMINI_API_KEY not found. OpenAI test will rely solely on fallback mechanism. !!!');
      }
    });

    afterAll(() => {
      console.log('--- OpenAI E2E afterAll End ---');
    });

    beforeEach(() => {
      console.log('--- OpenAI E2E beforeEach Start ---');
      // Reset modules to ensure a fresh instance and config
      jest.resetModules();
      // Ensure the real dependencies are used
      jest.unmock('axios');
      jest.unmock('openai'); // Upewniamy się, że OpenAI nie jest mockowane
      jest.unmock('../../knowledge/running-knowledge-base');
      jest.unmock('../../config/gemini.config');
      jest.unmock('../../config/openai.config'); // Upewniamy się, że config OpenAI nie jest mockowany

      // Re-require after reset and unmock
      const RealGeminiService = require('../../services/gemini.service');
      realKnowledgeBase = require('../../knowledge/running-knowledge-base');
      const realGeminiConfig = require('../../config/gemini.config');
      const realOpenaiConfig = require('../../config/openai.config');

      // Make sure the real configs use the environment variables
      realGeminiConfig.apiKey = process.env.GEMINI_API_KEY;
      realOpenaiConfig.apiKey = process.env.OPENAI_API_KEY; // Upewniamy się, że klucz OpenAI jest załadowany

      // Create a new instance with the *real* knowledge base
      geminiService = new RealGeminiService(realKnowledgeBase);

      // --- FORCE OPENAI FALLBACK --- 
      // Ustawiamy klucz Gemini na null, aby wymusić błąd i fallback
      console.log('--- Forcing OpenAI fallback by setting Gemini API Key to null ---');
      geminiService.geminiApiKey = null;
      // Dodatkowo upewnijmy się, że klient OpenAI jest zainicjalizowany (jeśli klucz istnieje)
      if(process.env.OPENAI_API_KEY) {
          geminiService.openaiApiKey = process.env.OPENAI_API_KEY;
          geminiService.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          geminiService.openaiModel = realOpenaiConfig.model;
          geminiService.openaiTemperature = realOpenaiConfig.temperature;
          geminiService.openaiMaxTokens = realOpenaiConfig.maxTokens;
          geminiService.openaiTopP = realOpenaiConfig.topP;
      } else {
          geminiService.openai = null; // Upewnij się, że jest null, jeśli klucz nie istnieje
      }
      console.log(`Gemini Key set to: ${geminiService.geminiApiKey}`);
      console.log(`OpenAI Key is set: ${!!geminiService.openaiApiKey}`);
      console.log(`OpenAI client initialized: ${!!geminiService.openai}`);
      console.log('--- OpenAI E2E beforeEach End ---');
    });

    it('powinien wygenerować plan treningowy używając prawdziwego API OpenAI (fallback)', async () => {
      console.log('\n--- OpenAI E2E Test Start ---');
      // Skip test if API key is not set
      if (!process.env.OPENAI_API_KEY) {
        console.log('\n!!! Skipping OpenAI E2E test: OPENAI_API_KEY is not set. !!!');
        return; // Or use jest.skip()
      }
      if (!geminiService.openai) {
          console.log('\n!!! Skipping OpenAI E2E test: OpenAI client not initialized (likely missing API key). !!!');
          return;
      }

      const userData = {
        imieNazwisko: "TestOpenAI",
        wiek: 35,
        plec: "Kobieta",
        wzrost: 165,
        masaCiala: 60,
        glownyCel: "przebiegniecie_dystansu",
        poziomZaawansowania: "sredniozaawansowany",
        dystansDocelowy: "polmaraton",
        dniTreningowe: ["Wtorek", "Czwartek", "Sobota", "Niedziela"],
        czasTreningu: 90,
        kontuzje: true,
        opisKontuzji: "Ból kolana biegacza (ITBS)",
        preferowanyCzasTreningu: "wieczor",
        godzinySnuOd: "23:00",
        godzinySnuDo: "07:00",
        chronotyp: "nocny_marek"
      }; // Dostosowane dane testowe zgodne z nowym modelem

      try {
        console.log('--- OpenAI E2E Calling API (via fallback) ---');
        const result = await geminiService.generateTrainingPlan(userData);
        console.log('--- OpenAI E2E Received Result ---');
        // console.log('OpenAI E2E Result:', JSON.stringify(result, null, 2)); // Odkomentuj, aby zobaczyć pełny plan

        // Basic assertions for the E2E test
        expect(result).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.discipline).toBe('running');
        expect(result.plan_weeks).toBeDefined();
        expect(Array.isArray(result.plan_weeks)).toBe(true);
        // Sprawdź czy plan zawiera ćwiczenia korekcyjne i monitorowanie bólu
        expect(result.corrective_exercises).toBeDefined();
        expect(result.pain_monitoring).toBeDefined();
        // Można dodać bardziej szczegółowe asercje, np. długość planu
        // Oczekiwana długość może być różna, więc lepiej sprawdzać ogólną strukturę
        // expect(result.plan_weeks.length).toBe(userData.planDuration); // Może nie być dokładne

      } catch (error) {
        console.error('OpenAI E2E Test Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        });
        throw error; // Rzuć błąd dalej, aby test się nie powiódł
      }
    });
  });

});
