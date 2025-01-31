const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { validatePassword } = require('../utils/validators');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    console.log('Tentative d\'inscription:', { email, username });

    // Validation du mot de passe
    if (!validatePassword(password)) {
      console.log('Échec de la validation du mot de passe');
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre ou caractère spécial'
      });
    }

    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('Utilisateur existant:', existingUser.email);
      return res.status(400).json({
        message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà'
      });
    }

    // Création du nouvel utilisateur
    const user = new User({ email, password, username });
    await user.save();
    console.log('Nouvel utilisateur créé:', user.email);

    // Génération du token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email: emailOrUsername, password } = req.body;
    console.log('Tentative de connexion:', { emailOrUsername });

    // Recherche de l'utilisateur par email ou nom d'utilisateur
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérification du mot de passe
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('Mot de passe invalide pour:', user.email);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('Connexion réussie pour:', user.email);

    // Génération du token
    const token = generateToken(user);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Erreur getCurrentUser:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: error.message });
  }
}; 