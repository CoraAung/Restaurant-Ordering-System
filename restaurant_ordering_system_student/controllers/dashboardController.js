// controllers/dashboardController.js
// const SaleOrder = require('../models/SaleOrder');
// const Product = require('../models/Product');

// class DashboardController {
//     static async index(req, res) {
//         try {
//             const filters = {
//                 startDate: req.query.start_date,
//                 endDate: req.query.end_date,
//                 productCategory: req.query.category,
//                 sortBy: req.query.sort_by || 'order_date',
//                 sortOrder: req.query.sort_order || 'DESC'
//             };

//             const orders = await SaleOrder.getSummary(filters);
//             const categories = await Product.getCategories();

//             res.render('dashboard', { 
//                 orders, 
//                 categories, 
//                 filters, 
//                 user: req.session.user 
//             });
//         } catch (error) {
//             console.error('Error loading dashboard:', error);
//             res.status(500).send('Server error');
//         }
//     }
// }

//import the dashboard model
const dashboardModel = require('../models/dashboardModel');

//retrieve dashboard data
module.exports.retrieveDashboardData = function (req, res) {
    const filters = {
        startDate: req.query.start_date || null,
        endDate: req.query.end_date || null,
        category: req.query.category || null,
        sortBy: req.query.sort_by || 'order_date',
        sortOrder: req.query.sort_order || 'DESC'
    };

    const adminMemberId = req.user.user_id;

    return dashboardModel
        .getSaleOrderSummary(adminMemberId, filters)
        .then(function (orders) {
            return dashboardModel
                .getCategories()
                .then(function (categories) {
                    return res.status(200).json({
                        success: true,
                        orders: orders,
                        categories: categories,
                        filters: filters,
                        user: {
                            id: req.session.userId,
                            role: req.session.userRole,
                            name: req.session.userName
                        }
                    });
                });
        })
        .catch(function (error) {
            console.error('Dashboard API error:', error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        });
};

//module.exports = DashboardController;