document.addEventListener("DOMContentLoaded", function () {
  loadFeedback();

  const deleteFeedbackForm = document.getElementById("deleteFeedbackForm");

  if (deleteFeedbackForm) {
    deleteFeedbackForm.addEventListener("submit", submitDeleteFeedbackForm);
  }
});

function loadFeedback() {
  const feedbackList = document.getElementById("feedbackList");
  const feedbackCount = document.getElementById("feedback-count");
  const loadingMessage = document.getElementById("loading-message");
  const emptyMessage = document.getElementById("empty-message");
  const errorMessage = document.getElementById("error-message");

  loadingMessage.style.display = "block";
  emptyMessage.style.display = "none";
  errorMessage.style.display = "none";
  feedbackList.innerHTML = "";

  fetch("/feedback", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to retrieve feedback.");
      }

      return response.json();
    })
    .then(function (data) {
      loadingMessage.style.display = "none";

      const feedback = data.feedback;

      feedbackCount.textContent = `Total Feedback: ${feedback.length}`;

      if (feedback.length === 0) {
        emptyMessage.style.display = "block";
        return;
      }

      feedback.forEach(function (item) {
        const feedbackCard = document.createElement("div");
        feedbackCard.className = "card mb-3";

        feedbackCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${item.product_name}</h5>

                        <p class="card-text">
                            <strong>Rating:</strong> ${"⭐".repeat(Number(item.rating))}
                        </p>

                        <p class="card-text">
                            <strong>Comments:</strong> ${item.comments}
                        </p>

                        <p class="card-text text-muted">
                            <small>
                                Last updated: ${formatDate(item.updated_at)}
                            </small>
                        </p>

                        <div class="d-flex gap-2">
                            <a 
                                href="/member/feedback/edit?feedbackId=${item.feedback_id}" 
                                class="btn btn-warning btn-sm"
                            >
                                Edit
                            </a>

                            <button 
                                type="button"
                                class="btn btn-danger btn-sm"
                                onclick="showDeleteFeedbackForm(${item.feedback_id})"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                `;

        feedbackList.appendChild(feedbackCard);
      });
    })
    .catch(function (error) {
      loadingMessage.style.display = "none";
      errorMessage.style.display = "block";
      errorMessage.textContent = error.message;
    });
}

function formatDate(dateString) {
  if (!dateString) {
    return "N/A";
  }

  const date = new Date(dateString);
  return date.toLocaleString();
}

function showDeleteFeedbackForm(feedbackId) {
  const deleteFeedbackBox = document.getElementById("deleteFeedbackBox");
  const deleteFeedbackId = document.getElementById("deleteFeedbackId");

  deleteFeedbackId.value = feedbackId;
  deleteFeedbackBox.style.display = "block";

  deleteFeedbackBox.scrollIntoView({
    behavior: "smooth",
  });
}

function cancelDeleteFeedback() {
  const deleteFeedbackBox = document.getElementById("deleteFeedbackBox");
  const deleteFeedbackId = document.getElementById("deleteFeedbackId");

  deleteFeedbackId.value = "";
  deleteFeedbackBox.style.display = "none";
}
