// backend/index.js

const express = require('express');
const cors = require('cors');
const { Server } = require("socket.io");
const http = require('http');
const authRoutes = require('./routes/auth');
const loginRoutes = require('./routes/login');
const { pool } = require('./db');

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
(async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connection established');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
})();

// --- Routes ---
// Define a simple route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MicroTutor API Server Running', 
    status: 'success',
    features: ['Authentication', 'Whiteboard', 'Real-time Chat', 'Session Management']
  });
});

// Mount routes at /api
app.use('/api', authRoutes);
app.use('/api', loginRoutes);

// Import and mount queries route
const { router: queriesRoutes, setIO } = require('./routes/queries');
app.use('/api/queries', queriesRoutes);

// Import and mount password reset routes
const passwordResetRoutes = require('./routes/passwordReset');
app.use('/api/auth', passwordResetRoutes);

// Set up Socket.IO for queries
setIO(io);

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Handle drawing events scoped to session rooms
  socket.on('drawing', (data) => {
    if (!data || !data.sessionId || !data.payload) {
      return;
    }

    const { sessionId, payload } = data;
    console.log(`Received drawing data for session ${sessionId}`);
    socket.to(`session-${sessionId}`).emit('drawing', payload);
  });
  
  // Handle chat messages
  socket.on('message', (data) => {
    console.log('Received message:', data);
    socket.broadcast.emit('message', data);
  });
  
  // Handle query notifications
  socket.on('join-tutor-room', (tutorId) => {
    socket.join(`tutor-${tutorId}`);
    console.log(`Tutor ${tutorId} joined their room`);
  });
  
  socket.on('join-student-room', (studentId) => {
    socket.join(`student-${studentId}`);
    console.log(`Student ${studentId} joined their room`);
  });

  socket.on('leave-tutor-room', (tutorId) => {
    socket.leave(`tutor-${tutorId}`);
    console.log(`Tutor ${tutorId} left their room`);
  });

  socket.on('leave-student-room', (studentId) => {
    socket.leave(`student-${studentId}`);
    console.log(`Student ${studentId} left their room`);
  });
  
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`User joined session ${sessionId}`);
  });

  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`User left session ${sessionId}`);
  });
  
  socket.on('session-message', (data) => {
    console.log('Session message:', data);
    socket.to(`session-${data.sessionId}`).emit('session-message', data.message);
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Function to notify tutors about new queries
const notifyTutors = (query) => {
  io.emit('new-query', query);
  console.log('Notified all tutors about new query:', query.id);
};

// Function to notify student about accepted query
const notifyStudent = (studentId, tutorInfo) => {
  io.to(`student-${studentId}`).emit('tutor-accepted', tutorInfo);
  console.log('Notified student about tutor acceptance');
};

// Export functions for use in routes
module.exports = { notifyTutors, notifyStudent };

// --- Server Startup ---
// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
