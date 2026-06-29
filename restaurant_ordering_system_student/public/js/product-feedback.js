document.addEventListener('DOMContentLoaded', function () {
    initProductFeedback();
});

function initProductFeedback() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        return;
    }

    loadProductFeedback(productId);
}

function loadProductFeedback(productId) {
    const feedbackList = document.getElementById('productFeedbackList');
    const loadingMessage = document.getElementById('product-feedback-loading');
    const emptyMessage = document.getElementById('product-feedback-empty');

    loadingMessage.style.display = 'block';
    emptyMessage.style.display = 'none';
    feedbackList.innerHTML = '';

    fetch(`/feedback/product/${productId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || 'Failed to load product feedback.');
                }

                return data;
            });
        })
        .then(function (data) {
            loadingMessage.style.display = 'none';

            const feedback = data.feedback;

            if (!feedback || feedback.length === 0) {
                emptyMessage.style.display = 'block';
                return;
            }

            feedback.forEach(function (item) {
                const feedbackCard = document.createElement('div');
                feedbackCard.className = 'card mb-3';

                feedbackCard.innerHTML = `
                    <div class="card-body">
                        <p class="mb-1">
                            <strong>Member Name:</strong> ${escapeHTML(item.member_name)}
                        </p>

                        <p class="mb-1">
                            <strong>Rating:</strong> ${getStars(item.rating)}
                        </p>

                        <p class="mb-1">
                            <strong>Comment:</strong> ${escapeHTML(item.comments)}
                        </p>

                        <p class="text-muted">
                            <small>
                                Last Updated: ${formatDate(item.last_updated)}
                            </small>
                        </p>

                        <hr>

                        <h6>Responses</h6>

                        <div id="responses-${item.feedback_id}">
                            <p class="text-muted">Loading responses...</p>
                        </div>

                        ${
                            item.can_respond
                                ? `
                                    <button
                                        type="button"
                                        class="btn btn-outline-dark btn-sm mt-2"
                                        onclick="showResponseForm(${item.feedback_id})"
                                    >
                                        Add Response
                                    </button>

                                    <div id="responseFormBox-${item.feedback_id}" class="mt-3" style="display: none;">
                                        <textarea
                                            id="responseText-${item.feedback_id}"
                                            class="form-control mb-2"
                                            rows="2"
                                            placeholder="Write your response..."
                                        ></textarea>

                                        <button
                                            type="button"
                                            class="btn btn-dark btn-sm"
                                            onclick="submitResponse(${item.feedback_id}, ${productId})"
                                        >
                                            Submit Response
                                        </button>

                                        <button
                                            type="button"
                                            class="btn btn-secondary btn-sm"
                                            onclick="cancelResponse(${item.feedback_id})"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                `
                                : `
                                    <p class="text-muted mt-2">
                                        <small>You cannot respond to your own feedback.</small>
                                    </p>
                                `
                        }
                    </div>
                `;

                feedbackList.appendChild(feedbackCard);

                loadResponsesForFeedback(item.feedback_id);
            });
        })
        .catch(function (error) {
            console.error('Error loading product feedback:', error);

            loadingMessage.style.display = 'none';

            feedbackList.innerHTML = `
                <div class="alert alert-danger">
                    ${escapeHTML(error.message)}
                </div>
            `;
        });
}

function loadResponsesForFeedback(feedbackId) {
    const responsesBox = document.getElementById(`responses-${feedbackId}`);

    fetch(`/feedback/${feedbackId}/responses`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || 'Failed to load responses.');
                }

                return data;
            });
        })
        .then(function (data) {
            const responses = data.responses;

            if (!responses || responses.length === 0) {
                responsesBox.innerHTML = `
                    <p class="text-muted mb-0">No responses yet.</p>
                `;
                return;
            }

            let html = '';

            responses.forEach(function (response) {
    html += `
        <div class="border rounded p-2 mb-2">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <p class="mb-1">
                        <strong>${escapeHTML(response.member_name)}:</strong>
                        ${escapeHTML(response.response_comment)}
                    </p>

                    <p class="text-muted mb-0">
                        <small>${formatDate(response.created_at)}</small>
                    </p>
                </div>

                ${
                    response.can_delete
                        ? `
                            <button
                                type="button"
                                class="btn btn-danger btn-sm"
                                onclick="deleteResponse(${response.response_id}, ${feedbackId})"
                            >
                                Delete
                            </button>
                        `
                        : ''
                }
            </div>
        </div>
    `;
});

            responsesBox.innerHTML = html;
        })
        .catch(function (error) {
            console.error('Error loading responses:', error);

            responsesBox.innerHTML = `
                <p class="text-danger mb-0">
                    Failed to load responses.
                </p>
            `;
        });
}

function showResponseForm(feedbackId) {
    document.getElementById(`responseFormBox-${feedbackId}`).style.display = 'block';
}

function cancelResponse(feedbackId) {
    document.getElementById(`responseText-${feedbackId}`).value = '';
    document.getElementById(`responseFormBox-${feedbackId}`).style.display = 'none';
}

function submitResponse(feedbackId, productId) {
    const responseText = document.getElementById(`responseText-${feedbackId}`).value.trim();

    if (!responseText) {
        alert('Response cannot be empty.');
        return;
    }

    fetch(`/feedback/${feedbackId}/responses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            response_comment: responseText
        })
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || 'Failed to create response.');
                }

                return data;
            });
        })
        .then(function () {
            loadProductFeedback(productId);
        })
        .catch(function (error) {
            console.error('Error creating response:', error);
            alert(error.message || 'Something went wrong while creating response.');
        });
}

function getStars(rating) {
    return '⭐'.repeat(Number(rating));
}

function formatDate(dateString) {
    if (!dateString) {
        return 'N/A';
    }

    const date = new Date(dateString);
    return date.toLocaleString();
}

function escapeHTML(value) {
    if (!value) {
        return '';
    }

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function deleteResponse(responseId, feedbackId) {
    const confirmDelete = confirm('Are you sure you want to delete this response?');

    if (!confirmDelete) {
        return;
    }

    fetch(`/feedback/responses/${responseId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || 'Failed to delete response.');
                }

                return data;
            });
        })
        .then(function () {
            loadResponsesForFeedback(feedbackId);
        })
        .catch(function (error) {
            console.error('Error deleting response:', error);
            alert(error.message || 'Something went wrong while deleting response.');
        });
}