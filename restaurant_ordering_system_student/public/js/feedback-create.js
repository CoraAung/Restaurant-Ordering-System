// Run initCreateFeedbackPage() only after the HTML page has fully loaded.
// This ensures all form elements can be found using document.getElementById().
document.addEventListener('DOMContentLoaded', initCreateFeedbackPage);

/*
  Initializes the create feedback page.

  Main responsibilities:
  1. Read productId from the URL query string.
     Example URL: /member/feedback/create?productId=3

  2. Prefill the Product ID input field.

  3. Set the Back button to return to the correct product detail page.

  4. Fetch the product details from the product API so the form title can show:
     "Create Feedback for Fish and Chips"

  5. Attach the form submit event listener.
*/
async function initCreateFeedbackPage() {
  // Read query parameters from the current page URL
  const params = new URLSearchParams(window.location.search);

  // Get productId from URL, e.g. productId=3
  const productId = params.get('productId');

  // Get important HTML elements from create.html
  const productIdInput = document.getElementById('productId');
  const formTitle = document.getElementById('formTitle');
  const backToProductBtn = document.getElementById('backToProductBtn');
  const errorMessage = document.getElementById('error-message');
  const form = document.getElementById('createFeedbackForm');

  // If productId is missing from the URL, the page does not know which product this feedback is for.
  // So show an error and hide the form.
  if (!productId) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'No product specified.';
    form.style.display = 'none';
    return;
  }

  // Prefill Product ID using the URL value.
  // The input should be readonly in HTML so the user cannot edit it.
  productIdInput.value = productId;

  // Make the Back button return to the correct product detail page.
  // Example: /member/product-detail?id=3
  backToProductBtn.href = `/member/product-detail?id=${productId}`;

  // Fetch product details so the page title can include the product name.
  // This makes the title dynamic instead of always saying "Create Feedback".
  try {
    const response = await fetch(`/products/${productId}`);
    const data = await response.json();

    // If the product API returns the product successfully, use its name in the form title.
    if (data.success && data.product) {
      formTitle.textContent = `Create Feedback for ${data.product.name}`;
      document.title = `Create Feedback for ${data.product.name}`;
    } else {
      // Fallback title if product data cannot be found
      formTitle.textContent = `Create Feedback for Product ${productId}`;
    }
  } catch (error) {
    // If the fetch request fails, do not break the whole page.
    // Just show a fallback title.
    console.error('Error loading product name:', error);
    formTitle.textContent = `Create Feedback for Product ${productId}`;
  }

  // When the user clicks the Create button, call createFeedback().
  form.addEventListener('submit', createFeedback);
}

/*
  Handles the feedback form submission.

  Main responsibilities:
  1. Stop the form from refreshing the page.
  2. Get product ID, rating, and comment from the form.
  3. Validate rating and comment.
  4. Send POST request to /feedback API.
  5. Show success/error message based on API response.
*/
async function createFeedback(event) {
  // Prevent default form submission because we want to use fetch() instead.
  event.preventDefault();

  // Get form values
  const productId = document.getElementById('productId').value;
  const rating = document.getElementById('rating').value;
  const commentText = document.getElementById('commentText').value.trim();

  // Get message containers
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  // Hide previous messages before validating/submitting again
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';

  // Rating must be between 1 and 5.
  // This is frontend validation only.
  // Backend/SQL should still validate again for security.
  if (!rating || rating < 1 || rating > 5) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Rating must be between 1 and 5.';
    return;
  }

  // Comment cannot be empty.
  if (!commentText) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Comment text is required.';
    return;
  }

  try {
    /*
      Send feedback data to the feedback API.

      This API route should later be handled by:
      routes/feedback.js
      → controllers/feedbackController.js
      → models/feedbackModel.js
      → SQL function/procedure create_feedback(...)
    */
    const response = await fetch('/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: Number(productId),
        rating: Number(rating),
        comment_text: commentText
      })
    });

    // Read JSON response from backend
    const data = await response.json();

    // If API returns error, show error message on the page
    if (!response.ok || !data.success) {
      errorMessage.style.display = 'block';
      errorMessage.textContent = data.message || data.error || 'Failed to create feedback.';
      return;
    }

    // If feedback was created successfully, show success message
    successMessage.style.display = 'block';
    successMessage.textContent = data.message || 'Feedback created successfully.';

    // After short delay, redirect user to their feedback list page
    setTimeout(() => {
      window.location.href = '/member/feedback';
    }, 800);

  } catch (error) {
    // This handles unexpected errors such as server down or network issue
    console.error('Error creating feedback:', error);
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Something went wrong while creating feedback.';
  }
}