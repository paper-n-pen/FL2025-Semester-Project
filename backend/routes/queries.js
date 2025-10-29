// backend/routes/queries.js

const express = require('express');
const { pool } = require('../db');

const router = express.Router();

let io;
const setIO = (socketIO) => {
  io = socketIO;
};

const mapQueryRow = (row, overrides = {}) => ({
  id: row.id.toString(),
  subject: row.subject,
  subtopic: row.subtopic,
  query: row.query_text,
  studentId: row.student_id,
  studentName: row.student_name,
  status: row.status,
  timestamp: row.created_at,
  acceptedTutorId: row.accepted_tutor_id ? row.accepted_tutor_id.toString() : null,
  ...overrides
});

router.post('/post', async (req, res) => {
  const { subject, subtopic, query, studentId } = req.body;

  if (!subject || !subtopic || !query || !studentId) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const studentIdNumber = Number(studentId);
  if (!Number.isInteger(studentIdNumber)) {
    return res.status(400).json({ message: 'Invalid studentId' });
  }

  try {
    const studentResult = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [studentIdNumber]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const trimmedQuery = query.trim();
    const insertResult = await pool.query(
      `INSERT INTO queries (subject, subtopic, query_text, student_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, subject, subtopic, query_text, student_id, status, created_at`,
      [subject, subtopic, trimmedQuery, studentIdNumber]
    );

    const newQuery = insertResult.rows[0];
    const notificationPayload = {
      id: newQuery.id.toString(),
      subject: newQuery.subject,
      subtopic: newQuery.subtopic,
      query: newQuery.query_text,
      studentId: studentIdNumber.toString(),
      studentName: studentResult.rows[0].username,
      timestamp: newQuery.created_at
    };

    console.log('New query posted:', {
      subject: newQuery.subject,
      subtopic: newQuery.subtopic,
      studentId: studentIdNumber
    });

    if (io) {
      io.emit('new-query', notificationPayload);
    }

    res.status(201).json({
      message: 'Query posted successfully',
      queryId: newQuery.id.toString()
    });
  } catch (error) {
    console.error('Error posting query:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/tutor/:tutorId', async (req, res) => {
  const tutorId = Number(req.params.tutorId);

  if (!Number.isInteger(tutorId)) {
    return res.status(400).json({ message: 'Invalid tutorId' });
  }

  try {
    const tutorResult = await pool.query(
      `SELECT id, user_type, specialties, rate_per_10_min
       FROM users
       WHERE id = $1`,
      [tutorId]
    );

    if (tutorResult.rows.length === 0 || tutorResult.rows[0].user_type !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const tutorRow = tutorResult.rows[0];
    const tutorSpecialties = Array.isArray(tutorRow.specialties) ? tutorRow.specialties : [];

    const queryParams = [tutorId];
    let queryText = `SELECT q.id, q.subject, q.subtopic, q.query_text, q.student_id, q.status, q.created_at,
                            q.accepted_tutor_id, s.username AS student_name
                     FROM queries q
                     JOIN users s ON s.id = q.student_id
                     WHERE q.status = 'pending'
                       AND NOT EXISTS (
                         SELECT 1
                         FROM query_declines d
                         WHERE d.query_id = q.id AND d.tutor_id = $1
                       )`;

    if (tutorSpecialties.length > 0) {
      queryParams.push(tutorSpecialties);
      queryText += ` AND q.subtopic = ANY($${queryParams.length}::text[])`;
    }

    queryText += ' ORDER BY q.created_at DESC';

    const queriesResult = await pool.query(queryText, queryParams);

    const rate = tutorRow.rate_per_10_min !== null && tutorRow.rate_per_10_min !== undefined
      ? Number(tutorRow.rate_per_10_min)
      : null;

    const serializedQueries = queriesResult.rows.map((row) =>
      mapQueryRow(row, { rate })
    );

    res.json(serializedQueries);
  } catch (error) {
    console.error('Error fetching tutor queries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/tutor/:tutorId/accepted-queries', async (req, res) => {
  const tutorId = Number(req.params.tutorId);

  if (!Number.isInteger(tutorId)) {
    return res.status(400).json({ message: 'Invalid tutorId' });
  }

  try {
    const tutorResult = await pool.query(
      `SELECT id, user_type, rate_per_10_min
       FROM users
       WHERE id = $1`,
      [tutorId]
    );

    if (tutorResult.rows.length === 0 || tutorResult.rows[0].user_type !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const tutorRow = tutorResult.rows[0];
    const rate = tutorRow.rate_per_10_min !== null && tutorRow.rate_per_10_min !== undefined
      ? Number(tutorRow.rate_per_10_min)
      : null;

    const queriesResult = await pool.query(
      `SELECT q.id,
              q.subject,
              q.subtopic,
              q.query_text,
              q.student_id,
              q.status,
              q.created_at,
              q.updated_at,
              s.username AS student_name,
              latest_session.id AS session_id,
              latest_session.status AS session_status
       FROM queries q
       JOIN users s ON s.id = q.student_id
       LEFT JOIN LATERAL (
         SELECT id, status
         FROM sessions
         WHERE query_id = q.id
         ORDER BY start_time DESC
         LIMIT 1
       ) latest_session ON TRUE
       WHERE q.accepted_tutor_id = $1
         AND q.status IN ('accepted', 'in-session')
       ORDER BY COALESCE(q.updated_at, q.created_at) DESC`,
      [tutorId]
    );

    const acceptedQueries = queriesResult.rows.map((row) =>
      mapQueryRow(row, {
        sessionId: row.session_id ? row.session_id.toString() : null,
        sessionStatus: row.session_status || null,
        rate
      })
    );

    res.json(acceptedQueries);
  } catch (error) {
    console.error('Error fetching accepted tutor queries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/accept', async (req, res) => {
  const { queryId, tutorId } = req.body;

  const queryIdNumber = Number(queryId);
  const tutorIdNumber = Number(tutorId);

  if (!Number.isInteger(queryIdNumber) || !Number.isInteger(tutorIdNumber)) {
    return res.status(400).json({ message: 'Invalid queryId or tutorId' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const queryResult = await client.query(
      `SELECT id, student_id, status
       FROM queries
       WHERE id = $1
       FOR UPDATE`,
      [queryIdNumber]
    );

    if (queryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Query not found' });
    }

    const queryRow = queryResult.rows[0];
    if (queryRow.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Query is no longer available' });
    }

    const tutorResult = await client.query(
      `SELECT id, user_type, username, bio, education, rate_per_10_min
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [tutorIdNumber]
    );

    if (tutorResult.rows.length === 0 || tutorResult.rows[0].user_type !== 'tutor') {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const tutorRow = tutorResult.rows[0];

    await client.query(
      `UPDATE queries
       SET status = 'accepted',
           accepted_tutor_id = $2,
           accepted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [queryIdNumber, tutorIdNumber]
    );

    await client.query(
      `DELETE FROM query_declines
       WHERE query_id = $1 AND tutor_id = $2`,
      [queryIdNumber, tutorIdNumber]
    );

    await client.query('COMMIT');

    console.log('Tutor accepted query:', { queryId: queryIdNumber, tutorId: tutorIdNumber });

    if (io) {
      io.to(`student-${queryRow.student_id}`).emit('tutor-accepted', {
        queryId: queryIdNumber.toString(),
        tutorName: tutorRow.username,
        rate: tutorRow.rate_per_10_min !== null && tutorRow.rate_per_10_min !== undefined
          ? Number(tutorRow.rate_per_10_min)
          : null,
        bio: tutorRow.bio,
        education: tutorRow.education
      });
    }

    res.json({ message: 'Query accepted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting query:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/decline', async (req, res) => {
  const { queryId, tutorId } = req.body;

  const queryIdNumber = Number(queryId);
  const tutorIdNumber = Number(tutorId);

  if (!Number.isInteger(queryIdNumber) || !Number.isInteger(tutorIdNumber)) {
    return res.status(400).json({ message: 'Invalid queryId or tutorId' });
  }

  try {
    await pool.query(
      `INSERT INTO query_declines (query_id, tutor_id)
       VALUES ($1, $2)
       ON CONFLICT (query_id, tutor_id) DO UPDATE
       SET created_at = CURRENT_TIMESTAMP`,
      [queryIdNumber, tutorIdNumber]
    );

    res.json({ message: 'Query declined successfully' });
  } catch (error) {
    console.error('Error declining query:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.id, q.subject, q.subtopic, q.query_text, q.student_id, q.status, q.created_at,
              q.accepted_tutor_id, s.username AS student_name
       FROM queries q
       JOIN users s ON s.id = q.student_id
       ORDER BY q.created_at DESC`
    );

    const allQueries = result.rows.map((row) => mapQueryRow(row));
    res.json(allQueries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/session', async (req, res) => {
  const { queryId, tutorId, studentId } = req.body;

  const queryIdNumber = Number(queryId);
  const tutorIdNumber = Number(tutorId);
  const studentIdNumber = Number(studentId);

  if (
    !Number.isInteger(queryIdNumber) ||
    !Number.isInteger(tutorIdNumber) ||
    !Number.isInteger(studentIdNumber)
  ) {
    return res.status(400).json({ message: 'Invalid identifiers provided' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const queryResult = await client.query(
      'SELECT id, status FROM queries WHERE id = $1 FOR UPDATE',
      [queryIdNumber]
    );

    if (queryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Query not found' });
    }

    const existingSessionResult = await client.query(
      `SELECT id, status
       FROM sessions
       WHERE query_id = $1
       ORDER BY start_time DESC
       LIMIT 1`,
      [queryIdNumber]
    );

    if (existingSessionResult.rows.length > 0) {
      const existingSession = existingSessionResult.rows[0];
      if (existingSession.status !== 'ended') {
        await client.query('COMMIT');
        return res.status(200).json({
          message: 'Session already active',
          sessionId: existingSession.id.toString()
        });
      }
    }

    const sessionResult = await client.query(
      `INSERT INTO sessions (query_id, tutor_id, student_id)
       VALUES ($1, $2, $3)
       RETURNING id, start_time`,
      [queryIdNumber, tutorIdNumber, studentIdNumber]
    );

    await client.query(
      `UPDATE queries
       SET status = 'in-session',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [queryIdNumber]
    );

    await client.query('COMMIT');

    console.log('Session created:', {
      queryId: queryIdNumber,
      tutorId: tutorIdNumber,
      studentId: studentIdNumber
    });

    res.status(201).json({
      message: 'Session created successfully',
      sessionId: sessionResult.rows[0].id.toString()
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/session/end', async (req, res) => {
  const { sessionId, endedBy } = req.body;

  const sessionIdNumber = Number(sessionId);
  const endedByNumber = Number(endedBy);

  if (!Number.isInteger(sessionIdNumber) || !Number.isInteger(endedByNumber)) {
    return res.status(400).json({ message: 'Invalid sessionId or endedBy' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `SELECT id, query_id, status
       FROM sessions
       WHERE id = $1
       FOR UPDATE`,
      [sessionIdNumber]
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Session not found' });
    }

    const sessionRow = sessionResult.rows[0];

    const queryInfoResult = await client.query(
      `SELECT id, student_id, accepted_tutor_id
       FROM queries
       WHERE id = $1`,
      [sessionRow.query_id]
    );

    const queryInfo = queryInfoResult.rows[0] || null;

    if (sessionRow.status === 'ended') {
      await client.query('ROLLBACK');
      return res.json({ message: 'Session already ended' });
    }

    await client.query(
      `UPDATE sessions
       SET status = 'ended'
       WHERE id = $1`,
      [sessionIdNumber]
    );

    await client.query(
      `UPDATE queries
       SET status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sessionRow.query_id]
    );

    await client.query('COMMIT');

    if (io) {
      const payload = {
        sessionId: sessionIdNumber.toString(),
        endedBy: endedByNumber.toString(),
        queryId: sessionRow.query_id ? sessionRow.query_id.toString() : null,
        tutorId: queryInfo?.accepted_tutor_id ? queryInfo.accepted_tutor_id.toString() : null,
        studentId: queryInfo?.student_id ? queryInfo.student_id.toString() : null
      };

      io.to(`session-${sessionIdNumber}`).emit('session-ended', payload);

      if (queryInfo?.accepted_tutor_id) {
        io.to(`tutor-${queryInfo.accepted_tutor_id}`).emit('session-ended', payload);
      }

      if (queryInfo?.student_id) {
        io.to(`student-${queryInfo.student_id}`).emit('session-ended', payload);
      }
    }

    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.get('/student/:studentId/responses', async (req, res) => {
  const studentId = Number(req.params.studentId);

  if (!Number.isInteger(studentId)) {
    return res.status(400).json({ message: 'Invalid studentId' });
  }

  try {
    const result = await pool.query(
      `SELECT q.id,
              q.subject,
              q.subtopic,
              q.query_text,
              q.status,
              q.created_at,
              q.updated_at,
              t.id AS tutor_id,
              t.username AS tutor_name,
              t.bio AS tutor_bio,
              t.education AS tutor_education,
              t.rate_per_10_min,
              s.id AS session_id,
              s.status AS session_status
       FROM queries q
       JOIN users t ON t.id = q.accepted_tutor_id
       LEFT JOIN LATERAL (
         SELECT id, status
         FROM sessions
         WHERE query_id = q.id
         ORDER BY start_time DESC
         LIMIT 1
       ) s ON TRUE
       WHERE q.student_id = $1
         AND q.accepted_tutor_id IS NOT NULL
       ORDER BY COALESCE(q.updated_at, q.created_at) DESC`,
      [studentId]
    );

    const responses = result.rows.map((row) => ({
      queryId: row.id.toString(),
      subject: row.subject,
      subtopic: row.subtopic,
      query: row.query_text,
      status: row.status,
      tutorId: row.tutor_id,
      tutorName: row.tutor_name,
      rate: row.rate_per_10_min !== null && row.rate_per_10_min !== undefined
        ? Number(row.rate_per_10_min)
        : null,
      bio: row.tutor_bio,
      education: row.tutor_education,
      sessionId: row.session_id ? row.session_id.toString() : null,
      sessionStatus: row.session_status || null,
      updatedAt: row.updated_at,
      createdAt: row.created_at
    }));

    res.json(responses);
  } catch (error) {
    console.error('Error fetching student responses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', async (req, res) => {
  const { userId, bio, education, specialties, ratePer10Min } = req.body;

  const userIdNumber = Number(userId);
  if (!Number.isInteger(userIdNumber)) {
    return res.status(400).json({ message: 'Invalid userId' });
  }

  const sanitizedSpecialties = Array.isArray(specialties) ? specialties : [];
  const sanitizedRate = ratePer10Min !== null && ratePer10Min !== undefined
    ? Number(ratePer10Min)
    : null;

  if (sanitizedRate !== null) {
    if (Number.isNaN(sanitizedRate)) {
      return res.status(400).json({ message: 'ratePer10Min must be a valid number' });
    }

    if (sanitizedRate < 0) {
      return res.status(400).json({ message: 'ratePer10Min must be non-negative' });
    }
  }

  try {
    const updateResult = await pool.query(
      `UPDATE users
       SET bio = $2,
           education = $3,
           specialties = $4,
           rate_per_10_min = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_type = 'tutor'
       RETURNING id`,
      [
        userIdNumber,
        bio || null,
        education || null,
        sanitizedSpecialties,
        sanitizedRate
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Tutor profile updated:', {
      userId: userIdNumber,
      bio,
      education,
      specialties: sanitizedSpecialties,
      ratePer10Min: sanitizedRate
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating tutor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, setIO };
