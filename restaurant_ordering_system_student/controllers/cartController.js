const cartModel = require("../models/cartModel");
const { EMPTY_RESULT_ERROR, INVALID_REFERENCE_ERROR, CHECKOUT_CALCULATION_ERROR } = require("../errors");

// createCartItem - handles POST /cart/items
// Adds a product to the logged-in member's cart, or increments quantity if it already exists
module.exports.createCartItem = function (req, res) {
  const memberId = req.user.user_id;
  const productId = parseInt(req.body.product_id);
  const quantity = parseInt(req.body.quantity);

  // validate product ID is present
  if (!productId) {
    return res
      .status(400)
      .json({ success: false, error: "Product ID is required." });
  }

  // validate quantity is a positive number
  if (!quantity || quantity <= 0) {
    return res
      .status(400)
      .json({ success: false, error: "Quantity must be more than 0." });
  }

  return cartModel
    .createCartItems(memberId, productId, quantity)
    .then(function (cartItem) {
      return res
        .status(201)
        .json({
          success: true,
          message: "Item added to cart successfully.",
          cartItem: cartItem,
        });
    })
    .catch(function (error) {
      console.error(error);

      // product ID does not exist in the product table
      if (error instanceof INVALID_REFERENCE_ERROR) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(500).json({ success: false, error: error.message });
    });
};

// retrieveCartItems - handles GET /cart/items
// Returns all items in the logged-in member's cart
module.exports.retrieveCartItems = function (req, res) {
  const memberId = req.user.user_id;

  return cartModel
    .getCartItems(memberId)
    .then(function (cartItems) {
      return res.status(200).json({
        success: true,
        cartItems: cartItems,
      });
    })
    .catch(function (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: error.message });
    });
};

// retrieveCartSummary - handles GET /cart/summary
// Returns total quantity and total checkout price for the logged-in member's cart
module.exports.retrieveCartSummary = function (req, res) {
  const memberId = req.user.user_id;

  return cartModel
    .getCartSummary(memberId)
    .then(function (summary) {
      return res.status(200).json({
        success: true,
        summary: summary,
      });
    })
    .catch(function (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: error.message });
    });
};

// updateCartItem - handles PUT /cart/items/:cart_item_id
// Updates the quantity of a single cart item; ownership is checked inside the model
module.exports.updateCartItem = function (req, res) {
    const memberId = req.user.user_id;
    const cartItemId = parseInt(req.params.cart_item_id);
    const quantity = parseInt(req.body.quantity);

    // validate quantity is a positive number
    if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Quantity must be more than 0.' });
    }

    return cartModel
        .updateCartItems(memberId, cartItemId, quantity)
        .then(function (cartItem) {
            return res.status(200).json({
                success: true,
                message: 'Cart item updated successfully.',
                cartItem: cartItem,
            });
        })
        .catch(function (error) {
            console.error(error);

            // cart item does not exist, or does not belong to this member
            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ success: false, error: error.message });
            }

            return res.status(500).json({ success: false, error: error.message });
        });
};

// removeCartItem - handles DELETE /cart/items/:cart_item_id
// Deletes a single cart item; ownership is checked inside the model
module.exports.removeCartItem = function (req, res) {
    const memberId = req.user.user_id;
    const cartItemId = parseInt(req.params.cart_item_id);

    return cartModel
        .deleteCartItems(memberId, cartItemId)
        .then(function (cartItem) {
            return res.status(200).json({
                success: true,
                message: 'Cart item deleted successfully.',
            });
        })
        .catch(function (error) {
            console.error(error);

            // cart item does not exist, or does not belong to this member
            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ success: false, error: error.message });
            }

            return res.status(500).json({ success: false, error: error.message });
        });
};

// retrieveCheckoutSummary - handles GET /cart/checkout
// Returns the full checkout breakdown: order items, discounts, delivery fee, and total
module.exports.retrieveCheckoutSummary = function (req, res) {
    const memberId = req.user.user_id;

    return cartModel
        .calculateCheckout(memberId)
        .then(function (checkoutSummary) {
            return res.status(200).json({
                success: true,
                checkout: checkoutSummary,
            });
        })
        .catch(function (error) {
            console.error(error);

            // discount calculation failed (e.g. malformed discount rule)
            if (error instanceof CHECKOUT_CALCULATION_ERROR) {
                return res.status(500).json({ success: false, error: error.message });
            }

            return res.status(500).json({ success: false, error: error.message });
        });
};

// whitelist regex: letters, numbers, spaces, comma, period, hyphen, hash, slash, apostrophe
const ADDRESS_REGEX = /^[a-zA-Z0-9\s,.\-#/']+$/;

// sanitizeAddress - validates and trims a delivery address string
// returns null if the address is missing, too long, or contains disallowed characters
function sanitizeAddress(address) {
    if (!address || typeof address !== 'string') {
        return null;
    }

    const trimmed = address.trim();

    if (trimmed.length === 0 || trimmed.length > 255) {
        return null;
    }

    if (!ADDRESS_REGEX.test(trimmed)) {
        return null;
    }

    return trimmed;
}

// submitPlaceOrder - handles POST /cart/place-order
// Validates the delivery address, then invokes the place_orders stored procedure via the model
module.exports.submitPlaceOrder = function (req, res) {
    const memberId = req.user.user_id;
    const deliveryAddress = sanitizeAddress(req.body.delivery_address);

    if (!deliveryAddress) {
        return res.status(400).json({
            success: false,
            error: 'A valid delivery address is required (letters, numbers, and common punctuation only, max 255 characters).'
        });
    }

    return cartModel
        .placeOrder(memberId, deliveryAddress)
        .then(function (result) {
            return res.status(200).json({
                success: true,
                orderId: result.orderId,
                itemsProcessed: result.itemsProcessed,
                itemsPlaced: result.itemsPlaced,
                itemsRemaining: result.itemsRemaining,
            });
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: error.message });
        });
};