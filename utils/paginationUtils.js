const formatPaginatedResponse = (data, totalItems, req) => {
    const { page, limit } = req.pagination;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        data,
        pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

module.exports = {
    formatPaginatedResponse,
};
