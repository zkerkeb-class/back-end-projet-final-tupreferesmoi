const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');

// Chargement des variables d'environnement
dotenv.config();

// Vérification de la configuration
if (!process.env.MONGO_URL) {
    console.error('Erreur: MONGO_URL n\'est pas défini dans le fichier .env');
    process.exit(1);
}

// Configuration FFmpeg
Ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg');
Ffmpeg.setFfprobePath('/usr/local/bin/ffprobe');

// Configuration AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Formats audio acceptés
const ACCEPTED_FORMATS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
const CONVERT_TO_FORMAT = 'm4a';

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connecté à MongoDB avec succès');
}).catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

// Import des modèles
const Album = require('./models/album.model');
const Artist = require('./models/artist.model');
const Track = require('./models/track.model');

async function scanDirectory(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            files.push(...await scanDirectory(fullPath));
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (ACCEPTED_FORMATS.includes(ext)) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

async function convertAudio(inputPath) {
    const outputPath = `${inputPath}.${CONVERT_TO_FORMAT}`;
    
    return new Promise((resolve, reject) => {
        Ffmpeg(inputPath)
            .toFormat(CONVERT_TO_FORMAT)
            .audioCodec('aac')
            .audioBitrate('320k')
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .save(outputPath);
    });
}

async function uploadToS3(filePath, key) {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: fileStream
    };

    return s3.upload(uploadParams).promise();
}

async function processFile(filePath) {
    try {
        console.log(`Traitement de : ${filePath}`);
        
        // Extraction des métadonnées
        const tags = NodeID3.read(filePath);
        
        // Création ou récupération de l'artiste
        const artist = await Artist.findOneAndUpdate(
            { name: tags.artist || 'Artiste Inconnu' },
            { 
                name: tags.artist || 'Artiste Inconnu',
                genres: tags.genre ? [tags.genre] : [],
                updatedAt: Date.now()
            },
            { upsert: true, new: true }
        );

        // Gestion de la date
        let releaseDate = new Date();
        if (tags.year) {
            // Si l'année est un nombre valide
            const year = parseInt(tags.year);
            if (!isNaN(year) && year > 1900 && year < 2100) {
                releaseDate = new Date(year, 0);
            }
        }

        // Création ou récupération de l'album
        const album = await Album.findOneAndUpdate(
            { 
                title: tags.album || 'Album Inconnu',
                artistId: artist._id 
            },
            {
                title: tags.album || 'Album Inconnu',
                artistId: artist._id,
                releaseDate: releaseDate,
                genres: tags.genre ? [tags.genre] : [],
                type: 'album',
                updatedAt: Date.now()
            },
            { upsert: true, new: true }
        );

        // Obtenir la durée avec FFmpeg
        const duration = await new Promise((resolve, reject) => {
            Ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata.format.duration || 0);
            });
        });

        // Conversion audio si nécessaire
        const convertedPath = path.extname(filePath).toLowerCase() === `.${CONVERT_TO_FORMAT}`
            ? filePath
            : await convertAudio(filePath);

        // Upload sur S3
        const s3Key = `tracks/${path.basename(convertedPath)}`;
        const s3Response = await uploadToS3(convertedPath, s3Key);

        // Création de la piste
        const track = new Track({
            title: tags.title || path.basename(filePath),
            fileUrl: s3Response.Location,
            duration: Math.round(duration),
            albumId: album._id,
            trackNumber: parseInt(tags.trackNumber) || 1,
            genres: tags.genre ? [tags.genre] : [],
            updatedAt: Date.now()
        });

        await track.save();

        // Nettoyage des fichiers temporaires
        if (convertedPath !== filePath) {
            fs.unlinkSync(convertedPath);
        }

        console.log(`Traitement terminé pour : ${filePath}`);
    } catch (error) {
        console.error(`Erreur lors du traitement de ${filePath}:`, error);
    }
}

async function main() {
    try {
        // Utilisation du chemin relatif depuis le script
        const libraryPath = path.join(__dirname, 'library');
        
        // Vérification si le dossier existe
        if (!fs.existsSync(libraryPath)) {
            console.error(`Le dossier 'library' n'existe pas dans ${libraryPath}`);
            console.log('Création du dossier library...');
            fs.mkdirSync(libraryPath);
            console.log('Veuillez placer vos fichiers audio dans le dossier library et relancer le script');
            process.exit(1);
        }

        const audioFiles = await scanDirectory(libraryPath);
        
        console.log(`Nombre de fichiers audio trouvés : ${audioFiles.length}`);
        
        for (const file of audioFiles) {
            await processFile(file);
        }
        
        console.log('Traitement terminé avec succès');
    } catch (error) {
        console.error('Erreur lors du traitement :', error);
    } finally {
        mongoose.disconnect();
    }
}

main();
