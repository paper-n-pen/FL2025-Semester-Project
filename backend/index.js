// backend/index.js

const express = require('express');
const cors = require('cors');
const { Server } = require("socket.io");
const http = require('http');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const loginRoutes = require('./routes/login');
const postRoutes = require('./routes/posts');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/api', postRoutes);

// Add a request logger to see all incoming requests
app.use((req, res, next) => {
  console.log(`Request received for: ${req.method} ${req.originalUrl}`);
  next();
});

// --- Database ---
// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- Routes ---
// Define a simple route
app.get('/', async (req, res) => {
  try {
    // Use pool.query for automatic connection handling
    const result = await pool.query('SELECT NOW()');
    res.send(`Hello, Express! DB connected. Current time from DB: ${result.rows[0].now}`);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).send('Error connecting to database');
  }
});

// Mount routes at /api
app.use('/api', authRoutes);
app.use('/api', loginRoutes);

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('drawing', (data) => {
    console.log('Received drawing data:', data);
    socket.broadcast.emit('drawing', data);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// --- Server Startup ---
// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
