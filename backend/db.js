// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Only use these settings if DATABASE_URL is not set
  ...(!process.env.DATABASE_URL && {
    user: process.env.DB_USER || 'myapp_user',
    host: 'localhost',
    database: process.env.DB_NAME || 'myapp_db',
    password: process.env.DB_PASSWORD || 'secret',
    port: 5432,
  }),
});

module.exports = { pool };
