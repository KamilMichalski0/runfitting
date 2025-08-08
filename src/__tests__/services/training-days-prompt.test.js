const GeminiService = require('../../services/gemini.service');

describe('Training Days in AI Prompt Generation', () => {
  let geminiService;
  
  beforeEach(() => {
    geminiService = new GeminiService({}, {});
  });

  describe('prepareWeeklyPlanPrompt', () => {
    test('should include user-specific training days in prompt', () => {
      // Arrange - weeklyData with user's actual training days
      const weeklyData = {
        name: 'Jan Kowalski',
        age: 30,
        level: 'poczatkujacy',
        goal: 'poprawa_kondycji',
        daysPerWeek: 3,
        weekNumber: 1,
        currentPhase: 'base',
        deliveryFrequency: 'weekly',
        
        // User's actual training days from form
        dniTreningowe: ['sobota', 'środa', 'poniedziałek'],
        
        recentPerformance: {
          averageCompletion: 0.8,
          trend: 'improving',
          recommendation: 'maintain'
        },
        
        progressionRate: 1.0,
        longTermGoal: { targetEvent: 'general_fitness' }
      };

      // Act
      const prompt = geminiService.prepareWeeklyPlanPrompt(weeklyData);

      // Assert - check that user's specific training days are mentioned
      expect(prompt).toContain('UŻYJ DOKŁADNIE TYCH DNI TRENINGOWYCH: sobota, środa, poniedziałek');
      
      // Should NOT contain default training days
      expect(prompt).not.toContain('poniedziałek, środa, piątek');
      
      console.log('=== Generated Prompt ===');
      console.log(prompt);
      console.log('========================');
    });

    test('should include training days in weekly context', () => {
      // Arrange
      const weeklyData = {
        name: 'Jan Kowalski',
        age: 30,
        level: 'poczatkujacy',
        goal: 'poprawa_kondycji',
        daysPerWeek: 3,
        weekNumber: 1,
        dniTreningowe: ['sobota', 'środa', 'poniedziałek'],
        weeklyDistance: 10,
        hasInjuries: false,
        
        // Add required recentPerformance for context generation
        recentPerformance: {
          averageCompletion: 0.8,
          trend: 'improving',
          recommendation: 'maintain'
        },
        
        longTermGoal: { targetEvent: 'general_fitness' }
      };

      // Act
      const context = geminiService.buildWeeklyContext(weeklyData);

      // Assert
      expect(context).toContain('Wybrane dni treningowe: sobota, środa, poniedziałek');
      
      console.log('=== Generated Context ===');
      console.log(context);
      console.log('=========================');
    });

    test('should handle userData nested training days', () => {
      // Arrange - weeklyData with training days in userData
      const weeklyData = {
        name: 'Jan Kowalski',
        age: 30,
        level: 'poczatkujacy',
        goal: 'poprawa_kondycji',
        daysPerWeek: 3,
        weekNumber: 1,
        currentPhase: 'base',
        deliveryFrequency: 'weekly',
        
        // Training days in userData (like from form processing)
        userData: {
          dniTreningowe: ['sobota', 'środa', 'poniedziałek']
        },
        
        recentPerformance: {
          averageCompletion: 0.8,
          trend: 'improving',
          recommendation: 'maintain'
        },
        
        progressionRate: 1.0,
        longTermGoal: { targetEvent: 'general_fitness' }
      };

      // Act
      const prompt = geminiService.prepareWeeklyPlanPrompt(weeklyData);
      const context = geminiService.buildWeeklyContext(weeklyData);

      // Assert
      expect(prompt).toContain('UŻYJ DOKŁADNIE TYCH DNI TRENINGOWYCH: sobota, środa, poniedziałek');
      expect(context).toContain('Wybrane dni treningowe: sobota, środa, poniedziałek');
    });

    test('should handle fallback training day sources correctly', () => {
      // Arrange - test priority of different sources
      const weeklyData = {
        name: 'Jan Kowalski',
        age: 30,
        level: 'poczatkujacy',
        goal: 'poprawa_kondycji',
        daysPerWeek: 3,
        weekNumber: 1,
        currentPhase: 'base',
        deliveryFrequency: 'weekly',
        
        // Multiple sources - dniTreningowe should have priority
        dniTreningowe: ['sobota', 'środa', 'poniedziałek'],
        trainingDays: ['monday', 'wednesday', 'friday'],
        userData: {
          dniTreningowe: ['wtorek', 'czwartek', 'niedziela'],
          trainingDays: ['tuesday', 'thursday', 'sunday']
        },
        
        recentPerformance: {
          averageCompletion: 0.8,
          trend: 'improving',
          recommendation: 'maintain'
        },
        
        progressionRate: 1.0,
        longTermGoal: { targetEvent: 'general_fitness' },
        weeklyDistance: 10,
        hasInjuries: false
      };

      // Act
      const prompt = geminiService.prepareWeeklyPlanPrompt(weeklyData);
      const context = geminiService.buildWeeklyContext(weeklyData);

      // Assert - should use the first available source (dniTreningowe)
      expect(prompt).toContain('UŻYJ DOKŁADNIE TYCH DNI TRENINGOWYCH: sobota, środa, poniedziałek');
      expect(context).toContain('Wybrane dni treningowe: sobota, środa, poniedziałek');
      
      // Should not contain other sources
      expect(prompt).not.toContain('monday, wednesday, friday');
      expect(prompt).not.toContain('wtorek, czwartek, niedziela');
    });

    test('should handle missing training days gracefully', () => {
      // Arrange - weeklyData without training days
      const weeklyData = {
        name: 'Jan Kowalski',
        age: 30,
        level: 'poczatkujacy',
        goal: 'poprawa_kondycji',
        daysPerWeek: 3,
        weekNumber: 1,
        currentPhase: 'base',
        deliveryFrequency: 'weekly',
        
        // No training days specified
        
        recentPerformance: {
          averageCompletion: 0.8,
          trend: 'improving',
          recommendation: 'maintain'
        },
        
        progressionRate: 1.0,
        longTermGoal: { targetEvent: 'general_fitness' },
        weeklyDistance: 10,
        hasInjuries: false
      };

      // Act
      const prompt = geminiService.prepareWeeklyPlanPrompt(weeklyData);
      const context = geminiService.buildWeeklyContext(weeklyData);

      // Assert - should not add training days requirement line
      expect(prompt).not.toContain('UŻYJ DOKŁADNIE TYCH DNI TRENINGOWYCH:');
      expect(context).not.toContain('Wybrane dni treningowe:');
      
      console.log('=== Prompt without training days ===');
      console.log(prompt);
      console.log('====================================');
    });
  });
});