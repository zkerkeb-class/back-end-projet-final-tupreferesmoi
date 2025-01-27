const express = require('express');
const { authLimiter } = require('../config/rateLimit');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { 
    registerSchema, 
    loginSchema, 
    updateProfileSchema, 
    changePasswordSchema 
} = require('../validation/user.schema');

const router = express.Router();

// Routes publiques avec limiteur d'authentification et validation
router.post('/register', authLimiter, validateRequest(registerSchema), userController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), userController.login);

// Routes protégées avec validation
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validateRequest(updateProfileSchema), userController.updateProfile);
router.put('/password', auth, validateRequest(changePasswordSchema), userController.changePassword);
router.put('/privacy', auth, userController.updatePrivacySettings);
router.delete('/account', auth, userController.deleteAccount);

module.exports = router; 