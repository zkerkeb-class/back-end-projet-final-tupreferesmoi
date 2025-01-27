const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Track:
 *       type: object
 *       required:
 *         - title
 *         - albumId
 *         - duration
 *         - fileUrl
 *         - trackNumber
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la piste
 *         title:
 *           type: string
 *           description: Titre de la piste
 *         albumId:
 *           type: string
 *           description: ID de l'album associé
 *         duration:
 *           type: number
 *           description: Durée de la piste en secondes
 *         fileUrl:
 *           type: string
 *           description: URL du fichier audio
 *         lyrics:
 *           type: string
 *           description: Paroles de la chanson
 *         genres:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des genres musicaux
 *         trackNumber:
 *           type: number
 *           description: Numéro de la piste dans l'album
 *         popularity:
 *           type: number
 *           description: Score de popularité de la piste
 *         featuring:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des IDs des artistes en featuring
 *         previewUrl:
 *           type: string
 *           description: URL de l'aperçu audio
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 */

const trackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    lyrics: String,
    genres: [{
        type: String
    }],
    trackNumber: {
        type: Number,
        required: true
    },
    popularity: {
        type: Number,
        default: 0
    },
    featuring: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist'
    }],
    previewUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour améliorer les performances de recherche
trackSchema.index({ title: 'text' });

// Middleware pour mettre à jour updatedAt avant chaque sauvegarde
trackSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Méthode virtuelle pour obtenir la durée formatée
trackSchema.virtual('durationFormatted').get(function() {
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

module.exports = mongoose.model('Track', trackSchema); 