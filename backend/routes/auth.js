// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

// Registration endpoint
router.post('/register', async (req, res) => {
  console.log('POST /register endpoint hit');
  const {
    username,
    email,
    password,
    userType,
    bio,
    education,
    specialties,
    ratePer10Min
  } = req.body;

  if (!username || !email || !password) {
    console.log('Registration failed: username, email, and password are required');
    return res.status(400).json({ message: 'username, email, and password are required' });
  }

  const normalizedUserType = (userType || 'student').toLowerCase() === 'tutor' ? 'tutor' : 'student';

  if (normalizedUserType === 'tutor') {
    if (!bio || !education) {
      return res.status(400).json({ message: 'Tutor profile requires bio and education information' });
    }

    if (!Array.isArray(specialties) || specialties.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one specialty for tutor registration' });
    }

    if (ratePer10Min === undefined || ratePer10Min === null || Number(ratePer10Min) <= 0) {
      return res.status(400).json({ message: 'Tutor profile requires a positive ratePer10Min value' });
    }
  }

  try {
    console.log(`Checking if user with email ${email} already exists.`);
    const existingUser = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log(`User with email ${email} already exists.`);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('User not found, proceeding with registration. Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    const tutorBio = normalizedUserType === 'tutor' ? bio : null;
    const tutorEducation = normalizedUserType === 'tutor' ? education : null;
    const tutorSpecialties = normalizedUserType === 'tutor' ? specialties : [];
    const tutorRate = normalizedUserType === 'tutor' ? Number(ratePer10Min) : null;

    console.log('Password hashed. Inserting new user into database...');
    const insertResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, user_type, bio, education, specialties, rate_per_10_min)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, user_type, bio, education, specialties, rate_per_10_min, created_at`,
      [
        username,
        email,
        passwordHash,
        normalizedUserType,
        tutorBio,
        tutorEducation,
        tutorSpecialties,
        tutorRate
      ]
    );

    const newUser = insertResult.rows[0];

    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log('User registered successfully');
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        userType: newUser.user_type,
        bio: newUser.bio,
        education: newUser.education,
        specialties: newUser.specialties || [],
        ratePer10Min: newUser.rate_per_10_min !== null ? Number(newUser.rate_per_10_min) : null,
        createdAt: newUser.created_at
      }
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
