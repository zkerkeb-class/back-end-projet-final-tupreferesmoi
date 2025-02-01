const { createClient } = require("redis");
const logger = require("../config/logger");

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.DEFAULT_EXPIRATION = 3600; // 1 heure en secondes
    }

    async connect() {
        try {
            this.client = createClient({
                url: process.env.REDIS_URL || "redis://localhost:6379",
            });

            this.client.on("error", (err) => {
                logger.error("Erreur Redis:", err);
                this.isConnected = false;
            });

            this.client.on("connect", () => {
                logger.info("Connecté à Redis");
                this.isConnected = true;
            });

            await this.client.connect();
        } catch (error) {
            logger.error("Erreur de connexion à Redis:", error);
            this.isConnected = false;
        }
    }

    async get(key) {
        try {
            if (!this.isConnected) return null;
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(
                `Erreur lors de la récupération de la clé ${key}:`,
                error
            );
            return null;
        }
    }

    async set(key, value, expiration = this.DEFAULT_EXPIRATION) {
        try {
            if (!this.isConnected) return false;
            await this.client.set(key, JSON.stringify(value), {
                EX: expiration,
            });
            return true;
        } catch (error) {
            logger.error(
                `Erreur lors de la définition de la clé ${key}:`,
                error
            );
            return false;
        }
    }

    async del(key) {
        try {
            if (!this.isConnected) return false;
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error(
                `Erreur lors de la suppression de la clé ${key}:`,
                error
            );
            return false;
        }
    }

    async flush() {
        try {
            if (!this.isConnected) return false;
            await this.client.flushAll();
            return true;
        } catch (error) {
            logger.error("Erreur lors du nettoyage du cache:", error);
            return false;
        }
    }

    generateKey(prefix, params) {
        return `${prefix}:${JSON.stringify(params)}`;
    }
}

// Export d'une instance unique
module.exports = new CacheService();
