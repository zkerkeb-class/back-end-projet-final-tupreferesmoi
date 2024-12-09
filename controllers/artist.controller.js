const Artist = require('../models/artist.model');

// Récupérer tous les artistes
exports.findAll = async (req, res) => {
    try {
        const artists = await Artist.find();
        res.status(200).json(artists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer un artiste par son ID
exports.findOne = async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) {
            return res.status(404).json({ message: "Artiste non trouvé" });
        }
        res.status(200).json(artist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Créer un nouvel artiste
exports.create = async (req, res) => {
    try {
        const artist = new Artist(req.body);
        const newArtist = await artist.save();
        res.status(201).json(newArtist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Mettre à jour un artiste
exports.update = async (req, res) => {
    try {
        const artist = await Artist.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!artist) {
            return res.status(404).json({ message: "Artiste non trouvé" });
        }
        res.status(200).json(artist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Supprimer un artiste
exports.delete = async (req, res) => {
    try {
        const artist = await Artist.findByIdAndDelete(req.params.id);
        if (!artist) {
            return res.status(404).json({ message: "Artiste non trouvé" });
        }
        res.status(200).json({ message: "Artiste supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 