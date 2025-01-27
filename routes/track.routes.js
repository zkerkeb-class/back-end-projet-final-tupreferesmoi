const express = require('express');
const { uploadLimiter } = require('../config/rateLimit');
const trackController = require('../controllers/track.controller');
const auth = require('../middleware/auth');
const paginationMiddleware = require('../middleware/pagination');

const router = express.Router();

/**
 * @swagger
 * /api/tracks:
 *   get:
 *     tags:
 *       - Tracks
 *     summary: Liste les pistes audio
 *     description: Retourne une liste paginée des pistes audio
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Numéro de la page (défaut - 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Nombre d'éléments par page (défaut - 10, max - 50)
 *       - in: query
 *         name: albumId
 *         schema:
 *           type: string
 *         description: ID de l'album pour filtrer les pistes
 *     responses:
 *       200:
 *         description: Liste paginée des pistes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Track'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 */
router.get('/', paginationMiddleware, trackController.findAll);
router.post('/', auth, uploadLimiter, trackController.create);
router.get('/:id', trackController.findOne);
router.put('/:id', auth, trackController.update);
router.delete('/:id', auth, trackController.delete);

// Routes additionnelles
router.get('/search/query', trackController.search);
router.patch('/:id/popularity', auth, trackController.updatePopularity);

module.exports = router; 