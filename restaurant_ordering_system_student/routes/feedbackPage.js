// routes/feedbackPage.js

// Import Express to create route handlers
const express = require('express');
const path = require('path');

//export only one specific function: ensureAuthenticated from ../middleware/auth.js
const { ensureAuthenticated } = require('../middleware/auth');

// Create an Express router object
const router = express.Router();

/*
  GET /member/feedback

  Purpose:
  - Serves the main feedback page.
  - This page displays all feedback submitted by the logged-in customer.
  - The actual feedback data will be loaded using a separate API route, such as GET /feedback.

  Note:
  - This route only sends the HTML file.
  - It does not directly retrieve feedback from the database.
*/
router.get('/', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/feedback/index.html'));
});

/*
  GET /member/feedback/create

  Purpose:
  - Serves the create feedback page.
  - This page contains the form for the customer to submit feedback for a product.
  - The product ID is usually passed through the URL query string.

  Example:
  /member/feedback/create?productId=5

  Note:
  - This route only opens the create feedback form.
  - The actual database insert happens when the form submits to the API route POST /feedback.
*/
router.get('/create', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/feedback/create.html'));
});

/*
  GET /member/feedback/edit

  Purpose:
  - Serves the edit feedback page.
  - This page contains the form for updating an existing feedback entry.
  - The feedback ID is usually passed through the URL query string.

  Example:
  /member/feedback/edit?feedbackId=3

  Note:
  - This route only opens the edit feedback form.
  - The existing feedback details should be loaded using an API route, such as GET /feedback/:feedbackId.
  - The actual database update happens when the form submits to the API route PUT /feedback/:feedbackId.
*/
router.get('/edit', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/feedback/edit.html'));
});

// Export the router so it can be mounted in server.js
module.exports = router;