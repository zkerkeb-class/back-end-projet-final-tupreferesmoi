const mongoose = require('mongoose');
const Playlist = require("../models/playlist.model");

// Récupérer toutes les playlists avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit, skip, sort } = req.pagination;
        const query = {};

        console.log('User from request:', req.user);
        console.log('Query params:', req.query);

        // Si un userId est spécifié
        if (req.query.userId) {
            query.userId = req.query.userId;

            // Si l'utilisateur est connecté et demande ses propres playlists
            if (req.user && req.user.id === req.query.userId) {
                // Ne pas filtrer sur isPublic pour voir toutes ses playlists
                console.log('Utilisateur demande ses propres playlists');
            } else {
                // Pour les autres utilisateurs, ne montrer que les playlists publiques
                query.isPublic = true;
                console.log('Utilisateur demande les playlists d\'un autre utilisateur');
            }
        } else {
            // Si aucun userId n'est spécifié, ne montrer que les playlists publiques
            query.isPublic = true;
        }

        console.log('Query finale MongoDB:', query);

        const [playlists, total] = await Promise.all([
            Playlist.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("userId", "username")
                .populate({
                    path: "tracks",
                    select: "title duration artistId albumId audioUrl",
                    populate: [
                        {
                            path: "artistId",
                            select: "name"
                        },
                        {
                            path: "albumId",
                            select: "title coverImage"
                        }
                    ]
                }),
            Playlist.countDocuments(query),
        ]);

        console.log('Nombre de playlists trouvées:', playlists.length);
        console.log('Playlists trouvées après filtres:', playlists);
        console.log('Nombre total de playlists:', total);

        // Formater les playlists
        const formattedPlaylists = playlists.map(playlist => {
            const formattedTracks = playlist.tracks.map(track => ({
                _id: track._id,
                id: track._id,
                title: track.title,
                duration: track.duration,
                audioUrl: track.audioUrl,
                artist: track.artistId?.name || "Artiste inconnu",
                artistId: {
                    _id: track.artistId?._id,
                    name: track.artistId?.name
                },
                albumId: {
                    _id: track.albumId?._id,
                    title: track.albumId?.title,
                    coverImage: track.albumId?.coverImage
                }
            }));

            return {
                _id: playlist._id,
                name: playlist.name,
                description: playlist.description,
                isPublic: playlist.isPublic,
                coverImage: playlist.coverImage,
                userId: playlist.userId,
                tracks: formattedTracks,
                totalDuration: playlist.tracks.reduce((total, track) => total + (track.duration || 0), 0),
                totalTracks: playlist.tracks.length,
                createdAt: playlist.createdAt,
                updatedAt: playlist.updatedAt
            };
        });

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: formattedPlaylists,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des playlists",
            error: error.message,
        });
    }
};

// Récupérer une playlist par ID
const findOne = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate("userId", "username")
            .populate({
                path: "tracks",
                select: "title duration artistId albumId audioUrl",
                populate: [
                    {
                        path: "artistId",
                        select: "name"
                    },
                    {
                        path: "albumId",
                        select: "title coverImage"
                    }
                ]
            });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist non trouvée",
            });
        }

        // Vérifier si l'utilisateur a le droit de voir cette playlist
        if (
            !playlist.isPublic &&
            (!req.user || playlist.userId.toString() !== req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Vous n'avez pas accès à cette playlist",
            });
        }

        // Calculer la durée totale et le nombre de pistes
        playlist.totalDuration = playlist.tracks.reduce(
            (total, track) => total + (track.duration || 0),
            0
        );
        playlist.totalTracks = playlist.tracks.length;

        // Sauvegarder les mises à jour
        await playlist.save();

        // Formater les données des pistes pour inclure toutes les informations nécessaires
        const formattedTracks = playlist.tracks.map(track => ({
            _id: track._id,
            id: track._id, // Pour la compatibilité avec le frontend
            title: track.title,
            duration: track.duration,
            audioUrl: track.audioUrl,
            artist: track.artistId?.name || "Artiste inconnu",
            artistId: {
                _id: track.artistId?._id,
                name: track.artistId?.name
            },
            albumId: {
                _id: track.albumId?._id,
                title: track.albumId?.title,
                coverImage: track.albumId?.coverImage
            }
        }));

        // Créer un objet formaté de la playlist
        const formattedPlaylist = {
            _id: playlist._id,
            name: playlist.name,
            description: playlist.description,
            isPublic: playlist.isPublic,
            coverImage: playlist.coverImage,
            userId: playlist.userId,
            tracks: formattedTracks,
            totalDuration: playlist.totalDuration,
            totalTracks: playlist.totalTracks,
            createdAt: playlist.createdAt,
            updatedAt: playlist.updatedAt
        };

        res.status(200).json({
            success: true,
            data: formattedPlaylist,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la playlist",
            error: error.message,
        });
    }
};

// Créer une nouvelle playlist
const create = async (req, res) => {
    try {
        const playlist = new Playlist({
            ...req.body,
            userId: req.user.id,
        });
        const newPlaylist = await playlist.save();

        const populatedPlaylist = await Playlist.findById(newPlaylist._id)
            .populate("userId", "username")
            .populate({
                path: "tracks",
                select: "title duration artistId",
                populate: {
                    path: "artistId",
                    select: "name",
                },
            });

        res.status(201).json({
            success: true,
            data: populatedPlaylist,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la création de la playlist",
            error: error.message,
        });
    }
};

// Mettre à jour une playlist
const update = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message:
                    "Playlist non trouvée ou vous n'êtes pas autorisé à la modifier",
            });
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate("userId", "username")
            .populate({
                path: "tracks",
                select: "title duration artistId",
                populate: {
                    path: "artistId",
                    select: "name",
                },
            });

        res.status(200).json({
            success: true,
            data: updatedPlaylist,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la mise à jour de la playlist",
            error: error.message,
        });
    }
};

// Supprimer une playlist
const deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message:
                    "Playlist non trouvée ou vous n'êtes pas autorisé à la supprimer",
            });
        }

        res.status(200).json({
            success: true,
            message: "Playlist supprimée avec succès",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de la playlist",
            error: error.message,
        });
    }
};

// Ajouter une piste à la playlist
const addTrack = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message:
                    "Playlist non trouvée ou vous n'êtes pas autorisé à la modifier",
            });
        }

        const trackId = req.body.trackId;
        if (playlist.tracks.includes(trackId)) {
            return res.status(400).json({
                success: false,
                message: "Cette piste est déjà dans la playlist",
            });
        }

        playlist.tracks.push(trackId);
        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlist._id)
            .populate("userId", "username")
            .populate({
                path: "tracks",
                select: "title duration artistId",
                populate: {
                    path: "artistId",
                    select: "name",
                },
            });

        res.status(200).json({
            success: true,
            data: updatedPlaylist,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de l'ajout de la piste à la playlist",
            error: error.message,
        });
    }
};

// Retirer une piste de la playlist
const removeTrack = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message:
                    "Playlist non trouvée ou vous n'êtes pas autorisé à la modifier",
            });
        }

        const trackId = req.params.trackId;
        const trackIndex = playlist.tracks.indexOf(trackId);

        if (trackIndex === -1) {
            return res.status(400).json({
                success: false,
                message: "Cette piste n'est pas dans la playlist",
            });
        }

        playlist.tracks.splice(trackIndex, 1);
        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlist._id)
            .populate("userId", "username")
            .populate({
                path: "tracks",
                select: "title duration artistId",
                populate: {
                    path: "artistId",
                    select: "name",
                },
            });

        res.status(200).json({
            success: true,
            data: updatedPlaylist,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors du retrait de la piste de la playlist",
            error: error.message,
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
    removeTrack,
};
