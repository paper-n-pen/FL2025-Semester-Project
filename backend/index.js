// backend/index.js

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Define a simple route
app.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.send(`Hello, Express! DB connected. Current time from DB: ${result.rows[0].now}`);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to database');
  }
});

// Mount routes
app.use('/api', authRoutes);
app.use('/api', loginRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
