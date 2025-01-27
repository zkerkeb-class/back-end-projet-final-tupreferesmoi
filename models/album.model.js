const mongoose = require('mongoose');

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