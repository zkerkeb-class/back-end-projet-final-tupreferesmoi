const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.min': 'Le nom d\'utilisateur doit contenir au moins {#limit} caractères',
            'string.max': 'Le nom d\'utilisateur ne doit pas dépasser {#limit} caractères',
            'any.required': 'Le nom d\'utilisateur est requis'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'L\'email doit être une adresse valide',
            'any.required': 'L\'email est requis'
        }),
    
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': 'Le mot de passe doit contenir au moins {#limit} caractères',
            'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
            'any.required': 'Le mot de passe est requis'
        })
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'L\'email doit être une adresse valide',
            'any.required': 'L\'email est requis'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Le mot de passe est requis'
        })
});

const updateProfileSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .messages({
            'string.min': 'Le nom d\'utilisateur doit contenir au moins {#limit} caractères',
            'string.max': 'Le nom d\'utilisateur ne doit pas dépasser {#limit} caractères'
        }),
    
    email: Joi.string()
        .email()
        .messages({
            'string.email': 'L\'email doit être une adresse valide'
        }),

    bio: Joi.string()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'La bio ne doit pas dépasser {#limit} caractères'
        })
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Le mot de passe actuel est requis'
        }),
    
    newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': 'Le nouveau mot de passe doit contenir au moins {#limit} caractères',
            'string.pattern.base': 'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
            'any.required': 'Le nouveau mot de passe est requis'
        })
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema
}; 