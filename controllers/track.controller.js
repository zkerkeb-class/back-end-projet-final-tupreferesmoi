const Track = require('../models/track.model');
const { formatPaginatedResponse } = require('../utils/pagination');
const AWS = require('aws-sdk');

// Configuration AWS avec les credentials et la région
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4'
});

const DEFAULT_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyQTJBMkEiLz48cGF0aCBkPSJNOTAgODBIMTEwQzExNS41MjMgODAgMTIwIDg0LjQ3NzIgMTIwIDkwVjExMEMxMjAgMTE1LjUyMyAxMTUuNTIzIDEyMCAxMTAgMTIwSDkwQzg0LjQ3NzIgMTIwIDgwIDExNS41MjMgODAgMTEwVjkwQzgwIDg0LjQ3NzIgODQuNDc3MiA4MCA5MCA4MFoiIGZpbGw9IiM0MDQwNDAiLz48cGF0aCBkPSJNMTAwIDg1QzEwMi43NjEgODUgMTA1IDg3LjIzODYgMTA1IDkwQzEwNSA5Mi43NjE0IDEwMi43NjEgOTUgMTAwIDk1Qzk3LjIzODYgOTUgOTUgOTIuNzYxNCA5NSA5MEM5NSA4Ny4yMzg2IDk3LjIzODYgODUgMTAwIDg1WiIgZmlsbD0iIzU5NTk1OSIvPjwvc3ZnPg==";

const getSignedUrl = async (imageUrl) => {
    if (!imageUrl) return null;
    
    try {
        // Extraire la clé de l'URL complète
        const urlParts = imageUrl.split('.amazonaws.com/');
        if (urlParts.length !== 2) return null;
        
        const key = urlParts[1];
        console.log('Génération URL signée pour la clé:', key);

        // Générer une URL signée valide pendant 1 heure
        const signedUrl = await s3.getSignedUrlPromise('getObject', {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: 3600
        });
        
        return signedUrl;
    } catch (error) {
        console.error('Erreur lors de la génération de l\'URL signée:', error);
        return null;
    }
};

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

const getRecent = async (req, res) => {
    try {
        const recentTracks = await Track.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('artistId', 'name')
            .populate('albumId', 'coverImage');

        console.log('Morceaux récupérés avec leurs albums:', recentTracks.map(track => ({
            title: track.title,
            albumId: track.albumId?._id,
            albumCoverImage: track.albumId?.coverImage
        })));

        const tracksWithUrls = await Promise.all(recentTracks.map(async (track) => {
            try {
                let imageUrl = DEFAULT_IMAGE;
                
                // Si l'album a des images configurées, essayer de générer une URL signée
                if (track.albumId?.coverImage) {
                    const selectedImage = track.albumId.coverImage.medium || 
                                       track.albumId.coverImage.large || 
                                       track.albumId.coverImage.thumbnail;
                    
                    console.log(`Image sélectionnée pour ${track.title}:`, selectedImage);
                    
                    if (selectedImage) {
                        const signedUrl = await getSignedUrl(selectedImage);
                        console.log(`URL signée générée pour ${track.title}:`, signedUrl);
                        if (signedUrl) {
                            imageUrl = signedUrl;
                        }
                    }
                } else {
                    console.log(`Pas d'image trouvée pour ${track.title} (Album ID: ${track.albumId?._id})`);
                }
                
                return {
                    id: track._id,
                    title: track.title,
                    artist: track.artistId?.name || 'Artiste inconnu',
                    coverUrl: imageUrl,
                    duration: track.duration
                };
            } catch (error) {
                console.error('Erreur lors du traitement du morceau:', track.title, error);
                return {
                    id: track._id,
                    title: track.title,
                    artist: track.artistId?.name || 'Artiste inconnu',
                    coverUrl: DEFAULT_IMAGE,
                    duration: track.duration
                };
            }
        }));

        console.log('Morceaux formatés avec leurs URLs:', tracksWithUrls);
        res.json(tracksWithUrls);
    } catch (error) {
        console.error('Erreur dans getRecent:', error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération des morceaux récents",
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
    updatePopularity,
    getRecent
}; 