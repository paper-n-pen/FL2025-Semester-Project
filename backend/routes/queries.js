// backend/routes/queries.js

const express = require('express');
const { addUser, findUserByEmail, getAllUsers } = require('../storage');

const router = express.Router();

// Get the io instance from the main app
let io;
const setIO = (socketIO) => {
  io = socketIO;
};

// In-memory storage for queries and sessions
const queries = [];
const sessions = [];

// Post a new query
router.post('/post', (req, res) => {
  const { subject, subtopic, query, studentId } = req.body;
  
  if (!subject || !subtopic || !query || !studentId) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const newQuery = {
    id: Date.now().toString(),
    subject,
    subtopic,
    query,
    studentId,
    timestamp: new Date(),
    status: 'pending',
    acceptedTutors: []
  };

  queries.push(newQuery);
  console.log('New query posted:', { subject, subtopic, studentId });

  // Emit real-time notification to all tutors
  if (io) {
    io.emit('new-query', {
      id: newQuery.id,
      subject,
      subtopic,
      query,
      studentId,
      timestamp: newQuery.timestamp
    });
  }

  res.status(201).json({ 
    message: 'Query posted successfully',
    queryId: newQuery.id 
  });
});

// Get queries for tutors (filtered by specialty)
router.get('/tutor/:tutorId', (req, res) => {
  const { tutorId } = req.params;
  
  // Find tutor to get their specialties
  const tutor = getAllUsers().find(u => u.id.toString() === tutorId);
  if (!tutor) {
    return res.status(404).json({ message: 'Tutor not found' });
  }

  // Filter queries by tutor's specialties - only show pending queries that this tutor hasn't accepted
  const relevantQueries = queries.filter(q => {
    if (q.status !== 'pending') return false;
    
    // Don't show queries that this tutor has already accepted
    if (q.acceptedTutorId === tutorId) return false;
    
    // If tutor has no specialties, show all pending queries
    if (!tutor.specialties || tutor.specialties.length === 0) return true;
    
    // Check if query subtopic matches any of tutor's specialties
    return tutor.specialties.includes(q.subtopic);
  });

  // Add student names to queries
  const queriesWithStudentNames = relevantQueries.map(query => {
    const student = getAllUsers().find(u => u.id.toString() === query.studentId);
    return {
      ...query,
      studentName: student ? student.username : 'Unknown Student'
    };
  });

  res.json(queriesWithStudentNames);
});

// Accept a query
router.post('/accept', (req, res) => {
  const { queryId, tutorId } = req.body;
  
  const query = queries.find(q => q.id === queryId);
  if (!query) {
    return res.status(404).json({ message: 'Query not found' });
  }

  const tutor = getAllUsers().find(u => u.id.toString() === tutorId);
  if (!tutor) {
    return res.status(404).json({ message: 'Tutor not found' });
  }

  // Update query status to accepted
  query.status = 'accepted';
  query.acceptedTutorId = tutorId;
  query.acceptedTutorName = tutor.username;
  query.acceptedTutorRate = tutor.ratePer10Min;

  console.log('Tutor accepted query:', { queryId, tutorId });

  // Emit notification to student
  if (io) {
    io.to(`student-${query.studentId}`).emit('tutor-accepted', {
      queryId,
      tutorName: tutor.username,
      rate: tutor.ratePer10Min,
      bio: tutor.bio,
      education: tutor.education
    });
  }

  res.json({ message: 'Query accepted successfully' });
});

// Get all queries (for testing)
router.get('/all', (req, res) => {
  res.json(queries);
});

// Create a session
router.post('/session', (req, res) => {
  const { queryId, tutorId, studentId } = req.body;
  
  const query = queries.find(q => q.id === queryId);
  if (!query) {
    return res.status(404).json({ message: 'Query not found' });
  }

  const session = {
    id: Date.now().toString(),
    queryId,
    tutorId,
    studentId,
    startTime: new Date(),
    status: 'active'
  };

  sessions.push(session);
  
  // Update query status
  query.status = 'in-session';

  console.log('Session created:', session);

  res.status(201).json({ 
    message: 'Session created successfully',
    sessionId: session.id 
  });
});

// Update tutor profile
router.put('/profile', (req, res) => {
  const { userId, bio, education, specialties, ratePer10Min } = req.body;
  
  const user = getAllUsers().find(u => u.id.toString() === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Update user profile
  user.bio = bio;
  user.education = education;
  user.specialties = specialties;
  user.ratePer10Min = ratePer10Min;

  console.log('Tutor profile updated:', { userId, bio, education, specialties, ratePer10Min });

  res.json({ message: 'Profile updated successfully' });
});

module.exports = { router, setIO };
