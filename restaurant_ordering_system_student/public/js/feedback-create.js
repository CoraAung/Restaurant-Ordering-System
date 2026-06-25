document.addEventListener('DOMContentLoaded', function () {
    initCreateFeedbackPage();
});

function initCreateFeedbackPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');

    const productIdInput = document.getElementById('productId');
    const formTitle = document.getElementById('formTitle');
    const backToProductBtn = document.getElementById('backToProductBtn');
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('createFeedbackForm');

    if (!productId) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'No product specified.';
        form.style.display = 'none';
        return;
    }

    productIdInput.value = productId;
    backToProductBtn.href = `/member/product-detail?id=${productId}`;

    fetch(`/products/${productId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Failed to load product details.');
            }

            return response.json();
        })
        .then(function (data) {
            if (data.success && data.product) {
                formTitle.textContent = `Create Feedback for ${data.product.name}`;
                document.title = `Create Feedback for ${data.product.name}`;
            } else {
                formTitle.textContent = `Create Feedback for Product ${productId}`;
            }
        })
        .catch(function (error) {
            console.error('Error loading product name:', error);
            formTitle.textContent = `Create Feedback for Product ${productId}`;
        });

    form.addEventListener('submit', createFeedback);
}

function createFeedback(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const rating = document.getElementById('rating').value;
    const commentText = document.getElementById('commentText').value.trim();

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Rating must be between 1 and 5.';
        return;
    }

    if (!commentText) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Comment text is required.';
        return;
    }

    fetch('/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            product_id: Number(productId),
            rating: Number(rating),
            comments: commentText
        })
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Failed to create feedback.');
                }

                return data;
            });
        })
        .then(function (data) {
            successMessage.style.display = 'block';
            successMessage.textContent = data.message || 'Feedback created successfully.';

            setTimeout(function () {
                window.location.href = '/member/feedback';
            }, 800);
        })
        .catch(function (error) {
            console.error('Error creating feedback:', error);

            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Something went wrong while creating feedback.';
        });
}