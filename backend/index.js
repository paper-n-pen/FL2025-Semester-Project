// backend/index.js

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');   // reusing the same pool
const authRoutes = require('./routes/auth');
const loginRoutes = require('./routes/login');

const app = express();  // 👈 must come before app.use
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Needed for JSON request bodies

// Test route
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(
      `Hello, Express! DB connected. Current time from DB: ${result.rows[0].now}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to database');
  }
});

// Mount routes at /api
app.use('/api', authRoutes);
app.use('/api', loginRoutes);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
