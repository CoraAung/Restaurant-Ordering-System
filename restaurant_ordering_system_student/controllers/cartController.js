const cartModel = require("../models/cartModel");
const { INVALID_REFERENCE_ERROR } = require("../errors");

module.exports.createCartItem = function (req, res) {
  const memberId = req.user.user_id;
  const productId = parseInt(req.body.product_id);
  const quantity = parseInt(req.body.quantity);

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, error: "Product ID is required." });
  }

  if (!quantity || quantity <= 0) {
    return res
      .status(400)
      .json({ success: false, error: "Quantity must be more than 0." });
  }

  return cartModel
    .createCartItems(memberId, productId, quantity)
    .then(function (cartItem) {
      return res.status(201).json({ success: true, cartItem: cartItem });
    })
    .catch(function (error) {
      console.error(error);

      if (error instanceof INVALID_REFERENCE_ERROR) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(500).json({ success: false, error: error.message });
    });
};

module.exports.createCartItem = function (req, res) {
  const memberId = req.user.user_id;
  const productId = parseInt(req.body.product_id);
  const quantity = parseInt(req.body.quantity);

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, error: "Product ID is required." });
  }
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


module.exports.updateCartItem = function (req, res) {
    const memberId = req.user.user_id;
    const cartItemId = parseInt(req.params.cart_item_id);
    const quantity = parseInt(req.body.quantity);

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

            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ success: false, error: error.message });
            }

            return res.status(500).json({ success: false, error: error.message });
        });
};

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

            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ success: false, error: error.message });
            }

            return res.status(500).json({ success: false, error: error.message });
        });
};

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
            return res.status(500).json({ success: false, error: error.message });
        });
};
