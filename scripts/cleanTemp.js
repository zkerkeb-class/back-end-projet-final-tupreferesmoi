const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");

const TEMP_DIR = path.join(__dirname, "../temp");
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

/**
 * Nettoie les fichiers temporaires plus vieux que MAX_AGE
 */
async function cleanTempFiles() {
    try {
        // Créer le dossier temp s'il n'existe pas
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
            logger.info("Dossier temp créé");
            return;
        }

        const now = Date.now();
        let deletedCount = 0;
        let errorCount = 0;

        // Lire tous les fichiers du dossier temp
        const files = fs.readdirSync(TEMP_DIR);

        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);

            try {
                const stats = fs.statSync(filePath);
                const age = now - stats.mtimeMs;

                // Supprimer si plus vieux que MAX_AGE
                if (age > MAX_AGE) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    logger.info(`Fichier supprimé: ${file}`);
                }
            } catch (error) {
                errorCount++;
                logger.error(
                    `Erreur lors de la suppression de ${file}:`,
                    error
                );
            }
        }

        logger.info(
            `Nettoyage terminé: ${deletedCount} fichier(s) supprimé(s), ${errorCount} erreur(s)`
        );
    } catch (error) {
        logger.error(
            "Erreur lors du nettoyage des fichiers temporaires:",
            error
        );
    }
}

// Si exécuté directement
if (require.main === module) {
    cleanTempFiles();
}

module.exports = cleanTempFiles;
