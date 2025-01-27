import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import connectToMongoDB from './db/mongodb.js';
import userRoutes from './routes/user.routes.js';
import logger from './config/logger.js';

dotenv.config();
connectToMongoDB();

const app = express();

// Middleware de sécurité
app.use(helmet());

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