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