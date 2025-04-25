/**
 * Podstawowe testy dla serwisu Gemini
 * Skupiają się na głównej funkcjonalności generowania planów treningowych
 */

// Mockujemy axios przed importem innych modułów
const axios = require('axios');
jest.mock('axios');

// Mockujemy pozostałe zależności
jest.mock('../../config/gemini.config', () => ({
  apiKey: 'test-api-key',
  model: 'gemini-pro',
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxTokens: 8192
}));

jest.mock('../../templates/plan-template-selector', () => ({
  getExamplePlanTemplate: jest.fn().mockReturnValue({
    id: 'template_123',
    weeks: [
      { week_num: 1, focus: 'Wprowadzenie', days: [] },
      { week_num: 2, focus: 'Budowanie bazy', days: [] }
    ]
  })
}));

jest.mock('../../knowledge/running-knowledge-base', () => ({
  getRunningTips: jest.fn().mockReturnValue(['Tip 1', 'Tip 2']),
  getRunningTerminology: jest.fn().mockReturnValue({ term1: 'definition1' }),
  getTrainingZones: jest.fn().mockReturnValue({
    zone1: { name: 'Regeneracja', min: 60, max: 70 }
  })
}));

// Mockujemy AppError
class MockAppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      isOperational: this.isOperational
    };
  }
}

jest.mock('../../utils/app-error', () => MockAppError);

// Importujemy serwis po mockach
const geminiService = require('../../services/gemini.service');

describe('GeminiService - Podstawowe testy', () => {
  // Wyciszamy konsolę, aby uniknąć zaśmiecania wyjścia testów
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // Przywracamy konsolę po wszystkich testach
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  // Przywrócenie wszystkich mocków po każdym teście
  afterEach(() => {
    jest.clearAllMocks();
    // Resetujemy dane użytkownika w kontekście instancji
    geminiService.userData = null;
  });

  describe('generateTrainingPlan', () => {
    // Define mockAxiosInstance in this scope
    let mockAxiosInstance;

    // Mockujemy metody, które mogą powodować problemy w testach
    beforeEach(() => {
      // Setup the mock axios instance returned by axios.create
      mockAxiosInstance = {
        post: jest.fn() // Initialize post mock here
      };
      axios.create.mockReturnValue(mockAxiosInstance);

      // Mockujemy metodę _createPrompt, aby uniknąć problemów z zależnościami
      jest.spyOn(geminiService, '_createPrompt').mockImplementation(() => 'Mockowany prompt');

      // Mockujemy metodę _parseResponse, aby kontrolować jej zachowanie
      // NOTE: This mock might interfere with testing the actual _parseResponse logic
      // if generateTrainingPlan relies on it. Keep it for now as it was there before.
      jest.spyOn(geminiService, '_parseResponse').mockImplementation((response) => {
        if (!response || !response.candidates || !response.candidates[0]?.content?.parts?.[0]?.text) {
           // Use the actual _createDefaultTrainingPlan or a controlled mock if needed
           // For simplicity, returning a basic default structure here matching the mock below.
           return { id: 'running_plan_default_parser_mock', metadata: { description: 'Podstawowy plan biegowy (domyślny)' }, plan_weeks: [] };
        }
        try {
          const text = response.candidates[0].content.parts[0].text;
          // Basic JSON parsing attempt, might need refinement based on actual needs
          if (text === 'null') {
             return { id: 'running_plan_default_parser_mock_null', metadata: { description: 'Podstawowy plan biegowy (domyślny)' }, plan_weeks: [] };
          }
          return JSON.parse(text);
        } catch (error) {
           return { id: 'running_plan_default_parser_mock_error', metadata: { description: 'Podstawowy plan biegowy (domyślny)' }, plan_weeks: [] };
        }
      });

      // Mock _createDefaultTrainingPlan consistently for fallback scenarios
      jest.spyOn(geminiService, '_createDefaultTrainingPlan').mockImplementation(() => ({
        id: 'running_plan_default_generic_mock',
        metadata: {
          description: 'Podstawowy plan biegowy (domyślny)',
          duration_weeks: 8 // Add missing field from original error
        },
        plan_weeks: [{week_num: 1, days: []}, {week_num: 2, days: []}] // Match structure
      }));
    });

    it('powinien zwrócić plan treningowy z poprawnej odpowiedzi API', async () => {
      // Przygotowanie danych użytkownika
      const userData = {
        firstName: 'Jan',
        experienceLevel: 'początkujący',
        mainGoal: 'poprawa kondycji',
        trainingDaysPerWeek: 3,
        planDuration: 8
      };

      // Przygotowanie odpowiedzi z API
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      id: 'test_plan_123',
                      metadata: {
                        discipline: 'running',
                        target_group: 'początkujący',
                        target_goal: 'poprawa kondycji',
                        level_hint: 'początkujący',
                        days_per_week: '3',
                        duration_weeks: 8,
                        description: 'Plan treningowy dla Jana',
                        author: 'RunFitting AI'
                      },
                      plan_weeks: [
                        {
                          week_num: 1,
                          focus: 'Wprowadzenie',
                          days: [
                            {
                              day_name: 'poniedziałek',
                              workout: 'Trening wprowadzający'
                            }
                          ]
                        }
                      ]
                    })
                  }
                ]
              }
            }
          ]
        }
      };

      // Configure the mock post for this specific test
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Wywołanie testowanej metody
      const result = await geminiService.generateTrainingPlan(userData);

      // Sprawdzenie wyników
      expect(result).toBeDefined();
      expect(result.id).toBe('test_plan_123');
      expect(result.metadata.description).toBe('Plan treningowy dla Jana');
      expect(result.plan_weeks).toHaveLength(1);
    });

    it('powinien obsłużyć błąd w zapytaniu do API i zwrócić domyślny plan', async () => {
      // Przygotowanie danych użytkownika
      const userData = {
        firstName: 'Jan',
        experienceLevel: 'początkujący',
        mainGoal: 'poprawa kondycji',
        trainingDaysPerWeek: 3
      };

      // Configure the mock post for this specific test
      mockAxiosInstance.post.mockRejectedValue(new Error('API error'));

      // Ensure _createDefaultTrainingPlan is mocked (done in beforeEach)

      // Wywołanie testowanej metody
      const result = await geminiService.generateTrainingPlan(userData);

      // Sprawdzenie wyników - powinien zwrócić domyślny plan
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });

    it('powinien obsłużyć odpowiedź API bez struktury candidates', async () => {
      // Przygotowanie danych użytkownika
      const userData = {
        firstName: 'Jan',
        experienceLevel: 'początkujący',
        mainGoal: 'poprawa kondycji',
        trainingDaysPerWeek: 3
      };

      // Przygotowanie odpowiedzi z API bez candidates
      const mockResponse = {
        data: {}
      };

      // Configure the mock post for this specific test
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Ensure _createDefaultTrainingPlan is mocked (done in beforeEach)

      // Wywołanie testowanej metody
      const result = await geminiService.generateTrainingPlan(userData);

      // Sprawdzenie wyników - powinien zwrócić domyślny plan
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });
  });

  describe('_parseResponse', () => {
    // Przywracamy oryginalną implementację _parseResponse
    beforeEach(() => {
      if (geminiService._parseResponse.mockRestore) {
        geminiService._parseResponse.mockRestore();
      }
      
      // Ustawiamy dane użytkownika w kontekście instancji
      geminiService.userData = {
        firstName: 'Jan',
        experienceLevel: 'początkujący',
        mainGoal: 'poprawa kondycji',
        trainingDaysPerWeek: 3,
        planDuration: 8
      };
    });

    it('powinien obsłużyć odpowiedź null', () => {
      // Mockujemy _createDefaultTrainingPlan, aby kontrolować jego zachowanie
      jest.spyOn(geminiService, '_createDefaultTrainingPlan').mockImplementation(() => ({
        id: 'running_plan_default_123',
        metadata: {
          description: 'Podstawowy plan biegowy (domyślny) - został wygenerowany awaryjnie'
        },
        plan_weeks: []
      }));

      // Wywołanie testowanej metody
      const result = geminiService._parseResponse(null);

      // Sprawdzenie wyników - powinien zwrócić domyślny plan
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });
  });

  describe('_createDefaultTrainingPlan', () => {
    // Restore original method before testing it
    let originalMethod;
    beforeAll(() => {
       originalMethod = geminiService._createDefaultTrainingPlan;
    });
    afterAll(() => {
       geminiService._createDefaultTrainingPlan = originalMethod;
    });
     beforeEach(() => {
        // Ensure mocks from outer scope don't interfere
        if (geminiService._createDefaultTrainingPlan.mockRestore) {
           geminiService._createDefaultTrainingPlan.mockRestore();
        }
     });

    it('powinien utworzyć domyślny plan z danymi użytkownika', () => {
      // Przygotowanie danych użytkownika
      const userData = {
        firstName: 'Jan',
        experienceLevel: 'zaawansowany',
        mainGoal: 'maraton',
        trainingDaysPerWeek: 5,
        planDuration: 12
      };

      // Wywołanie testowanej metody
      const result = geminiService._createDefaultTrainingPlan(userData);

      // Sprawdzenie wyników
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      // Assert the expected duration based on input userData
      expect(result.metadata.duration_weeks).toBe(12);
      expect(result.plan_weeks).toHaveLength(2); // Domyślny plan ma 2 tygodnie
    });

    it('powinien utworzyć domyślny plan bez danych użytkownika', () => {
      // Wywołanie testowanej metody bez danych użytkownika
      const result = geminiService._createDefaultTrainingPlan();

      // Sprawdzenie wyników
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      // Assert the default duration when no userData is provided
      expect(result.metadata.duration_weeks).toBe(8); // Domyślna wartość
      expect(result.plan_weeks).toHaveLength(2); // Domyślny plan ma 2 tygodnie
    });
  });
});
