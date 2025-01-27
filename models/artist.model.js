const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    bio: {
        type: String
    },
    genres: [{
        type: String
    }],
    popularity: {
        type: Number,
        default: 0
    },
    image: {
        thumbnail: String,
        medium: String,
        large: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware pour mettre à jour updatedAt avant chaque sauvegarde
artistSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Artist', artistSchema);
