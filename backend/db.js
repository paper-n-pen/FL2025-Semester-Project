// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'myapp_user',
  host: 'localhost',
  database: process.env.DB_NAME || 'myapp_db',
  password: process.env.DB_PASSWORD || 'secret',
  port: 5432,

  // altered by ai, not sure if is for docker settings
  connectionString: process.env.DATABASE_URL,
});

module.exports = { pool };
