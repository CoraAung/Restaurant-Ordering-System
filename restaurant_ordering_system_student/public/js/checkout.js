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
    const errorMessage = document.getElementById('error-message');
    const addressError = document.getElementById('address-error');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();

    errorMessage.style.display = 'none';
    addressError.style.display = 'none';

    const ADDRESS_REGEX = /^[a-zA-Z0-9\s,.\-#/']+$/;

    if (!deliveryAddress) {
        addressError.style.display = 'block';
        addressError.textContent = 'Delivery address is required.';
        return;
    }

    if (!ADDRESS_REGEX.test(deliveryAddress)) {
        addressError.style.display = 'block';
        addressError.textContent = 'Address contains invalid characters. Only letters, numbers, and common punctuation (, . - # /) are allowed.';
        return;
    }

    placeOrderBtn.disabled = true;

    fetch('/cart/place-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            delivery_address: deliveryAddress
        })
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
            renderOrderResult(data);
        })
        .catch(function (error) {
            console.error('Error placing order:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Something went wrong while placing your order.';
            placeOrderBtn.disabled = false;
        });
}

function renderOrderResult(data) {
    document.getElementById('checkout-content').style.display = 'none';

    const resultPanel = document.getElementById('order-result');
    const alertBox = document.getElementById('order-result-alert');
    const detailsBox = document.getElementById('order-result-details');
    const actionsBox = document.getElementById('order-result-actions');

    const itemsPlaced = data.itemsPlaced || [];
    const itemsRemaining = data.itemsRemaining || [];

    const placedListHTML = itemsPlaced.length > 0
        ? `
            <p class="mt-3 mb-1 fw-bold">Items placed:</p>
            <ul>
                ${itemsPlaced.map(function (item) {
                    return `<li>${escapeHTML(item.productName)} x${item.quantity} — $${item.subTotalPrice.toFixed(2)}</li>`;
                }).join('')}
            </ul>
        `
        : '';

    if (data.itemsProcessed > 0 && itemsRemaining.length === 0) {
        // Scenario 1: full success
        alertBox.className = 'alert alert-success';
        alertBox.textContent = '✅ Order Placed Successfully!';

        detailsBox.innerHTML = `
            <p class="text-center mb-0">Order #${data.orderId} — Status: PACKING</p>
            ${placedListHTML}
        `;

        actionsBox.innerHTML = `
            <a href="/member/products" class="btn btn-outline-dark btn-sm">Continue Shopping</a>
        `;
    } else if (data.itemsProcessed > 0) {
        // Scenario 2: partial success
        alertBox.className = 'alert alert-warning';
        alertBox.textContent = '⚠️ Order Placed for Available Items';

        const remainingList = itemsRemaining.map(function (name) {
            return `<li>${escapeHTML(name)}</li>`;
        }).join('');

        detailsBox.innerHTML = `
            <p class="text-center mb-0">Order #${data.orderId} — Status: PACKING</p>
            ${placedListHTML}
            <p class="mt-3 mb-1 fw-bold">The following items are currently unavailable and remain in your cart:</p>
            <ul>${remainingList}</ul>
        `;

        actionsBox.innerHTML = `
            <a href="/member/cart/retrieve/all" class="btn btn-outline-dark btn-sm">View Cart</a>
        `;
    } else {
        // Scenario 3: nothing available
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = '❌ No Items Available';

        detailsBox.innerHTML = `
            <p class="text-center">None of the items in your cart are currently available. Your cart has not been changed.</p>
        `;

        actionsBox.innerHTML = `
            <a href="/member/cart/retrieve/all" class="btn btn-outline-dark btn-sm">View Cart</a>
        `;
    }

    resultPanel.style.display = 'block';
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