require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spotify';

mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.info('Connecté à MongoDB');
        app.listen(PORT, () => {
            logger.info(`Serveur démarré sur le port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error('Erreur de connexion à MongoDB:', err);
        process.exit(1);
    });