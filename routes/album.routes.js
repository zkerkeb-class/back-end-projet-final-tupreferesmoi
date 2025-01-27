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
 *     description: Retourne une liste paginée des albums avec options de tri et de filtrage
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, releaseDate, trackCount]
 *         description: Champ pour le tri
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordre du tri (asc ou desc)
 *       - in: query
 *         name: artistId
 *         schema:
 *           type: string
 *         description: ID de l'artiste pour filtrer les albums
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [album, single, ep]
 *         description: Type d'album
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre musical pour filtrer les albums
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Année de sortie spécifique
 *       - in: query
 *         name: fromYear
 *         schema:
 *           type: integer
 *         description: Année de début pour la plage de dates
 *       - in: query
 *         name: toYear
 *         schema:
 *           type: integer
 *         description: Année de fin pour la plage de dates
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
router.delete('/:id', auth, albumController.deleteAlbum);

module.exports = router; 