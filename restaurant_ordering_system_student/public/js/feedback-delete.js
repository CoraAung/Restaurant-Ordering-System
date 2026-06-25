document.addEventListener('DOMContentLoaded', function () {
    initDeleteFeedback();
});

function initDeleteFeedback() {
    const deleteFeedbackForm = document.getElementById('deleteFeedbackForm');

    if (deleteFeedbackForm) {
        deleteFeedbackForm.addEventListener('submit', submitDeleteFeedbackForm);
    }
}

function showDeleteFeedbackForm(feedbackId) {
    const deleteFeedbackBox = document.getElementById('deleteFeedbackBox');
    const deleteFeedbackId = document.getElementById('deleteFeedbackId');

    deleteFeedbackId.value = feedbackId;
    deleteFeedbackBox.style.display = 'block';

    deleteFeedbackBox.scrollIntoView({
        behavior: 'smooth'
    });
}

function cancelDeleteFeedback() {
    const deleteFeedbackBox = document.getElementById('deleteFeedbackBox');
    const deleteFeedbackId = document.getElementById('deleteFeedbackId');

    deleteFeedbackId.value = '';
    deleteFeedbackBox.style.display = 'none';
}

function submitDeleteFeedbackForm(event) {
    event.preventDefault();

    const feedbackId = document.getElementById('deleteFeedbackId').value;

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!feedbackId) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Feedback ID is required.';
        return;
    }

    deleteFeedback(feedbackId);
}

function deleteFeedback(feedbackId) {
    const confirmDelete = confirm('Are you sure you want to delete this feedback?');

    if (!confirmDelete) {
        return;
    }

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    fetch(`/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || 'Failed to delete feedback.');
                }

                return data;
            });
        })
        .then(function (data) {
            successMessage.style.display = 'block';
            successMessage.textContent = data.message || 'Feedback deleted successfully.';

            cancelDeleteFeedback();

            loadFeedback();
        })
        .catch(function (error) {
            console.error('Error deleting feedback:', error);

            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Something went wrong while deleting feedback.';
        });
}