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

/**
 * GET /api/weekly-schedule/job-status/:jobId
 * Sprawdza status zadania generowania planu w kolejce Redis
 */
router.get('/job-status/:jobId', weeklyScheduleController.getJobStatus);

/**
 * POST /api/weekly-schedule/test-job
 * Test endpoint for debugging job processing
 */
router.post('/test-job', async (req, res) => {
  try {
    const aiJobService = require('../services/ai-job.service');
    const jobId = await aiJobService.testWeeklyPlanGeneration();
    res.json({ 
      status: 'success', 
      data: { 
        testJobId: jobId,
        message: 'Test job created - check console logs for processing status'
      }
    });
  } catch (error) {
    console.error('Test job error:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

/**
 * GET /api/weekly-schedule/debug-queue
 * Debug endpoint to check queue status
 */
router.get('/debug-queue', async (req, res) => {
  try {
    const aiJobService = require('../services/ai-job.service');
    await aiJobService.debugQueueStatus();
    res.json({ 
      status: 'success', 
      message: 'Queue status logged to console'
    });
  } catch (error) {
    console.error('Debug queue error:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

/**
 * POST /api/weekly-schedule/force-process
 * Force process waiting jobs manually
 */
router.post('/force-process', async (req, res) => {
  try {
    const aiJobService = require('../services/ai-job.service');
    const result = await aiJobService.forceProcessWaitingJobs();
    res.json({ 
      status: 'success', 
      data: result,
      message: 'Manual job processing attempted - check console logs'
    });
  } catch (error) {
    console.error('Force process error:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

/**
 * GET /api/weekly-schedule/debug-user
 * Debug endpoint to check user schedule status
 */
router.get('/debug-user', weeklyScheduleController.debugUserSchedule);

/**
 * POST /api/weekly-schedule/create-fallback
 * Create fallback schedule for user (debug endpoint)
 */
router.post('/create-fallback', weeklyScheduleController.createFallbackSchedule);

/**
 * GET /api/weekly-schedule/notifications
 * Server-Sent Events endpoint dla powiadomień w czasie rzeczywistym
 */
router.get('/notifications', weeklyScheduleController.getNotifications);

module.exports = router; 