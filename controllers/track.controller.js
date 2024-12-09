const Track = require('../models/track.model');

// Récupérer toutes les pistes avec pagination
exports.findAll = async (req, res) => {
    try {
        const { page = 1, limit = 20, albumId } = req.query;
        const query = albumId ? { albumId } : {};

        const tracks = await Track.find(query)
            .populate('albumId', 'title')
            .populate('featuring', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ trackNumber: 1 });

        const count = await Track.countDocuments(query);

        res.status(200).json({
            tracks,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer une piste par ID
exports.findOne = async (req, res) => {
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
exports.create = async (req, res) => {
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
exports.update = async (req, res) => {
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
exports.delete = async (req, res) => {
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
exports.findByAlbum = async (req, res) => {
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
exports.search = async (req, res) => {
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
exports.updatePopularity = async (req, res) => {
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