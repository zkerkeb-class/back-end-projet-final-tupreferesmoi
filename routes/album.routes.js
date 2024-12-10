const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');

// Routes principales CRUD
router.get('/', albumController.findAll);
router.post('/', albumController.create);
router.get('/:id', albumController.findOne);
router.put('/:id', albumController.update);
router.delete('/:id', albumController.delete);

// Routes additionnelles
router.get('/artist/:artistId', albumController.findByArtist);
router.get('/search/query', albumController.search);

module.exports = router; 