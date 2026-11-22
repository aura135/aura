const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// 1. Get all alarms
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM alarms WHERE user_id = $1 ORDER BY hour ASC, minute ASC', [req.userId]);
    return res.json({ success: true, alarms: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create alarm
router.post('/', async (req, res) => {
  try {
    const { hour, minute, label = 'AURA Alarm', days_of_week = 'DAILY' } = req.body;
    if (hour === undefined || minute === undefined) {
      return res.status(400).json({ success: false, message: 'Hour and minute are required.' });
    }

    const result = await db.query(
      'INSERT INTO alarms (user_id, hour, minute, label, days_of_week) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, hour, minute, label, days_of_week]
    );

    return res.status(201).json({ success: true, alarm: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Toggle alarm enable/disable
router.patch('/:id/toggle', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE alarms SET is_enabled = NOT is_enabled WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alarm not found.' });
    }
    return res.json({ success: true, alarm: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Delete alarm
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM alarms WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    return res.json({ success: true, message: 'Alarm deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
