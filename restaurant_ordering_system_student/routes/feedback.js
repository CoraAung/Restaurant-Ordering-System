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

// GET /feedback/product/:product_id - retrieve all feedback received by one product
router.get('/product/:product_id', ensureAuthenticated, feedbackController.retrieveFeedbackByProduct);

//POST /feedback - create feedback
router.post('/', ensureAuthenticated, feedbackController.createFeedback);

//DELETE /feedback/:feedback_id
router.delete('/:feedback_id', ensureAuthenticated, feedbackController.removeFeedback);

//PUT /feedback/:feedback_id
router.put('/:feedback_id', ensureAuthenticated, feedbackController.updateFeedback);

// GET /feedback/:feedback_id/responses - retrieve responses for one feedback
router.get('/:feedback_id/responses', ensureAuthenticated, feedbackController.retrieveResponsesByFeedback);

// POST /feedback/:feedback_id/responses - create response for one feedback
router.post('/:feedback_id/responses', ensureAuthenticated, feedbackController.createResponse);

// DELETE /feedback/responses/:response_id - delete own response
router.delete('/responses/:response_id', ensureAuthenticated, feedbackController.removeResponse);

module.exports = router;