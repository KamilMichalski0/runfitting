const express = require('express');
const trainingPlanController = require('../controllers/training-plan.controller');
const { planValidators, trainingDayValidators, formValidators } = require('../validators/plan.validators');
const supabaseAuth = require('../middleware/supabaseAuth.middleware');
const { aiRateLimiter, jobStatusRateLimiter, backpressureMiddleware } = require('../middleware/ai-rate-limiter.middleware');
const BeginnerRulesMiddleware = require('../middleware/beginner-rules.middleware');
const ProgressiveFormMiddleware = require('../middleware/progressive-form.middleware');

const router = express.Router();

// Zastosuj middleware autoryzacji do wszystkich tras w tym pliku
router.use(supabaseAuth);

/**
 * @swagger
 * tags:
 *   name: Plany Treningowe
 *   description: Operacje związane z planami treningowymi
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Plan:
 *       type: object
 *       required:
 *         - name
 *         - goal
 *         - level
 *         - duration
 *       properties:
 *         name:
 *           type: string
 *           description: Nazwa planu treningowego
 *         goal:
 *           type: string
 *           enum: [strength, muscle_gain, fat_loss, endurance, general_fitness, rehabilitation, custom]
 *           description: Cel planu treningowego
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced, expert]
 *           description: Poziom zaawansowania planu
 *         duration:
 *           type: integer
 *           description: Czas trwania planu w tygodniach
 *         daysPerWeek:
 *           type: integer
 *           minimum: 1
 *           maximum: 7
 *           description: Liczba dni treningowych w tygodniu
 *         description:
 *           type: string
 *           description: Opis planu
 *     TrainingDay:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nazwa dnia treningowego
 *         description:
 *           type: string
 *           description: Opis treningu
 *         completed:
 *           type: boolean
 *           description: Czy trening został ukończony
 *         workouts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 */

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Pobranie wszystkich planów treningowych użytkownika
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista planów treningowych
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 *       401:
 *         description: Brak uwierzytelnienia
 *   post:
 *     summary: Tworzenie nowego planu treningowego
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Plan'
 *     responses:
 *       201:
 *         description: Plan treningowy utworzony pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.route('/')
  .get(trainingPlanController.getUserPlans)
  .post(planValidators.createPlan, aiRateLimiter, backpressureMiddleware, trainingPlanController.generatePlan);

/**
 * @swagger
 * /api/plans/{planId}:
 *   get:
 *     summary: Pobranie szczegółów planu treningowego
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *     responses:
 *       200:
 *         description: Szczegóły planu treningowego
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     plan:
 *                       $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Nieprawidłowy format ID planu
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan treningowy nie znaleziony
 *   delete:
 *     summary: Usunięcie planu treningowego
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *     responses:
 *       204:
 *         description: Plan został usunięty
 *       400:
 *         description: Nieprawidłowy format ID planu
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan treningowy nie znaleziony
 */
router.route('/:planId')
  .get(trainingPlanController.getPlanDetails)
  .delete(trainingPlanController.deletePlan);

/**
 * @swagger
 * /api/plans/{id}/current-week:
 *   get:
 *     summary: Pobranie aktualnego tygodnia treningu
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *     responses:
 *       200:
 *         description: Aktualny tydzień treningowy
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan treningowy nie znaleziony
 */
router.get('/:id/current-week', trainingPlanController.getCurrentWeek);

/**
 * @swagger
 * /api/plans/days:
 *   get:
 *     summary: Pobranie wszystkich dni treningowych
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista wszystkich dni treningowych
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.get('/days', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Endpoint w budowie',
    data: []
  });
});

/**
 * @swagger
 * /api/plans/{planId}/days:
 *   get:
 *     summary: Pobranie dni treningowych dla konkretnego planu
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *     responses:
 *       200:
 *         description: Lista dni treningowych dla planu
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan treningowy nie znaleziony
 */
router.get('/:planId/days', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Endpoint w budowie',
    data: []
  });
});

/**
 * @swagger
 * /api/plans/{planId}/days/{dayId}:
 *   put:
 *     summary: Aktualizacja dnia treningowego
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *       - in: path
 *         name: dayId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dnia treningowego
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainingDay'
 *     responses:
 *       200:
 *         description: Dzień treningowy zaktualizowany pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan lub dzień treningowy nie znaleziony
 */
router.route('/:planId/days/:dayId')
  .put((req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Endpoint w budowie'
    });
  });

/**
 * @swagger
 * /api/plans/{planId}/days/{dayId}/complete:
 *   post:
 *     summary: Oznaczenie treningu jako ukończony
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *       - in: path
 *         name: dayId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dnia treningowego
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notatki z treningu
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Ocena treningu (1-5)
 *     responses:
 *       200:
 *         description: Trening oznaczony jako ukończony
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan lub dzień treningowy nie znaleziony
 */
router.route('/:planId/days/:dayId/complete')
  .post((req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Endpoint w budowie'
    });
  });

/**
 * @swagger
 * /api/plans/{planId}/days/{dayId}/miss:
 *   post:
 *     summary: Oznaczenie treningu jako opuszczony
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *       - in: path
 *         name: dayId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dnia treningowego
 *     responses:
 *       200:
 *         description: Trening oznaczony jako opuszczony
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan lub dzień treningowy nie znaleziony
 */
router.route('/:planId/days/:dayId/miss')
  .post((req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Endpoint w budowie'
    });
  });

/**
 * @swagger
 * /api/plans/form:
 *   post:
 *     summary: Zapisuje formularz biegowy i generuje plan treningowy
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainingFormSubmission'
 *     responses:
 *       201:
 *         description: Plan treningowy utworzony pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.post('/form', 
  formValidators.validateFormForPlanGeneration,
  ProgressiveFormMiddleware.validateProgressiveForm,
  BeginnerRulesMiddleware.validate48HourGap,
  BeginnerRulesMiddleware.validateProgressionEligibility,
  BeginnerRulesMiddleware.checkProgressionStatus,
  aiRateLimiter, 
  backpressureMiddleware, 
  trainingPlanController.generatePlan
);

/**
 * @swagger
 * /api/plans/form/save:
 *   post:
 *     summary: Zapisuje formularz biegowy bez generowania planu
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainingFormSubmission'
 *     responses:
 *       201:
 *         description: Formularz zapisany pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 */
// DEPRECATED: Form submission now handled through unified profile endpoint
// router.post('/form/save', trainingPlanController.saveRunningForm);

/**
 * @swagger
 * /api/plans/form/{formId}/generate:
 *   post:
 *     summary: Generuje plan na podstawie zapisanego formularza
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID formularza
 *     responses:
 *       201:
 *         description: Plan treningowy utworzony pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe lub formularz już przetworzony
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Formularz nie został znaleziony
 */
router.post('/form/:formId/generate', aiRateLimiter, backpressureMiddleware, trainingPlanController.generatePlanFromSavedForm);

/**
 * @swagger
 * /api/plans/regenerate/{formId}:
 *   post:
 *     summary: Regeneruje plan treningowy na podstawie istniejącego formularza
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID formularza do regeneracji planu
 *     responses:
 *       201:
 *         description: Plan treningowy został zregenerowany pomyślnie
 *       400:
 *         description: Nieprawidłowy format ID formularza
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Formularz nie został znaleziony
 */
router.post('/regenerate/:formId', aiRateLimiter, backpressureMiddleware, trainingPlanController.regeneratePlanFromForm);

/**
 * @swagger
 * /api/plans/progress:
 *   post:
 *     summary: Aktualizacja postępu w planie treningowym
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - weekNum
 *               - dayName
 *               - completed
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID planu treningowego
 *               weekNum:
 *                 type: integer
 *                 description: Numer tygodnia
 *               dayName:
 *                 type: string
 *                 description: Nazwa dnia
 *               completed:
 *                 type: boolean
 *                 description: Czy trening został ukończony
 *     responses:
 *       200:
 *         description: Postęp zaktualizowany pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan, tydzień lub dzień nie został znaleziony
 */
router.post('/progress', trainingPlanController.updateProgress);

// --- NOWE TRASY DLA MODYFIKACJI PLANU ---

/**
 * @swagger
 * /api/plans/{planId}/weeks/{weekIndex}/days/{dayIndex}/modify:
 *   put:
 *     summary: Modyfikuje konkretny dzień w planie treningowym
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *       - in: path
 *         name: weekIndex
 *         required: true
 *         schema:
 *           type: integer
 *           format: int32
 *         description: Indeks tygodnia (0-based)
 *       - in: path
 *         name: dayIndex
 *         required: true
 *         schema:
 *           type: integer
 *           format: int32
 *         description: Indeks dnia w tygodniu (0-based)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modificationReason
 *             properties:
 *               modificationReason:
 *                 type: string
 *                 description: Powód modyfikacji dnia
 *                 example: "Potrzebuję lżejszego treningu dzisiaj."
 *     responses:
 *       200:
 *         description: Dzień w planie został zmodyfikowany
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     plan:
 *                       $ref: '#/components/schemas/Plan' # Zakładając, że zwracany jest cały plan
 *       400:
 *         description: Nieprawidłowe dane wejściowe (np. brak powodu, nieprawidłowe indeksy)
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan treningowy nie znaleziony
 */
router.put(
  '/:planId/weeks/:weekIndex/days/:dayIndex/modify',
  // TODO: Rozważyć dodanie walidatorów dla parametrów ścieżki i ciała żądania
  trainingPlanController.modifyPlanDay
);

/**
 * @swagger
 * /api/plans/{planId}/weeks/{weekIndex}/modify:
 *   put:
 *     summary: Modyfikuje cały tydzień w planie treningowym
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID planu treningowego
 *       - in: path
 *         name: weekIndex
 *         required: true
 *         schema:
 *           type: integer
 *           format: int32
 *         description: Indeks tygodnia (0-based)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modificationReason
 *             properties:
 *               modificationReason:
 *                 type: string
 *                 description: Powód modyfikacji tygodnia
 *                 example: "Chcę zamienić trening siłowy na biegowy w tym tygodniu."
 *     responses:
 *       200:
 *         description: Tydzień w planie został zmodyfikowany
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     plan:
 *                       $ref: '#/components/schemas/Plan' # Zakładając, że zwracany jest cały plan
 *       400:
 *         description: Nieprawidłowe dane wejściowe (np. brak powodu, nieprawidłowy indeks)
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Plan treningowy nie znaleziony
 */
router.put(
  '/:planId/weeks/:weekIndex/modify',
  // TODO: Rozważyć dodanie walidatorów dla parametrów ścieżki i ciała żądania
  trainingPlanController.modifyPlanWeek
);

/**
 * @swagger
 * /api/plans/status/{jobId}:
 *   get:
 *     summary: Pobiera status zadania generowania planu treningowego
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID zadania AI
 *     responses:
 *       200:
 *         description: Status zadania
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed, cancelled]
 *                     progress:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Zadanie nie zostało znalezione
 */
router.get('/status/:jobId', jobStatusRateLimiter, trainingPlanController.getJobStatus);

/**
 * @swagger
 * /api/plans/validate-form:
 *   post:
 *     summary: Waliduje formularz treningowy bez generowania planu
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainingFormSubmission'
 *     responses:
 *       200:
 *         description: Formularz jest poprawny
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     formContext:
 *                       type: object
 *                       description: Kontekst formularza na podstawie wybranego celu
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Błędy walidacji
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.post('/validate-form', 
  formValidators.validateFormForPlanGeneration,
  ProgressiveFormMiddleware.validateProgressiveForm,
  BeginnerRulesMiddleware.validate48HourGap,
  BeginnerRulesMiddleware.validateProgressionEligibility,
  BeginnerRulesMiddleware.checkProgressionStatus,
  (req, res) => {
    // Jeśli doszliśmy do tego punktu, walidacja przeszła pomyślnie
    res.status(200).json({
      status: 'success',
      data: {
        valid: true,
        formContext: req.formContext || {},
        beginnerProgression: req.beginnerProgression || null,
        message: 'Formularz jest poprawny i gotowy do wygenerowania planu'
      }
    });
  }
);

/**
 * @swagger
 * /api/plans/test-validation:
 *   post:
 *     summary: Uruchamia testy walidacji formularza (tylko development)
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wyniki testów walidacji
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     passed:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     errors:
 *                       type: array
 *       403:
 *         description: Dostępne tylko w środowisku development
 */
router.post('/test-validation', (req, res) => {
  // Tylko w środowisku development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      status: 'error',
      message: 'Endpoint dostępny tylko w środowisku development'
    });
  }
  
  const FormValidationTester = require('../utils/form-validation-tester');
  
  FormValidationTester.runAllTests().then(results => {
    res.status(200).json({
      status: 'success',
      data: results
    });
  }).catch(error => {
    res.status(500).json({
      status: 'error',
      message: 'Błąd podczas wykonywania testów walidacji',
      error: error.message
    });
  });
});

/**
 * @swagger
 * /api/plans/test-professional-structure:
 *   post:
 *     summary: Testuje profesjonalną strukturę treningową (tylko development)
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               week:
 *                 type: number
 *                 default: 1
 *                 description: Numer tygodnia do testowania
 *               workoutNumber:
 *                 type: number
 *                 default: 1
 *                 description: Numer treningu w tygodniu
 *     responses:
 *       200:
 *         description: Wyniki testów profesjonalnej struktury
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     heartRateZones:
 *                       type: object
 *                     trainingComponents:
 *                       type: object
 *                     beginnerProgression:
 *                       type: object
 *                     exampleWorkout:
 *                       type: object
 *                     formattedDescription:
 *                       type: string
 *       403:
 *         description: Dostępne tylko w środowisku development
 */
router.post('/test-professional-structure', (req, res) => {
  // Tylko w środowisku development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      status: 'error',
      message: 'Endpoint dostępny tylko w środowisku development'
    });
  }
  
  try {
    const { 
      HEART_RATE_ZONES, 
      TRAINING_COMPONENTS, 
      BEGINNER_PROGRESSION_PATTERN,
      generateDetailedWorkout,
      formatWorkoutDescription 
    } = require('../templates/professional-training-structure');
    
    const { week = 1, workoutNumber = 1 } = req.body;
    
    // Wygeneruj przykładowy trening
    const exampleWorkout = generateDetailedWorkout(week, workoutNumber, 'beginner');
    const formattedDescription = formatWorkoutDescription(exampleWorkout);
    
    res.status(200).json({
      status: 'success',
      data: {
        heartRateZones: HEART_RATE_ZONES,
        trainingComponents: TRAINING_COMPONENTS,
        beginnerProgression: BEGINNER_PROGRESSION_PATTERN,
        exampleWorkout,
        formattedDescription,
        testParameters: {
          week,
          workoutNumber,
          userLevel: 'beginner'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Błąd podczas testowania profesjonalnej struktury',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/plans/test-monotony:
 *   post:
 *     summary: Testuje czy wygenerowane plany są różnorodne (tylko development)
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               iterations:
 *                 type: number
 *                 default: 3
 *                 description: Liczba planów do wygenerowania i porównania
 *               userData:
 *                 type: object
 *                 description: Dane użytkownika do testowania
 *     responses:
 *       200:
 *         description: Analiza różnorodności planów
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     diversityScore:
 *                       type: number
 *                     analysis:
 *                       type: array
 *                     recommendations:
 *                       type: array
 *       403:
 *         description: Dostępne tylko w środowisku development
 */
router.post('/test-monotony', (req, res) => {
  // Tylko w środowisku development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      status: 'error',
      message: 'Endpoint dostępny tylko w środowisku development'
    });
  }
  
  const { iterations = 3, userData } = req.body;
  
  // Domyślne dane testowe jeśli nie podano
  const testUserData = userData || {
    imieNazwisko: 'Test User',
    wiek: 30,
    poziomZaawansowania: 'poczatkujacy',
    glownyCel: 'zaczac_biegac',
    dniTreningowe: ['poniedziałek', 'środa', 'piątek'],
    czasTreningu: 30
  };
  
  try {
    // Funkcja do analizy różnorodności w tygodniu
    const analyzeWeekDiversity = (week) => {
      const workouts = week.days || [];
      const structures = workouts.map(day => {
        const details = day.details || [];
        const mainWorkout = details.find(d => d.type === 'Bieg/Marsz') || {};
        return {
          day: day.day_of_week,
          description: mainWorkout.description || '',
          duration: mainWorkout.duration_minutes || 0,
          structure: mainWorkout.description ? mainWorkout.description.match(/\\d+x|\\d+ min/g) : []
        };
      });
      
      // Sprawdź podobieństwo
      const similarities = [];
      for (let i = 0; i < structures.length; i++) {
        for (let j = i + 1; j < structures.length; j++) {
          const sim1 = structures[i];
          const sim2 = structures[j];
          
          let similarity = 0;
          if (sim1.duration === sim2.duration) similarity += 0.3;
          if (sim1.description === sim2.description) similarity += 0.5;
          if (JSON.stringify(sim1.structure) === JSON.stringify(sim2.structure)) similarity += 0.4;
          
          if (similarity > 0.6) {
            similarities.push({
              days: [sim1.day, sim2.day],
              similarity: similarity,
              reason: similarity > 0.8 ? 'Identyczne' : 'Bardzo podobne'
            });
          }
        }
      }
      
      return {
        structures,
        similarities,
        diversityScore: 1 - (similarities.length / (structures.length * (structures.length - 1) / 2))
      };
    };
    
    // Symulacja generowania planów (ponieważ nie mamy pełnej integracji tutaj)
    const mockPlans = [];
    for (let i = 0; i < iterations; i++) {
      mockPlans.push({
        iteration: i + 1,
        plan_weeks: [{
          week_num: 1,
          days: [
            {
              day_of_week: 'poniedziałek',
              details: [{ type: 'Bieg/Marsz', duration_minutes: 25, description: '5x (2 min bieg/3 min marsz)' }]
            },
            {
              day_of_week: 'środa', 
              details: [{ type: 'Bieg/Marsz', duration_minutes: 25, description: '5x (2 min bieg/3 min marsz)' }]
            },
            {
              day_of_week: 'piątek',
              details: [{ type: 'Bieg/Marsz', duration_minutes: 25, description: '5x (2 min bieg/3 min marsz)' }]
            }
          ]
        }]
      });
    }
    
    // Analiza różnorodności
    const analyses = mockPlans.map(plan => {
      const weekAnalysis = analyzeWeekDiversity(plan.plan_weeks[0]);
      return {
        iteration: plan.iteration,
        ...weekAnalysis
      };
    });
    
    const overallDiversityScore = analyses.reduce((sum, a) => sum + a.diversityScore, 0) / analyses.length;
    
    const recommendations = [];
    if (overallDiversityScore < 0.5) {
      recommendations.push('KRYTYCZNE: Plany są bardzo monotonne - należy wzmocnić instrukcje różnorodności');
    }
    if (overallDiversityScore < 0.7) {
      recommendations.push('Plany wykazują pewną monotonię - rozważ dodanie bardziej szczegółowych wzorców');
    }
    if (overallDiversityScore > 0.8) {
      recommendations.push('Dobra różnorodność planów - kontynuuj obecne podejście');
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        diversityScore: Math.round(overallDiversityScore * 100) / 100,
        analysis: analyses,
        recommendations,
        testNote: 'To jest mockowa analiza - dla pełnej analizy potrzebna jest integracja z Gemini Service'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Błąd podczas testowania monotoniczności',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/plans/test-randomization:
 *   post:
 *     summary: Testuje system randomizacji planów (tylko development)
 *     tags: [Plany Treningowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userData:
 *                 type: object
 *                 description: Dane użytkownika do testowania
 *               iterations:
 *                 type: number
 *                 default: 5
 *                 description: Liczba iteracji testowania
 *     responses:
 *       200:
 *         description: Wyniki testów randomizacji
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     iterations:
 *                       type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     variantStats:
 *                       type: object
 *                     diversityScore:
 *                       type: number
 *       403:
 *         description: Dostępne tylko w środowisku development
 */
router.post('/test-randomization', (req, res) => {
  // Tylko w środowisku development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      status: 'error',
      message: 'Endpoint dostępny tylko w środowisku development'
    });
  }
  
  const { selectRandomizedPlanTemplate, getVariantStats } = require('../templates/plan-template-selector');
  const { userData, iterations = 5 } = req.body;
  
  // Domyślne dane testowe jeśli nie podano
  const testUserData = userData || {
    imieNazwisko: 'Jan Kowalski',
    wiek: 30,
    experienceLevel: 'intermediate',
    mainGoal: 'run_5k',
    daysPerWeek: 4,
    glownyCel: 'przebiegniecie_dystansu',
    poziomZaawansowania: 'sredniozaawansowany',
    dystansDocelowy: '5km',
    dniTreningowe: ['poniedziałek', 'środa', 'piątek', 'sobota']
  };
  
  const results = [];
  const variantCounts = {};
  
  try {
    // Testuj randomizację wielokrotnie
    for (let i = 0; i < iterations; i++) {
      const plan = selectRandomizedPlanTemplate(testUserData);
      
      const result = {
        iteration: i + 1,
        planId: plan?.id || 'unknown',
        variantId: plan?.variantId || 'none',
        variantFocus: plan?.variantFocus || 'none',
        variantDescription: plan?.variantDescription || 'none',
        planDescription: plan?.metadata?.description || 'none'
      };
      
      results.push(result);
      
      // Zlicz warianty
      const variantKey = result.variantId || 'none';
      variantCounts[variantKey] = (variantCounts[variantKey] || 0) + 1;
    }
    
    // Oblicz wskaźnik różnorodności
    const uniqueVariants = Object.keys(variantCounts).length;
    const diversityScore = uniqueVariants / iterations;
    
    // Pobierz statystyki systemu
    const systemStats = getVariantStats();
    
    res.status(200).json({
      status: 'success',
      data: {
        iterations,
        results,
        variantCounts,
        diversityScore: Math.round(diversityScore * 100) / 100,
        systemStats,
        analysis: {
          uniqueVariantsGenerated: uniqueVariants,
          mostCommonVariant: Object.entries(variantCounts).reduce((a, b) => variantCounts[a[0]] > variantCounts[b[0]] ? a : b),
          diversityAnalysis: diversityScore > 0.7 ? 'Wysoka różnorodność' : diversityScore > 0.4 ? 'Średnia różnorodność' : 'Niska różnorodność'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Błąd podczas testowania randomizacji',
      error: error.message
    });
  }
});

module.exports = router; 