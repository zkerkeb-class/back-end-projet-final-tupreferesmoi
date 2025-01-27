const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// Limiter général pour toutes les routes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    message: {
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard.'
    },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

// Limiter plus strict pour les routes d'authentification
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // Limite chaque IP à 5 tentatives par heure
    message: {
        success: false,
        message: 'Trop de tentatives de connexion, veuillez réessayer dans une heure.'
    },
    handler: (req, res, next, options) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

// Limiter pour les routes d'upload
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 50, // Limite chaque IP à 50 uploads par heure
    message: {
        success: false,
        message: 'Trop d\'uploads, veuillez réessayer plus tard.'
    },
    handler: (req, res, next, options) => {
        logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

module.exports = {
    globalLimiter,
    authLimiter,
    uploadLimiter
}; 