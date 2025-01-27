const express = require('express');
const { uploadLimiter } = require('../config/rateLimit');
const trackController = require('../controllers/track.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes principales CRUD
router.get('/', trackController.findAll);
router.post('/', auth, uploadLimiter, trackController.create);
router.get('/:id', trackController.findOne);
router.put('/:id', auth, trackController.update);
router.delete('/:id', auth, trackController.delete);

// Routes additionnelles
router.get('/album/:albumId', trackController.findByAlbum);
router.get('/search/query', trackController.search);
router.patch('/:id/popularity', auth, trackController.updatePopularity);

module.exports = router; 