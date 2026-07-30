const cartModel = require('../models/cartModel');
const { INVALID_REFERENCE_ERROR } = require('../errors');

module.exports.createCartItem = function (req, res) {
    const memberId = req.user.user_id;
    const productId = parseInt(req.body.product_id);
    const quantity = parseInt(req.body.quantity);

    if (!productId) {
        return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Quantity must be more than 0.' });
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