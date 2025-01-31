const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const paginationMiddleware = require('../middleware/pagination');
const auth = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache.middleware');

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

// Routes publiques avec cache
router.get('/recent', cacheMiddleware('albums-recent', 600), albumController.getRecent);
router.get('/search/query', cacheMiddleware('album-search', 600), albumController.search);
router.get('/', paginationMiddleware, cacheMiddleware('albums-list', 1200), albumController.findAll);
router.get('/:id', cacheMiddleware('album-detail', 1800), albumController.findOne);

// Routes protégées sans cache
router.post('/', auth, albumController.create);
router.put('/:id', auth, albumController.update);
router.delete('/:id', auth, albumController.deleteAlbum);

/**
 * @swagger
 * /api/albums/{id}/tracks:
 *   get:
 *     tags:
 *       - Albums
 *     summary: Récupère les pistes d'un album
 *     description: Retourne toutes les pistes d'un album spécifique avec les informations détaillées
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'album
 *     responses:
 *       200:
 *         description: Liste des pistes de l'album avec les informations de l'album
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     album:
 *                       $ref: '#/components/schemas/Album'
 *                     tracks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Track'
 */
router.get('/:id/tracks', cacheMiddleware('album-tracks', 1800), albumController.getAlbumTracks);

module.exports = router; 