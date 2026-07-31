// routes/cart.js
// Contains the backend API routes for cart
// create, update, delete, retrieve items + cart summary
const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();
const cartController = require('../controllers/cartController');

// POST /cart/items - add an item to cart
router.post('/items', ensureAuthenticated, cartController.createCartItem);

 //GET /cart/items - retrieve all items in the member's cart
router.get('/items', ensureAuthenticated, cartController.retrieveCartItems);

// PUT /cart/items/:cart_item_id - update quantity of a single cart item
router.put('/items/:cart_item_id', ensureAuthenticated, cartController.updateCartItem);

// DELETE /cart/items/:cart_item_id - remove a single item from cart
router.delete('/items/:cart_item_id', ensureAuthenticated, cartController.removeCartItem);

 //GET /cart/summary - retrieve cart summary (total quantity, total checkout price)
router.get('/summary', ensureAuthenticated, cartController.retrieveCartSummary);

// GET /cart/checkout - retrieves the full checkout breakdown (order items, discounts, delivery, total)
router.get('/checkout', ensureAuthenticated, cartController.retrieveCheckoutSummary);
module.exports = router;