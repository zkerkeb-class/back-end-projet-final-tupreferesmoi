const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Vérifier si l'email ou le username existe déjà
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email ou nom d'utilisateur déjà utilisé",
            });
        }

        const user = new User(req.body);
        await user.save();

        // Générer le token JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Connexion utilisateur
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect",
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });

        res.status(200).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer le profil utilisateur
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mettre à jour le profil utilisateur
exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        delete updates.password; // Empêcher la modification directe du mot de passe

        const user = await User.findByIdAndUpdate(req.params.userId, updates, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Changer le mot de passe
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                message: "Mot de passe actuel incorrect",
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Mettre à jour les paramètres de confidentialité
exports.updatePrivacySettings = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { privacySettings: req.body },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Supprimer le compte utilisateur
exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json({ message: "Compte supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Récupérer tout les  profils utilisateur
exports.getAll = async (req, res) => {
    try {
        const users = await User.find({});
        if (users.length == 0) {
            return res.status(404).json({ message: "Utilisateurs non trouvé" });
        }
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};