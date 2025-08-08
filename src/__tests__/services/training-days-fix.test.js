const GeminiService = require('../../services/gemini.service');

describe('Training Days Fix in AI Response', () => {
  let geminiService;
  
  beforeEach(() => {
    geminiService = new GeminiService({}, {});
  });

  describe('_validateAndRepairPlan with trainingDays', () => {
    test('should correct AI response days to match user training days', () => {
      // Arrange - Mock AI response that ignores user's training days
      const aiPlan = {
        id: 'test-plan',
        metadata: {
          discipline: 'bieganie',
          target_group: 'adult_runners',
          days_per_week: 3
        },
        plan_weeks: [
          {
            week_num: 1,
            focus: 'Tydzień podstawowy',
            days: [
              {
                day_name: 'poniedziałek', // AI chose this
                type: 'easy_run',
                duration_minutes: 30,
                description: 'Łatwy bieg podstawowy',
                workout: {}
              },
              {
                day_name: 'środa', // AI chose this (happens to match)
                type: 'intervals', 
                duration_minutes: 25,
                description: 'Trening interwałowy',
                workout: {}
              },
              {
                day_name: 'piątek', // AI chose this (wrong!)
                type: 'long_run',
                duration_minutes: 40,
                description: 'Długi bieg wytrzymałościowy',
                workout: {}
              }
            ]
          }
        ],
        corrective_exercises: { frequency: 'daily', list: [] },
        notes: []
      };

      // User's actual training days
      const userTrainingDays = ['sobota', 'środa', 'poniedziałek'];

      // Act - Apply our fix
      const correctedPlan = geminiService._validateAndRepairPlan(aiPlan, userTrainingDays);

      // Assert - Days should be corrected to match user's preference
      const correctedDays = correctedPlan.plan_weeks[0].days;
      
      expect(correctedDays).toHaveLength(3); // User has 3 training days
      expect(correctedDays[0].day_name).toBe('sobota');     // 1st day corrected
      expect(correctedDays[1].day_name).toBe('środa');      // 2nd day (was already correct)
      expect(correctedDays[2].day_name).toBe('poniedziałek'); // 3rd day corrected
      
      // Workouts should be preserved, only days changed
      expect(correctedDays[0].type).toBe('easy_run');
      expect(correctedDays[1].type).toBe('intervals');
      expect(correctedDays[2].type).toBe('long_run');
      
      expect(correctedDays[0].duration_minutes).toBe(30);
      expect(correctedDays[1].duration_minutes).toBe(25);
      expect(correctedDays[2].duration_minutes).toBe(40);
      
      console.log('✅ Test passed: AI days corrected to user training days');
      console.log('Original days:', ['poniedziałek', 'środa', 'piątek']);
      console.log('Corrected days:', correctedDays.map(d => d.day_name));
    });

    test('should handle plans with fewer days than user training days', () => {
      // Arrange - AI response with only 2 days, but user has 3 training days
      const aiPlan = {
        id: 'test-plan',
        metadata: { discipline: 'bieganie' },
        plan_weeks: [{
          week_num: 1,
          focus: 'Tydzień podstawowy',
          days: [
            { day_name: 'poniedziałek', type: 'easy_run', workout: {} },
            { day_name: 'piątek', type: 'intervals', workout: {} }
            // Missing 3rd day!
          ]
        }],
        corrective_exercises: { frequency: 'daily', list: [] },
        notes: []
      };

      const userTrainingDays = ['sobota', 'środa', 'poniedziałek'];

      // Act
      const correctedPlan = geminiService._validateAndRepairPlan(aiPlan, userTrainingDays);

      // Assert - Should be truncated to match available workouts (2 days)
      const correctedDays = correctedPlan.plan_weeks[0].days;
      expect(correctedDays).toHaveLength(2); 
      expect(correctedDays[0].day_name).toBe('sobota');
      expect(correctedDays[1].day_name).toBe('środa');
    });

    test('should handle plans with more days than user training days', () => {
      // Arrange - AI response with 5 days, but user has only 3 training days
      const aiPlan = {
        id: 'test-plan',
        metadata: { discipline: 'bieganie' },
        plan_weeks: [{
          week_num: 1,
          focus: 'Tydzień podstawowy',
          days: [
            { day_name: 'poniedziałek', type: 'easy_run', workout: {} },
            { day_name: 'wtorek', type: 'strength', workout: {} },
            { day_name: 'środa', type: 'intervals', workout: {} },
            { day_name: 'czwartek', type: 'recovery', workout: {} },
            { day_name: 'piątek', type: 'long_run', workout: {} }
          ]
        }],
        corrective_exercises: { frequency: 'daily', list: [] },
        notes: []
      };

      const userTrainingDays = ['sobota', 'środa', 'poniedziałek'];

      // Act
      const correctedPlan = geminiService._validateAndRepairPlan(aiPlan, userTrainingDays);

      // Assert - Should be trimmed to user's 3 training days
      const correctedDays = correctedPlan.plan_weeks[0].days;
      expect(correctedDays).toHaveLength(3); // Trimmed to user's training days count
      expect(correctedDays[0].day_name).toBe('sobota');
      expect(correctedDays[1].day_name).toBe('środa');
      expect(correctedDays[2].day_name).toBe('poniedziałek');
      
      // Should preserve first 3 workouts
      expect(correctedDays[0].type).toBe('easy_run');
      expect(correctedDays[1].type).toBe('strength');
      expect(correctedDays[2].type).toBe('intervals');
    });

    test('should not change days when trainingDays is null or empty', () => {
      // Arrange
      const aiPlan = {
        id: 'test-plan',
        metadata: { discipline: 'bieganie' },
        plan_weeks: [{
          week_num: 1,
          focus: 'Tydzień podstawowy',
          days: [
            { day_name: 'poniedziałek', type: 'easy_run', workout: {} },
            { day_name: 'środa', type: 'intervals', workout: {} },
            { day_name: 'piątek', type: 'long_run', workout: {} }
          ]
        }],
        corrective_exercises: { frequency: 'daily', list: [] },
        notes: []
      };

      // Act - No training days provided
      const correctedPlan = geminiService._validateAndRepairPlan(aiPlan, null);

      // Assert - Days should remain unchanged
      const correctedDays = correctedPlan.plan_weeks[0].days;
      expect(correctedDays[0].day_name).toBe('poniedziałek');
      expect(correctedDays[1].day_name).toBe('środa');
      expect(correctedDays[2].day_name).toBe('piątek');
    });
  });
});