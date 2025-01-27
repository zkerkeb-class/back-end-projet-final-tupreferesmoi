const trackRoutes = require('./routes/track.routes');
const albumRoutes = require('./routes/album.routes');
const artistRoutes = require('./routes/artist.routes');
const playlistRoutes = require('./routes/playlist.routes');
const express = require('express');
const app = express();
const cacheService = require('./services/cache.service');

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