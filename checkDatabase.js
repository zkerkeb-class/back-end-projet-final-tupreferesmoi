require("dotenv").config();
const mongoose = require("mongoose");
const Artist = require("./models/artist.model");

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connecté à MongoDB");

        const artistCount = await Artist.countDocuments();
        console.log(`Nombre total d'artistes: ${artistCount}`);

        if (artistCount > 0) {
            const artists = await Artist.find().limit(5);
            console.log("\nPremiers artistes trouvés:");
            artists.forEach((artist) => {
                console.log(`\nNom: ${artist.name}`);
                console.log("Images:", JSON.stringify(artist.image, null, 2));
                console.log("Popularité:", artist.popularity);
            });
        }
    } catch (error) {
        console.error("Erreur:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDatabase();
