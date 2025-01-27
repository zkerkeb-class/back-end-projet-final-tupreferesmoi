const Track = require('../models/track.model');
const { formatPaginatedResponse } = require('../utils/pagination');

// Récupérer toutes les pistes avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit, skip, sort } = req.pagination;
        const query = {};

        // Filtre par albumId si spécifié
        if (req.query.albumId) {
            query.albumId = req.query.albumId;
        }

        // Filtre par durée
        if (req.query.minDuration || req.query.maxDuration) {
            query.duration = {};
            if (req.query.minDuration) query.duration.$gte = parseInt(req.query.minDuration);
            if (req.query.maxDuration) query.duration.$lte = parseInt(req.query.maxDuration);
        }

        // Filtre par genre
        if (req.query.genre) {
            query.genres = { $in: [req.query.genre] };
        }

        // Filtre par popularité
        if (req.query.minPopularity || req.query.maxPopularity) {
            query.popularity = {};
            if (req.query.minPopularity) query.popularity.$gte = parseInt(req.query.minPopularity);
            if (req.query.maxPopularity) query.popularity.$lte = parseInt(req.query.maxPopularity);
        }

        const [tracks, total] = await Promise.all([
            Track.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('albumId', 'title artistId')
                .populate('artistId', 'name')
                .populate('featuring', 'name'),
            Track.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: tracks,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des pistes",
            error: error.message
        });
    }
};

// Récupérer une piste par ID
const findOne = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id)
            .populate('albumId', 'title artistId')
            .populate('featuring', 'name');

        if (!track) {
            return res.status(404).json({ 
                success: false,
                message: "Piste non trouvée" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: track 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération de la piste",
            error: error.message 
        });
    }
};

// Créer une nouvelle piste
const create = async (req, res) => {
    try {
        const track = new Track(req.body);
        const newTrack = await track.save();
        
        const populatedTrack = await Track.findById(newTrack._id)
            .populate('albumId', 'title')
            .populate('featuring', 'name');

        res.status(201).json({ 
            success: true,
            data: populatedTrack 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la création de la piste",
            error: error.message 
        });
    }
};

// Mettre à jour une piste
const update = async (req, res) => {
    try {
        const track = await Track.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('albumId', 'title')
        .populate('featuring', 'name');

        if (!track) {
            return res.status(404).json({ 
                success: false,
                message: "Piste non trouvée" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: track 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la mise à jour de la piste",
            error: error.message 
        });
    }
};

// Supprimer une piste
const deleteTrack = async (req, res) => {
    try {
        const track = await Track.findByIdAndDelete(req.params.id);
        if (!track) {
            return res.status(404).json({ 
                success: false,
                message: "Piste non trouvée" 
            });
        }
        res.status(200).json({ 
            success: true,
            message: "Piste supprimée avec succès" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la suppression de la piste",
            error: error.message 
        });
    }
};

// Rechercher des pistes
const search = async (req, res) => {
    try {
        const { query } = req.query;
        const tracks = await Track.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { lyrics: { $regex: query, $options: 'i' } }
            ]
        })
        .populate('albumId', 'title artistId')
        .populate('featuring', 'name')
        .limit(10);

        res.status(200).json({ 
            success: true,
            data: tracks 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la recherche de pistes",
            error: error.message 
        });
    }
};

// Mettre à jour la popularité d'une piste
const updatePopularity = async (req, res) => {
    try {
        const { popularity } = req.body;
        const track = await Track.findByIdAndUpdate(
            req.params.id,
            { popularity },
            { new: true }
        );

        if (!track) {
            return res.status(404).json({ 
                success: false,
                message: "Piste non trouvée" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: track 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la mise à jour de la popularité",
            error: error.message 
        });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    deleteTrack,
    search,
    updatePopularity
}; 