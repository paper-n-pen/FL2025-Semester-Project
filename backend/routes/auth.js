// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const router = express.Router();

// Registration endpoint
router.post('/register', async (req, res) => {
  const { username, email, password, userType, bio, education, specialties, ratePer10Min } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(), // Use timestamp for unique ID
      username,
      email,
      password_hash: passwordHash,
      userType: userType || 'student',
      bio: bio || '',
      education: education || '',
      specialties: specialties || [],
      ratePer10Min: ratePer10Min || 0
    };
    
    addUser(newUser);
    console.log('User registered:', { username, email, userType });

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: newUser.id,
      user: newUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
