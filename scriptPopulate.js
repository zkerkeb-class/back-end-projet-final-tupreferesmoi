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
  failures: [],
  startTime: Date.now()
};

// Cache pour les images
const imageCache = new Map();

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
const BATCH_SIZE = 2; // Traitement de 2 fichiers en parallèle

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
  
  // Vérifier le cache
  const cacheKey = `${prefix}-${imageBuffer.length}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }
  
  try {
    const sizes = {
      thumbnail: { width: 300, height: 300 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 }
    };

    // Générer un hash unique pour l'image
    const imageHash = require('crypto')
      .createHash('md5')
      .update(imageBuffer)
      .digest('hex');

    // Vérifier si les images existent déjà pour ce hash
    const existingUrls = {};
    const checkPromises = Object.keys(sizes).map(async (size) => {
      const imageKey = `images/${prefix}-${size}-${imageHash}.webp`;
      try {
        await s3.headObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imageKey
        }).promise();
        existingUrls[size] = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${imageKey}`;
        return true;
      } catch (error) {
        if (error.code === 'NotFound') {
          return false;
        }
        throw error;
      }
    });

    const existingResults = await Promise.all(checkPromises);
    if (existingResults.every(exists => exists)) {
      imageCache.set(cacheKey, existingUrls);
      return existingUrls;
    }

    // Traitement parallèle des images manquantes
    const uploadPromises = Object.entries(sizes).map(async ([size, dimensions], index) => {
      if (existingResults[index]) {
        return [size, existingUrls[size]];
      }

      const webpBuffer = await sharp(imageBuffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'centre',
          withoutEnlargement: true
        })
        .webp({ 
          quality: 95,
          effort: 6,
          smartSubsample: true
        })
        .toBuffer();
      
      const imageKey = `images/${prefix}-${size}-${imageHash}.webp`;
      await s3.upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
        Body: webpBuffer,
        ContentType: 'image/webp'
      }).promise();
      
      return [size, `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${imageKey}`];
    });

    const results = await Promise.all(uploadPromises);
    const urls = Object.fromEntries(results);
    
    // Mettre en cache
    imageCache.set(cacheKey, urls);
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

      // Vérification plus stricte du format audio
      console.log('Format audio détecté:', format.container);
      
      // Forcer le réencodage pour tous les fichiers non m4a
      if (path.extname(filePath).toLowerCase() !== '.m4a') {
        console.log(`Réencodage du fichier ${originalname} en m4a...`);
        outputFilePath = `${filePath}.m4a`;
        await new Promise((resolve, reject) => {
          Ffmpeg(filePath)
            .outputOptions([
              '-vn',                // Pas de vidéo
              '-acodec aac',        // Codec AAC
              '-b:a 256k',          // Bitrate 256k
              '-ar 44100',          // Sample rate 44.1kHz
              '-af aresample=44100' // Resampling explicite
            ])
            .on('start', (commandLine) => {
              console.log('Commande FFmpeg:', commandLine);
            })
            .on('progress', (progress) => {
              console.log(`Progression: ${progress.percent}%`);
            })
            .on('end', () => {
              console.log(`Réencodage terminé: ${outputFilePath}`);
              resolve();
            })
            .on('error', (err) => {
              console.error(`Erreur de réencodage: ${err.message}`);
              reject(err);
            })
            .save(outputFilePath);
        });
      }

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
        
        // Traitement parallèle des artistes
        const artistPromises = artistNames.map(async name => {
          if (name) {
            return await Artist.findOneAndUpdate(
              {name},
              {
                name,
                genres: common.genre || [],
                image: null
              },
              {upsert: true, new: true}
            );
          }
          return null;
        });
        
        const results = await Promise.all(artistPromises);
        return results.filter(Boolean);
      };

      // Traitement parallèle de la conversion audio et des artistes
      const [conversionResult, mainArtists, featuredArtists] = await Promise.all([
        // Conversion audio
        (async () => {
          return outputFilePath;
        })(),
        // Artistes principaux
        processArtists(common.artist),
        // Artistes featuring
        processArtists(common.artists?.join(','))
      ]);
      
      // Si aucun artiste principal n'est trouvé, créer un artiste "Unknown"
      if (!mainArtists.length) {
        const unknownArtist = await Artist.findOneAndUpdate(
          { name: 'Unknown Artist' },
          {
            name: 'Unknown Artist',
            genres: common.genre || [],
            image: null
          },
          { upsert: true, new: true }
        );
        mainArtists.push(unknownArtist);
      }
      
      // Fusionner les listes d'artistes sans doublons
      const allArtists = [...new Set([...mainArtists, ...featuredArtists])];
      
      const albumTitle = common.album || 'Unknown Album';
      const currentYear = new Date().getFullYear();
      const year = common.year || (common.date ? new Date(common.date).getFullYear() : currentYear);

      // Traitement parallèle des images
      let albumCoverUrls = null;
      if (common.picture?.length) {
        const picture = common.picture[0];
        const [albumUrls, ...artistUpdates] = await Promise.all([
          // Upload de la cover d'album
          uploadImageToS3(picture.data, picture.format, `album-${albumTitle}`),
          // Upload des images d'artistes en parallèle
          ...allArtists.map(artist =>
            uploadImageToS3(picture.data, picture.format, `artist-${artist.name}`)
              .then(urls => 
                Artist.findByIdAndUpdate(artist._id, {
                  image: {
                    thumbnail: urls?.thumbnail || null,
                    medium: urls?.medium || null,
                    large: urls?.large || null
                  }
                })
              )
          )
        ]);
        albumCoverUrls = albumUrls;
      }

      // Création de l'album et upload du fichier audio en parallèle
      const [album, audioUpload] = await Promise.all([
        Album.findOneAndUpdate(
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
        ),
        (async () => {
          const newFileName = `${path.parse(originalname).name}.m4a`;
          const s3Key = `audio-files/${newFileName}`;
          await s3.upload({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: fs.createReadStream(fileExtension === '.m4a' ? filePath : outputFilePath),
            ContentType: 'audio/m4a'
          }).promise();
          return s3Key;
        })()
      ]);

      // Créer la piste
      const newTrack = new Track({
        title: common.title || path.parse(originalname).name,
        albumId: album._id,
        artistId: mainArtists[0]?._id,
        duration: Math.floor(format.duration),
        audioUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${audioUpload}`,
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
    const files = walkSync(localDirectory)
      .filter(file => ['.mp3', '.wav', '.flac', '.m4a', '.webm', '.opus'].includes(path.extname(file).toLowerCase()))
      .slice(0, MAX_FILES);
    
    console.log(`Found ${files.length} files to process`);
    
    // Traitement par lots
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(processAudioFile));
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files`);
    }
    
    const duration = (Date.now() - stats.startTime) / 1000;
    console.log('\n=== Rapport Final ===');
    console.log(`Durée totale: ${duration.toFixed(2)} secondes`);
    console.log(`Moyenne: ${(duration / stats.totalFiles).toFixed(2)} secondes par fichier`);
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
    await mongoose.disconnect();
  }
}

populateDatabaseFromDirectory();