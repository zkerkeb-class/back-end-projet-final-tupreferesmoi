const express = require('express');
const router = express.Router();
const trackController = require('../controllers/track.controller');

// Routes principales CRUD
router.get('/', trackController.findAll);
router.post('/', trackController.create);
router.get('/:id', trackController.findOne);
router.put('/:id', trackController.update);
router.delete('/:id', trackController.delete);

// Routes additionnelles
router.get('/album/:albumId', trackController.findByAlbum);
router.get('/search/query', trackController.search);
router.patch('/:id/popularity', trackController.updatePopularity);

module.exports = router; 