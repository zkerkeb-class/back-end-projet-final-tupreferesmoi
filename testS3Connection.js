const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Charger le fichier .env
dotenv.config();

// Configurer AWS SDK avec les informations de votre .env
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Créer une instance de S3
const s3 = new AWS.S3();

// Essayer de lister les objets dans votre bucket
async function listObjectsInBucket() {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // Le nom de votre bucket
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    console.log('Liste des objets dans le bucket :', data);
  } catch (error) {
    console.error('Erreur lors de l\'accès au bucket S3 :', error);
  }
}

// Appeler la fonction pour tester
listObjectsInBucket();
