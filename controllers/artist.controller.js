const Artist = require('../models/artist.model');
const { formatPaginatedResponse } = require('../utils/pagination');

// Récupérer tous les artistes avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit } = req.pagination;
        const query = {};
        
        // Filtre par genre si spécifié
        if (req.query.genre) {
            query.genres = req.query.genre;
        }

        const [artists, total] = await Promise.all([
            Artist.find(query)
                .skip((page - 1) * limit)
                .limit(limit),
            Artist.countDocuments(query)
        ]);

        res.status(200).json(formatPaginatedResponse(artists, total, page, limit));
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération des artistes",
            error: error.message 
        });
    }
};

// Récupérer un artiste par son ID
const findOne = async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) {
            return res.status(404).json({ 
                success: false,
                message: "Artiste non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: artist 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération de l'artiste",
            error: error.message 
        });
    }
};

// Créer un nouvel artiste
const create = async (req, res) => {
    try {
        const artist = new Artist(req.body);
        const newArtist = await artist.save();
        res.status(201).json({ 
            success: true,
            data: newArtist 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la création de l'artiste",
            error: error.message 
        });
    }
};

// Mettre à jour un artiste
const update = async (req, res) => {
    try {
        const artist = await Artist.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!artist) {
            return res.status(404).json({ 
                success: false,
                message: "Artiste non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: artist 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la mise à jour de l'artiste",
            error: error.message 
        });
    }
};

// Supprimer un artiste
const deleteArtist = async (req, res) => {
    try {
        const artist = await Artist.findByIdAndDelete(req.params.id);
        if (!artist) {
            return res.status(404).json({ 
                success: false,
                message: "Artiste non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            message: "Artiste supprimé avec succès" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la suppression de l'artiste",
            error: error.message 
        });
    }
};

// Rechercher des artistes
const search = async (req, res) => {
    try {
        const { query } = req.query;
        const artists = await Artist.find({ 
            $text: { $search: query } 
        });
        res.status(200).json({ 
            success: true,
            data: artists 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la recherche d'artistes",
            error: error.message 
        });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    delete: deleteArtist,
    search
}; 