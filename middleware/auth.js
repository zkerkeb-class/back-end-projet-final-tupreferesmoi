const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
    try {
        // Vérifier si le token est présent
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Authentification requise" });
        }

        // Extraire et vérifier le token
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Vérifier si l'utilisateur existe toujours
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "Utilisateur non trouvé" });
        }

        // Ajouter les informations de l'utilisateur à la requête
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Token invalide" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Session expirée" });
        }
        res.status(500).json({ message: "Erreur d'authentification" });
    }
}; 