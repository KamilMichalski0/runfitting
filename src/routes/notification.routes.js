const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/supabaseAuth.middleware');
const { body, query } = require('express-validator');

/**
 * Walidatory dla różnych endpointów
 */

// Walidacja preferencji powiadomień
const validatePreferences = [
  body('channels').optional().isObject().withMessage('Channels must be an object'),
  body('channels.email.enabled').optional().isBoolean().withMessage('Email enabled must be boolean'),
  body('channels.sms.enabled').optional().isBoolean().withMessage('SMS enabled must be boolean'),
  body('channels.push.enabled').optional().isBoolean().withMessage('Push enabled must be boolean'),
  body('types').optional().isObject().withMessage('Types must be an object'),
  body('preferredTimes').optional().isObject().withMessage('Preferred times must be an object'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
  body('quietHours').optional().isObject().withMessage('Quiet hours must be an object')
];

// Walidacja subskrypcji push
const validatePushSubscription = [
  body('endpoint').notEmpty().isURL().withMessage('Valid endpoint URL is required'),
  body('keys').notEmpty().isObject().withMessage('Keys object is required'),
  body('keys.p256dh').notEmpty().isString().withMessage('p256dh key is required'),
  body('keys.auth').notEmpty().isString().withMessage('auth key is required'),
  body('platform').optional().isString().withMessage('Platform must be a string')
];

// Walidacja powiadomienia testowego
const validateTestNotification = [
  body('type').optional().isIn([
    'training_reminder',
    'motivational_message',
    'progress_report',
    'system_notification',
    'achievement'
  ]).withMessage('Invalid notification type'),
  body('channel').optional().isIn(['email', 'sms', 'push']).withMessage('Invalid channel'),
  body('message').optional().isString().withMessage('Message must be a string')
];

// Walidacja wysyłania powiadomienia
const validateSendNotification = [
  body('type').notEmpty().isIn([
    'training_reminder',
    'motivational_message',
    'progress_report',
    'system_notification',
    'achievement'
  ]).withMessage('Valid notification type is required'),
  body('userId').optional().isMongoId().withMessage('Valid user ID required'),
  body('userIds').optional().isArray().withMessage('User IDs must be an array'),
  body('data').optional().isObject().withMessage('Data must be an object')
];

// Walidacja planowania powiadomienia (admin)
const validateScheduleNotification = [
  ...validateSendNotification,
  body('scheduledFor').notEmpty().isISO8601().withMessage('Valid scheduled date is required')
];

// Walidacja parametrów zapytania dla historii
const validateHistoryQuery = [
  query('type').optional().isIn([
    'training_reminder',
    'motivational_message',
    'progress_report',
    'system_notification',
    'achievement'
  ]).withMessage('Invalid notification type'),
  query('channel').optional().isIn(['email', 'sms', 'push']).withMessage('Invalid channel'),
  query('status').optional().isIn([
    'pending',
    'sent',
    'delivered',
    'failed',
    'bounced',
    'clicked',
    'opened'
  ]).withMessage('Invalid status'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1')
];

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Zarządzanie powiadomieniami użytkowników
 */

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Pobranie preferencji powiadomień użytkownika
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferencje pobrane pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       type: object
 *                     quietHours:
 *                       type: object
 *       401:
 *         description: Brak autoryzacji
 *       404:
 *         description: Użytkownik nie znaleziony
 */
router.get('/preferences', authenticate, notificationController.getPreferences);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Aktualizacja preferencji powiadomień użytkownika
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channels:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                   sms:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                   push:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *               types:
 *                 type: object
 *               quietHours:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   start:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                       minute:
 *                         type: integer
 *                   end:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                       minute:
 *                         type: integer
 *     responses:
 *       200:
 *         description: Preferencje zaktualizowane pomyślnie
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autoryzacji
 */
router.put('/preferences', authenticate, validatePreferences, notificationController.updatePreferences);

/**
 * @swagger
 * /api/notifications/push/subscribe:
 *   post:
 *     summary: Subskrypcja push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - keys
 *             properties:
 *               endpoint:
 *                 type: string
 *                 format: uri
 *               keys:
 *                 type: object
 *                 required:
 *                   - p256dh
 *                   - auth
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *               platform:
 *                 type: string
 *                 enum: [web, mobile]
 *     responses:
 *       201:
 *         description: Subskrypcja utworzona pomyślnie
 *       400:
 *         description: Błędne dane subskrypcji
 *       401:
 *         description: Brak autoryzacji
 */
router.post('/push/subscribe', authenticate, validatePushSubscription, notificationController.subscribeToPush);

/**
 * @swagger
 * /api/notifications/push/unsubscribe:
 *   delete:
 *     summary: Wypisanie z push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wypisanie z subskrypcji pomyślne
 *       400:
 *         description: Brak endpoint
 *       401:
 *         description: Brak autoryzacji
 */
router.delete('/push/unsubscribe', authenticate, notificationController.unsubscribeFromPush);

/**
 * @swagger
 * /api/notifications/push/vapid-keys:
 *   get:
 *     summary: Pobranie kluczy VAPID
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Klucze VAPID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicKey:
 *                       type: string
 */
router.get('/push/vapid-keys', notificationController.getVapidKeys);

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Wysyłanie testowego powiadomienia
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [training_reminder, motivational_message, progress_report, system_notification, achievement]
 *               channel:
 *                 type: string
 *                 enum: [email, sms, push]
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Powiadomienie testowe wysłane
 *       400:
 *         description: Błędne parametry
 *       401:
 *         description: Brak autoryzacji
 */
router.post('/test', authenticate, validateTestNotification, notificationController.sendTestNotification);

/**
 * @swagger
 * /api/notifications/history:
 *   get:
 *     summary: Pobranie historii powiadomień użytkownika
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [training_reminder, motivational_message, progress_report, system_notification, achievement]
 *       - name: channel
 *         in: query
 *         schema:
 *           type: string
 *           enum: [email, sms, push]
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, sent, delivered, failed, bounced, clicked, opened]
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *     responses:
 *       200:
 *         description: Historia powiadomień
 *       401:
 *         description: Brak autoryzacji
 */
router.get('/history', authenticate, validateHistoryQuery, notificationController.getNotificationHistory);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Statystyki powiadomień użytkownika
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *     responses:
 *       200:
 *         description: Statystyki powiadomień
 *       401:
 *         description: Brak autoryzacji
 */
router.get('/stats', authenticate, notificationController.getNotificationStats);

/**
 * @swagger
 * /api/notifications/status:
 *   get:
 *     summary: Status serwisów powiadomień
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status wszystkich serwisów powiadomień
 *       401:
 *         description: Brak autoryzacji
 */
router.get('/status', authenticate, notificationController.getServicesStatus);

// === ENDPOINTY ADMINISTRACYJNE ===

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Wysyłanie powiadomienia (tylko administratorzy)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID pojedynczego użytkownika
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista ID użytkowników
 *               type:
 *                 type: string
 *                 enum: [training_reminder, motivational_message, progress_report, system_notification, achievement]
 *               data:
 *                 type: object
 *                 description: Dane powiadomienia
 *               options:
 *                 type: object
 *                 description: Opcje powiadomienia
 *     responses:
 *       200:
 *         description: Powiadomienie wysłane pomyślnie
 *       400:
 *         description: Błędne dane
 *       401:
 *         description: Brak autoryzacji
 *       403:
 *         description: Brak uprawnień administratora
 */
router.post('/send', authenticate, validateSendNotification, notificationController.sendNotification);

/**
 * @swagger
 * /api/notifications/schedule:
 *   post:
 *     summary: Zaplanowanie powiadomienia (tylko administratorzy)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - scheduledFor
 *             properties:
 *               userId:
 *                 type: string
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               type:
 *                 type: string
 *                 enum: [training_reminder, motivational_message, progress_report, system_notification, achievement]
 *               data:
 *                 type: object
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               options:
 *                 type: object
 *     responses:
 *       201:
 *         description: Powiadomienie zaplanowane pomyślnie
 *       400:
 *         description: Błędne dane
 *       401:
 *         description: Brak autoryzacji
 *       403:
 *         description: Brak uprawnień administratora
 */
router.post('/schedule', authenticate, validateScheduleNotification, notificationController.scheduleNotification);

/**
 * @swagger
 * /api/notifications/process-pending:
 *   post:
 *     summary: Przetwarzanie zaplanowanych powiadomień (wewnętrzny endpoint)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 default: 100
 *     responses:
 *       200:
 *         description: Powiadomienia przetworzone pomyślnie
 *       401:
 *         description: Brak autoryzacji
 *       403:
 *         description: Brak uprawnień
 */
router.post('/process-pending', notificationController.processPendingNotifications);

/**
 * @swagger
 * /api/notifications/webhook/{provider}:
 *   post:
 *     summary: Webhook dla statusu powiadomień
 *     tags: [Notifications]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [twilio, sendgrid]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook przetworzony pomyślnie
 *       400:
 *         description: Błędne dane webhook
 */
router.post('/webhook/:provider', notificationController.handleWebhook);

module.exports = router; 