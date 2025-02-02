const Track = require("../models/track.model");
const { formatPaginatedResponse } = require("../utils/pagination");
const AWS = require("aws-sdk");

// Configuration AWS avec les credentials et la région
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: "v4",
});

const DEFAULT_IMAGE =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyQTJBMkEiLz48cGF0aCBkPSJNOTAgODBIMTEwQzExNS41MjMgODAgMTIwIDg0LjQ3NzIgMTIwIDkwVjExMEMxMjAgMTE1LjUyMyAxMTUuNTIzIDEyMCAxMTAgMTIwSDkwQzg0LjQ3NzIgMTIwIDgwIDExNS41MjMgODAgMTEwVjkwQzgwIDg0LjQ3NzIgODQuNDc3MiA4MCA5MCA4MFoiIGZpbGw9IiM0MDQwNDAiLz48cGF0aCBkPSJNMTAwIDg1QzEwMi43NjEgODUgMTA1IDg3LjIzODYgMTA1IDkwQzEwNSA5Mi43NjE0IDEwMi43NjEgOTUgMTAwIDk1Qzk3LjIzODYgOTUgOTUgOTIuNzYxNCA5NSA5MEM5NSA4Ny4yMzg2IDk3LjIzODYgODUgMTAwIDg1WiIgZmlsbD0iIzU5NTk1OSIvPjwvc3ZnPg==";

const getSignedUrl = async (url) => {
    if (!url) return null;

    try {
        // Extraire la clé de l'URL complète
        const urlParts = url.split(".amazonaws.com/");
        if (urlParts.length !== 2) {
            console.log("URL invalide:", url);
            return null;
        }

        const key = decodeURIComponent(urlParts[1]);
        console.log("Génération URL signée pour la clé:", key);

        // Générer une URL signée valide pendant 1 heure
        const signedUrl = await s3.getSignedUrlPromise("getObject", {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: 3600,
            ResponseContentDisposition: "inline",
        });

        console.log("URL signée générée avec succès");
        return signedUrl;
    } catch (error) {
        console.error("Erreur lors de la génération de l'URL signée:", error);
        return null;
    }
};

// Récupérer toutes les pistes avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit, skip, sort } = req.pagination;
        const query = {};

        // Filtre par artistId si spécifié
        if (req.query.artistId) {
            query.artistId = req.query.artistId;
        }

        // Filtre par albumId si spécifié
        if (req.query.albumId) {
            query.albumId = req.query.albumId;
        }

        // Filtre par durée
        if (req.query.minDuration || req.query.maxDuration) {
            query.duration = {};
            if (req.query.minDuration)
                query.duration.$gte = parseInt(req.query.minDuration);
            if (req.query.maxDuration)
                query.duration.$lte = parseInt(req.query.maxDuration);
        }

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

        const [tracks, total] = await Promise.all([
            Track.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("artistId", "name")
                .populate({
                    path: "albumId",
                    select: "title coverImage type releaseDate artistId",
                    populate: { path: "artistId", select: "name" },
                }),
            Track.countDocuments(query),
        ]);

        const processTrack = async (track) => {
            try {
                let imageUrl = DEFAULT_IMAGE;
                let audioUrl = null;

                if (track.albumId?.coverImage) {
                    const selectedImage =
                        track.albumId.coverImage.medium ||
                        track.albumId.coverImage.large ||
                        track.albumId.coverImage.thumbnail;

                    if (selectedImage) {
                        const signedImageUrl = await getSignedUrl(selectedImage);
                        if (signedImageUrl) {
                            imageUrl = signedImageUrl;
                        }
                    }
                }

                if (track.audioUrl) {
                    const signedAudioUrl = await getSignedUrl(track.audioUrl);
                    if (signedAudioUrl) {
                        audioUrl = signedAudioUrl;
                    }
                }

                return {
                    id: track._id,
                    title: track.title,
                    artist: track.artistId?.name || "Artiste inconnu",
                    album: {
                        id: track.albumId?._id,
                        title: track.albumId?.title || "Album inconnu",
                        type: track.albumId?.type || "single",
                        releaseDate: track.albumId?.releaseDate,
                        artist: track.albumId?.artistId?.name,
                    },
                    coverUrl: imageUrl,
                    duration: track.duration || 0,
                    audioUrl: audioUrl,
                };
            } catch (error) {
                return null;
            }
        };

        const tracksWithUrls = await Promise.all(tracks.map(processTrack));
        const validTracks = tracksWithUrls.filter(track => track !== null);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: validTracks,
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
            message: "Erreur lors de la récupération des pistes",
            error: error.message,
        });
    }
};

// Récupérer une piste par ID
const findOne = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id)
            .populate("artistId", "name")
            .populate({
                path: "albumId",
                select: "title coverImage type releaseDate artistId",
                populate: { path: "artistId", select: "name" }
            })
            .populate("featuring", "name");

        if (!track) {
            return res.status(404).json({
                success: false,
                message: "Piste non trouvée",
            });
        }

        // Préparer les URLs signées
        let imageUrl = DEFAULT_IMAGE;
        let audioUrl = null;

        // Signer l'URL de l'image de l'album
        if (track.albumId?.coverImage) {
            const selectedImage =
                track.albumId.coverImage.medium ||
                track.albumId.coverImage.large ||
                track.albumId.coverImage.thumbnail;

            if (selectedImage) {
                const signedImageUrl = await getSignedUrl(selectedImage);
                if (signedImageUrl) {
                    imageUrl = signedImageUrl;
                }
            }
        }

        // Signer l'URL audio
        if (track.audioUrl) {
            console.log("URL audio originale:", track.audioUrl);
            const signedAudioUrl = await getSignedUrl(track.audioUrl);
            if (signedAudioUrl) {
                audioUrl = signedAudioUrl;
                console.log("URL audio signée générée");
            }
        }

        const trackData = {
            id: track._id,
            title: track.title,
            artistId: track.artistId,
            albumId: track.albumId,
            coverUrl: imageUrl,
            duration: track.duration || 0,
            audioUrl: audioUrl,
            featuring: track.featuring || [],
            genres: track.genres || [],
            popularity: track.popularity || 0,
            explicit: track.explicit || false,
            trackNumber: track.trackNumber || 1,
        };

        res.status(200).json({
            success: true,
            data: trackData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la piste",
            error: error.message,
        });
    }
};

// Créer une nouvelle piste
const create = async (req, res) => {
    try {
        const track = new Track(req.body);
        const newTrack = await track.save();

        const populatedTrack = await Track.findById(newTrack._id)
            .populate("albumId", "title")
            .populate("featuring", "name");

        res.status(201).json({
            success: true,
            data: populatedTrack,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la création de la piste",
            error: error.message,
        });
    }
};

// Mettre à jour une piste
const update = async (req, res) => {
    try {
        const track = await Track.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate("albumId", "title")
            .populate("featuring", "name");

        if (!track) {
            return res.status(404).json({
                success: false,
                message: "Piste non trouvée",
            });
        }
        res.status(200).json({
            success: true,
            data: track,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la mise à jour de la piste",
            error: error.message,
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
                message: "Piste non trouvée",
            });
        }
        res.status(200).json({
            success: true,
            message: "Piste supprimée avec succès",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de la piste",
            error: error.message,
        });
    }
};

// Rechercher des pistes
const search = async (req, res) => {
    try {
        const { query } = req.query;
        const tracks = await Track.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { lyrics: { $regex: query, $options: "i" } },
            ],
        })
            .populate("albumId", "title artistId")
            .populate("featuring", "name")
            .limit(10);

        res.status(200).json({
            success: true,
            data: tracks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la recherche de pistes",
            error: error.message,
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
                message: "Piste non trouvée",
            });
        }
        res.status(200).json({
            success: true,
            data: track,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Erreur lors de la mise à jour de la popularité",
            error: error.message,
        });
    }
};

const getRecent = async (req, res) => {
    try {
        console.log("Récupération des pistes récentes...");
        const recentTracks = await Track.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("artistId", "name")
            .populate("albumId", "coverImage");

        console.log("Nombre de pistes trouvées:", recentTracks.length);

        const tracksWithUrls = await Promise.all(
            recentTracks.map(async (track) => {
                try {
                    console.log("\nTraitement de la piste:", track.title);
                    let imageUrl = DEFAULT_IMAGE;
                    let audioUrl = null;

                    // Signer l'URL de l'image
                    if (track.albumId?.coverImage) {
                        const selectedImage =
                            track.albumId.coverImage.medium ||
                            track.albumId.coverImage.large ||
                            track.albumId.coverImage.thumbnail;

                        if (selectedImage) {
                            console.log("URL image originale:", selectedImage);
                            const signedImageUrl =
                                await getSignedUrl(selectedImage);
                            if (signedImageUrl) {
                                imageUrl = signedImageUrl;
                                console.log("URL image signée générée");
                            }
                        }
                    }

                    // Signer l'URL audio
                    if (track.audioUrl) {
                        console.log("URL audio originale:", track.audioUrl);
                        const signedAudioUrl = await getSignedUrl(
                            track.audioUrl
                        );
                        if (signedAudioUrl) {
                            audioUrl = signedAudioUrl;
                            console.log("URL audio signée générée:", audioUrl);
                        } else {
                            console.log(
                                "Échec de la génération de l'URL audio signée"
                            );
                        }
                    } else {
                        console.log(
                            "Aucune URL audio trouvée pour la piste:",
                            track.title
                        );
                    }

                    const trackData = {
                        id: track._id,
                        title: track.title,
                        artist: track.artistId?.name || "Artiste inconnu",
                        coverUrl: imageUrl,
                        duration: track.duration,
                        audioUrl: audioUrl,
                    };
                    console.log("Données de piste préparées:", trackData);
                    return trackData;
                } catch (error) {
                    console.error(
                        "Erreur lors du traitement du morceau:",
                        track.title,
                        error
                    );
                    return {
                        id: track._id,
                        title: track.title,
                        artist: track.artistId?.name || "Artiste inconnu",
                        coverUrl: DEFAULT_IMAGE,
                        duration: track.duration,
                        audioUrl: track.previewUrl,
                    };
                }
            })
        );

        console.log(
            "\nEnvoi de la réponse avec",
            tracksWithUrls.length,
            "pistes"
        );
        res.json(tracksWithUrls);
    } catch (error) {
        console.error("Erreur dans getRecent:", error);
        res.status(500).json({
            message: "Erreur lors de la récupération des morceaux récents",
            error: error.message,
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
    updatePopularity,
    getRecent,
};
