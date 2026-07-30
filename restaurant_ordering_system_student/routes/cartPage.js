// routes/cartPage.js
// For the frontend - serves cart-related HTML pages
const express = require('express');
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

/*
  GET /member/cart/create

  Purpose:
  - Serves the "Add Cart Items" page.
  - This page contains the form for the member to add a product to their cart
    (Product Id + Quantity fields).

  Note:
  - This route only opens the create cart item form.
  - The actual database insert happens when the form submits to the API route POST /cart/items.
*/
router.get('/create', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/cart/create.html'));
});

/*
  GET /member/cart/retrieve/all

  Purpose:
  - Serves the "Shopping Cart" page showing all items in the member's cart,
    with Update Quantity and Delete Item actions, plus the cart summary.

  Note:
  - This route only sends the HTML file.
  - The actual cart items are loaded using GET /cart/items and GET /cart/summary.
*/
// router.get('/retrieve/all', ensureAuthenticated, (req, res) => {
//   res.sendFile(path.join(__dirname, '../views/cart/retrieve-all.html'));
// });

module.exports = router;