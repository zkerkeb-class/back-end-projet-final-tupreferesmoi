const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes protégées (nécessitent une authentification)
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/password', auth, userController.changePassword);
router.put('/privacy', auth, userController.updatePrivacySettings);
router.delete('/account', auth, userController.deleteAccount);

module.exports = router; 