const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const auth = (req, res, next) => {
    try {
        // Récupérer le token du header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant ou invalide'
            });
        }

        // Extraire le token
        const token = authHeader.split(' ')[1];

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');

        // Ajouter les informations de l'utilisateur à la requête
        req.user = decoded;

        next();
    } catch (error) {
        logger.error('Erreur d\'authentification:', error);
        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré'
        });
    }
};

module.exports = auth; 