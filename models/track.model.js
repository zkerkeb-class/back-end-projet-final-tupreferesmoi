const mongoose = require('mongoose');

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