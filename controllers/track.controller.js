const Track = require('../models/track.model');
const { formatPaginatedResponse } = require('../utils/paginationUtils');

// Récupérer toutes les pistes avec pagination
const findAll = async (req, res) => {
    try {
        const { skip, limit } = req.pagination;
        const query = req.query.albumId ? { albumId: req.query.albumId } : {};

        // Récupération des tracks avec pagination
        const tracks = await Track.find(query)
            .skip(skip)
            .limit(limit)
            .populate('albumId', 'title')
            .populate('artistId', 'name')
            .populate('featuring', 'name')
            .sort({ trackNumber: 1 });

        // Compte total des tracks
        const totalItems = await Track.countDocuments(query);

        // Formatage de la réponse
        const response = formatPaginatedResponse(tracks, totalItems, req);

        res.json(response);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des tracks',
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
            return res.status(404).json({ message: "Piste non trouvée" });
        }
        res.status(200).json(track);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        res.status(201).json(populatedTrack);
    } catch (error) {
        res.status(400).json({ message: error.message });
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
            return res.status(404).json({ message: "Piste non trouvée" });
        }
        res.status(200).json(track);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Supprimer une piste
const deleteTrack = async (req, res) => {
    try {
        const track = await Track.findByIdAndDelete(req.params.id);
        if (!track) {
            return res.status(404).json({ message: "Piste non trouvée" });
        }
        res.status(200).json({ message: "Piste supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer les pistes par album
const findByAlbum = async (req, res) => {
    try {
        const tracks = await Track.find({ albumId: req.params.albumId })
            .populate('albumId', 'title')
            .populate('featuring', 'name')
            .sort({ trackNumber: 1 });

        res.status(200).json(tracks);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        res.status(200).json(tracks);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
            return res.status(404).json({ message: "Piste non trouvée" });
        }
        res.status(200).json(track);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    delete: deleteTrack,
    findByAlbum,
    search,
    updatePopularity
}; 