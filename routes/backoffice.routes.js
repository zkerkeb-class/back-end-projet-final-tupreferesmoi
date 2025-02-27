const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configuration AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Configuration de Multer pour le stockage temporaire
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite à 10MB
    },
    fileFilter: (req, file, cb) => {
        // Vérifier le type MIME
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Le fichier doit être un fichier audio'));
        }
    }
});

// Route pour l'upload de fichiers audio
router.post('/upload/audio', upload.single('audio'), async (req, res) => {
    console.log('Début de la route upload/audio');
    
    if (!req.file) {
        console.log('Aucun fichier reçu');
        return res.status(400).json({
            success: false,
            message: 'Aucun fichier audio fourni'
        });
    }

    try {
        console.log('Fichier reçu:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Générer un nom de fichier unique en conservant l'extension d'origine
        const originalExtension = path.extname(req.file.originalname);
        const fileName = `${uuidv4()}${originalExtension}`;
        const s3Key = `audio-files/${fileName}`;

        console.log('Préparation upload S3:', {
            fileName,
            s3Key,
            bucket: process.env.AWS_BUCKET_NAME
        });

        // Upload vers S3
        const uploadResult = await s3.upload({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }).promise();

        console.log('Upload S3 réussi:', uploadResult.Location);

        // Pour le moment, on renvoie une durée fixe (à remplacer plus tard par une vraie analyse)
        const duration = 180; // 3 minutes par défaut

        res.status(200).json({
            success: true,
            url: uploadResult.Location,
            duration: duration
        });

    } catch (error) {
        console.error('Erreur détaillée:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload du fichier audio',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router; 