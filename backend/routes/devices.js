const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// 1. Get user's registered devices
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM devices WHERE user_id = $1 ORDER BY last_active DESC', [req.userId]);
    return res.json({ success: true, devices: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Register or update device
router.post('/register', async (req, res) => {
  try {
    const { device_name, device_type, push_token = '', user_agent = '' } = req.body;
    if (!device_name || !device_type) {
      return res.status(400).json({ success: false, message: 'Device name and type are required.' });
    }

    const result = await db.query(
      'INSERT INTO devices (user_id, device_name, device_type, push_token, user_agent) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, device_name, device_type, push_token, user_agent]
    );

    return res.status(201).json({ success: true, device: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Unregister device
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM devices WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    return res.json({ success: true, message: 'Device unregistered.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
