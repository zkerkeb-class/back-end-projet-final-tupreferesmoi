const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Playlist:
 *       type: object
 *       required:
 *         - name
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la playlist
 *         name:
 *           type: string
 *           description: Nom de la playlist
 *         description:
 *           type: string
 *           description: Description de la playlist
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur propriétaire
 *         tracks:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des IDs des pistes
 *         isPublic:
 *           type: boolean
 *           description: Visibilité de la playlist
 *         coverImage:
 *           type: object
 *           properties:
 *             thumbnail:
 *               type: string
 *             medium:
 *               type: string
 *             large:
 *               type: string
 *           description: Images de couverture de la playlist
 *         totalDuration:
 *           type: number
 *           description: Durée totale de la playlist en secondes
 *         totalTracks:
 *           type: number
 *           description: Nombre total de pistes
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 */

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxLength: 500,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tracks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Track",
            },
        ],
        isPublic: {
            type: Boolean,
            default: true,
        },
        coverImage: {
            thumbnail: String,
            medium: String,
            large: String,
        },
        totalDuration: {
            type: Number,
            default: 0,
        },
        totalTracks: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index pour améliorer les performances de recherche
playlistSchema.index({ name: "text", description: "text" });
playlistSchema.index({ userId: 1, isPublic: 1 });

// Middleware pour mettre à jour les totaux avant sauvegarde
playlistSchema.pre("save", async function (next) {
    if (this.isModified("tracks")) {
        const Track = mongoose.model("Track");
        const tracks = await Track.find({ _id: { $in: this.tracks } });

        this.totalTracks = tracks.length;
        this.totalDuration = tracks.reduce(
            (total, track) => total + (track.duration || 0),
            0
        );
    }
    next();
});

module.exports = mongoose.model("Playlist", playlistSchema);
