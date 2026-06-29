const express = require('express');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard
router.get('/', ensureAuthenticated, ensureAdmin, dashboardController.retrieveDashboardData);

module.exports = router;