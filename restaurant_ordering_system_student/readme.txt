# Restaurant Ordering System

## Project Overview

This project is a restaurant ordering system built using Node.js, Express, PostgreSQL, HTML, CSS, Bootstrap, and JavaScript.

The features implemented for this assignment include:

* Dining feedback
* Feedback responses
* Admin dashboard with summarized sale order data

## Prerequisites

Before running the application, ensure that the following are installed:

* Node.js
* npm
* PostgreSQL
* pgAdmin

## Dependencies

Install the project dependencies using:

```bash
npm install
```

Main dependencies used include:

* `express` — used to build the Node.js web server and API routes
* `pg` — used to connect the application to PostgreSQL
* `express-session` — used to manage user login sessions
* `bcryptjs` — used for password hashing and authentication
* `dotenv` — used to load environment variables from the `.env` file
* `multer` — used for handling file uploads, if required by the application

Development dependency:

* `nodemon` — used to automatically restart the server during development

## Database Setup

1. Create or restore the PostgreSQL database.
2. Import the provided SQL backup file from the repository.
3. Configure the `.env` file with the correct database connection details.
4. The SQL backup contains the database schema, additional feedback and response tables, stored procedures, and user-defined functions.

The main stored procedures and functions implemented are:

### Feedback

* `create_feedback`
* `get_feedback`
* `get_feedback_by_product`
* `update_feedback`
* `delete_feedback`

### Response

* `create_response`
* `get_responses_by_feedback`
* `delete_response`

### Dashboard

* `get_sale_order_summary`

## Running the Application

Start the server using:

```bash
npm start
```

Or, if using nodemon during development:

```bash
npm run dev
```

Then open the application in the browser:

```txt
http://localhost:3000/login
```

## Features Implemented

### Feedback Feature

Members can create feedback for products they have purchased in completed orders. Each member can only submit one feedback per product. Members can also retrieve, update, and delete their own feedback.

Validation includes:

* Rating must be between 1 and 5
* Comments cannot be empty
* Duplicate feedback for the same product is not allowed
* Members can only update or delete their own feedback
* Feedback can only be created for products bought in completed orders

### Response Feature

Members can respond to feedback written by other members. Responses are displayed under each feedback on the product detail page.

Validation includes:

* Response comment cannot be empty
* Members cannot respond to their own feedback
* Members can only delete their own responses

### Admin Dashboard Feature

Admins can view summarized sale order data using the dashboard.

The dashboard supports:

* Filtering by start date
* Filtering by end date
* Filtering by product category
* Sorting by order date, total amount, customer name, and status
* Displaying product count and products ordered for each sale order

The dashboard is restricted to admin users only.

## Important Files

### Feedback and Response Pages

* `views/feedback/index.html`
* `views/feedback/create.html`
* `views/feedback/edit.html`
* `views/product-detail.html`

### Frontend JavaScript

* `public/js/feedback-create.js`
* `public/js/feedback-edit.js`
* `public/js/feedback-index.js`
* `public/js/feedback-delete.js`
* `public/js/product-feedback.js`
* `public/js/dashboard.js`

### Backend Files

* `routes/feedback.js`
* `routes/feedbackPage.js`
* `routes/dashboardApi.js`
* `controllers/feedbackController.js`
* `controllers/dashboardController.js`
* `models/feedbackModel.js`
* `models/dashboardModel.js`

## Testing

Testing was done using both pgAdmin and the application interface.

Examples of tests performed:

* Successful feedback creation
* Duplicate feedback error
* Feedback creation blocked when product was not purchased
* Retrieve feedback submitted by a member
* Retrieve feedback by product
* Update own feedback
* Delete own feedback
* Create response
* Prevent responding to own feedback
* Retrieve responses under feedback
* Delete own response
* Dashboard category filtering
* Dashboard date filtering
* Dashboard sorting
* Dashboard admin access validation

## Notes for Reviewers

The member ID used for feedback and response operations is taken from the authenticated session using `req.user.user_id`. Users do not manually enter their member ID from the frontend.

The feedback and response API routes use `ensureAuthenticated` so only logged-in users can access them.

The dashboard API route uses authentication and admin middleware, while the `get_sale_order_summary` database function also validates admin access at the database level.
