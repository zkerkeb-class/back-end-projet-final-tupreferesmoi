const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const { rateLimit } = require('express-rate-limit');

const trackRoutes = require('./routes/track.routes');
const albumRoutes = require('./routes/album.routes');
const artistRoutes = require('./routes/artist.routes');
const playlistRoutes = require('./routes/playlist.routes');
const cacheService = require('./services/cache.service');

const app = express();

// Middleware de base
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialisation de Redis
cacheService.connect().catch(err => {
    console.error('Erreur de connexion à Redis:', err);
});

// Démarrage des tâches cron
require('./scripts/cron');

// Routes
app.use('/api/tracks', trackRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/playlists', playlistRoutes);

module.exports = app; 