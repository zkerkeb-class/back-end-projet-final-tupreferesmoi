const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const paginationMiddleware = require('../middleware/pagination');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/albums:
 *   get:
 *     tags:
 *       - Albums
 *     summary: Liste les albums
 *     description: Retourne une liste paginée des albums
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
 *         name: artistId
 *         schema:
 *           type: string
 *         description: ID de l'artiste pour filtrer les albums
 *     responses:
 *       200:
 *         description: Liste paginée des albums
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Album'
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

// Routes principales
router.get('/', paginationMiddleware, albumController.findAll);
router.post('/', auth, albumController.create);

// Routes de recherche
router.get('/search/query', albumController.search);

// Routes avec paramètres
router.get('/:id', albumController.findOne);
router.put('/:id', auth, albumController.update);
router.delete('/:id', auth, albumController.delete);

module.exports = router; 