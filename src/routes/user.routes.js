const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const {
  validateProfileUpdate,
  validateTrainingHistory,
  validateTrainingGoal
} = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Użytkownicy
 *   description: Operacje związane z użytkownikami
 */

// --- Endpointy dotyczące profilu użytkownika ---
router.get('/profile', userController.getProfile);
router.patch('/profile', validateProfileUpdate, userController.updateProfile);

// --- Endpointy dotyczące celów i historii treningowej ---
router.put('/me/training-goals', validateTrainingGoal, userController.updateTrainingGoals);
router.put('/me/training-history', validateTrainingHistory, userController.updateTrainingHistory);

// --- Endpointy kalkulatorów ---
router.get('/me/heart-rate-zones', userController.getHeartRateZones);
router.get('/me/training-paces', userController.getTrainingPaces);

// Chronione endpointy (autoryzacja globalna przez supabaseAuth)
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Pobieranie profilu zalogowanego użytkownika
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil użytkownika
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Aktualizacja profilu użytkownika
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: Profil zaktualizowany pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.patch('/profile', validateProfileUpdate, userController.updateProfile);

// --- (opcjonalnie) Endpoint listy użytkowników dla admina (do usunięcia lub refaktoryzacji) ---
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Pobieranie listy wszystkich użytkowników (tylko dla administratorów)
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista wszystkich użytkowników
 *       401:
 *         description: Brak uwierzytelnienia
 *       403:
 *         description: Brak uprawnień
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lista wszystkich użytkowników - tylko dla administratorów'
  });
});

module.exports = router;