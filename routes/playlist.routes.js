const express = require("express");
const router = express.Router();
const playlistController = require("../controllers/playlist.controller");
const auth = require("../middleware/auth");
const paginationMiddleware = require("../middleware/pagination");

/**
 * @swagger
 * /api/playlists:
 *   get:
 *     summary: Récupérer toutes les playlists avec pagination
 *     tags: [Playlists]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtrer par ID utilisateur
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
 *         name: minTracks
 *         schema:
 *           type: integer
 *         description: Nombre minimum de pistes
 *       - in: query
 *         name: maxTracks
 *         schema:
 *           type: integer
 *         description: Nombre maximum de pistes
 *     responses:
 *       200:
 *         description: Liste des playlists paginée
 *       500:
 *         description: Erreur serveur
 */
router.get("/", auth, paginationMiddleware, playlistController.findAll);

/**
 * @swagger
 * /api/playlists/public:
 *   get:
 *     summary: Récupérer toutes les playlists publiques avec pagination
 *     tags: [Playlists]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des playlists publiques paginée
 *       500:
 *         description: Erreur serveur
 */
router.get("/public", paginationMiddleware, playlistController.findAll);

/**
 * @swagger
 * /api/playlists/{id}:
 *   get:
 *     summary: Récupérer une playlist par ID
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     responses:
 *       200:
 *         description: Playlist trouvée
 *       404:
 *         description: Playlist non trouvée
 */
router.get("/:id", auth, playlistController.findOne);

/**
 * @swagger
 * /api/playlists:
 *   post:
 *     summary: Créer une nouvelle playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *               coverImage:
 *                 type: string
 *               tracks:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Playlist créée
 *       400:
 *         description: Données invalides
 */
router.post("/", auth, playlistController.create);

/**
 * @swagger
 * /api/playlists/{id}:
 *   put:
 *     summary: Mettre à jour une playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               coverImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Playlist mise à jour
 *       404:
 *         description: Playlist non trouvée
 */
router.put("/:id", auth, playlistController.update);

/**
 * @swagger
 * /api/playlists/{id}:
 *   delete:
 *     summary: Supprimer une playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     responses:
 *       200:
 *         description: Playlist supprimée
 *       404:
 *         description: Playlist non trouvée
 */
router.delete("/:id", auth, playlistController.deletePlaylist);

/**
 * @swagger
 * /api/playlists/{id}/tracks:
 *   post:
 *     summary: Ajouter une piste à la playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackId
 *             properties:
 *               trackId:
 *                 type: string
 *                 description: ID de la piste à ajouter
 *     responses:
 *       200:
 *         description: Piste ajoutée à la playlist
 *       404:
 *         description: Playlist non trouvée
 */
router.post("/:id/tracks", auth, playlistController.addTrack);

/**
 * @swagger
 * /api/playlists/{id}/tracks/{trackId}:
 *   delete:
 *     summary: Retirer une piste de la playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la piste à retirer
 *     responses:
 *       200:
 *         description: Piste retirée de la playlist
 *       404:
 *         description: Playlist ou piste non trouvée
 */
router.delete("/:id/tracks/:trackId", auth, playlistController.removeTrack);

/**
 * @swagger
 * /api/playlists/{id}/admin:
 *   put:
 *     summary: Mettre à jour une playlist (Admin seulement)
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               tracks:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Playlist mise à jour
 *       404:
 *         description: Playlist non trouvée
 */
router.put("/:id/admin", auth, playlistController.updateAdmin);

/**
 * @swagger
 * /api/playlists/{id}/admin:
 *   delete:
 *     summary: Supprimer une playlist (Admin seulement)
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     responses:
 *       200:
 *         description: Playlist supprimée
 *       404:
 *         description: Playlist non trouvée
 */
router.delete("/:id/admin", auth, playlistController.deletePlaylistAdmin);

module.exports = router;
