const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// 1. Get all preferences for current user
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT pref_key, pref_value FROM user_preferences WHERE user_id = $1', [req.userId]);
    const prefs = {};
    result.rows.forEach(r => {
      prefs[r.pref_key] = r.pref_value;
    });
    return res.json({ success: true, preferences: prefs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Set or update a preference
router.put('/', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: 'Preference key is required.' });
    }

    await db.query(
      `INSERT INTO user_preferences (user_id, pref_key, pref_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, pref_key)
       DO UPDATE SET pref_value = EXCLUDED.pref_value, updated_at = CURRENT_TIMESTAMP`,
      [req.userId, key, String(value)]
    );

    return res.json({ success: true, message: `Preference '${key}' updated.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
