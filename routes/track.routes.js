const express = require("express");
const { uploadLimiter } = require("../config/rateLimit");
const trackController = require("../controllers/track.controller");
const auth = require("../middleware/auth");
const paginationMiddleware = require("../middleware/pagination");
const cacheMiddleware = require("../middleware/cache.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/tracks:
 *   get:
 *     tags:
 *       - Tracks
 *     summary: Liste les pistes
 *     description: Retourne une liste paginée des pistes avec options de tri et de filtrage
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
 *           enum: [title, duration, popularity, trackNumber]
 *         description: Champ pour le tri
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordre du tri (asc ou desc)
 *       - in: query
 *         name: albumId
 *         schema:
 *           type: string
 *         description: ID de l'album pour filtrer les pistes
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre musical pour filtrer les pistes
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: integer
 *         description: Durée minimale en secondes
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: integer
 *         description: Durée maximale en secondes
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
 *         description: Liste paginée des pistes
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

// Routes publiques avec cache
router.get(
    "/recent",
    cacheMiddleware("tracks-recent", 600),
    trackController.getRecent
);
router.get(
    "/search/query",
    cacheMiddleware("track-search", 600),
    trackController.search
);
router.get(
    "/",
    paginationMiddleware,
    cacheMiddleware("tracks-list", 1200),
    trackController.findAll
);
router.get(
    "/:id",
    cacheMiddleware("track-detail", 1800),
    trackController.findOne
);

// Routes de mise à jour de popularité (avec cache court)
router.patch(
    "/:id/popularity",
    auth,
    cacheMiddleware("track-popularity", 300),
    trackController.updatePopularity
);

// Routes protégées sans cache
router.post("/", auth, trackController.create);
router.put("/:id", auth, trackController.update);
router.delete("/:id", auth, trackController.deleteTrack);

module.exports = router;
