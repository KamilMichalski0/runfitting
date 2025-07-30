const express = require('express');
const router = express.Router();
const WeeklyScheduleController = require('../controllers/weekly-schedule.controller');
const authenticate = require('../middleware/supabaseAuth.middleware');

// Kontroler jest już eksportowany jako instancja
const weeklyScheduleController = WeeklyScheduleController;

/**
 * @swagger
 * tags:
 *   name: WeeklySchedule
 *   description: Zarządzanie harmonogramami dostarczania planów tygodniowych
 */

/**
 * Wszystkie endpointy wymagają uwierzytelnienia
 */
router.use(authenticate);

/**
 * POST /api/weekly-schedule
 * Tworzy nowy harmonogram dostarczania planów tygodniowych
 */
router.post('/', weeklyScheduleController.createSchedule);

/**
 * GET /api/weekly-schedule
 * Pobiera harmonogram dostarczania planów użytkownika
 */
router.get('/', weeklyScheduleController.getSchedule);

/**
 * PUT /api/weekly-schedule
 * Aktualizuje istniejący harmonogram dostarczania
 */
router.put('/', weeklyScheduleController.updateSchedule);

/**
 * POST /api/weekly-schedule/pause
 * Wstrzymuje harmonogram dostarczania na określony czas
 */
router.post('/pause', weeklyScheduleController.pauseSchedule);

/**
 * POST /api/weekly-schedule/resume
 * Wznawia wstrzymany harmonogram dostarczania
 */
router.post('/resume', weeklyScheduleController.resumeSchedule);

/**
 * POST /api/weekly-schedule/deactivate
 * Deaktywuje harmonogram dostarczania
 */
router.post('/deactivate', weeklyScheduleController.deactivateSchedule);

/**
 * POST /api/weekly-schedule/progress
 * Aktualizuje postęp wykonania planu tygodniowego
 */
router.post('/progress', weeklyScheduleController.updateProgress);

/**
 * POST /api/weekly-schedule/manual-delivery
 * Ręczne wygenerowanie planu tygodniowego (poza harmonogramem)
 */
router.post('/manual-delivery', weeklyScheduleController.manualDelivery);

/**
 * GET /api/weekly-schedule/history
 * Pobiera historię planów tygodniowych użytkownika
 */
router.get('/history', weeklyScheduleController.getHistory);

// Nowa trasa dla pobierania wszystkich planów
router.get('/all-plans', weeklyScheduleController.getAllWeeklyPlans);

/**
 * POST /api/weekly-schedule/new-plan
 * Generuje nowy plan tygodniowy (zaczynając od tygodnia 1)
 */
router.post('/new-plan', weeklyScheduleController.generateNewPlan);

/**
 * DELETE /api/weekly-schedule/delete-all
 * Usuwa wszystkie plany tygodniowe użytkownika (bulk delete)
 */
router.delete('/delete-all', weeklyScheduleController.deleteAllPlans);

module.exports = router; 