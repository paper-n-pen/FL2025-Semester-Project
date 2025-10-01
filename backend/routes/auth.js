// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const router = express.Router();

// Registration endpoint
router.post('/register', async (req, res) => {
  console.log('POST /register endpoint hit');
  const { username, email, password } = req.body;
  console.log('Request body:', req.body);

  if (!username || !email || !password) {
    console.log('Registration failed: All fields required');
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    console.log(`Checking if user with email ${email} already exists.`);
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      console.log(`User with email ${email} already exists.`);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('User not found, proceeding with registration. Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed. Inserting new user into database...');
    await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
      [username, email, passwordHash]
    );

    console.log('User registered successfully');
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
