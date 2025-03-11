const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Track = require("../models/track.model");
const Album = require("../models/album.model");
const Artist = require("../models/artist.model");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

console.log("URL MongoDB:", process.env.MONGO_URL);

const createTestData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connecté à MongoDB");

        // Créer un artiste
        const artist = await Artist.create({
            name: "Artiste Test",
            genres: ["Pop", "Rock"],
            image: {
                thumbnail: "https://example.com/thumb.jpg",
                medium: "https://example.com/medium.jpg",
                large: "https://example.com/large.jpg",
            },
        });

        // Créer un album
        const album = await Album.create({
            title: "Album Test",
            artistId: artist._id,
            releaseDate: new Date(),
            genres: ["Pop", "Rock"],
            coverImage: {
                thumbnail: "https://example.com/album-thumb.jpg",
                medium: "https://example.com/album-medium.jpg",
                large: "https://example.com/album-large.jpg",
            },
            type: "album",
        });

        // Créer quelques tracks
        const tracks = await Track.create([
            {
                title: "Chanson 1",
                albumId: album._id,
                artistId: artist._id,
                duration: 180,
                fileUrl: "https://example.com/song1.mp3",
                genres: ["Pop"],
                trackNumber: 1,
            },
            {
                title: "Chanson 2",
                albumId: album._id,
                artistId: artist._id,
                duration: 200,
                fileUrl: "https://example.com/song2.mp3",
                genres: ["Rock"],
                trackNumber: 2,
            },
            {
                title: "Chanson 3",
                albumId: album._id,
                artistId: artist._id,
                duration: 220,
                fileUrl: "https://example.com/song3.mp3",
                genres: ["Pop", "Rock"],
                trackNumber: 3,
            },
        ]);

        console.log("Données de test créées avec succès");
        console.log("Artist ID:", artist._id);
        console.log("Album ID:", album._id);
        console.log("Tracks créées:", tracks.length);
    } catch (error) {
        console.error("Erreur:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Déconnecté de MongoDB");
    }
};

createTestData();
