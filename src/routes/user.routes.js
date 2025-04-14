const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, restrictTo } = require('../middleware/auth.middleware');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange
} = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Użytkownicy
 *   description: Operacje związane z użytkownikami
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Użytkownicy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Użytkownik zarejestrowany pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       409:
 *         description: Użytkownik o podanym adresie email już istnieje
 */
router.post('/register', validateRegistration, userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [Użytkownicy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Zalogowano pomyślnie
 *       401:
 *         description: Nieprawidłowe dane logowania
 */
router.post('/login', validateLogin, userController.login);

/**
 * @swagger
 * /api/users/logout:
 *   get:
 *     summary: Wylogowanie użytkownika
 *     tags: [Użytkownicy]
 *     responses:
 *       200:
 *         description: Wylogowano pomyślnie
 */
router.get('/logout', userController.logout);

/**
 * @swagger
 * /api/users/forgotPassword:
 *   post:
 *     summary: Wysłanie linku do resetowania hasła
 *     tags: [Użytkownicy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Link do resetowania hasła wysłany
 *       404:
 *         description: Nie znaleziono użytkownika o podanym adresie email
 */
router.post('/forgotPassword', userController.forgotPassword);

/**
 * @swagger
 * /api/users/resetPassword/{token}:
 *   patch:
 *     summary: Resetowanie hasła za pomocą tokenu
 *     tags: [Użytkownicy]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token resetowania hasła
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - passwordConfirm
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Hasło zresetowane pomyślnie
 *       400:
 *         description: Nieprawidłowe dane lub token wygasł
 */
router.patch('/resetPassword/:token', userController.resetPassword);

// Chronione endpointy - wymagają uwierzytelnienia
router.use(authenticate);

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

/**
 * @swagger
 * /api/users/updatePassword:
 *   patch:
 *     summary: Zmiana hasła zalogowanego użytkownika
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - newPasswordConfirm
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               newPasswordConfirm:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Hasło zmienione pomyślnie
 *       400:
 *         description: Nieprawidłowe dane wejściowe
 *       401:
 *         description: Brak uwierzytelnienia lub nieprawidłowe aktualne hasło
 */
router.patch('/updatePassword', validatePasswordChange, userController.updatePassword);

/**
 * @swagger
 * /api/users/deleteAccount:
 *   delete:
 *     summary: Usunięcie konta użytkownika
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Konto usunięte pomyślnie
 *       401:
 *         description: Brak uwierzytelnienia
 */
router.delete('/deleteAccount', userController.deleteAccount);

// Endpointy tylko dla administratorów
router.use(restrictTo('admin'));

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