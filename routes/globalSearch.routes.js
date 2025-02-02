const express = require('express');
const router = express.Router();
const searchController = require('../controllers/globalSearch.controller');
const cacheMiddleware = require('../middleware/cache.middleware');


//routes public avec cacth
router.get('/:value', cacheMiddleware('global-search', 600), searchController.globalSearch);


module.exports = router;