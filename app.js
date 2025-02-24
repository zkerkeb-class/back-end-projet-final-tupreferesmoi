const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const { rateLimit } = require("express-rate-limit");

const trackRoutes = require('./routes/track.routes');
const albumRoutes = require('./routes/album.routes');
const artistRoutes = require('./routes/artist.routes');
const playlistRoutes = require('./routes/playlist.routes');
const authRoutes = require('./routes/auth.routes');
const searchRoutes = require('./routes/globalSearch.routes');
const cacheService = require('./services/cache.service');

const app = express();

// Configuration CORS
app.use(
    cors({
        origin: ["http://localhost:4000", "http://localhost:3001"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

// Autres middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialisation de Redis
cacheService.connect().catch((err) => {
    console.error("Erreur de connexion à Redis:", err);
});

// Démarrage des tâches cron
require("./scripts/cron");

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/search', searchRoutes);

module.exports = app;
