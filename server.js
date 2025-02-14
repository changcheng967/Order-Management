const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./orders.db');  // SQLite database

// Set up EJS for templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Create orders table if not exists
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roblox_username TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        item_wanted TEXT NOT NULL,
        total_price REAL NOT NULL,
        paid_price REAL NOT NULL,
        contract_signed TEXT NOT NULL,
        delivery_status TEXT NOT NULL,
        estimated_delivery TEXT NOT NULL,
        order_submitted_time TEXT NOT NULL
    )
`);

// Route to handle login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const password = req.body.password;
    if (password === 'Jiu142857kuang') {  // Only allow access with the correct password
        req.session.loggedIn = true;
        return res.redirect('/dashboard');
    } else {
        return res.send('Incorrect password');
    }
});

// Route for dashboard (order management)
app.get('/dashboard', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }

    db.all('SELECT * FROM orders', (err, orders) => {
        if (err) {
            console.error(err);
            return res.send('Error fetching orders');
        }

        res.render('dashboard', { orders });
    });
});

// Route to create a new order
app.post('/create-order', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }

    const { roblox_username, buyer_name, item_wanted, total_price, contract_signed, delivery_status, estimated_delivery } = req.body;
    const paid_price = total_price;  // For simplicity, assuming paid price equals total price
    const order_submitted_time = new Date().toISOString();

    const query = `
        INSERT INTO orders (roblox_username, buyer_name, item_wanted, total_price, paid_price, contract_signed, delivery_status, estimated_delivery, order_submitted_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [roblox_username, buyer_name, item_wanted, total_price, paid_price, contract_signed, delivery_status, estimated_delivery, order_submitted_time];

    db.run(query, params, function(err) {
        if (err) {
            console.error(err);
            return res.send('Error creating order');
        }

        res.redirect('/dashboard');
    });
});

// Route to logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }

        res.redirect('/login');
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
