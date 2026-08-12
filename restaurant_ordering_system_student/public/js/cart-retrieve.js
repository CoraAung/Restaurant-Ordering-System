document.addEventListener("DOMContentLoaded", function () {
  loadCart();

  

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      window.location.href = "/member/cart/checkout";
    });
  }
});

function loadCart() {
  const loadingMessage = document.getElementById("loading-message");
  const emptyMessage = document.getElementById("empty-message");
  const errorMessage = document.getElementById("error-message");
  const tableContainer = document.getElementById("cart-table-container");
  const summaryBox = document.getElementById("cart-summary-box");
  const tbody = document.getElementById("cart-items-tbody");

  loadingMessage.style.display = "block";
  emptyMessage.style.display = "none";
  errorMessage.style.display = "none";
  tableContainer.style.display = "none";
  summaryBox.style.display = "none";
  tbody.innerHTML = "";

  fetch("/cart/items", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to retrieve cart items.");
        }
        return data;
      });
    })
    .then(function (data) {
      loadingMessage.style.display = "none";

      const cartItems = data.cartItems;

      if (!cartItems || cartItems.length === 0) {
        emptyMessage.style.display = "block";
        return;
      }

      tableContainer.style.display = "block";

      cartItems.forEach(function (item) {
        const row = document.createElement("tr");
        row.dataset.cartItemId = item.cartItemId;

        row.innerHTML = `
                    <td>${escapeHTML(item.productName)}${item.productDescription ? " - " + escapeHTML(item.productDescription) : ""}</td>
                    <td class="subtotal-cell">${parseFloat(item.subTotalPrice).toFixed(2)}</td>
                    <td>${parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary qty-decrement">−</button>
                            <span class="qty-display" data-original="${item.quantity}">${item.quantity}</span>
                            <button type="button" class="btn btn-sm btn-outline-secondary qty-increment">+</button>
                        </div>
                    </td>
                    <td>
                        <button type="button" class="btn btn-warning btn-sm update-qty-btn" disabled>Update</button>
                    </td>
                    <td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteCartItem(${item.cartItemId})">Delete</button>
                    </td>
                `;

        tbody.appendChild(row);

        const qtyDisplay = row.querySelector(".qty-display");
        const decrementBtn = row.querySelector(".qty-decrement");
        const incrementBtn = row.querySelector(".qty-increment");
        const updateBtn = row.querySelector(".update-qty-btn");

        function refreshUpdateButtonState() {
          const currentQty = parseInt(qtyDisplay.textContent);
          const originalQty = parseInt(qtyDisplay.dataset.original);
          updateBtn.disabled = currentQty === originalQty;
        }

        decrementBtn.addEventListener("click", function () {
          const currentQty = parseInt(qtyDisplay.textContent);
          if (currentQty > 1) {
            qtyDisplay.textContent = currentQty - 1;
            refreshUpdateButtonState();
          }
        });

        incrementBtn.addEventListener("click", function () {
          const currentQty = parseInt(qtyDisplay.textContent);
          qtyDisplay.textContent = currentQty + 1;
          refreshUpdateButtonState();
        });

        updateBtn.addEventListener("click", function () {
          updateCartItemQuantity(
            item.cartItemId,
            parseInt(qtyDisplay.textContent),
            updateBtn,
          );
        });
      });

      loadCartSummary();
    })
    .catch(function (error) {
      loadingMessage.style.display = "none";
      errorMessage.style.display = "block";
      errorMessage.textContent = error.message;
    });
}

function loadCartSummary() {
  const summaryBox = document.getElementById("cart-summary-box");
  const totalQuantity = document.getElementById("summary-total-quantity");
  const totalPrice = document.getElementById("summary-total-price");

  fetch("/cart/summary", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to retrieve cart summary.");
        }
        return data;
      });
    })
    .then(function (data) {
      totalQuantity.textContent = data.summary.totalQuantity;
      totalPrice.textContent = parseFloat(
        data.summary.totalCheckoutPrice,
      ).toFixed(2);
      summaryBox.style.display = "block";
    })
    .catch(function (error) {
      console.error("Error loading cart summary:", error);
    });
}

function deleteCartItem(cartItemId) {
  const confirmDelete = confirm("Remove this item from your cart?");

  if (!confirmDelete) {
    return;
  }

  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");

  errorMessage.style.display = "none";
  successMessage.style.display = "none";

  fetch(`/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to delete item.");
        }
        return data;
      });
    })
    .then(function (data) {
      successMessage.style.display = "block";
      successMessage.textContent = data.message || "Item removed from cart.";

      loadCart();
    })
    .catch(function (error) {
      console.error("Error deleting cart item:", error);
      errorMessage.style.display = "block";
      errorMessage.textContent =
        error.message || "Something went wrong while deleting item.";
    });
}

function escapeHTML(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateCartItemQuantity(cartItemId, quantity, buttonEl) {
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");

  errorMessage.style.display = "none";
  successMessage.style.display = "none";

  buttonEl.disabled = true;
  buttonEl.textContent = "Updating...";

  fetch(`/cart/items/${cartItemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ quantity: quantity }),
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to update quantity.");
        }
        return data;
      });
    })
    .then(function (data) {
      successMessage.style.display = "block";
      successMessage.textContent =
        data.message || "Quantity updated successfully.";
      loadCart();
    })
    .catch(function (error) {
      console.error("Error updating quantity:", error);
      errorMessage.style.display = "block";
      errorMessage.textContent =
        error.message || "Something went wrong while updating quantity.";
      buttonEl.disabled = false;
      buttonEl.textContent = "Update";
    });
}
