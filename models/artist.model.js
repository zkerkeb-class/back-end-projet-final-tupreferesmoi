const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Artist:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'artiste
 *         name:
 *           type: string
 *           description: Nom de l'artiste
 *         genres:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des genres musicaux
 *         image:
 *           type: object
 *           properties:
 *             thumbnail:
 *               type: string
 *             medium:
 *               type: string
 *             large:
 *               type: string
 *           description: Images de l'artiste
 *         popularity:
 *           type: number
 *           description: Score de popularité de l'artiste
 *         biography:
 *           type: string
 *           description: Biographie de l'artiste
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 */

const artistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        bio: {
            type: String,
        },
        genres: [
            {
                type: String,
            },
        ],
        popularity: {
            type: Number,
            default: 0,
        },
        image: {
            thumbnail: String,
            medium: String,
            large: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Middleware pour mettre à jour updatedAt avant chaque sauvegarde
artistSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Artist", artistSchema);
