// Run loadMyFeedback() after the HTML page has fully loaded.
document.addEventListener('DOMContentLoaded', loadMyFeedback);

/*
  Loads all feedback submitted by the logged-in customer.

  API route needed later:
  GET /feedback

  Expected data from backend:
  [
    {
      feedback_id: 3,
      product_name: "Chili Crab",
      rating: 5,
      comment_text: "Yummy",
      updated_at: "2026-01-01T11:20:01"
    }
  ]
*/
async function loadMyFeedback() {
  const loadingMessage = document.getElementById('loading-message');
  const emptyMessage = document.getElementById('empty-message');
  const feedbackList = document.getElementById('feedbackList');
  const feedbackCount = document.getElementById('feedback-count');
  const errorMessage = document.getElementById('error-message');

  try {
    const response = await fetch('/feedback');
    const data = await response.json();

    loadingMessage.style.display = 'none';

    if (!response.ok) {
      errorMessage.style.display = 'block';
      errorMessage.textContent =
        data.message || data.error || 'Failed to load feedback.';
      return;
    }

    /*
      Supports a few possible backend response styles.

      Example 1:
      data = [...]

      Example 2:
      data = {
        success: true,
        feedback: [...]
      }
    */
    const feedbacks = Array.isArray(data)
      ? data
      : data.feedback || data.feedbacks || data.data || [];

    feedbackList.innerHTML = '';
    feedbackCount.textContent = `Total Feedback: ${feedbacks.length}`;

    if (feedbacks.length === 0) {
      emptyMessage.style.display = 'block';
      return;
    }

    feedbacks.forEach((feedback) => {
      const feedbackId = feedback.feedback_id || feedback.feedbackId;
      const productName = feedback.product_name || feedback.productName || '-';
      const rating = Number(feedback.rating) || 0;
      const commentText = feedback.comment_text || feedback.commentText || '-';
      const updatedAt =
        feedback.updated_at || feedback.updatedAt || feedback.last_updated;

      const feedbackItem = document.createElement('div');
      feedbackItem.className = 'my-feedback-item';

      feedbackItem.innerHTML = `
        <h5 class="feedback-id-title">
          Feedback ID: ${escapeHTML(feedbackId)}
        </h5>

        <p>
          <strong>Product Name:</strong>
          ${escapeHTML(productName)}
        </p>

        <p>
          <strong>Rating:</strong>
          <span class="feedback-stars">${'⭐'.repeat(rating)}</span>
        </p>

        <p>
          <strong>Comments:</strong>
          ${escapeHTML(commentText)}
        </p>

        <p>
          <strong>Last Updated:</strong>
          ${formatDateTime(updatedAt)}
        </p>

        <button
          class="btn btn-dark btn-sm me-2"
          onclick="goToEditFeedback(${feedbackId})"
        >
          Update
        </button>

        <button
          class="btn btn-outline-dark btn-sm"
          onclick="deleteFeedback(${feedbackId})"
        >
          Delete
        </button>
      `;

      feedbackList.appendChild(feedbackItem);
    });
  } catch (error) {
    console.error('Error loading feedback:', error);
    loadingMessage.style.display = 'none';
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Something went wrong while loading feedback.';
  }
}

/*
  Redirect to edit feedback page.

  Page route:
  /member/feedback/edit?feedbackId=3
*/
function goToEditFeedback(feedbackId) {
  window.location.href = `/member/feedback/edit?feedbackId=${feedbackId}`;
}

/*
  Deletes selected feedback.

  API route needed later:
  DELETE /feedback/:feedbackId
*/
async function deleteFeedback(feedbackId) {
  const confirmDelete = confirm('Are you sure you want to delete this feedback?');

  if (!confirmDelete) {
    return;
  }

  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';

  try {
    const response = await fetch(`/feedback/${feedbackId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      errorMessage.style.display = 'block';
      errorMessage.textContent =
        data.message || data.error || 'Failed to delete feedback.';
      return;
    }

    successMessage.style.display = 'block';
    successMessage.textContent =
      data.message || 'Feedback deleted successfully.';

    loadMyFeedback();
  } catch (error) {
    console.error('Error deleting feedback:', error);
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Something went wrong while deleting feedback.';
  }
}

/*
  Converts database timestamp into readable date/time.
*/
function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}

/*
  Prevents raw user/database text from being treated as HTML.
*/
function escapeHTML(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}