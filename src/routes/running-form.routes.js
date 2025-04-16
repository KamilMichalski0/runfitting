const express = require('express');
const router = express.Router();
const trainingPlanController = require('../controllers/training-plan.controller');
const { validateRunningFormSubmission } = require('../validators/running-form.validators');

/**
 * @swagger
 * tags:
 *   name: Formularze biegowe
 *   description: Operacje związane z formularzami biegowymi
 */

/**
 * @swagger
 * /api/running-forms:
 *   post:
 *     summary: Dodaje nowy formularz biegowy
 *     tags: [Formularze biegowe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - age
 *               - email
 *               - experienceLevel
 *               - mainGoal
 *               - weeklyKilometers
 *               - trainingDaysPerWeek
 *               - hasInjuries
 *               - restingHeartRate
 *             properties:
 *               firstName:
 *                 type: string
 *               age:
 *                 type: integer
 *               email:
 *                 type: string
 *                 format: email
 *               experienceLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, professional]
 *               mainGoal:
 *                 type: string
 *                 enum: [run_5k, run_10k, half_marathon, marathon, ultra, weight_loss, endurance, speed]
 *               weeklyKilometers:
 *                 type: integer
 *               trainingDaysPerWeek:
 *                 type: integer
 *               hasInjuries:
 *                 type: boolean
 *               restingHeartRate:
 *                 type: object
 *                 properties:
 *                   known:
 *                     type: boolean
 *                   value:
 *                     type: integer
 *               personalBests:
 *                 type: object
 *                 properties:
 *                   fiveKm:
 *                     type: object
 *                     properties:
 *                       minutes:
 *                         type: integer
 *                       seconds:
 *                         type: integer
 *                   tenKm:
 *                     type: object
 *                     properties:
 *                       minutes:
 *                         type: integer
 *                       seconds:
 *                         type: integer
 *                   halfMarathon:
 *                     type: object
 *                     properties:
 *                       hours:
 *                         type: integer
 *                       minutes:
 *                         type: integer
 *                   marathon:
 *                     type: object
 *                     properties:
 *                       hours:
 *                         type: integer
 *                       minutes:
 *                         type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Formularz biegowy dodany pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.post('/', validateRunningFormSubmission, trainingPlanController.submitRunningForm);

/**
 * @swagger
 * /api/running-forms:
 *   get:
 *     summary: Pobiera wszystkie formularze biegowe użytkownika
 *     tags: [Formularze biegowe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista formularzy biegowych
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.get('/', trainingPlanController.getUserRunningForms);

/**
 * @swagger
 * /api/running-forms/{id}:
 *   get:
 *     summary: Pobiera szczegóły konkretnego formularza biegowego
 *     tags: [Formularze biegowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID formularza biegowego
 *     responses:
 *       200:
 *         description: Szczegóły formularza biegowego
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Nie znaleziono formularza biegowego
 */
router.get('/:id', trainingPlanController.getRunningFormDetails);

/**
 * @swagger
 * /api/running-forms/{id}/generate-plan:
 *   post:
 *     summary: Generuje plan treningowy na podstawie formularza biegowego
 *     tags: [Formularze biegowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID formularza biegowego
 *     responses:
 *       201:
 *         description: Plan treningowy wygenerowany pomyślnie
 *       400:
 *         description: Formularz już przetworzony lub błąd generowania
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Nie znaleziono formularza biegowego
 */
router.post('/:id/generate-plan', trainingPlanController.generatePlanFromForm);

/**
 * @swagger
 * /api/running-forms/{id}/generate-plan:
 *   post:
 *     summary: Generuje plan treningowy na podstawie formularza biegowego
 *     tags: [Formularze biegowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID formularza biegowego
 *       - in: query
 *         name: force
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Wymuszenie generowania planu, nawet jeśli formularz został już przetworzony (true/false)
 *     responses:
 *       201:
 *         description: Plan treningowy wygenerowany pomyślnie
 *       400:
 *         description: Formularz już przetworzony lub błąd generowania
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Nie znaleziono formularza biegowego
 */
router.post('/:id/generate-plan', trainingPlanController.generatePlanFromForm);

/**
 * @swagger
 * /api/running-forms/{id}/regenerate-plan:
 *   post:
 *     summary: Regeneruje plan treningowy na podstawie formularza biegowego, nawet jeśli został już przetworzony
 *     tags: [Formularze biegowe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID formularza biegowego
 *     responses:
 *       201:
 *         description: Plan treningowy wygenerowany pomyślnie
 *       401:
 *         description: Brak uwierzytelnienia
 *       404:
 *         description: Nie znaleziono formularza biegowego
 */
router.post('/:id/regenerate-plan', trainingPlanController.regeneratePlanFromForm);

module.exports = router; 