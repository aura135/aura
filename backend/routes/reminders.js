const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validateReminder } = require('../middleware/validator');

router.use(authMiddleware);

// 1. Get all reminders for current user
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reminders WHERE user_id = $1 ORDER BY reminder_time ASC', [req.userId]);
    return res.json({ success: true, reminders: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create reminder (with exact time or free-time window)
router.post('/', validateReminder, async (req, res) => {
  try {
    const {
      title,
      reminder_time,
      repeat_type = 'NONE',
      is_free_time = false,
      free_time_start = '',
      free_time_end = ''
    } = req.body;

    const result = await db.query(
      `INSERT INTO reminders (user_id, title, reminder_time, repeat_type, is_free_time, free_time_start, free_time_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, title.trim(), reminder_time, repeat_type, is_free_time, free_time_start, free_time_end]
    );

    return res.status(201).json({ success: true, reminder: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Toggle reminder completion
router.patch('/:id/complete', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE reminders SET is_completed = NOT is_completed WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }
    return res.json({ success: true, reminder: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reminders WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    return res.json({ success: true, message: 'Reminder deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
