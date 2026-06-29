const pool = require('../config/database');

module.exports.getSaleOrderSummary = function getSaleOrderSummary(adminMemberId, filters) {
    return pool.query(
        'SELECT * FROM get_sale_order_summary($1, $2, $3, $4, $5, $6)',
        [
            adminMemberId,
            filters.startDate,
            filters.endDate,
            filters.category,
            filters.sortBy,
            filters.sortOrder
        ]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.getCategories = function getCategories() {
    return pool.query(
        `SELECT DISTINCT category
         FROM product
         WHERE category IS NOT NULL
         ORDER BY category`
    )
        .then(function (result) {
            return result.rows.map(function (row) {
                return row.category;
            });
        })
        .catch(function (error) {
            throw error;
        });
};