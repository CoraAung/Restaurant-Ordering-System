const feedbackModel = require('../models/feedbackModel');

module.exports.retrieveAllFeedbackById = function (req, res) {
    const member_id = req.user.user_id;

    return feedbackModel
        .getAllFeedbackById(member_id)
        .then(function (feedback) {
            return res.status(200).json({
                success: true,
                feedback: feedback
            });
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        });
};

module.exports.createFeedback = function (req, res) {
    const member_id = req.user.user_id;
    const product_id = req.body.product_id;
    const rating = req.body.rating;
    const comments = req.body.comments;

    return feedbackModel
        .insertFeedback(member_id, product_id, rating, comments)
        .then(function () {
            return res.status(201).json({
                success: true,
                message: 'Feedback created successfully.'
            });
        })
        .catch(function (error) {
            console.error(error);

            return res.status(400).json({
                success: false,
                error: error.message
            });
        });
};
 
module.exports.updateFeedback = function (req, res) {
    const member_id = req.user.user_id;
    const feedback_id = req.params.feedback_id;
    const rating = req.body.rating;
    const comments = req.body.comments;

    return feedbackModel
        .editFeedback(member_id, feedback_id, rating, comments)
        .then(function () {
            return res.status(200).json({
                success: true,
                message: 'Feedback updated successfully.'
            });
        })
        .catch(function (error) {
            console.error(error);

            return res.status(400).json({
                success: false,
                error: error.message
            });
        });
};

module.exports.removeFeedback = function (req, res) {
    const member_id = req.user.user_id;
    const feedback_id = req.params.feedback_id;

    console.log('DELETE FEEDBACK HIT');
    console.log('member_id:', member_id);
    console.log('feedback_id:', feedback_id);

    return feedbackModel
        .deleteFeedback(member_id, feedback_id)
        .then(function () {
            return res.status(200).json({
                success: true,
                message: 'Feedback deleted successfully.'
            });
        })
        .catch(function (error) {
            console.error(error);

            return res.status(400).json({
                success: false,
                error: error.message
            });
        });
};

module.exports.retrieveFeedbackByProduct = function (req, res) {
    const product_id = req.params.product_id;
    const member_id = req.user.user_id;

    return feedbackModel
        .getFeedbackByProduct(product_id, member_id)
        .then(function (feedback) {
            return res.status(200).json({
                success: true,
                feedback: feedback
            });
        })
        .catch(function (error) {
            console.error(error);

            return res.status(400).json({
                success: false,
                error: error.message
            });
        });
};

module.exports.retrieveResponsesByFeedback = function (req, res) {
    const feedback_id = req.params.feedback_id;
    const member_id = req.user.user_id;

    return feedbackModel
        .getResponsesByFeedback(feedback_id, member_id)
        .then(function (responses) {
            return res.status(200).json({
                success: true,
                responses: responses
            });
        })
        .catch(function (error) {
            console.error(error);

            return res.status(400).json({
                success: false,
                error: error.message
            });
        });
};

module.exports.createResponse = function (req, res) {
    const feedback_id = req.params.feedback_id;
    const member_id = req.user.user_id;
    const response_comment = req.body.response_comment;

    return feedbackModel
        .insertResponse(feedback_id, member_id, response_comment)
        .then(function () {
            return res.status(201).json({
                success: true,
                message: 'Response created successfully.'
            });
        })
        .catch(function (error) {
            console.error(error);

            return res.status(400).json({
                success: false,
                error: error.message
            });
        });
};