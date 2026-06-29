const pool = require('../config/database');

//retrieve all feedback written by a member
//tested: working
module.exports.getAllFeedbackById = function getAllFeedbackById(member_id){
    return pool.query('SELECT * FROM get_feedback($1)', [member_id])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.insertFeedback = function insertFeedback(member_id, product_id, rating, comments) {
    return pool.query(
        'CALL create_feedback($1, $2, $3, $4)',
        [member_id, product_id, rating, comments]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.editFeedback = function editFeedback(member_id, feedback_id, rating, comments) {
    return pool.query(
        'CALL update_feedback($1, $2, $3, $4)',
        [member_id, feedback_id, rating, comments]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.deleteFeedback = function deleteFeedback(member_id, feedback_id) {
    return pool.query(
        'CALL delete_feedback($1, $2)',
        [member_id, feedback_id]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.getFeedbackByProduct = function getFeedbackByProduct(product_id, member_id) {
    return pool.query(
        'SELECT * FROM get_feedback_by_product($1, $2)',
        [product_id, member_id]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.getResponsesByFeedback = function getResponsesByFeedback(feedback_id, member_id) {
    return pool.query(
        'SELECT * FROM get_responses_by_feedback($1, $2)',
        [feedback_id, member_id]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.insertResponse = function insertResponse(feedback_id, member_id, response_comment) {
    return pool.query(
        'CALL create_response($1, $2, $3)',
        [feedback_id, member_id, response_comment]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};

module.exports.deleteResponse = function deleteResponse(member_id, response_id) {
    return pool.query(
        'CALL delete_response($1, $2)',
        [member_id, response_id]
    )
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            throw error;
        });
};