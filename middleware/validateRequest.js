const logger = require('../config/logger');

const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            logger.warn('Validation error', { errors });
            
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation des données',
                errors
            });
        }
        next();
    };
};

module.exports = validateRequest; 