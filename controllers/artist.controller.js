const Artist = require("../models/artist.model");
const { formatPaginatedResponse } = require("../utils/pagination");
const AWS = require("aws-sdk");
const Track = require("../models/track.model");

// Configuration AWS avec les credentials et la région
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: "v4",
});

const getSignedUrl = async (imageUrl) => {
    if (!imageUrl) return null;

    try {
        // Extraire la clé de l'URL complète
        const urlParts = imageUrl.split(".amazonaws.com/");
        if (urlParts.length !== 2) return null;

        const key = urlParts[1];
        console.log("Génération URL signée pour la clé:", key);

        // Générer une URL signée valide pendant 1 heure
        const signedUrl = await s3.getSignedUrlPromise("getObject", {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: 3600,
        });

        return signedUrl;
    } catch (error) {
        console.error("Erreur lors de la génération de l'URL signée:", error);
        return null;
    }
};

// Récupérer tous les artistes avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit, skip, sort } = req.pagination;
        const query = {};

        // Filtre par genre
        if (req.query.genre) {
            query.genres = { $in: [req.query.genre] };
        }

        // Filtre par popularité
        if (req.query.minPopularity || req.query.maxPopularity) {
            query.popularity = {};
            if (req.query.minPopularity)
                query.popularity.$gte = parseInt(req.query.minPopularity);
            if (req.query.maxPopularity)
                query.popularity.$lte = parseInt(req.query.maxPopularity);
        }

        // Filtre par nom (recherche partielle)
        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: "i" };
        }

        const [artists, total] = await Promise.all([
            Artist.find(query).sort(sort).skip(skip).limit(limit),
            Artist.countDocuments(query),
        ]);

        const artistsWithUrls = await Promise.all(
            artists.map(async (artist) => {
                try {
                    let imageUrl = DEFAULT_IMAGE;

                    // Si l'artiste a des images configurées, essayer de générer une URL signée
                    if (artist.image) {
                        const selectedImage =
                            artist.image.medium ||
                            artist.image.large ||
                            artist.image.thumbnail;
                        if (selectedImage) {
                            const signedUrl = await getSignedUrl(selectedImage);
                            if (signedUrl) {
                                imageUrl = signedUrl;
                            }
                        }
                    }

                    return {
                        id: artist._id,
                        name: artist.name,
                        imageUrl: imageUrl,
                        genres: artist.genres || [],
                        popularity: artist.popularity || 0
                    };
                } catch (error) {
                    console.error(
                        "Erreur lors du traitement de l'artiste:",
                        artist.name,
                        error
                    );
                    return {
                        id: artist._id,
                        name: artist.name,
                        imageUrl: DEFAULT_IMAGE,
                        genres: artist.genres || [],
                        popularity: artist.popularity || 0
                    };
                }
            })
        );

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: artistsWithUrls,
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
            message: "Erreur lors de la récupération des artistes",
            error: error.message,
        });
    }
};

// Récupérer un artiste par son ID
const findOne = async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id)
            .populate("genres")
            .lean();

        if (!artist) {
            return res.status(404).json({
                success: false,
                message: "Artiste non trouvé",
            });
        }

        // Calculer le nombre d'auditeurs mensuels (simulé pour l'exemple)
        const monthlyListeners = Math.floor(Math.random() * 1000000) + 100000;

        const enrichedArtist = {
            ...artist,
            followers: monthlyListeners,
            imageUrl: artist.image || "https://via.placeholder.com/300", // URL par défaut si pas d'image
            verified: true, // Pour l'exemple, tous les artistes sont vérifiés
        };

        res.json({
            success: true,
            data: enrichedArtist,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'artiste:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de l'artiste",
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
            data: newArtist,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la création de l'artiste",
            error: error.message,
        });
    }
};

// Mettre à jour un artiste
const update = async (req, res) => {
    try {
        const artist = await Artist.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!artist) {
            return res.status(404).json({
                success: false,
                message: "Artiste non trouvé",
            });
        }
        res.status(200).json({
            success: true,
            data: artist,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la mise à jour de l'artiste",
            error: error.message,
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
                message: "Artiste non trouvé",
            });
        }
        res.status(200).json({
            success: true,
            message: "Artiste supprimé avec succès",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de l'artiste",
            error: error.message,
        });
    }
};

// Rechercher des artistes
const search = async (req, res) => {
    try {
        const { query } = req.query;
        const artists = await Artist.find({
            $text: { $search: query },
        });
        res.status(200).json({
            success: true,
            data: artists,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la recherche d'artistes",
            error: error.message,
        });
    }
};

const DEFAULT_IMAGE =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyQTJBMkEiLz48cGF0aCBkPSJNOTAgODBIMTEwQzExNS41MjMgODAgMTIwIDg0LjQ3NzIgMTIwIDkwVjExMEMxMjAgMTE1LjUyMyAxMTUuNTIzIDEyMCAxMTAgMTIwSDkwQzg0LjQ3NzIgMTIwIDgwIDExNS41MjMgODAgMTEwVjkwQzgwIDg0LjQ3NzIgODQuNDc3MiA4MCA5MCA4MFoiIGZpbGw9IiM0MDQwNDAiLz48cGF0aCBkPSJNMTAwIDg1QzEwMi43NjEgODUgMTA1IDg3LjIzODYgMTA1IDkwQzEwNSA5Mi43NjE0IDEwMi43NjEgOTUgMTAwIDk1Qzk3LjIzODYgOTUgOTUgOTIuNzYxNCA5NSA5MEM5NSA4Ny4yMzg2IDk3LjIzODYgODUgMTAwIDg1WiIgZmlsbD0iIzU5NTk1OSIvPjwvc3ZnPg==";

const getPopular = async (req, res) => {
    try {
        const popularArtists = await Artist.find()
            .sort({ popularity: -1 })
            .limit(10);

        if (popularArtists.length === 0) {
            return res.json([]);
        }

        const artistsWithUrls = await Promise.all(
            popularArtists.map(async (artist) => {
                try {
                    let imageUrl = DEFAULT_IMAGE;

                    // Si l'artiste a des images configurées, essayer de générer une URL signée
                    if (artist.image) {
                        const selectedImage =
                            artist.image.medium ||
                            artist.image.large ||
                            artist.image.thumbnail;
                        if (selectedImage) {
                            const signedUrl = await getSignedUrl(selectedImage);
                            if (signedUrl) {
                                imageUrl = signedUrl;
                            }
                        }
                    }

                    return {
                        id: artist._id,
                        name: artist.name,
                        imageUrl: imageUrl,
                        followers: artist.followers || 0,
                    };
                } catch (error) {
                    console.error(
                        "Erreur lors du traitement de l'artiste:",
                        artist.name,
                        error
                    );
                    return {
                        id: artist._id,
                        name: artist.name,
                        imageUrl: DEFAULT_IMAGE,
                        followers: artist.followers || 0,
                    };
                }
            })
        );

        res.json(artistsWithUrls);
    } catch (error) {
        console.error("Erreur dans getPopular:", error);
        res.status(500).json({
            message: "Erreur lors de la récupération des artistes populaires",
            error: error.message,
        });
    }
};

const getTopTracks = async (req, res) => {
    try {
        const artistId = req.params.id;

        // Vérifier si l'artiste existe
        const artist = await Artist.findById(artistId);
        if (!artist) {
            return res.status(404).json({
                success: false,
                message: "Artiste non trouvé",
            });
        }

        // Récupérer les titres les plus populaires de l'artiste
        const topTracks = await Track.find({ artistId: artistId })
            .sort({ popularity: -1 })
            .limit(10)
            .populate("albumId")
            .lean();

        // Enrichir les données des titres avec les URLs signées
        const enrichedTracks = await Promise.all(topTracks.map(async (track) => {
            let coverUrl = null;
            let audioUrl = null;

            // Générer URL signée pour la couverture de l'album
            if (track.albumId?.coverImage) {
                const selectedImage = 
                    track.albumId.coverImage.medium ||
                    track.albumId.coverImage.large ||
                    track.albumId.coverImage.thumbnail;
                if (selectedImage) {
                    coverUrl = await getSignedUrl(selectedImage);
                }
            }

            // Générer URL signée pour l'audio
            if (track.audioUrl) {
                audioUrl = await getSignedUrl(track.audioUrl);
            }

            return {
                id: track._id,
                title: track.title,
                duration: track.duration,
                plays: Math.floor(Math.random() * 1000000) + 10000, // Nombre de lectures simulé
                albumTitle: track.albumId?.title || "Single",
                coverUrl: coverUrl || DEFAULT_IMAGE,
                audioUrl: audioUrl,
                explicit: track.explicit || false,
            };
        }));

        res.json({
            success: true,
            data: enrichedTracks,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des top tracks:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des top tracks",
        });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    deleteArtist,
    search,
    getPopular,
    getTopTracks,
};
