const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

console.log('[USER ROUTES] Loading user.routes.js file');

// VERY SIMPLE TEST ROUTE AT THE TOP
router.get('/test-simple', (req, res) => {
  console.log('[DEBUG] Simple test route hit!');
  res.json({ message: 'Simple test works!' });
});
const supabaseAuth = require('../middleware/supabaseAuth.middleware');
const {
  validateProfileUpdate,
  validateTrainingHistory,
  validateTrainingGoal
} = require('../validators/user.validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID użytkownika generowane przez MongoDB
 *           example: 60d0fe4f5311236168a109ca
 *         name:
 *           type: string
 *           example: Jan Kowalski
 *         email:
 *           type: string
 *           format: email
 *           example: jan.kowalski@example.com
 *         role:
 *           type: string
 *           enum: [user, admin, coach]
 *           default: user
 *         active:
 *           type: boolean
 *           default: true
 *         hasFilledRunningForm:
 *           type: boolean
 *           default: false
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         age:
 *           type: integer
 *           minimum: 15
 *           maximum: 120
 *         weight:
 *           type: number
 *           format: float
 *           minimum: 30
 *           maximum: 300
 *           description: Waga w kg
 *         height:
 *           type: number
 *           minimum: 100
 *           maximum: 250
 *           description: Wzrost w cm
 *         phoneNumber:
 *           type: string
 *           example: "+48123456789"
 *         waistCircumference:
 *           type: number
 *           minimum: 30
 *           maximum: 200
 *           description: Obwód talii w cm
 *         restingHeartRate:
 *           type: number
 *           minimum: 30
 *           maximum: 100
 *           description: Tętno spoczynkowe (uderzenia na minutę)
 *         maxHeartRate:
 *           type: number
 *           minimum: 100
 *           maximum: 250
 *           description: Tętno maksymalne (uderzenia na minutę)
 *         experienceLevel:
 *           type: string
 *           enum: [poczatkujacy, sredniozaawansowany, zaawansowany]
 *         currentActivityLevel:
 *           type: string
 *           enum: [siedzacy, lekko_aktywny, umiarkowanie_aktywny, aktywny]
 *         chronotype:
 *           type: string
 *           enum: [ranny_ptaszek, nocny_marek, posredni]
 *         preferredTrainingTime:
 *           type: string
 *           enum: [rano, poludnie, wieczor, dowolnie]
 *         availableEquipment:
 *           type: array
 *           items:
 *             type: string
 *           example: [hantle, mata, skakanka]
 *         hasCurrentInjuries:
 *           type: boolean
 *           default: false
 *         hasHealthRestrictions:
 *           type: boolean
 *           default: false
 *         hasAllergies:
 *           type: boolean
 *           default: false
 *         mainFitnessGoal:
 *           type: string
 *           enum: [redukcja_masy_ciala, przebiegniecie_dystansu, zaczac_biegac, aktywny_tryb_zycia, zmiana_nawykow, powrot_po_kontuzji, poprawa_kondycji, inny_cel]
 *         fitnessGoals:
 *           type: array
 *           items:
 *             type: string
 *             enum: [weight_loss, muscle_gain, endurance, strength, flexibility, general_fitness]
 *         totalWorkouts:
 *           type: integer
 *           default: 0
 *         totalDistance:
 *           type: number
 *           default: 0
 *           description: w metrach
 *         totalDuration:
 *           type: number
 *           default: 0
 *           description: w sekundach
 *         totalCaloriesBurned:
 *           type: number
 *           default: 0
 *         bmi:
 *           type: string
 *           description: "Obliczone BMI (tylko do odczytu)"
 *           readOnly: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth: # Możesz przenieść to do głównej konfiguracji Swaggera, jeśli jeszcze tam nie jest
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Użytkownicy
 *   description: Operacje związane z użytkownikami
 */

// --- Endpointy dotyczące profilu użytkownika ---
router.get('/profile', supabaseAuth, userController.getProfile);
router.patch('/profile', supabaseAuth, validateProfileUpdate, userController.updateProfile);
router.get('/check-first-form', supabaseAuth, userController.checkFirstFormSubmission);

// --- Endpointy dotyczące celów i historii treningowej ---
router.put('/me/training-goals', supabaseAuth, validateTrainingGoal, userController.updateTrainingGoals);
router.put('/me/training-history', supabaseAuth, validateTrainingHistory, userController.updateTrainingHistory);

// --- Endpointy kalkulatorów ---
router.get('/me/heart-rate-zones', supabaseAuth, userController.getHeartRateZones);
router.get('/me/training-paces', supabaseAuth, userController.getTrainingPaces);

// Nowa trasa do pobierania limitów subskrypcji
router.get('/me/subscription-limits', supabaseAuth, userController.getSubscriptionLimits);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Brak uwierzytelnienia
 */

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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               age:
 *                 type: integer
 *               weight:
 *                 type: number
 *                 description: Waga w kg
 *               height:
 *                 type: number
 *                 description: Wzrost w cm
 *               phoneNumber:
 *                 type: string
 *               waistCircumference:
 *                 type: number
 *                 description: Obwód talii w cm
 *               restingHeartRate:
 *                 type: number
 *               maxHeartRate:
 *                 type: number
 *               experienceLevel:
 *                 type: string
 *                 enum: [poczatkujacy, sredniozaawansowany, zaawansowany]
 *               currentActivityLevel:
 *                 type: string
 *                 enum: [siedzacy, lekko_aktywny, umiarkowanie_aktywny, aktywny]
 *               chronotype:
 *                 type: string
 *                 enum: [ranny_ptaszek, nocny_marek, posredni]
 *               preferredTrainingTime:
 *                 type: string
 *                 enum: [rano, poludnie, wieczor, dowolnie]
 *               availableEquipment:
 *                 type: array
 *                 items:
 *                   type: string
 *               hasCurrentInjuries:
 *                 type: boolean
 *               hasHealthRestrictions:
 *                 type: boolean
 *               hasAllergies:
 *                 type: boolean
 *               mainFitnessGoal:
 *                 type: string
 *                 enum: [redukcja_masy_ciala, przebiegniecie_dystansu, zaczac_biegac, aktywny_tryb_zycia, zmiana_nawykow, powrot_po_kontuzji, poprawa_kondycji, inny_cel]
 *               fitnessGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [weight_loss, muscle_gain, endurance, strength, flexibility, general_fitness]
 *             example:
 *               name: "Jan Kowalski Nowy"
 *               email: "jan.nowy@example.com"
 *               age: 31
 *               weight: 75
 *               fitnessGoals: ["strength", "muscle_gain"]
 *     responses:
 *       200:
 *         description: Profil zaktualizowany pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 */


console.log('[USER ROUTES] Exporting router with registered routes');
module.exports = router;