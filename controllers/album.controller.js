const Album = require('../models/album.model');
const { formatPaginatedResponse } = require('../utils/pagination');

// Récupérer tous les albums avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit } = req.pagination;
        const query = {};
        
        // Filtre par artiste si spécifié
        if (req.query.artistId) {
            query.artistId = req.query.artistId;
        }

        const [albums, total] = await Promise.all([
            Album.find(query)
                .populate('artistId', 'name')
                .populate('featuring', 'name')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ releaseDate: -1 }),
            Album.countDocuments(query)
        ]);

        res.status(200).json(formatPaginatedResponse(albums, total, page, limit));
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération des albums",
            error: error.message 
        });
    }
};

// Récupérer un album par ID
const findOne = async (req, res) => {
    try {
        const album = await Album.findById(req.params.id)
            .populate('artistId', 'name')
            .populate('featuring', 'name');

        if (!album) {
            return res.status(404).json({ 
                success: false,
                message: "Album non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: album 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération de l'album",
            error: error.message 
        });
    }
};

// Créer un nouvel album
const create = async (req, res) => {
    try {
        const album = new Album(req.body);
        const newAlbum = await album.save();
        
        const populatedAlbum = await Album.findById(newAlbum._id)
            .populate('artistId', 'name')
            .populate('featuring', 'name');

        res.status(201).json({ 
            success: true,
            data: populatedAlbum 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la création de l'album",
            error: error.message 
        });
    }
};

// Mettre à jour un album
const update = async (req, res) => {
    try {
        const album = await Album.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('artistId', 'name')
        .populate('featuring', 'name');

        if (!album) {
            return res.status(404).json({ 
                success: false,
                message: "Album non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: album 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la mise à jour de l'album",
            error: error.message 
        });
    }
};

// Supprimer un album
const deleteAlbum = async (req, res) => {
    try {
        const album = await Album.findByIdAndDelete(req.params.id);
        if (!album) {
            return res.status(404).json({ 
                success: false,
                message: "Album non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            message: "Album supprimé avec succès" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la suppression de l'album",
            error: error.message 
        });
    }
};

// Rechercher des albums
const search = async (req, res) => {
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

        res.status(200).json({ 
            success: true,
            data: albums 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la recherche d'albums",
            error: error.message 
        });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    delete: deleteAlbum,
    search
}; 