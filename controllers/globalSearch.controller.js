const Track = require('../models/track.model');
const Artist = require('../models/artist.model');
const Album = require('../models/album.model');
const AWS = require('aws-sdk');

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

// Rechercher Pistes/ Artist /Album
const globalSearch = async (req, res) => {
    try {
        const searchValue = req.query.q;
        if (!searchValue || searchValue.length < 2) {
            return res.status(200).json({
                success: true,
                data: {
                    tracks: [],
                    artists: [],
                    albums: [],
                }
            });
        }

        const searchRegex = new RegExp(searchValue, 'i');
        
        const [tracks, artists, albums] = await Promise.all([
            // Track search
            Track.find({
                $or: [
                    { title: { $regex: searchRegex } },
                    { 'featuring.name': { $regex: searchRegex } }
                ]
            })
            .populate('albumId', 'title artistId coverImage')
            .populate('featuring', 'name')
            .limit(5),

            // Artist search
            Artist.find({ 
                $or: [
                    { name: { $regex: searchRegex } },
                    { genres: { $regex: searchRegex } }
                ]
            })
            .sort({ popularity: -1 })
            .limit(3),
            
            // Album search
            Album.find({
                $or: [
                    { title: { $regex: searchRegex } },
                    { genre: { $regex: searchRegex } }
                ]
            })
            .populate('artistId', 'name')
            .sort({ releaseDate: -1 })
            .limit(3)
        ]);

        // Process tracks to include signed URLs
        const processedTracks = await Promise.all(tracks.map(async track => {
            const trackObj = track.toObject();
            if (trackObj.albumId?.coverImage) {
                const signedCoverImage = {
                    thumbnail: await getSignedUrl(trackObj.albumId.coverImage.thumbnail),
                    medium: await getSignedUrl(trackObj.albumId.coverImage.medium),
                    large: await getSignedUrl(trackObj.albumId.coverImage.large)
                };
                trackObj.albumId.coverImage = signedCoverImage;
            }
            return trackObj;
        }));

        // Process artists to include signed URLs
        const processedArtists = await Promise.all(artists.map(async artist => {
            const artistObj = artist.toObject();
            if (artistObj.image) {
                const signedImage = {
                    thumbnail: await getSignedUrl(artistObj.image.thumbnail),
                    medium: await getSignedUrl(artistObj.image.medium),
                    large: await getSignedUrl(artistObj.image.large)
                };
                artistObj.image = signedImage;
            }
            return artistObj;
        }));

        // Process albums to include signed URLs
        const processedAlbums = await Promise.all(albums.map(async album => {
            const albumObj = album.toObject();
            if (albumObj.coverImage) {
                const signedCoverImage = {
                    thumbnail: await getSignedUrl(albumObj.coverImage.thumbnail),
                    medium: await getSignedUrl(albumObj.coverImage.medium),
                    large: await getSignedUrl(albumObj.coverImage.large)
                };
                albumObj.coverImage = signedCoverImage;
            }
            return albumObj;
        }));

        res.status(200).json({ 
            success: true,
            data: {
                tracks: processedTracks,
                artists: processedArtists,
                albums: processedAlbums
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la recherche globale",
            error: error.message 
        });
    }
};

module.exports = {
    globalSearch
}