const Playlist = require('../models/playlist.model');

// Récupérer toutes les playlists avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit, skip, sort } = req.pagination;
        const query = {};

        // Filtre par utilisateur
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        // Ne montrer que les playlists publiques sauf si c'est l'utilisateur propriétaire
        if (!req.query.userId || req.query.userId !== req.user?.id) {
            query.isPublic = true;
        }

        // Filtre par durée totale
        if (req.query.minDuration || req.query.maxDuration) {
            query.totalDuration = {};
            if (req.query.minDuration) query.totalDuration.$gte = parseInt(req.query.minDuration);
            if (req.query.maxDuration) query.totalDuration.$lte = parseInt(req.query.maxDuration);
        }

        // Filtre par nombre de pistes
        if (req.query.minTracks || req.query.maxTracks) {
            query.totalTracks = {};
            if (req.query.minTracks) query.totalTracks.$gte = parseInt(req.query.minTracks);
            if (req.query.maxTracks) query.totalTracks.$lte = parseInt(req.query.maxTracks);
        }

        const [playlists, total] = await Promise.all([
            Playlist.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username')
                .populate({
                    path: 'tracks',
                    select: 'title duration artistId',
                    populate: {
                        path: 'artistId',
                        select: 'name'
                    }
                }),
            Playlist.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: playlists,
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
            message: "Erreur lors de la récupération des playlists",
            error: error.message
        });
    }
};

// Récupérer une playlist par ID
const findOne = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('userId', 'username')
            .populate({
                path: 'tracks',
                select: 'title duration artistId albumId',
                populate: [
                    { path: 'artistId', select: 'name' },
                    { path: 'albumId', select: 'title coverImage' }
                ]
            });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist non trouvée"
            });
        }

        // Vérifier si l'utilisateur a le droit de voir cette playlist
        if (!playlist.isPublic && (!req.user || playlist.userId.toString() !== req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "Vous n'avez pas accès à cette playlist"
            });
        }

        res.status(200).json({
            success: true,
            data: playlist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la playlist",
            error: error.message
        });
    }
};

// Créer une nouvelle playlist
const create = async (req, res) => {
    try {
        const playlist = new Playlist({
            ...req.body,
            userId: req.user.id
        });
        const newPlaylist = await playlist.save();

        const populatedPlaylist = await Playlist.findById(newPlaylist._id)
            .populate('userId', 'username')
            .populate({
                path: 'tracks',
                select: 'title duration artistId',
                populate: {
                    path: 'artistId',
                    select: 'name'
                }
            });

        res.status(201).json({
            success: true,
            data: populatedPlaylist
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la création de la playlist",
            error: error.message
        });
    }
};

// Mettre à jour une playlist
const update = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist non trouvée ou vous n'êtes pas autorisé à la modifier"
            });
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('userId', 'username')
        .populate({
            path: 'tracks',
            select: 'title duration artistId',
            populate: {
                path: 'artistId',
                select: 'name'
            }
        });

        res.status(200).json({
            success: true,
            data: updatedPlaylist
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la mise à jour de la playlist",
            error: error.message
        });
    }
};

// Supprimer une playlist
const deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist non trouvée ou vous n'êtes pas autorisé à la supprimer"
            });
        }

        res.status(200).json({
            success: true,
            message: "Playlist supprimée avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de la playlist",
            error: error.message
        });
    }
};

// Ajouter une piste à la playlist
const addTrack = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist non trouvée ou vous n'êtes pas autorisé à la modifier"
            });
        }

        const trackId = req.body.trackId;
        if (playlist.tracks.includes(trackId)) {
            return res.status(400).json({
                success: false,
                message: "Cette piste est déjà dans la playlist"
            });
        }

        playlist.tracks.push(trackId);
        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlist._id)
            .populate('userId', 'username')
            .populate({
                path: 'tracks',
                select: 'title duration artistId',
                populate: {
                    path: 'artistId',
                    select: 'name'
                }
            });

        res.status(200).json({
            success: true,
            data: updatedPlaylist
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de l'ajout de la piste à la playlist",
            error: error.message
        });
    }
};

// Retirer une piste de la playlist
const removeTrack = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist non trouvée ou vous n'êtes pas autorisé à la modifier"
            });
        }

        const trackId = req.params.trackId;
        const trackIndex = playlist.tracks.indexOf(trackId);
        
        if (trackIndex === -1) {
            return res.status(400).json({
                success: false,
                message: "Cette piste n'est pas dans la playlist"
            });
        }

        playlist.tracks.splice(trackIndex, 1);
        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlist._id)
            .populate('userId', 'username')
            .populate({
                path: 'tracks',
                select: 'title duration artistId',
                populate: {
                    path: 'artistId',
                    select: 'name'
                }
            });

        res.status(200).json({
            success: true,
            data: updatedPlaylist
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors du retrait de la piste de la playlist",
            error: error.message
        });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    deletePlaylist,
    addTrack,
    removeTrack
}; 