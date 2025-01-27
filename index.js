const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const connectToMongoDB = require('./db/mongodb.js');
const userRoutes = require('./routes/user.routes.js');
const trackRoutes = require('./routes/track.routes.js');
const logger = require('./config/logger.js');
const { globalLimiter } = require('./config/rateLimit.js');
const swaggerSpecs = require('./config/swagger.js');

// Import des modèles
require('./models/album.model');
require('./models/artist.model');
require('./models/track.model');

// Import des routes
const albumRoutes = require('./routes/album.routes');
const artistRoutes = require('./routes/artist.routes');

dotenv.config();
connectToMongoDB();

const app = express();

// Middleware de sécurité
app.use(helmet());

// Configuration Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "API Spotify Clone - Documentation"
}));

// Rate Limiting global
app.use(globalLimiter);

// Middleware pour parser le JSON
app.use(express.json());

// Logger pour les requêtes HTTP
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/artists', artistRoutes);

// Gestion des erreurs globale
app.use((err, req, res, next) => {
    logger.error('Erreur non gérée:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Une erreur interne est survenue' 
    });
});

app.listen(3000, () => {
    logger.info('Serveur démarré sur http://localhost:3000');
});