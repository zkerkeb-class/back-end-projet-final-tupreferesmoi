const Album = require('../models/album.model');

// Récupérer tous les albums avec pagination
exports.findAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, artistId } = req.query;
        const query = artistId ? { artistId } : {};

        const albums = await Album.find(query)
            .populate('artistId', 'name')
            .populate('featuring', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ releaseDate: -1 });

        const count = await Album.countDocuments(query);

        res.status(200).json({
            albums,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer un album par ID
exports.findOne = async (req, res) => {
    try {
        const album = await Album.findById(req.params.id)
            .populate('artistId', 'name')
            .populate('featuring', 'name');

        if (!album) {
            return res.status(404).json({ message: "Album non trouvé" });
        }
        res.status(200).json(album);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Créer un nouvel album
exports.create = async (req, res) => {
    try {
        const album = new Album(req.body);
        const newAlbum = await album.save();
        
        const populatedAlbum = await Album.findById(newAlbum._id)
            .populate('artistId', 'name')
            .populate('featuring', 'name');

        res.status(201).json(populatedAlbum);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Mettre à jour un album
exports.update = async (req, res) => {
    try {
        const album = await Album.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('artistId', 'name')
        .populate('featuring', 'name');

        if (!album) {
            return res.status(404).json({ message: "Album non trouvé" });
        }
        res.status(200).json(album);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Supprimer un album
exports.delete = async (req, res) => {
    try {
        const album = await Album.findByIdAndDelete(req.params.id);
        if (!album) {
            return res.status(404).json({ message: "Album non trouvé" });
        }
        res.status(200).json({ message: "Album supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer les albums par artiste
exports.findByArtist = async (req, res) => {
    try {
        const albums = await Album.find({ artistId: req.params.artistId })
            .populate('artistId', 'name')
            .populate('featuring', 'name')
            .sort({ releaseDate: -1 });

        res.status(200).json(albums);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Rechercher des albums
exports.search = async (req, res) => {
    try {
        const { query } = req.query;
        const albums = await Album.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { label: { $regex: query, $options: 'i' } }
            ]
        })
        .populate('artistId', 'name')
        .populate('featuring', 'name')
        .limit(10);

        res.status(200).json(albums);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 