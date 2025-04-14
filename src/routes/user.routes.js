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

// Publiczne endpointy
router.post('/register', validateRegistration, userController.register);
router.post('/login', validateLogin, userController.login);
router.get('/logout', userController.logout);
router.post('/forgotPassword', userController.forgotPassword);
router.patch('/resetPassword/:token', userController.resetPassword);

// Chronione endpointy - wymagają uwierzytelnienia
router.use(authenticate);

// Profil użytkownika
router.get('/profile', userController.getProfile);
router.patch('/profile', validateProfileUpdate, userController.updateProfile);
router.patch('/updatePassword', validatePasswordChange, userController.updatePassword);
router.delete('/deleteAccount', userController.deleteAccount);

// Endpointy tylko dla administratorów
router.use(restrictTo('admin'));

// Lista wszystkich użytkowników (tylko dla administratorów)
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lista wszystkich użytkowników - tylko dla administratorów'
  });
});

module.exports = router; 