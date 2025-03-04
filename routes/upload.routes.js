const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth.middleware');

// Configuration AWS S3
const s3 = new AWS.S3();

// Configuration Multer pour l'upload temporaire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite à 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être une image'));
    }
  },
});

// Fonction pour générer un nom de fichier unique
const generateUniqueFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  return `${prefix ? prefix + '-' : ''}${timestamp}-${hash}.${extension}`;
};

// Fonction pour uploader sur S3
const uploadToS3 = async (buffer, key, contentType) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }

    const prefix = req.body.prefix || '';
    const fileName = generateUniqueFileName(req.file.originalname, prefix);
    const sizes = {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    const urls = {};
    for (const [size, dimensions] of Object.entries(sizes)) {
      const resizedBuffer = await sharp(req.file.buffer)
        .resize(dimensions.width, dimensions.height, { fit: 'cover' })
        .toBuffer();

      const key = `${prefix}-${size}-${fileName}`;
      urls[size] = await uploadToS3(resizedBuffer, key, req.file.mimetype);
    }

    res.json({ urls });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image', error: error.message });
  }
});

module.exports = router; 