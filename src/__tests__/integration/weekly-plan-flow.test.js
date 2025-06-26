const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const { connectDB, closeDB } = require('../../config/database');

// Modele
const WeeklyPlanSchedule = require('../../models/weekly-plan-schedule.model');
const TrainingPlan = require('../../models/training-plan.model');

// Mock token dla testów
const mockUserId = '59d74ec1-aa49-410c-9582-3ac3000b9350';
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1OWQ3NGVjMS1hYTQ5LTQxMGMtOTU4Mi0zYWMzMDAwYjkzNTAiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE1MTYyMzkwMjJ9.test';

describe('Weekly Plan Flow Integration Tests', () => {
  let server;

  beforeAll(async () => {
    // Ustaw zmienne środowiskowe dla testów
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/runfitting_test';
    process.env.SUPABASE_JWT_SECRET = 'test-secret';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-key';
    
    await connectDB();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await closeDB();
  });

  beforeEach(async () => {
    await WeeklyPlanSchedule.deleteMany({});
    await TrainingPlan.deleteMany({});
  });

  describe('Kompletny flow planów tygodniowych', () => {
    test('1. Zapisanie formularza → automatyczne utworzenie harmonogramu → generowanie pierwszego planu', async () => {
      const formData = {
        imieNazwisko: 'Jan Kowalski',
        email: 'jan@test.com',
        wiek: 30,
        poziomZaawansowania: 'początkujący',
        glownyCel: 'zaczac_biegac',
        dystansDocelowy: '5km',
        dniTreningowe: ['poniedziałek', 'środa', 'piątek'],
        czasDostepny: 30,
        preferowaneGodziny: ['rano'],
        aktualnyDystansTygodniowy: 0, // POCZĄTKUJĄCY - 0 km!
        ostatniTrening: 'nigdy',
        kontuzje: false,
        tetnoSpoczynkowe: 65,
        wagaCiala: 75,
        wzrost: 180,
        plec: 'mężczyzna'
      };

      const formResponse = await request(app)
        .post('/api/plans/form/save')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(formData)
        .expect(201);

      expect(formResponse.body).toHaveProperty('success', true);
      expect(formResponse.body).toHaveProperty('scheduleId');
      expect(formResponse.body).toHaveProperty('firstPlanId');

      const schedule = await WeeklyPlanSchedule.findById(formResponse.body.scheduleId);
      expect(schedule).toBeTruthy();
      expect(schedule.userProfile.weeklyDistance).toBe(0);
      expect(schedule.userProfile.level).toBe('początkujący');
    });

    test('2. Pobieranie harmonogramu użytkownika', async () => {
      const schedule = new WeeklyPlanSchedule({
        userId: mockUserId,
        userProfile: {
          name: 'Jan Kowalski',
          age: 30,
          level: 'początkujący',
          goal: 'zaczac_biegac',
          daysPerWeek: 3,
          weeklyDistance: 0,
          hasInjuries: false
        },
        deliveryFrequency: 'weekly',
        deliveryDay: 'sunday',
        deliveryTime: '18:00',
        timezone: 'Europe/Warsaw',
        nextDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await schedule.save();

      const response = await request(app)
        .get('/api/weekly-schedule')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.schedule.userProfile.weeklyDistance).toBe(0);
    });

    test('3. Health check endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('RunFitting API');
    });
  });
});

// Helper functions
function createMockJWT(userId = mockUserId) {
  // W rzeczywistej aplikacji używaj prawdziwego JWT
  // To jest tylko mock dla testów
  return mockToken;
}

// Cleanup helper
afterAll(async () => {
  // Zamknij wszystkie połączenia
  await mongoose.connection.close();
}); 