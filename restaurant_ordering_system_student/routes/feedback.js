// routes/feedback.js
//contains the backend routes for feedback
//create, edit, delete, retrieve
//Htet Yamin Aung P2535607
const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// GET /feedback - retrieve all feedback submitted by one user
router.get('/', ensureAuthenticated, feedbackController.retrieveAllFeedbackById);

//POST /feedback - create feedback
router.post('/', ensureAuthenticated, feedbackController.createFeedback);

//DELETE /feedback/:feedback_id
router.delete('/:feedback_id', ensureAuthenticated, feedbackController.removeFeedback);

//PUT /feedback/:feedback_id
router.put('/:feedback_id', ensureAuthenticated, feedbackController.updateFeedback);

module.exports = router;