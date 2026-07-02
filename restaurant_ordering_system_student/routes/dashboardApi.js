// Import Express to create route handlers
const express = require('express');
//import ensureAuthenticated and ensureAdmin from middleware/auth
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
//import dashboard controller 
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard
router.get('/', ensureAuthenticated, ensureAdmin, dashboardController.retrieveDashboardData);

//export the router
module.exports = router;