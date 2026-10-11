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


## CA2 Features Implemented

Building on the CA1 codebase, the following features were added for CA2:

### Database Setup — Additional Notes for CA2

CA2 integrates Prisma ORM and requires setup steps beyond the CA1 SQL backup import above:

1. Run `npx prisma generate` to generate the Prisma client.
2. Run `npx prisma migrate dev` (or apply the provided migration) to create the new `cart`, `cart_item`, and `discount` tables on top of the existing schema.
3. A separate `manufacturer` database is used for Section 5 (Indexing) — restore its backup separately; it is not integrated into the application.
4. **Note on restoring from seed data:** if `sale_order` or `sale_order_item` rows are restored with explicit primary key values, the underlying auto-increment sequence can fall out of sync with the actual max ID in each table, causing `duplicate key value violates unique constraint` errors when `place_orders` is called. If this occurs, run:
```sql
   SELECT setval('public.sale_order_order_id_seq', (SELECT MAX(order_id) FROM sale_order));
   SELECT setval('public.sale_order_item_order_item_id_seq', (SELECT MAX(order_item_id) FROM sale_order_item));
```

### Cart Management Feature

Members can manage their own shopping cart, implemented via Prisma ORM.

Functionally, a member can:

* Add items to cart (auto-creates a cart on first add, via upsert)
* Update the quantity of an item in the cart
* Remove an item from the cart
* Retrieve all items in the cart, and view a cart summary (total quantity, total checkout price)

Validation includes:

* Product ID must reference a valid, existing product
* Quantity must be greater than 0
* Adding a product already in the cart increments its existing quantity rather than creating a duplicate row
* A member can only access, update, or delete items in their own cart — never another member's, even with a known/guessed cart item ID

### Checkout Feature

Members can proceed from their cart to a checkout page showing applicable discounts and the delivery fee before placing an order.

Discounts supported:

* Product-quantity discounts (e.g. "Buy 3 X get 10% off")
* Cart-value discounts (e.g. "Spend $100 get 5% off")
* Tiered delivery fees based on cart value

All active discounts are evaluated simultaneously against the cart's original order value, and both met and unmet discounts are shown, with unmet discounts displaying an actionable message (e.g. "Add 2 more X to qualify"). New discount rules can be added directly via data (`INSERT`) with no code changes.

### Transaction Management Feature

At the end of checkout, a member can place an order via the `place_orders` stored procedure, which processes each cart item individually:

* Available items are converted into a sale order and sale order item, and removed from the cart
* Unavailable items are skipped and remain in the cart, without rolling back items already processed
* If no items are available, no sale order is created

### Manufacturer Table Indexing (Section 5)

Six queries against the `manufacturer` table were optimized using various index types (single-column B-tree, composite, function-based, and covering indexes), with `EXPLAIN ANALYZE` evidence of performance improvement documented in the CA2 report. This is documentation-only; the `manufacturer` table is not integrated into the application.

## Important Files — CA2 Additions

### Cart and Checkout Pages

* `views/cart/create.html`
* `views/cart/retrieve-all.html`
* `views/cart/checkout.html`

### Frontend JavaScript

* `public/js/cart-retrieve.js`
* `public/js/cart-create.js`
* `public/js/checkout.js`

### Backend Files

* `routes/cart.js`
* `controllers/cartController.js`
* `models/cartModel.js`

### Database

* `prisma/schema.prisma` — new `cart`, `cart_item`, `discount` models
* `functions_and_stored_procedures.sql` — includes `place_orders`

## CA2 Testing

Testing was done using the application interface, Postman, and pgAdmin.

Examples of tests performed:

* Cart CRUD: add item (including duplicate-add increments quantity), update quantity, delete item, retrieve items and summary
* Ownership scoping: updating or deleting another member's cart item returns "Cart item not found" rather than succeeding or exposing existence
* Checkout: multiple discount types evaluated and displayed simultaneously; unmet discounts show actionable messaging; delivery fee steps correctly across tier boundaries
* Extensibility: new discount rules (same type, different product) added purely via `INSERT`, applied correctly with no code changes
* Transaction: full-success, partial-success, and zero-availability scenarios for `place_orders`, each verified against both the application UI and pgAdmin
