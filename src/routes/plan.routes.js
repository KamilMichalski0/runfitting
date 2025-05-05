const express = require('express');
const trainingPlanController = require('../controllers/training-plan.controller');
const { planValidators, trainingDayValidators } = require('../validators/plan.validators');
const supabaseAuth = require('../middleware/supabaseAuth.middleware');

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
  .post(planValidators.createPlan, trainingPlanController.generatePlan);

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
router.post('/form', trainingPlanController.generatePlan);

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
router.post('/form/save', trainingPlanController.saveRunningForm);

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
router.post('/form/:formId/generate', trainingPlanController.generatePlanFromSavedForm);

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
router.post('/regenerate/:formId', trainingPlanController.regeneratePlanFromForm);

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

module.exports = router; 