const WeeklyPlanDeliveryService = require('../../services/weekly-plan-delivery.service');
const TrainingFormSubmission = require('../../models/running-form.model');
const WeeklyPlanSchedule = require('../../models/weekly-plan-schedule.model');
const mongoose = require('mongoose');

describe('Weekly Plan Integration - Training Days Flow', () => {
  let weeklyService;
  let testUserId = '507f1f77bcf86cd799439011';
  
  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/runfitting_test');
    }
    
    weeklyService = new WeeklyPlanDeliveryService();
  });

  beforeEach(async () => {
    // Clean up test data
    await TrainingFormSubmission.deleteMany({ userId: testUserId });
    await WeeklyPlanSchedule.deleteMany({ userId: testUserId });
  });

  afterAll(async () => {
    // Clean up test data
    await TrainingFormSubmission.deleteMany({ userId: testUserId });
    await WeeklyPlanSchedule.deleteMany({ userId: testUserId });
  });

  describe('prepareWeeklyPlanDataWithWeek', () => {
    test('should use training days from user form when available', async () => {
      // Arrange - Create a user form with specific training days
      const userForm = new TrainingFormSubmission({
        userId: testUserId,
        imie: 'Jan',
        nazwisko: 'Kowalski',
        wiek: 30,
        poziomZaawansowania: 'poczatkujacy',
        glownyCel: 'poprawa_kondycji',
        dniTreningowe: ['sobota', 'środa', 'poniedziałek'],
        iloscDniTreningowych: 3,
        createdAt: new Date()
      });
      await userForm.save();
      console.log('✅ Utworzono formularz z dniami:', userForm.dniTreningowe);

      // Create schedule with different training days to test priority
      const schedule = new WeeklyPlanSchedule({
        userId: testUserId,
        userProfile: {
          name: 'Jan Kowalski',
          age: 30,
          level: 'poczatkujacy',
          goal: 'poprawa_kondycji',
          daysPerWeek: 3,
          
          // Different training days in schedule - should be overridden by form
          dniTreningowe: ['wtorek', 'czwartek', 'niedziela'],
          trainingDays: ['tuesday', 'thursday', 'sunday']
        },
        deliveryFrequency: 'weekly',
        isActive: true,
        progressTracking: {
          weekNumber: 1,
          currentPhase: 'base',
          totalWeeksDelivered: 0
        }
      });
      await schedule.save();
      console.log('✅ Utworzono harmonogram z dniami:', schedule.userProfile.dniTreningowe);

      // Act
      const weeklyData = await weeklyService.prepareWeeklyPlanDataWithWeek(schedule, 2);

      // Assert
      console.log('🔍 Rezultat weeklyData.dniTreningowe:', weeklyData.dniTreningowe);
      console.log('🔍 Rezultat weeklyData.userData.dniTreningowe:', weeklyData.userData?.dniTreningowe);
      
      // Should use training days from the user form (latest), not from schedule
      expect(weeklyData.dniTreningowe).toEqual(['sobota', 'środa', 'poniedziałek']);
      expect(weeklyData.userData.dniTreningowe).toEqual(['sobota', 'środa', 'poniedziałek']);
      
      // Week number should be as specified
      expect(weeklyData.weekNumber).toBe(2);
      
      // Should contain form data
      expect(weeklyData.imie).toBe('Jan');
      expect(weeklyData.poziomZaawansowania).toBe('poczatkujacy');
      expect(weeklyData.glownyCel).toBe('poprawa_kondycji');
    });

    test('should fallback to schedule training days when form has empty days', async () => {
      // Arrange - Create a user form with EMPTY training days
      const userForm = new TrainingFormSubmission({
        userId: testUserId,
        imie: 'Jan',
        nazwisko: 'Kowalski',
        wiek: 30,
        poziomZaawansowania: 'poczatkujacy',
        glownyCel: 'poprawa_kondycji',
        dniTreningowe: [], // Empty array
        iloscDniTreningowych: 3,
        createdAt: new Date()
      });
      await userForm.save();
      console.log('✅ Utworzono formularz z pustymi dniami:', userForm.dniTreningowe);

      // Create schedule with valid training days as fallback
      const schedule = new WeeklyPlanSchedule({
        userId: testUserId,
        userProfile: {
          name: 'Jan Kowalski',
          age: 30,
          level: 'poczatkujacy',
          goal: 'poprawa_kondycji',
          daysPerWeek: 3,
          
          // Should be used as fallback
          dniTreningowe: ['sobota', 'środa', 'poniedziałek'],
          trainingDays: ['saturday', 'wednesday', 'monday']
        },
        deliveryFrequency: 'weekly',
        isActive: true,
        progressTracking: {
          weekNumber: 1,
          currentPhase: 'base',
          totalWeeksDelivered: 0
        }
      });
      await schedule.save();
      console.log('✅ Utworzono harmonogram z fallback dniami:', schedule.userProfile.dniTreningowe);

      // Act
      const weeklyData = await weeklyService.prepareWeeklyPlanDataWithWeek(schedule, 2);

      // Assert
      console.log('🔍 Rezultat weeklyData.dniTreningowe:', weeklyData.dniTreningowe);
      console.log('🔍 Rezultat weeklyData.userData.dniTreningowe:', weeklyData.userData?.dniTreningowe);
      
      // Should use training days from the schedule (fallback)
      expect(weeklyData.dniTreningowe).toEqual(['sobota', 'środa', 'poniedziałek']);
      expect(weeklyData.userData.dniTreningowe).toEqual(['sobota', 'środa', 'poniedziałek']);
    });

    test('should throw error when both form and schedule have no training days', async () => {
      // Arrange - Create a user form with EMPTY training days
      const userForm = new TrainingFormSubmission({
        userId: testUserId,
        imie: 'Jan',
        nazwisko: 'Kowalski',
        wiek: 30,
        poziomZaawansowania: 'poczatkujacy',
        glownyCel: 'poprawa_kondycji',
        dniTreningowe: [], // Empty array
        iloscDniTreningowych: 3,
        createdAt: new Date()
      });
      await userForm.save();

      // Create schedule with ALSO empty training days
      const schedule = new WeeklyPlanSchedule({
        userId: testUserId,
        userProfile: {
          name: 'Jan Kowalski',
          age: 30,
          level: 'poczatkujacy',
          goal: 'poprawa_kondycji',
          daysPerWeek: 3,
          
          // Also empty
          dniTreningowe: [],
          trainingDays: []
        },
        deliveryFrequency: 'weekly',
        isActive: true,
        progressTracking: {
          weekNumber: 1,
          currentPhase: 'base',
          totalWeeksDelivered: 0
        }
      });
      await schedule.save();

      // Act & Assert
      await expect(
        weeklyService.prepareWeeklyPlanDataWithWeek(schedule, 2)
      ).rejects.toThrow('Brak dni treningowych do wygenerowania planu');
    });
  });

  describe('generateWeeklyPlan', () => {
    test('should create weekly data with correct training days for AI', async () => {
      // Arrange - Setup real scenario like user reported
      const userForm = new TrainingFormSubmission({
        userId: testUserId,
        imie: 'Jan',
        nazwisko: 'Kowalski',
        wiek: 30,
        poziomZaawansowania: 'poczatkujacy',
        glownyCel: 'poprawa_kondycji',
        dniTreningowe: ['sobota', 'środa', 'poniedziałek'], // User's actual days
        iloscDniTreningowych: 3,
        createdAt: new Date()
      });
      await userForm.save();

      const schedule = new WeeklyPlanSchedule({
        userId: testUserId,
        userProfile: {
          name: 'Jan Kowalski',
          age: 30,
          level: 'poczatkujacy',
          goal: 'poprawa_kondycji',
          daysPerWeek: 3,
          dniTreningowe: ['sobota', 'środa', 'poniedziałek'], // Matching
          trainingDays: ['saturday', 'wednesday', 'monday']
        },
        deliveryFrequency: 'weekly',
        isActive: true,
        progressTracking: {
          weekNumber: 1,
          currentPhase: 'base',
          totalWeeksDelivered: 0
        }
      });
      await schedule.save();

      // Act - This would call AI, but we'll capture the data before AI call
      console.log('🔍 Test: Sprawdzam dane przed wywołaniem AI...');
      
      // Just test the data preparation part (not actual AI call)
      const weeklyData = await weeklyService.prepareWeeklyPlanDataWithWeek(schedule, 1);
      
      // Assert
      expect(weeklyData.dniTreningowe).toEqual(['sobota', 'środa', 'poniedziałek']);
      expect(weeklyData.userData.dniTreningowe).toEqual(['sobota', 'środa', 'poniedziałek']);
      expect(weeklyData.weekNumber).toBe(1);
      
      console.log('✅ Test zakończony - dane są przygotowane poprawnie dla AI');
      console.log('📊 weeklyData.dniTreningowe:', weeklyData.dniTreningowe);
      console.log('📊 weeklyData.userData.dniTreningowe:', weeklyData.userData.dniTreningowe);
    });
  });
});