// backend/routes/posts.js

const express = require('express');
const { pool } = require('../db');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

/* -----------------------------------------------
   POST /api/posts   →  Create a new post
------------------------------------------------- */
router.post('/posts', authenticate, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const result = await pool.query(
      `
      WITH ins AS (
        INSERT INTO posts (user_id, title, content)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, title, content, created_at
      )
      SELECT ins.id, ins.title, ins.content, ins.created_at, u.username
      FROM ins
      JOIN users u ON u.id = ins.user_id
      `,
      [userId, title, content]
    );

    res.status(201).json({ message: 'Post created', post: result.rows[0] });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* -----------------------------------------------
   GET /api/posts   →  Fetch all posts (public)
------------------------------------------------- */
router.get('/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT posts.id, posts.title, posts.content, posts.created_at, users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
