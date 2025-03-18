const Album = require("../models/album.model");
const { formatPaginatedResponse } = require("../utils/pagination");
const AWS = require("aws-sdk");
const cacheService = require("../services/cache.service");

// Configurer AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: "v4",
});

const DEFAULT_IMAGE =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyQTJBMkEiLz48cGF0aCBkPSJNOTAgODBIMTEwQzExNS41MjMgODAgMTIwIDg0LjQ3NzIgMTIwIDkwVjExMEMxMjAgMTE1LjUyMyAxMTUuNTIzIDEyMCAxMTAgMTIwSDkwQzg0LjQ3NzIgMTIwIDgwIDExNS41MjMgODAgMTEwVjkwQzgwIDg0LjQ3NzIgODQuNDc3MiA4MCA5MCA4MFoiIGZpbGw9IiM0MDQwNDAiLz48cGF0aCBkPSJNMTAwIDg1QzEwMi43NjEgODUgMTA1IDg3LjIzODYgMTA1IDkwQzEwNSA5Mi43NjE0IDEwMi43NjEgOTUgMTAwIDk1Qzk3LjIzODYgOTUgOTUgOTIuNzYxNCA5NSA5MEM5NSA4Ny4yMzg2IDk3LjIzODYgODUgMTAwIDg1WiIgZmlsbD0iIzU5NTk1OSIvPjwvc3ZnPg==";

// Liste des clés de cache liées aux albums
const ALBUM_CACHE_KEYS = [
    "albums-list",
    "albums-recent",
    "album-search",
    "album-detail",
    "album-tracks",
    "global-search"
];

// Fonction utilitaire pour invalider le cache des albums
const invalidateAlbumCache = async () => {
    try {
        await cacheService.flush(); // On vide tout le cache pour être sûr
    } catch (error) {
        console.error("Erreur lors de l'invalidation du cache des albums:", error);
    }
};

const getSignedUrl = async (imageUrl) => {
    if (!imageUrl) return null;
    
    // Si c'est une URL Spotify, la retourner directement
    if (imageUrl.includes("i.scdn.co")) {
        return imageUrl;
    }

    // Si ce n'est pas une URL AWS mais une URL externe normale (https), la retourner directement
    if (!imageUrl.includes("amazonaws.com") && imageUrl.startsWith("http")) {
        return imageUrl;
    }

    try {
        // Extraire la clé de l'URL complète
        const urlParts = imageUrl.split(".amazonaws.com/");
        if (urlParts.length !== 2) {
            return imageUrl;
        }

        const key = urlParts[1];

        // Générer une URL signée valide pendant 1 heure
        const signedUrl = await s3.getSignedUrlPromise("getObject", {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: 3600,
        });

        return signedUrl;
    } catch (error) {
        console.error("Erreur lors de la génération de l'URL signée:", error);
        return imageUrl;
    }
};

// Récupérer tous les albums avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit, skip, sort } = req.pagination;
        const query = {};

        // Filtre par artistId si spécifié
        if (req.query.artistId) {
            query.artistId = req.query.artistId;
        }

        // Filtre par type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filtre par genre
        if (req.query.genre) {
            query.genres = { $in: [req.query.genre] };
        }

        // Filtre par date de sortie
        if (req.query.releaseDate) {
            query.releaseDate = req.query.releaseDate;
        }

        const [albums, total] = await Promise.all([
            Album.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("artistId", "name"),
            Album.countDocuments(query),
        ]);

        const albumsWithUrls = await Promise.all(
            albums.map(async (album) => {
                try {
                    let imageUrl = DEFAULT_IMAGE;

                    // Si l'album a des images configurées, essayer de générer une URL signée
                    if (album.coverImage) {
                        const selectedImage =
                            album.coverImage.medium ||
                            album.coverImage.large ||
                            album.coverImage.thumbnail;
                        if (selectedImage) {
                            const signedUrl = await getSignedUrl(selectedImage);
                            if (signedUrl) {
                                imageUrl = signedUrl;
                            }
                        }
                    }

                    return {
                        id: album._id,
                        title: album.title || "Album Inconnu",
                        artist: album.artistId?.name || "Artiste inconnu",
                        coverUrl: imageUrl,
                        trackCount: album.trackCount || 0,
                        releaseDate: album.releaseDate,
                        year: album.releaseDate
                            ? new Date(album.releaseDate).getFullYear()
                            : null,
                    };
                } catch (error) {
                    return {
                        id: album._id,
                        title: album.title || "Album Inconnu",
                        artist: album.artistId?.name || "Artiste inconnu",
                        coverUrl: DEFAULT_IMAGE,
                        trackCount: album.trackCount || 0,
                        releaseDate: album.releaseDate,
                        year: album.releaseDate
                            ? new Date(album.releaseDate).getFullYear()
                            : null,
                    };
                }
            })
        );

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: albumsWithUrls,
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
            message: "Erreur lors de la récupération des albums",
            error: error.message,
        });
    }
};

// Récupérer un album par ID
const findOne = async (req, res) => {
    try {
        const Track = require("../models/track.model");
        
        // Récupérer l'album
        const album = await Album.findById(req.params.id)
            .populate("artistId", "name")
            .populate("featuring", "name");

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album non trouvé",
            });
        }

        // Récupérer les pistes associées
        const tracks = await Track.find({ albumId: req.params.id })
            .populate("artistId", "name")
            .populate("featuring", "name");

        // Generate signed URLs for all image sizes
        const signedCoverImage = {
            thumbnail: album.coverImage?.thumbnail
                ? await getSignedUrl(album.coverImage.thumbnail)
                : null,
            medium: album.coverImage?.medium
                ? await getSignedUrl(album.coverImage.medium)
                : null,
            large: album.coverImage?.large
                ? await getSignedUrl(album.coverImage.large)
                : null,
        };

        // Sélectionner la meilleure image disponible pour coverUrl
        const coverUrl = signedCoverImage.large || 
                         signedCoverImage.medium || 
                         signedCoverImage.thumbnail || 
                         DEFAULT_IMAGE;

        // Create a new object with signed URLs and tracks
        const albumWithSignedUrls = {
            ...album.toObject(),
            coverImage: signedCoverImage,
            coverUrl: coverUrl, // Ajouter directement une coverUrl
            tracks: tracks // Ajout des pistes
        };

        res.status(200).json({
            success: true,
            data: albumWithSignedUrls,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de l'album",
            error: error.message,
        });
    }
};

// Créer un nouvel album
const create = async (req, res) => {
    try {
        const album = new Album(req.body);
        const newAlbum = await album.save();

        const populatedAlbum = await Album.findById(newAlbum._id)
            .populate("artistId", "name")
            .populate("featuring", "name");

        await invalidateAlbumCache();

        res.status(201).json({
            success: true,
            data: populatedAlbum,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la création de l'album",
            error: error.message,
        });
    }
};

// Mettre à jour un album
const update = async (req, res) => {
    try {
        const album = await Album.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate("artistId", "name")
            .populate("featuring", "name");

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album non trouvé",
            });
        }

        await invalidateAlbumCache();

        res.status(200).json({
            success: true,
            data: album,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la mise à jour de l'album",
            error: error.message,
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
                message: "Album non trouvé",
            });
        }

        await invalidateAlbumCache();

        res.status(200).json({
            success: true,
            message: "Album supprimé avec succès",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de l'album",
            error: error.message,
        });
    }
};

// Rechercher des albums
const search = async (req, res) => {
    try {
        const { query } = req.query;
        const albums = await Album.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { label: { $regex: query, $options: "i" } },
            ],
        })
            .populate("artistId", "name")
            .populate("featuring", "name")
            .limit(10);

        res.status(200).json({
            success: true,
            data: albums,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la recherche d'albums",
            error: error.message,
        });
    }
};

const getRecent = async (req, res) => {
    try {
        const recentAlbums = await Album.find()
            .sort({ releaseDate: -1 })
            .limit(10)
            .populate("artistId", "name");

        const albumsWithUrls = await Promise.all(
            recentAlbums.map(async (album) => {
                try {
                    let imageUrl = DEFAULT_IMAGE;

                    // Si l'album a des images configurées, essayer de générer une URL signée
                    if (album.coverImage) {
                        const selectedImage =
                            album.coverImage.medium ||
                            album.coverImage.large ||
                            album.coverImage.thumbnail;
                        if (selectedImage) {
                            const signedUrl = await getSignedUrl(selectedImage);
                            if (signedUrl) {
                                imageUrl = signedUrl;
                            }
                        }
                    }

                    return {
                        id: album._id,
                        title: album.title || "Album Inconnu",
                        artist: album.artistId?.name || "Artiste inconnu",
                        coverUrl: imageUrl,
                        trackCount: album.trackCount || 0,
                        releaseDate: album.releaseDate,
                        year: album.releaseDate
                            ? new Date(album.releaseDate).getFullYear()
                            : null,
                    };
                } catch (error) {
                    console.error("Erreur lors du traitement de l'album:", album.title, error);
                    return {
                        id: album._id,
                        title: album.title || "Album Inconnu",
                        artist: album.artistId?.name || "Artiste inconnu",
                        coverUrl: DEFAULT_IMAGE,
                        trackCount: album.trackCount || 0,
                        releaseDate: album.releaseDate,
                        year: album.releaseDate
                            ? new Date(album.releaseDate).getFullYear()
                            : null,
                    };
                }
            })
        );

        res.json({
            success: true,
            data: albumsWithUrls
        });
    } catch (error) {
        console.error("Erreur dans getRecent:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des albums récents",
            error: error.message,
        });
    }
};

// Récupérer les pistes d'un album
const getAlbumTracks = async (req, res) => {
    try {
        const Track = require("../models/track.model");
        const tracks = await Track.find({ albumId: req.params.id })
            .sort({ trackNumber: 1 })
            .populate("artistId", "name")
            .populate("featuring", "name");

        // Get album information
        const album = await Album.findById(req.params.id)
            .populate("artistId", "name")
            .populate("featuring", "name");

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album non trouvé",
            });
        }

        // Generate signed URLs for album cover images
        const signedCoverImage = {
            thumbnail: album.coverImage?.thumbnail
                ? await getSignedUrl(album.coverImage.thumbnail)
                : null,
            medium: album.coverImage?.medium
                ? await getSignedUrl(album.coverImage.medium)
                : null,
            large: album.coverImage?.large
                ? await getSignedUrl(album.coverImage.large)
                : null,
        };

        // Sélectionner la meilleure image disponible pour coverUrl
        const coverUrl = signedCoverImage.large || 
                         signedCoverImage.medium || 
                         signedCoverImage.thumbnail || 
                         DEFAULT_IMAGE;

        // Format response with signed URLs
        const response = {
            album: {
                ...album.toObject(),
                coverImage: signedCoverImage,
                coverUrl: coverUrl // Ajouter directement une coverUrl
            },
            tracks: await Promise.all(
                tracks.map(async (track) => {
                    // Generate signed URL for track audio
                    const audioUrl = track.audioUrl
                        ? await getSignedUrl(track.audioUrl)
                        : null;

                    // Use album cover for tracks
                    return {
                        ...track.toObject(),
                        audioUrl,
                        coverImage: signedCoverImage, // Use album cover for tracks
                        coverUrl: coverUrl // Ajouter directement une coverUrl pour les pistes
                    };
                })
            ),
        };

        res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des pistes de l'album",
            error: error.message,
        });
    }
};

// Récupérer les pistes disponibles d'un artiste pour un album
const getAvailableTracksForAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const album = await Album.findById(albumId).populate("artistId");
        
        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album non trouvé",
            });
        }

        const Track = require("../models/track.model");
        
        // Récupérer toutes les pistes de l'artiste
        const artistTracks = await Track.find({
            artistId: album.artistId._id
        }).populate("artistId", "name")
          .populate("featuring", "name");

        // Générer les URLs signées pour les pistes
        const tracksWithUrls = await Promise.all(
            artistTracks.map(async (track) => {
                const audioUrl = track.audioUrl ? await getSignedUrl(track.audioUrl) : null;
                return {
                    ...track.toObject(),
                    audioUrl,
                    isInAlbum: track.albumId && track.albumId.toString() === albumId
                };
            })
        );

        res.status(200).json({
            success: true,
            data: tracksWithUrls,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des pistes disponibles",
            error: error.message,
        });
    }
};

// Mettre à jour les pistes d'un album
const updateAlbumTracks = async (req, res) => {
    try {
        const { albumId } = req.params;
        const { trackIds } = req.body;

        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album non trouvé",
            });
        }

        const Track = require("../models/track.model");

        // Retirer l'albumId des pistes qui ne sont plus dans l'album
        await Track.updateMany(
            { 
                albumId: albumId,
                _id: { $nin: trackIds }
            },
            { 
                $unset: { albumId: "" }
            }
        );

        // Ajouter l'albumId aux nouvelles pistes
        await Track.updateMany(
            { 
                _id: { $in: trackIds },
                artistId: album.artistId // Sécurité supplémentaire
            },
            { 
                albumId: albumId
            }
        );

        // Mettre à jour le nombre de pistes
        album.trackCount = trackIds.length;
        await album.save();

        await invalidateAlbumCache();

        res.status(200).json({
            success: true,
            message: "Pistes de l'album mises à jour avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour des pistes de l'album",
            error: error.message,
        });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    deleteAlbum,
    search,
    getRecent,
    getAlbumTracks,
    getAvailableTracksForAlbum,
    updateAlbumTracks
};
