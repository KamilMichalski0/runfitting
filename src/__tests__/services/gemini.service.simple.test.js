/**
 * Proste testy dla serwisu Gemini
 * Skupiają się na testowaniu metod _createDefaultTrainingPlan i _parseResponse
 */

// Mockujemy zależności
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

// Importujemy serwis
const geminiService = require('../../services/gemini.service');

describe('GeminiService - Proste testy', () => {
  // Wyciszamy konsolę
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // Przywracamy konsolę
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

  describe('_createDefaultTrainingPlan', () => {
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
      expect(result.metadata.duration_weeks).toBe(12);
      expect(result.plan_weeks).toHaveLength(2); // Domyślny plan ma 2 tygodnie
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });

    it('powinien utworzyć domyślny plan bez danych użytkownika', () => {
      // Wywołanie testowanej metody bez danych użytkownika
      const result = geminiService._createDefaultTrainingPlan();

      // Sprawdzenie wyników
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.duration_weeks).toBe(8); // Domyślna wartość
      expect(result.plan_weeks).toHaveLength(2); // Domyślny plan ma 2 tygodnie
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });

    it('powinien utworzyć domyślny plan z danymi z kontekstu instancji', () => {
      // Ustawienie danych użytkownika w kontekście instancji
      geminiService.userData = {
        firstName: 'Jan',
        planDuration: 10
      };

      // Wywołanie testowanej metody bez danych użytkownika
      const result = geminiService._createDefaultTrainingPlan();

      // Sprawdzenie wyników
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.duration_weeks).toBe(10); // Wartość z kontekstu instancji
      expect(result.plan_weeks).toHaveLength(2); // Domyślny plan ma 2 tygodnie
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });
  });

  describe('_parseResponse', () => {
    // Przed każdym testem ustawiamy dane użytkownika w kontekście instancji
    beforeEach(() => {
      geminiService.userData = {
        firstName: 'Jan',
        experienceLevel: 'początkujący',
        mainGoal: 'poprawa kondycji',
        trainingDaysPerWeek: 3,
        planDuration: 8
      };
    });

    it('powinien obsłużyć odpowiedź null', () => {
      // Wywołanie testowanej metody z null
      const result = geminiService._parseResponse(null);

      // Sprawdzenie wyników - powinien zwrócić domyślny plan
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });

    it('powinien obsłużyć odpowiedź bez candidates', () => {
      // Przygotowanie odpowiedzi bez candidates
      const response = {};

      // Wywołanie testowanej metody
      const result = geminiService._parseResponse(response);

      // Sprawdzenie wyników - powinien zwrócić domyślny plan
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });

    it('powinien obsłużyć odpowiedź z tekstem "null"', () => {
      // Przygotowanie odpowiedzi z tekstem "null"
      const response = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'null'
                }
              ]
            }
          }
        ]
      };

      // Wywołanie testowanej metody
      const result = geminiService._parseResponse(response);

      // Sprawdzenie wyników - powinien zwrócić domyślny plan
      expect(result).toBeDefined();
      expect(result.id).toContain('running_plan_default_');
      expect(result.metadata.description).toContain('Podstawowy plan biegowy (domyślny)');
    });

    it('powinien obsłużyć odpowiedź z poprawnym JSON', () => {
      // Przygotowanie odpowiedzi z poprawnym JSON
      const response = {
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
      };

      // Wywołanie testowanej metody
      const result = geminiService._parseResponse(response);

      // Sprawdzenie wyników - powinien zwrócić plan z odpowiedzi
      expect(result).toBeDefined();
      expect(result.id).toBe('test_plan_123');
      expect(result.metadata.description).toBe('Plan treningowy dla Jana');
      expect(result.plan_weeks).toHaveLength(1);
      expect(result.plan_weeks[0].days).toHaveLength(1);
      expect(result.plan_weeks[0].days[0].day_name).toBe('poniedziałek');
    });
  });

  describe('_createPrompt', () => {
    it('powinien wygenerować prompt z podstawowymi danymi użytkownika', () => {
      // Przygotowanie danych użytkownika
      const userData = {
        firstName: 'Anna',
        experienceLevel: 'średniozaawansowany',
        mainGoal: 'przygotowanie do półmaratonu',
        trainingDaysPerWeek: 4,
        planDuration: 10,
        specificRaceDate: '2024-10-20',
        preferredIntensity: 'średnia',
        availableEquipment: ['bieżnia', 'zegarek z GPS']
      };
      // Ustawienie danych użytkownika w kontekście instancji
      geminiService.userData = userData;

      // Wywołanie testowanej metody
      const prompt = geminiService._createPrompt();

      // Sprawdzenie wyników
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Anna');
      expect(prompt).toContain('średniozaawansowany');
      expect(prompt).toContain('przygotowanie do półmaratonu');
      expect(prompt).toContain('4 dni');
      expect(prompt).toContain('10 tygodni');
      expect(prompt).toContain('2024-10-20');
      expect(prompt).toContain('średnia intensywność');
      expect(prompt).toContain('bieżnia');
      expect(prompt).toContain('zegarek z GPS');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('id');
      expect(prompt).toContain('metadata');
      expect(prompt).toContain('plan_weeks');
      expect(prompt).toContain('week_num');
      expect(prompt).toContain('focus');
      expect(prompt).toContain('days');
      expect(prompt).toContain('day_name');
      expect(prompt).toContain('workout');
    });

    it('powinien wygenerować prompt z minimalnymi danymi użytkownika', () => {
      // Przygotowanie danych użytkownika (tylko wymagane pola)
      const userData = {
        firstName: 'Piotr',
        experienceLevel: 'początkujący',
        mainGoal: 'poprawa kondycji',
        trainingDaysPerWeek: 2,
        planDuration: 6
      };
      // Ustawienie danych użytkownika w kontekście instancji
      geminiService.userData = userData;

      // Wywołanie testowanej metody
      const prompt = geminiService._createPrompt();

      // Sprawdzenie wyników
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Piotr');
      expect(prompt).toContain('początkujący');
      expect(prompt).toContain('poprawa kondycji');
      expect(prompt).toContain('2 dni');
      expect(prompt).toContain('6 tygodni');
      // Sprawdzamy, czy nie zawiera pól opcjonalnych, których nie podano
      expect(prompt).not.toContain('Data konkretnego startu');
      expect(prompt).not.toContain('Preferowana intensywność');
      expect(prompt).not.toContain('Dostępny sprzęt');
      expect(prompt).toContain('JSON');
    });

    it('powinien użyć danych z kontekstu instancji, jeśli nie podano userData', () => {
      // Ustawienie danych użytkownika w kontekście instancji
      geminiService.userData = {
        firstName: 'Kasia',
        experienceLevel: 'zaawansowany',
        mainGoal: 'maraton',
        trainingDaysPerWeek: 5,
        planDuration: 12
      };

      // Wywołanie testowanej metody bez danych użytkownika
      const prompt = geminiService._createPrompt();

      // Sprawdzenie wyników
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Kasia');
      expect(prompt).toContain('zaawansowany');
      expect(prompt).toContain('maraton');
      expect(prompt).toContain('5 dni');
      expect(prompt).toContain('12 tygodni');
      expect(prompt).toContain('JSON');
    });
  });
});
