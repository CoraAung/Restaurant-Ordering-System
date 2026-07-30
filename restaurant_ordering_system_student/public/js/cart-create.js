document.addEventListener('DOMContentLoaded', function () {
    initCreateCartPage();
});

function initCreateCartPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');

    const productIdInput = document.getElementById('productId');
    const formTitle = document.getElementById('formTitle');
    const backToProductBtn = document.getElementById('backToProductBtn');
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('addCartItemForm');

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
                formTitle.textContent = `Add ${data.product.name} to Cart`;
                document.title = `Add ${data.product.name} to Cart`;
            } else {
                formTitle.textContent = `Add Product ${productId} to Cart`;
            }
        })
        .catch(function (error) {
            console.error('Error loading product name:', error);
            formTitle.textContent = `Add Product ${productId} to Cart`;
        });

    form.addEventListener('submit', createCartItem);
}

function createCartItem(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const quantity = document.getElementById('quantity').value;

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!quantity || Number(quantity) <= 0) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Quantity must be more than 0.';
        return;
    }

    fetch('/cart/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            product_id: Number(productId),
            quantity: Number(quantity)
        })
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to add item to cart.');
                }

                return data;
            });
        })
        .then(function (data) {
            successMessage.style.display = 'block';
            successMessage.textContent = data.message || 'Item added to cart successfully.';
        })
        .catch(function (error) {
            console.error('Error adding item to cart:', error);

            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Something went wrong while adding item to cart.';
        });
}