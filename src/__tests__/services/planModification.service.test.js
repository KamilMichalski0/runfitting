const PlanModificationService = require('../../services/planModification.service');
const AppError = require('../../utils/app-error'); // Assuming AppError is in src/utils/app-error.js

/**
 * @file Integration tests for PlanModificationService.
 * @important These tests make REAL API calls to Gemini (and potentially OpenAI).
 * Ensure your API keys are correctly configured in:
 * - src/config/gemini.config.js
 * - src/config/openai.config.js
 */

describe('PlanModificationService Integration Tests', () => {
  let planModificationService;
  let mockUserData;
  let mockOriginalPlan;

  beforeAll(() => {
    // Initialize the service. It will pick up API keys from your config files.
    // Passing null for knowledgeBase as the constructor allows it (and logs a warning).
    // For these specific tests focusing on AI modification, knowledgeBase might not be critical.
    planModificationService = new PlanModificationService(null);

    mockUserData = {
      name: 'Jan Tester',
      email: 'jan.tester@example.com',
      age: 33,
      gender: 'male',
      weight: 78, // kg
      height: 179, // cm
      experienceLevel: 'sredniozaawansowany',
      currentActivityLevel: 'umiarkowanie_aktywny',
      mainFitnessGoal: 'poprawa_kondycji',
      restingHeartRate: 58,
      maxHeartRate: 188,
      hasCurrentInjuries: false,
      hasHealthRestrictions: false,
      // Add any other fields from user.model.js that the AI might find relevant
      // for plan modification, based on the prompts in PlanModificationService.
    };

    mockOriginalPlan = {
      _id: 'testPlanIntegration123',
      plan_name: "Integracyjny Plan Testowy",
      target_goal: "Testowanie modyfikacji AI",
      duration_weeks: 2,
      experience_level: "sredniozaawansowany",
      plan_weeks: [
        { // Week 0
          week_num: 1,
          focus: "Wprowadzenie i adaptacja",
          summary: "Pierwszy tydzień skupia się na lekkich ćwiczeniach adaptacyjnych.",
          days: [
            { // Day 0
              day_num: 1,
              day_name: "Poniedziałek",
              workout_type: "Bieg",
              workout: {
                type: "Bieganie regeneracyjne",
                description: "Rozgrzewka (5 min), Lekki bieg (20 min), Schłodzenie (5 min).",
                duration_minutes: 30,
                distance_km: 4,
                intensity: "niska",
                notes: "Utrzymaj tętno w strefie 1-2."
              }
            },
            { // Day 1
              day_num: 2,
              day_name: "Wtorek",
              workout_type: "Siła",
              workout: { type: "Trening siłowy ogólnorozwojowy", description: "Podstawowe ćwiczenia z masą ciała.", duration_minutes: 45, intensity: "średnia" }
            },
             { // Day 2
              day_num: 3,
              day_name: "Środa",
              workout_type: "Odpoczynek",
              workout: { type: "Aktywny odpoczynek", description: "Lekki spacer lub joga.", duration_minutes: 30, intensity: "bardzo niska" }
            }
          ]
        },
        { // Week 1
          week_num: 2,
          focus: "Budowanie wytrzymałości",
          summary: "Drugi tydzień stopniowo zwiększa objętość.",
          days: [
            {
              day_num: 1,
              day_name: "Poniedziałek", // Typically day name would be consistent with day_num in a real plan
              workout_type: "Bieg",
              workout: { type: "Dłuższy bieg", description: "Bieg w stałym tempie.", duration_minutes: 45, intensity: "średnia" }
            }
            // ... more days for a complete week if needed
          ]
        }
      ]
    };
  });

  describe('modifyDayInPlan', () => {
    it('should successfully modify a day in the plan using an AI model', async () => {
      const weekIndex = 0;
      const dayIndex = 0; // Modifying "Poniedziałek" of week 1
      const modificationReason = "Użytkownik prosi o nieco lżejszy trening dzisiaj z powodu gorszego snu.";

      // This will make a real API call to Gemini (or OpenAI as fallback)
      const modifiedDay = await planModificationService.modifyDayInPlan(
        mockOriginalPlan,
        weekIndex,
        dayIndex,
        mockUserData,
        modificationReason
      );

      expect(modifiedDay).toBeDefined();
      expect(modifiedDay.day_name).toBe(mockOriginalPlan.plan_weeks[weekIndex].days[dayIndex].day_name);
      expect(modifiedDay.workout).toBeDefined();
      expect(typeof modifiedDay.workout.type).toBe('string');
      expect(typeof modifiedDay.workout.description).toBe('string');
      // Further assertions could check if the modification reflects the reason,
      // but AI responses are variable. Structural integrity is key here.
      // Example: Check if new duration is possibly less if "lżejszy trening" implies shorter.
      // This is hard to guarantee with AI, so focus on structure.
    }, 35000); // Increased timeout for external API call

    it('should throw AppError for invalid plan structure or indices', async () => {
      await expect(
        planModificationService.modifyDayInPlan(null, 0, 0, mockUserData, "reason")
      ).rejects.toThrow(AppError);

      await expect(
        planModificationService.modifyDayInPlan({ plan_weeks: [] }, 0, 0, mockUserData, "reason")
      ).rejects.toThrow(AppError);

       await expect(
        planModificationService.modifyDayInPlan(mockOriginalPlan, 99, 0, mockUserData, "reason") // Invalid weekIndex
      ).rejects.toThrow(AppError);

       await expect(
        planModificationService.modifyDayInPlan(mockOriginalPlan, 0, 99, mockUserData, "reason") // Invalid dayIndex
      ).rejects.toThrow(AppError);
    });
  });

  describe('modifyWeekInPlan', () => {
    it('should successfully modify a week in the plan using an AI model', async () => {
      const weekIndex = 0; // Modifying the first week
      const modificationReason = "Użytkownik prosi o ogólne zmniejszenie intensywności w tym tygodniu, ponieważ czuje się przemęczony.";

      // This will make a real API call
      const modifiedWeek = await planModificationService.modifyWeekInPlan(
        mockOriginalPlan,
        weekIndex,
        mockUserData,
        modificationReason
      );

      expect(modifiedWeek).toBeDefined();
      expect(modifiedWeek.week_num).toBe(mockOriginalPlan.plan_weeks[weekIndex].week_num);
      expect(typeof modifiedWeek.focus).toBe('string'); // Focus might change
      expect(Array.isArray(modifiedWeek.days)).toBe(true);
      // The number of days should ideally remain the same unless specified otherwise
      expect(modifiedWeek.days.length).toBe(mockOriginalPlan.plan_weeks[weekIndex].days.length);

      modifiedWeek.days.forEach(day => {
        expect(day.day_name).toBeDefined();
        expect(day.workout).toBeDefined();
        expect(typeof day.workout.type).toBe('string');
      });
    }, 45000); // Increased timeout for a potentially more complex API call

    it('should throw AppError for invalid plan structure or week index', async () => {
      await expect(
        planModificationService.modifyWeekInPlan(null, 0, mockUserData, "reason")
      ).rejects.toThrow(AppError);

      await expect(
        planModificationService.modifyWeekInPlan({ plan_weeks: [] }, 0, mockUserData, "reason")
      ).rejects.toThrow(AppError);

      await expect(
        planModificationService.modifyWeekInPlan(mockOriginalPlan, 99, mockUserData, "reason") // Invalid weekIndex
      ).rejects.toThrow(AppError);
    });
  });

  // Note: Testing the OpenAI fallback specifically would require manipulating the Gemini API key
  // or configuration, which is complex for a standard integration test run.
  // These tests primarily verify the happy path with the configured AI services.
  // If Gemini is configured and working, it will be used. If not, and OpenAI is, OpenAI will be used.
}); 