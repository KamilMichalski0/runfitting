const WeeklyPlanDeliveryService = require('../../services/weekly-plan-delivery.service');
const WeeklyPlanSchedule = require('../../models/weekly-plan-schedule.model');
const TrainingPlan = require('../../models/training-plan.model');

// Mock logging to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarning: jest.fn()
}));

// Mock Gemini service to avoid API calls
jest.mock('../../services/gemini.service', () => {
  return jest.fn().mockImplementation(() => ({
    generateWeeklyTrainingPlan: jest.fn().mockResolvedValue({
      id: 'mock-plan',
      metadata: {
        discipline: 'running',
        target_group: 'beginners',
        target_goal: 'general_fitness',
        level_hint: 'beginner',
        days_per_week: 3,
        duration_weeks: 1,
        description: 'Test plan',
        author: 'Test'
      },
      plan_weeks: [{
        week_num: 1,
        focus: 'Base building',
        days: []
      }]
    })
  }));
});

describe('Weekly Plan Progression Tests', () => {
  let service;
  let mockSchedule;

  beforeEach(() => {
    service = new WeeklyPlanDeliveryService();
    
    // Create a mock schedule
    mockSchedule = {
      userId: 'test-user-123',
      userProfile: {
        name: 'Test User',
        age: 30,
        experienceLevel: 'beginner',
        mainGoal: 'start_running',
        daysPerWeek: 3
      },
      progressTracking: {
        weekNumber: 1,
        currentPhase: 'base',
        totalWeeksDelivered: 0,
        lastWeeklyDistance: 0,
        progressionRate: 1.0
      },
      longTermGoal: 'general_fitness',
      deliveryFrequency: 'weekly',
      adaptationSettings: {
        autoAdjust: true
      },
      recentPlans: [],
      _id: 'mock-schedule-id',
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock TrainingPlan save method
    TrainingPlan.prototype.save = jest.fn().mockResolvedValue({
      _id: 'mock-plan-id',
      weekNumber: 1
    });

    // Mock TrainingPlan.exists method
    TrainingPlan.exists = jest.fn().mockResolvedValue(true);
  });

  describe('Week Progression Logic', () => {
    test('Should generate Week 2 when progressing from Week 1 (resetToWeekOne=false)', async () => {
      // Arrange: User is currently on week 1
      mockSchedule.progressTracking.weekNumber = 1;

      // Act: Generate next week plan (progression)
      const result = await service.generateWeeklyPlan(mockSchedule, false);

      // Assert: Should generate week 2 and update progress tracking
      expect(result.weekNumber).toBe(2);
      expect(mockSchedule.progressTracking.weekNumber).toBe(2);
      expect(mockSchedule.progressTracking.totalWeeksDelivered).toBe(1);
    });

    test('Should generate Week 3 when progressing from Week 2 (resetToWeekOne=false)', async () => {
      // Arrange: User is currently on week 2
      mockSchedule.progressTracking.weekNumber = 2;
      mockSchedule.progressTracking.totalWeeksDelivered = 1;

      // Act: Generate next week plan (progression)
      const result = await service.generateWeeklyPlan(mockSchedule, false);

      // Assert: Should generate week 3 and update progress tracking
      expect(result.weekNumber).toBe(3);
      expect(mockSchedule.progressTracking.weekNumber).toBe(3);
      expect(mockSchedule.progressTracking.totalWeeksDelivered).toBe(2);
    });

    test('Should generate Week 1 when creating new plan (resetToWeekOne=true)', async () => {
      // Arrange: User was on week 5 but wants a new plan
      mockSchedule.progressTracking.weekNumber = 5;
      mockSchedule.progressTracking.totalWeeksDelivered = 4;

      // Act: Generate new plan (reset to week 1)
      const result = await service.generateWeeklyPlan(mockSchedule, true);

      // Assert: Should generate week 1 and reset progress tracking
      expect(result.weekNumber).toBe(1);
      expect(mockSchedule.progressTracking.weekNumber).toBe(1);
      expect(mockSchedule.progressTracking.totalWeeksDelivered).toBe(0);
      expect(mockSchedule.progressTracking.currentPhase).toBe('base');
    });

    test('Should handle new user starting from week 1', async () => {
      // Arrange: New user with no progress tracking
      delete mockSchedule.progressTracking;

      // Act: Generate first plan (progression - should start from week 1)
      const result = await service.generateWeeklyPlan(mockSchedule, false);

      // Assert: Should generate week 2 (1 + 1) and initialize progress tracking
      expect(result.weekNumber).toBe(2);
      expect(mockSchedule.progressTracking.weekNumber).toBe(2);
      expect(mockSchedule.progressTracking.totalWeeksDelivered).toBe(1);
    });

    test('Should correctly pass week number to plan generation data', async () => {
      // Arrange: User is on week 3
      mockSchedule.progressTracking.weekNumber = 3;

      // Act: Generate next week plan
      const result = await service.generateWeeklyPlan(mockSchedule, false);

      // Assert: prepareWeeklyPlanDataWithWeek should be called with week 4
      expect(result.weekNumber).toBe(4);
    });
  });

  describe('prepareWeeklyPlanDataWithWeek method', () => {
    test('Should prepare data with specified week number', () => {
      // Arrange
      const targetWeek = 5;

      // Act
      const result = service.prepareWeeklyPlanDataWithWeek(mockSchedule, targetWeek);

      // Assert
      expect(result.weekNumber).toBe(targetWeek);
      expect(result.planType).toBe('weekly');
      expect(result.deliveryFrequency).toBe('weekly');
    });

    test('Should handle missing schedule progressTracking', () => {
      // Arrange
      delete mockSchedule.progressTracking;
      const targetWeek = 3;

      // Act
      const result = service.prepareWeeklyPlanDataWithWeek(mockSchedule, targetWeek);

      // Assert
      expect(result.weekNumber).toBe(targetWeek);
      expect(result.currentPhase).toBe('base');
      expect(result.totalWeeksDelivered).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('Should handle missing userId gracefully', async () => {
      // Arrange
      mockSchedule.userId = '';

      // Act & Assert: Should not throw error
      const result = await service.generateWeeklyPlan(mockSchedule, false);
      expect(result).toBeDefined();
    });

    test('Should update recentPlans with correct week number', async () => {
      // Arrange
      mockSchedule.progressTracking.weekNumber = 2;

      // Act
      await service.generateWeeklyPlan(mockSchedule, false);

      // Assert
      expect(mockSchedule.recentPlans).toHaveLength(1);
      expect(mockSchedule.recentPlans[0].weekNumber).toBe(3);
    });

    test('Should not call updateProgress method for new plans', async () => {
      // Arrange
      mockSchedule.updateProgress = jest.fn();

      // Act: Generate new plan
      await service.generateWeeklyPlan(mockSchedule, true);

      // Assert: updateProgress should not be called for new plans
      expect(mockSchedule.updateProgress).not.toHaveBeenCalled();
    });
  });
});