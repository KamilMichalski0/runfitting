const GeminiService = require('../../services/gemini.service');

describe('Training Days AI Response Validation', () => {
  let geminiService;
  
  beforeEach(() => {
    geminiService = new GeminiService({}, {});
  });

  describe('validateTrainingDaysInResponse', () => {
    test('should create AI response validator for training days', () => {
      // This test documents the need for AI response validation
      // since the AI can ignore our explicit instructions about training days
      
      const expectedTrainingDays = ['sobota', 'środa', 'poniedziałek'];
      
      // Mock AI response that IGNORES user's training days
      const wrongAIResponse = {
        plan_weeks: [{
          week_num: 1,
          days: [
            { day_name: 'poniedziałek', type: 'easy_run' },
            { day_name: 'środa', type: 'intervals' },
            { day_name: 'piątek', type: 'long_run' } // WRONG! Should be 'sobota'
          ]
        }]
      };
      
      // Mock AI response that FOLLOWS user's training days 
      const correctAIResponse = {
        plan_weeks: [{
          week_num: 1,
          days: [
            { day_name: 'sobota', type: 'long_run' },    // ✅ Correct
            { day_name: 'środa', type: 'intervals' },    // ✅ Correct
            { day_name: 'poniedziałek', type: 'easy_run' } // ✅ Correct
          ]
        }]
      };
      
      // Function to validate if AI response uses correct training days
      const validateTrainingDays = (aiResponse, expectedDays) => {
        const actualDays = aiResponse.plan_weeks[0].days.map(d => d.day_name);
        const expectedDaysSet = new Set(expectedDays);
        const actualDaysSet = new Set(actualDays);
        
        // Check if AI used exactly the expected training days
        const isCorrect = expectedDays.length === actualDays.length &&
                         expectedDays.every(day => actualDaysSet.has(day));
                         
        return {
          isValid: isCorrect,
          expectedDays: expectedDays,
          actualDays: actualDays,
          wrongDays: actualDays.filter(day => !expectedDaysSet.has(day)),
          missingDays: expectedDays.filter(day => !actualDaysSet.has(day))
        };
      };
      
      // Test wrong response
      const wrongValidation = validateTrainingDays(wrongAIResponse, expectedTrainingDays);
      expect(wrongValidation.isValid).toBe(false);
      expect(wrongValidation.wrongDays).toEqual(['piątek']);
      expect(wrongValidation.missingDays).toEqual(['sobota']);
      
      // Test correct response  
      const correctValidation = validateTrainingDays(correctAIResponse, expectedTrainingDays);
      expect(correctValidation.isValid).toBe(true);
      expect(correctValidation.wrongDays).toEqual([]);
      expect(correctValidation.missingDays).toEqual([]);
      
      console.log('🔍 Wrong AI Response Validation:', wrongValidation);
      console.log('✅ Correct AI Response Validation:', correctValidation);
      
      // This test proves we need automatic validation and correction
      // of AI responses to ensure they follow user's training day preferences
    });
    
    test('should create day name mapping for corrections', () => {
      // Test the mapping system needed to fix AI responses
      const dayNameMapping = {
        // English to Polish
        'monday': 'poniedziałek',
        'tuesday': 'wtorek', 
        'wednesday': 'środa',
        'thursday': 'czwartek',
        'friday': 'piątek',
        'saturday': 'sobota',
        'sunday': 'niedziela',
        
        // Polish variations
        'poniedzialek': 'poniedziałek',
        'sroda': 'środa',
        'sobota': 'sobota'
      };
      
      const userTrainingDays = ['sobota', 'środa', 'poniedziałek'];
      
      // Function to correct AI response days
      const correctAIResponseDays = (aiResponse, userDays) => {
        const correctedResponse = { ...aiResponse };
        
        correctedResponse.plan_weeks.forEach(week => {
          // Replace AI's chosen days with user's actual training days
          week.days = week.days.map((workout, index) => {
            if (index < userDays.length) {
              return {
                ...workout,
                day_name: userDays[index]
              };
            }
            return workout;
          });
        });
        
        return correctedResponse;
      };
      
      const wrongResponse = {
        plan_weeks: [{
          week_num: 1,
          days: [
            { day_name: 'poniedziałek', type: 'easy_run', duration: 30 },
            { day_name: 'środa', type: 'intervals', duration: 25 },
            { day_name: 'piątek', type: 'long_run', duration: 45 }
          ]
        }]
      };
      
      const correctedResponse = correctAIResponseDays(wrongResponse, userTrainingDays);
      
      expect(correctedResponse.plan_weeks[0].days[0].day_name).toBe('sobota');
      expect(correctedResponse.plan_weeks[0].days[1].day_name).toBe('środa');
      expect(correctedResponse.plan_weeks[0].days[2].day_name).toBe('poniedziałek');
      
      // Workouts should be preserved, only days corrected
      expect(correctedResponse.plan_weeks[0].days[0].type).toBe('easy_run');
      expect(correctedResponse.plan_weeks[0].days[1].type).toBe('intervals');
      expect(correctedResponse.plan_weeks[0].days[2].type).toBe('long_run');
      
      console.log('🔧 Original AI response days:', wrongResponse.plan_weeks[0].days.map(d => d.day_name));
      console.log('✅ Corrected response days:', correctedResponse.plan_weeks[0].days.map(d => d.day_name));
    });
  });
});