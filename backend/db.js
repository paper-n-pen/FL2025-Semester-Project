// backend/db.js

import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER || 'myapp_user',
  host: 'localhost',
  database: process.env.DB_NAME || 'myapp_db',
  password: process.env.DB_PASSWORD || 'secret',
  port: 5432,
});
