const cacheService = require('../services/cache.service');

/**
 * Middleware de cache pour les requêtes GET
 * @param {string} prefix - Préfixe pour la clé de cache
 * @param {number} expiration - Durée de vie du cache en secondes (optionnel)
 */
const cacheMiddleware = (prefix, expiration) => async (req, res, next) => {
    // Ne mettre en cache que les requêtes GET
    if (req.method !== 'GET') {
        return next();
    }

    try {
        // Générer une clé unique basée sur le préfixe et les paramètres de la requête
        const cacheKey = cacheService.generateKey(prefix, {
            query: req.query,
            params: req.params
        });

        // Vérifier si les données sont en cache
        const cachedData = await cacheService.get(cacheKey);
        
        if (cachedData) {
            return res.json(cachedData);
        }

        // Stocker la réponse originale pour la mettre en cache
        const originalJson = res.json;
        res.json = function(data) {
            // Restaurer la fonction json originale
            res.json = originalJson;
            
            // Mettre en cache uniquement les réponses réussies
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cacheService.set(cacheKey, data, expiration);
            }
            
            // Envoyer la réponse
            return res.json(data);
        };

        next();
    } catch (error) {
        // En cas d'erreur avec le cache, continuer sans cache
        next();
    }
};

module.exports = cacheMiddleware; 