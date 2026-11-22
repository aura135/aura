const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validateTask } = require('../middleware/validator');

router.use(authMiddleware);

// 1. Get all tasks
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    return res.json({ success: true, tasks: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Add task
router.post('/', validateTask, async (req, res) => {
  try {
    const { title, description = '', due_date = null } = req.body;
    const result = await db.query(
      'INSERT INTO tasks (user_id, title, description, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, title.trim(), description, due_date]
    );
    return res.status(201).json({ success: true, task: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Toggle task completion
router.patch('/:id/complete', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE tasks SET is_completed = NOT is_completed WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    return res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Delete task
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    return res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
