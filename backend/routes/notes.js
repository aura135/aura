const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validateNote } = require('../middleware/validator');

router.use(authMiddleware);

// 1. Get all notes for current user with their ordered points
router.get('/', async (req, res) => {
  try {
    const notesResult = await db.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    const notes = notesResult.rows;

    // If using postgres, query note_points for these notes
    if (db.isPostgres()) {
      for (const note of notes) {
        const pointsResult = await db.query('SELECT * FROM note_points WHERE note_id = $1 ORDER BY point_order ASC', [note.id]);
        note.points = pointsResult.rows;
      }
    }

    return res.json({ success: true, notes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create note with optional ordered points
router.post('/', validateNote, async (req, res) => {
  try {
    const { title, category = 'General', points = [] } = req.body;

    const noteResult = await db.query(
      'INSERT INTO notes (user_id, title, category) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, title, category]
    );
    const note = noteResult.rows[0];

    const savedPoints = [];
    if (Array.isArray(points)) {
      for (let i = 0; i < points.length; i++) {
        const ptText = typeof points[i] === 'string' ? points[i] : points[i].point_text || '';
        if (ptText.trim().length > 0) {
          const ptResult = await db.query(
            'INSERT INTO note_points (note_id, user_id, point_text, point_order) VALUES ($1, $2, $3, $4) RETURNING *',
            [note.id, req.userId, ptText.trim(), i + 1]
          );
          savedPoints.push(ptResult.rows[0]);
        }
      }
    }

    note.points = savedPoints;
    return res.status(201).json({ success: true, note });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Get single note by id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    const note = result.rows[0];
    if (db.isPostgres()) {
      const points = await db.query('SELECT * FROM note_points WHERE note_id = $1 ORDER BY point_order ASC', [note.id]);
      note.points = points.rows;
    }
    return res.json({ success: true, note });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Delete note and all ordered points
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    return res.json({ success: true, message: 'Note deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Add ordered point to existing note
router.post('/:id/points', async (req, res) => {
  try {
    const { point_text, point_order } = req.body;
    if (!point_text || point_text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Point text is required.' });
    }

    const order = point_order || 1;
    const result = await db.query(
      'INSERT INTO note_points (note_id, user_id, point_text, point_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.userId, point_text.trim(), order]
    );

    return res.status(201).json({ success: true, point: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
