document.addEventListener('DOMContentLoaded', function () {
    loadCheckout();

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', submitPlaceOrder);
    }
});

function loadCheckout() {
    const loadingMessage = document.getElementById('loading-message');
    const checkoutContent = document.getElementById('checkout-content');
    const errorMessage = document.getElementById('error-message');

    loadingMessage.style.display = 'block';
    checkoutContent.style.display = 'none';
    errorMessage.style.display = 'none';

    fetch('/cart/checkout', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to load checkout summary.');
                }
                return data;
            });
        })
        .then(function (data) {
            loadingMessage.style.display = 'none';
            renderCheckout(data.checkout);
            checkoutContent.style.display = 'block';
        })
        .catch(function (error) {
            loadingMessage.style.display = 'none';
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message;
        });
}

function renderCheckout(checkout) {
    // Order Items
    const itemsContainer = document.getElementById('checkout-items');
    let itemsHTML = '<h6 class="fw-bold mb-2">Order Items</h6>';

    checkout.cartItems.forEach(function (item) {
        itemsHTML += `
            <div class="d-flex justify-content-between mb-1">
                <span>${escapeHTML(item.productName)} x${item.quantity}</span>
                <span>$${item.subTotalPrice.toFixed(2)}</span>
            </div>
        `;
    });

    itemsContainer.innerHTML = itemsHTML;

    // Order Value (undiscounted anchor - shown BEFORE any discount lines)
    document.getElementById('checkout-subtotal').textContent = `$${checkout.orderValue.toFixed(2)}`;

    // Discounts Eligible (both applied and not-met, shown together)
    const discountsContainer = document.getElementById('checkout-discounts-list');
    let discountsHTML = '';

    if (checkout.discountsEligible.length > 0) {
        discountsHTML += '<h6 class="fw-bold mt-3 mb-2">Discounts Eligible</h6>';

        checkout.discountsEligible.forEach(function (discount) {
            const label = discount.scope === 'PRODUCT'
                ? `${escapeHTML(discount.productName)}: ${escapeHTML(discount.discountName)}`
                : escapeHTML(discount.discountName);

            if (discount.met) {
                discountsHTML += `
                    <div class="d-flex justify-content-between mb-1 text-success">
                        <span>${label}</span>
                        <span>-$${discount.amount.toFixed(2)}</span>
                    </div>
                `;
            } else {
                discountsHTML += `
                    <div class="d-flex justify-content-between mb-1 text-muted">
                        <span>${label}</span>
                        <span><small>${escapeHTML(discount.reason)}</small></span>
                    </div>
                `;
            }
        });
    }

    discountsContainer.innerHTML = discountsHTML;

    // Delivery
    document.getElementById('checkout-delivery-fee').textContent =
        `$${checkout.delivery.fee.toFixed(2)} (${escapeHTML(checkout.delivery.tierName)})`;

    // Total
    document.getElementById('checkout-total').textContent = `$${checkout.total.toFixed(2)}`;
}

function submitPlaceOrder() {
    const confirmOrder = confirm('Place this order?');

    if (!confirmOrder) {
        return;
    }

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    placeOrderBtn.disabled = true;

    fetch('/cart/place-order', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
    })
        .then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to place order.');
                }
                return data;
            });
        })
        .then(function (data) {
            successMessage.style.display = 'block';
            successMessage.textContent = data.message || 'Order placed successfully!';

            setTimeout(function () {
                window.location.href = '/member/products';
            }, 1200);
        })
        .catch(function (error) {
            console.error('Error placing order:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Something went wrong while placing your order.';
            placeOrderBtn.disabled = false;
        });
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