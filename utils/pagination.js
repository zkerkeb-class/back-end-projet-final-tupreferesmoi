/**
 * Formate la réponse paginée
 * @param {Array} data - Les données à paginer
 * @param {number} totalItems - Nombre total d'éléments
 * @param {number} currentPage - Page actuelle
 * @param {number} itemsPerPage - Nombre d'éléments par page
 * @returns {Object} Réponse formatée avec pagination
 */
const formatPaginatedResponse = (
    data,
    totalItems,
    currentPage,
    itemsPerPage
) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
        success: true,
        data,
        pagination: {
            currentPage: Number(currentPage),
            itemsPerPage: Number(itemsPerPage),
            totalItems,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        },
    };
};

module.exports = {
    formatPaginatedResponse,
};
