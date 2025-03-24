require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL Connection (Use the environment variables)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL Database!');
});

// Sign Up Endpoint
app.post('/signup', async (req, res) => {
    const { username, pwd } = req.body;

    if (!username || !pwd) {
        return res.status(400).send('All fields are required');
    }

    try {
        const hashedPassword = await bcrypt.hash(pwd, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error creating account');
            }
            res.status(201).send('Account created successfully!');
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Log In Endpoint
app.post('/login', (req, res) => {
    const { username, pwd } = req.body;

    if (!username || !pwd) {
        return res.status(400).send('All fields are required');
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(pwd, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid credentials');
        }

        res.status(200).send('Login successful');
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
