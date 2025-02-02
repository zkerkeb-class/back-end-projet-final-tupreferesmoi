const Track = require('../models/track.model');
const Artist = require('../models/artist.model');
const Album = require('../models/album.model');



// Rechercher Pistes/ Artist /Album
const globalSearch = async (req, res) => {
    try {
        const searchValue = req.params.value;
        console.log(searchValue);

        let searchResult = {
            tracks : undefined,

            artists :undefined,

            albums :undefined,
        }
        
        searchResult.tracks = await Track.find({
            $or: [{ title: { $regex: searchValue, $options: 'i' } }]
                
        })
        .populate('albumId', 'title artistId')
        .populate('featuring', 'name')
        .limit(10);

                
        searchResult.artists = await Artist.find({ 
            $or: [{ name : { $regex: searchValue, $options: 'i' } }]
                
        }).limit(10);
        
        searchResult.albums = await Album.find({
            $or: [{ title: { $regex: searchValue, $options: 'i' } }]
                        
        }).limit(10);


        res.status(200).json({ 
            success: true,
            data: searchResult 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Erreur lors la recherche global",
            error: error.message 
        });
    }
};


module.exports = {
    globalSearch
}