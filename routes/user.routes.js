const express = require('express');
const { authLimiter } = require('../config/rateLimit');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes publiques avec limiteur d'authentification
router.post('/register', authLimiter, userController.register);
router.post('/login', authLimiter, userController.login);

// Routes protégées (nécessitent une authentification)
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/password', auth, userController.changePassword);
router.put('/privacy', auth, userController.updatePrivacySettings);
router.delete('/account', auth, userController.deleteAccount);

module.exports = router; 