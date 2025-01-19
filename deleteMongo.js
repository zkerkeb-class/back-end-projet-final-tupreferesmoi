const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Artist = require('./models/artist.model.js');
const Track = require('./models/track.model.js');
const Album = require('./models/album.model.js');
const connectToDatabase = require('./db/mongodb.js');

dotenv.config();
connectToDatabase();

async function clearDatabase() {
    try {
        console.log('Début de la suppression des données...');

        // Suppression des artistes
        const artistResult = await Artist.deleteMany({});
        console.log(`${artistResult.deletedCount} artistes supprimés`);

        // Suppression des albums
        const albumResult = await Album.deleteMany({});
        console.log(`${albumResult.deletedCount} albums supprimés`);

        // Suppression des pistes
        const trackResult = await Track.deleteMany({});
        console.log(`${trackResult.deletedCount} pistes supprimées`);

        console.log('Toutes les données ont été supprimées avec succès !');
    } catch (error) {
        console.error('Erreur lors de la suppression des données:', error);
    } finally {
        // Fermeture de la connexion à la base de données
        await mongoose.disconnect();
        console.log('Déconnexion de la base de données');
    }
}

// Exécution du script
clearDatabase();
