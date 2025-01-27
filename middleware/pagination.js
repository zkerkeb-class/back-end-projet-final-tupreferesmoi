const paginationMiddleware = (req, res, next) => {
    // Valeurs par défaut
    const defaultPage = 1;
    const defaultLimit = 10;
    const maxLimit = 50; // Limite maximale pour éviter les abus

    // Récupération et validation des paramètres
    let page = parseInt(req.query.page) || defaultPage;
    let limit = parseInt(req.query.limit) || defaultLimit;

    // Validation des valeurs
    if (page < 1) page = defaultPage;
    if (limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    // Calcul du skip (nombre d'éléments à sauter)
    const skip = (page - 1) * limit;

    // Gestion du tri
    let sort = {};
    if (req.query.sortBy) {
        const sortField = req.query.sortBy;
        const sortOrder = req.query.order === 'desc' ? -1 : 1;
        sort[sortField] = sortOrder;
    }

    // Ajout des informations de pagination et tri à la requête
    req.pagination = {
        page,
        limit,
        skip,
        sort
    };

    next();
};

module.exports = paginationMiddleware; 