const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artist.controller');

// Récupérer tous les artistes
router.get('/', artistController.findAll);

// Créer un nouvel artiste
router.post('/', artistController.create);

// Récupérer un artiste spécifique
router.get('/:id', artistController.findOne);

// Mettre à jour un artiste
router.put('/:id', artistController.update);

// Supprimer un artiste
router.delete('/:id', artistController.delete);

module.exports = router; 