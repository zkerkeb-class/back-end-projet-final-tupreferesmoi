const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Ffmpeg = require('fluent-ffmpeg');
const musicMetadata = require('music-metadata');
const sharp = require('sharp');
const Track = require('./models/track.model.js');
const Artist = require('./models/artist.model.js');
const Album = require('./models/album.model.js');
const connectToDatabase = require('./db/mongodb.js');

// Statistiques globales
const stats = {
  totalFiles: 0,
  successCount: 0,
  failureCount: 0,
  failures: []
};

Ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg');

dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3();

connectToDatabase();

const localDirectory = './library';
const MAX_FILES = 100;

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.error('Skipping:', dirFile, ' - Broken symlink');
      } else throw err;
    }
  });
  return filelist;
}

async function uploadImageToS3(imageBuffer, format, prefix) {
  if (!imageBuffer) return null;
  
  try {
    // Définition des tailles avec une meilleure qualité
    const sizes = {
      thumbnail: { width: 300, height: 300 },  // Augmenté de 150 à 300
      medium: { width: 600, height: 600 },     // Augmenté de 400 à 600
      large: { width: 1200, height: 1200 }     // Augmenté de 800 à 1200
    };

    const urls = {};

    // Génération et upload des différentes tailles
    for (const [size, dimensions] of Object.entries(sizes)) {
      const webpBuffer = await sharp(imageBuffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'centre',
          withoutEnlargement: true
        })
        .webp({ 
          quality: 95,  // Augmenté de 80 à 95
          effort: 6,    // Meilleur effort de compression
          smartSubsample: true  // Meilleure qualité pour les zones colorées
        })
        .toBuffer();
      
      const imageKey = `images/${prefix}-${size}-${Date.now()}.webp`;
      await s3.upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: webpBuffer,
        ContentType: 'image/webp'
      }).promise();
      
      urls[size] = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${imageKey}`;
    }
    
    return urls;
  } catch (error) {
    console.error('Erreur lors de la conversion/upload de l\'image:', error);
    return null;
  }
}

async function processAudioFile(filePath) {
  let outputFilePath = filePath;
  try {
    const originalname = path.basename(filePath);
    console.log(`Processing file: ${filePath}`);
    stats.totalFiles++;

    try {
      const metadata = await musicMetadata.parseFile(filePath);
      const {common, format} = metadata;

      const existingTrack = await Track.findOne({title: common.title || originalname});
      if (existingTrack) {
        console.log(`Track already exists in the database: ${common.title || originalname}`);
        return;
      }

      const fileExtension = path.extname(originalname).toLowerCase();

      // Vérification du format de fichier compatible
      const supportedFormats = ['.mp3', '.wav', '.flac', '.m4a', '.webm', '.opus'];
      if (!supportedFormats.includes(fileExtension)) {
        console.error(`Unsupported file format: ${fileExtension}`);
        stats.failureCount++;
        stats.failures.push({
          file: originalname,
          error: `Unsupported file format: ${fileExtension}`
        });
        return;
      }

      // Vérification de la validité du fichier avant conversion
      if (!format || !format.duration) {
        console.error(`Invalid file format or corrupted file: ${originalname}`);
        stats.failureCount++;
        stats.failures.push({
          file: originalname,
          error: `Invalid file format or corrupted file: ${originalname}`
        });
        return;
      }

      // Traitement des artistes multiples
      const processArtists = async (artistString) => {
        if (!artistString) return [];
        const artistNames = artistString.split(',').map(name => name.trim());
        const artists = [];
        
        for (const name of artistNames) {
          if (name) {
            const artist = await Artist.findOneAndUpdate(
              {name},
              {
                name,
                genres: common.genre || [],
                image: null // L'image sera mise à jour plus tard si nécessaire
              },
              {upsert: true, new: true}
            );
            artists.push(artist);
          }
        }
        return artists;
      };

      if (fileExtension !== '.m4a') {
        outputFilePath = `${filePath}.m4a`;
        await new Promise((resolve, reject) => {
          Ffmpeg(filePath)
            .outputOptions([
              '-vn',
              '-acodec aac',
              '-b:a 256k'
            ])
            .on('end', () => resolve(outputFilePath))
            .on('error', err => {
              console.error('Error during conversion:', err);
              reject(err);
            })
            .save(outputFilePath);
        });
      }

      // Traitement des artistes principaux et featuring
      const mainArtists = await processArtists(common.artist);
      const featuredArtists = await processArtists(common.artists?.join(','));
      
      // Fusionner les listes d'artistes sans doublons
      const allArtists = [...new Set([...mainArtists, ...featuredArtists])];
      
      const albumTitle = common.album || 'Unknown Album';

      const currentYear = new Date().getFullYear();
      let year;
      try {
        year = common.year || (common.date ? new Date(common.date).getFullYear() : currentYear);
        if (isNaN(year)) throw new Error('Invalid year');
      } catch (dateError) {
        console.error('Invalid date format, using current year:', dateError);
        year = currentYear;
      }

      // Upload des images vers S3
      let albumCoverUrls = null;
      
      if (common.picture?.length) {
        const picture = common.picture[0];
        // Mettre à jour l'image pour tous les artistes
        for (const artist of allArtists) {
          const artistImageUrls = await uploadImageToS3(picture.data, picture.format, `artist-${artist.name}`);
          await Artist.findByIdAndUpdate(artist._id, { 
            image: {
              thumbnail: artistImageUrls?.thumbnail || null,
              medium: artistImageUrls?.medium || null,
              large: artistImageUrls?.large || null
            }
          });
        }
        albumCoverUrls = await uploadImageToS3(picture.data, picture.format, `album-${albumTitle}`);
      }

      // Créer ou mettre à jour l'album avec tous les artistes
      const album = await Album.findOneAndUpdate(
        {title: albumTitle, artistId: mainArtists[0]?._id},
        {
          title: albumTitle,
          artistId: mainArtists[0]?._id,
          releaseDate: isNaN(year) ? new Date(currentYear, 0, 1) : new Date(year, 0, 1),
          genres: common.genre || [],
          coverImage: {
            thumbnail: albumCoverUrls?.thumbnail || null,
            medium: albumCoverUrls?.medium || null,
            large: albumCoverUrls?.large || null
          },
          type: 'album',
          trackCount: 1,
          featuring: featuredArtists.map(artist => artist._id)
        },
        {upsert: true, new: true}
      );

      // Upload du fichier sur S3
      const newFileName = `${path.parse(originalname).name}.m4a`;
      const s3Key = `audio-files/${newFileName}`;
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: fs.createReadStream(fileExtension === '.m4a' ? filePath : outputFilePath),
        ContentType: 'audio/m4a'
      };

      await s3.upload(s3Params).promise();
      console.log(`Uploaded ${newFileName} to S3`);

      // Créer la piste avec tous les artistes
      const newTrack = new Track({
        title: common.title || path.parse(originalname).name,
        albumId: album._id,
        artistId: mainArtists[0]?._id,
        duration: Math.floor(format.duration),
        fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`,
        genres: common.genre || [],
        trackNumber: common.track?.no || 1,
        featuring: featuredArtists.map(artist => artist._id),
      });

      await newTrack.save();
      console.log(`Created track: ${newTrack.title}`);

      if (outputFilePath !== filePath) {
        fs.unlinkSync(outputFilePath);
      }

      stats.successCount++;
    } catch (error) {
      stats.failureCount++;
      stats.failures.push({
        file: originalname,
        error: error.message
      });
      console.error('Error processing file:', originalname, error);
    }
  } catch (error) {
    stats.failureCount++;
    stats.failures.push({
      file: filePath,
      error: error.message
    });
    console.error('Error processing file:', filePath, error);
  } finally {
    if (outputFilePath !== filePath && fs.existsSync(outputFilePath)) {
      try {
        fs.unlinkSync(outputFilePath);
        console.log(`Cleaned up temporary file: ${outputFilePath}`);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
  }
}

async function populateDatabaseFromDirectory() {
  try {
    const files = walkSync(localDirectory).slice(0, MAX_FILES);
    console.log(`Found ${files.length} files to process`);
    
    for (const filePath of files) {
      await processAudioFile(filePath);
    }
    
    // Afficher les statistiques finales
    console.log('\n=== Rapport Final ===');
    console.log(`Total des fichiers traités: ${stats.totalFiles}`);
    console.log(`Succès: ${stats.successCount}`);
    console.log(`Échecs: ${stats.failureCount}`);
    
    if (stats.failures.length > 0) {
      console.log('\nListe des fichiers en échec:');
      stats.failures.forEach(failure => {
        console.log(`\nFichier: ${failure.file}`);
        console.log(`Erreur: ${failure.error}`);
      });
    }
    
    console.log('\nTraitement terminé');
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    mongoose.disconnect();
  }
}

populateDatabaseFromDirectory();