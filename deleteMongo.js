const mongoose = require("mongoose");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
const Track = require("./models/track.model.js");
const Artist = require("./models/artist.model.js");
const Album = require("./models/album.model.js");
const connectToDatabase = require("./db/mongodb.js");

dotenv.config();

// Configuration AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3();

async function deleteS3Objects() {
    try {
        console.log("Suppression des objets S3...");

        // Lister tous les objets dans le bucket
        const listParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
        };

        const listedObjects = await s3.listObjectsV2(listParams).promise();

        if (listedObjects.Contents.length === 0) {
            console.log("Aucun objet à supprimer dans S3");
            return;
        }

        // Préparer les objets pour la suppression
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
                Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
            },
        };

        // Supprimer les objets
        const deleted = await s3.deleteObjects(deleteParams).promise();
        console.log(`${deleted.Deleted.length} objets supprimés de S3`);

        // Vérifier s'il y a plus d'objets à supprimer (pagination)
        if (listedObjects.IsTruncated) {
            console.log(
                "Plus d'objets à supprimer, traitement de la page suivante..."
            );
            await deleteS3Objects();
        }
    } catch (error) {
        console.error("Erreur lors de la suppression des objets S3:", error);
        throw error;
    }
}

async function deleteAllData() {
    try {
        console.log("Début de la suppression des données...");
        await connectToDatabase();

        // Supprimer les données MongoDB
        const artistsDeleted = await Artist.deleteMany({});
        console.log(`${artistsDeleted.deletedCount} artistes supprimés`);

        const albumsDeleted = await Album.deleteMany({});
        console.log(`${albumsDeleted.deletedCount} albums supprimés`);

        const tracksDeleted = await Track.deleteMany({});
        console.log(`${tracksDeleted.deletedCount} pistes supprimées`);

        // Supprimer les fichiers S3
        await deleteS3Objects();

        console.log("Toutes les données ont été supprimées avec succès !");
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
    } finally {
        console.log("Déconnexion de la base de données");
        await mongoose.disconnect();
    }
}
