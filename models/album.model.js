const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Album:
 *       type: object
 *       required:
 *         - title
 *         - artistId
 *         - releaseDate
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'album
 *         title:
 *           type: string
 *           description: Titre de l'album
 *         artistId:
 *           type: string
 *           description: ID de l'artiste
 *         releaseDate:
 *           type: string
 *           format: date-time
 *           description: Date de sortie de l'album
 *         genres:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des genres musicaux
 *         coverImage:
 *           type: object
 *           properties:
 *             thumbnail:
 *               type: string
 *             medium:
 *               type: string
 *             large:
 *               type: string
 *           description: Images de couverture de l'album
 *         type:
 *           type: string
 *           enum: [album, single, ep]
 *           description: Type de l'album
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 */

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true
    },
    releaseDate: {
        type: Date,
        required: true
    },
    genres: [{
        type: String
    }],
    coverImage: {
        thumbnail: String,
        medium: String,
        large: String
    },
    trackCount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['album', 'single', 'ep'],
        default: 'album'
    },
    label: String,
    copyright: String,
    featuring: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist'
    }],
}, {
    timestamps: true
});

// Middleware pour mettre à jour updatedAt avant chaque sauvegarde
albumSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Album', albumSchema); 