// backend/routes/login.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail } = require('../storage');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('POST /login endpoint hit');
  console.log('Request body:', req.body);

  try {
    const user = await findUserByEmail(email);

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
    const userType = user.user_type || 'student';
    console.log('User logged in:', { username: user.username, email, userType });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        userType,
        bio: user.bio,
        education: user.education,
        specialties: user.specialties || [],
        ratePer10Min: user.rate_per_10_min !== null && user.rate_per_10_min !== undefined
          ? Number(user.rate_per_10_min)
          : null
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
