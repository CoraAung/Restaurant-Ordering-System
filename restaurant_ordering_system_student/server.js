const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

//serve static assets only 
app.use(express.static('public'));
//Mount auth routes at the ROOT
app.use('/', require('./routes/auth'));

app.use('/dashboard', require('./routes/dashboard'));
app.use('/products', require('./routes/products'));
app.use('/member', require('./routes/productsPage'));

// Serves feedback HTML pages such as index.html, create.html, and edit.html.
app.use('/member/feedback', require('./routes/feedbackPage'));

//backend routes
// Handles feedback CRUD API requests and connects to controller/model/database logic.
app.use('/feedback', require('./routes/feedback'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});