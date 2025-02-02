const Track = require('../models/track.model');
const Artist = require('../models/artist.model');
const Album = require('../models/album.model');



// Rechercher Pistes/ Artist /Album
const globalSearch = async (req, res) => {
    try {
        const searchValue = req.params.value;
        if (!searchValue || searchValue.length < 2) {
            return res.status(200).json({
                success: true,
                data: {
                    tracks: [],
                    artists: [],
                    albums: []
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
            .populate('albumId', 'title artistId cover')
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

        res.status(200).json({ 
            success: true,
            data: {
                tracks,
                artists,
                albums
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