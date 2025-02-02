const express = require('express');
const router = express.Router();
const searchController = require('../controllers/globalSearch.controller');
const cacheMiddleware = require('../middleware/cache.middleware');

// Route for global search using query parameter
router.get('/', cacheMiddleware('global-search', 600), searchController.globalSearch);

module.exports = router;