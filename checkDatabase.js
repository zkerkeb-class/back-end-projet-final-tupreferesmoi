require("dotenv").config();
const mongoose = require("mongoose");
const Artist = require("./models/artist.model");

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connecté à MongoDB");

        const artistCount = await Artist.countDocuments();

        if (artistCount > 0) {
            const artists = await Artist.find().limit(5);
        }
    } catch (error) {
        console.error("Erreur:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDatabase();
