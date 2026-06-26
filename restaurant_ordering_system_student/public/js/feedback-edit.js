document.addEventListener('DOMContentLoaded', function () {
    initUpdateFeedbackPage();
});

function initUpdateFeedbackPage() {
    const params = new URLSearchParams(window.location.search);

    // Example URL: /member/feedback/edit?feedbackId=3
    const feedbackId = params.get('feedbackId');

    const feedbackIdInput = document.getElementById('feedbackId');
    const ratingInput = document.getElementById('rating');
    const commentTextInput = document.getElementById('commentText');
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('updateFeedbackForm');

    if (!feedbackId) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'No feedback specified.';
        form.style.display = 'none';
        return;
    }

    // Prefill readonly Feedback ID
    feedbackIdInput.value = feedbackId;

    // Load existing feedback details
    fetch('/feedback', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Failed to load feedback details.');
            }

            return response.json();
        })
        .then(function (data) {
            const feedbackList = data.feedback || data;

            const selectedFeedback = feedbackList.find(function (item) {
                return Number(item.feedback_id) === Number(feedbackId);
            });

            if (!selectedFeedback) {
                throw new Error('Feedback not found.');
            }

            ratingInput.value = selectedFeedback.rating;
            commentTextInput.value = selectedFeedback.comments;
        })
        .catch(function (error) {
            console.error('Error loading feedback:', error);

            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Failed to load feedback details.';
        });

    form.addEventListener('submit', updateFeedback);
}

function updateFeedback(event) {
    event.preventDefault();

    const feedbackId = document.getElementById('feedbackId').value;
    const rating = document.getElementById('rating').value;
    const commentText = document.getElementById('commentText').value.trim();

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!feedbackId) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Feedback ID is required.';
        return;
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Rating must be between 1 and 5.';
        return;
    }

    if (!commentText) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Comment cannot be empty.';
        return;
    }

    fetch(`/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            rating: Number(rating),
            comments: commentText
        })
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || 'Failed to update feedback.');
                }

                return data;
            });
        })
        .then(function (data) {
            successMessage.style.display = 'block';
            successMessage.textContent = data.message || 'Feedback updated successfully.';

            setTimeout(function () {
                window.location.href = '/member/feedback';
            }, 800);
        })
        .catch(function (error) {
            console.error('Error updating feedback:', error);

            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Something went wrong while updating feedback.';
        });
}