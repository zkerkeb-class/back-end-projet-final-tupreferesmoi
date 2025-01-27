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

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags:
 *       - Utilisateurs
 *     summary: Inscription d'un nouvel utilisateur
 *     description: Permet à un utilisateur de créer un nouveau compte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nom d'utilisateur
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe (min 6 caractères)
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/register', authLimiter, validateRequest(registerSchema), userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags:
 *       - Utilisateurs
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT
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
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/login', authLimiter, validateRequest(loginSchema), userController.login);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags:
 *       - Utilisateurs
 *     summary: Obtenir le profil utilisateur
 *     description: Retourne les informations du profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non authentifié
 */
router.get('/profile', auth, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags:
 *       - Utilisateurs
 *     summary: Mettre à jour le profil
 *     description: Permet à l'utilisateur de mettre à jour son profil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.put('/profile', auth, validateRequest(updateProfileSchema), userController.updateProfile);

// Routes protégées avec validation
router.put('/password', auth, validateRequest(changePasswordSchema), userController.changePassword);
router.put('/privacy', auth, userController.updatePrivacySettings);
router.delete('/account', auth, userController.deleteAccount);

module.exports = router; 