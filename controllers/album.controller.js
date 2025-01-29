const Album = require('../models/album.model');
const { formatPaginatedResponse } = require('../utils/pagination');
const AWS = require('aws-sdk');

// Configurer AWS S3
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

const getSignedUrl = async (key) => {
    if (!key) return null;
    try {
        const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
        return url;
    } catch (error) {
        console.error('Erreur lors de la génération de l\'URL signée:', error);
        return null;
    }
};

// Récupérer tous les albums avec pagination
const findAll = async (req, res) => {
    try {
        const { page, limit, skip, sort } = req.pagination;
        const query = {};

        // Filtre par artistId
        if (req.query.artistId) {
            query.artistId = req.query.artistId;
        }

        // Filtre par type (album, single, ep)
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filtre par genre
        if (req.query.genre) {
            query.genres = { $in: [req.query.genre] };
        }

        // Filtre par année de sortie
        if (req.query.year) {
            const year = parseInt(req.query.year);
            query.releaseDate = {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1)
            };
        }

        // Filtre par plage d'années
        if (req.query.fromYear || req.query.toYear) {
            query.releaseDate = {};
            if (req.query.fromYear) {
                query.releaseDate.$gte = new Date(parseInt(req.query.fromYear), 0, 1);
            }
            if (req.query.toYear) {
                query.releaseDate.$lt = new Date(parseInt(req.query.toYear) + 1, 0, 1);
            }
        }

        const [albums, total] = await Promise.all([
            Album.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('artistId', 'name')
                .populate('featuring', 'name'),
            Album.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: albums,
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
            message: "Erreur lors de la récupération des albums",
            error: error.message
        });
    }
};

// Récupérer un album par ID
const findOne = async (req, res) => {
    try {
        const album = await Album.findById(req.params.id)
            .populate('artistId', 'name')
            .populate('featuring', 'name');

        if (!album) {
            return res.status(404).json({ 
                success: false,
                message: "Album non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: album 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération de l'album",
            error: error.message 
        });
    }
};

// Créer un nouvel album
const create = async (req, res) => {
    try {
        const album = new Album(req.body);
        const newAlbum = await album.save();
        
        const populatedAlbum = await Album.findById(newAlbum._id)
            .populate('artistId', 'name')
            .populate('featuring', 'name');

        res.status(201).json({ 
            success: true,
            data: populatedAlbum 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la création de l'album",
            error: error.message 
        });
    }
};

// Mettre à jour un album
const update = async (req, res) => {
    try {
        const album = await Album.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('artistId', 'name')
        .populate('featuring', 'name');

        if (!album) {
            return res.status(404).json({ 
                success: false,
                message: "Album non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            data: album 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la mise à jour de l'album",
            error: error.message 
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
                message: "Album non trouvé" 
            });
        }
        res.status(200).json({ 
            success: true,
            message: "Album supprimé avec succès" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la suppression de l'album",
            error: error.message 
        });
    }
};

// Rechercher des albums
const search = async (req, res) => {
    try {
        const { query } = req.query;
        const albums = await Album.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { label: { $regex: query, $options: 'i' } }
            ]
        })
        .populate('artistId', 'name')
        .populate('featuring', 'name')
        .limit(10);

        res.status(200).json({ 
            success: true,
            data: albums 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la recherche d'albums",
            error: error.message 
        });
    }
};

const getRecent = async (req, res) => {
    try {
        const recentAlbums = await Album.find()
            .sort({ releaseDate: -1 })
            .limit(10)
            .populate('artistId', 'name');

        const albumsWithUrls = await Promise.all(recentAlbums.map(async (album) => {
            const coverUrl = await getSignedUrl(album.coverUrl) || '/assets/placeholder.webp';
            return {
                id: album._id,
                title: album.title,
                artist: album.artistId.name,
                coverUrl: coverUrl,
                year: new Date(album.releaseDate).getFullYear()
            };
        }));

        res.json(albumsWithUrls);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des albums récents" });
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    update,
    deleteAlbum,
    search,
    getRecent
}; 