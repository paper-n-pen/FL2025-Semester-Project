// backend/routes/posts.js

const express = require('express');
const { pool } = require('../db');
const authenticate = require('../middleware/authenticate'); // middleware to verify JWT

const router = express.Router();

// Create a post (protected)
router.post('/posts', authenticate, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id; // set by authenticate middleware

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, content]
    );
    res.status(201).json({ message: 'Post created', post: result.rows[0] });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
