const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artist.controller');
const paginationMiddleware = require('../middleware/pagination');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/artists:
 *   get:
 *     tags:
 *       - Artists
 *     summary: Liste les artistes
 *     description: Retourne une liste paginée des artistes avec options de tri et de filtrage
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
 *           enum: [name, popularity]
 *         description: Champ pour le tri
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordre du tri (asc ou desc)
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre musical pour filtrer les artistes
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Recherche partielle sur le nom de l'artiste
 *       - in: query
 *         name: minPopularity
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Score de popularité minimum
 *       - in: query
 *         name: maxPopularity
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Score de popularité maximum
 *     responses:
 *       200:
 *         description: Liste paginée des artistes
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
 *                     $ref: '#/components/schemas/Artist'
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
router.get('/', paginationMiddleware, artistController.findAll);
router.post('/', auth, artistController.create);

// Routes de recherche
router.get('/search/query', artistController.search);

// Routes avec paramètres
router.get('/:id', artistController.findOne);
router.put('/:id', auth, artistController.update);
router.delete('/:id', auth, artistController.deleteArtist);

module.exports = router; 