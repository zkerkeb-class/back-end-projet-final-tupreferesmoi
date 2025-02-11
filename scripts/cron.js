const cron = require("node-cron");
const logger = require("../config/logger");
const cleanTempFiles = require("./cleanTemp");

// Nettoyage des fichiers temporaires tous les jours à minuit
cron.schedule("0 0 * * *", async () => {
    logger.info("Démarrage du nettoyage automatique des fichiers temporaires");
    await cleanTempFiles();
});
