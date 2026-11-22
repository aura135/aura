const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// 1. Get recent command history
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM command_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    return res.json({ success: true, history: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Log spoken command execution
router.post('/', async (req, res) => {
  try {
    const { raw_text, action, language = 'en', success = true, response_text = '' } = req.body;
    if (!raw_text || !action) {
      return res.status(400).json({ success: false, message: 'raw_text and action are required.' });
    }

    const result = await db.query(
      `INSERT INTO command_history (user_id, raw_text, action, language, success, response_text)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, raw_text, action, language, success, response_text]
    );

    return res.status(201).json({ success: true, entry: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
