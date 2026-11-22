const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

// Helper to determine effective user ID (authenticated user, or fallback default user 1)
function getEffectiveUserId(req) {
  return req.userId || 1;
}

// 1. Sync Notes & Ordered Points (Preserving existing Android API)
router.post('/notes', async (req, res) => {
  try {
    const { notes } = req.body;
    if (!Array.isArray(notes)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: notes array required' });
    }

    const userId = getEffectiveUserId(req);
    let syncedCount = 0;

    for (const note of notes) {
      const title = note.title || 'Synced Note';
      const category = note.category || 'General';
      const noteResult = await db.query(
        'INSERT INTO notes (user_id, title, category) VALUES ($1, $2, $3) RETURNING id',
        [userId, title, category]
      );
      const noteId = noteResult.rows[0]?.id;

      if (noteId && Array.isArray(note.points)) {
        for (let i = 0; i < note.points.length; i++) {
          const pt = note.points[i];
          const text = typeof pt === 'string' ? pt : pt.pointText || pt.point_text || '';
          if (text.trim().length > 0) {
            await db.query(
              'INSERT INTO note_points (note_id, user_id, point_text, point_order) VALUES ($1, $2, $3, $4)',
              [noteId, userId, text.trim(), i + 1]
            );
          }
        }
      }
      syncedCount++;
    }

    return res.json({
      success: true,
      syncedCount,
      timestamp: Date.now()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Sync Reminders & Free-Time Reminders (Preserving existing Android API)
router.post('/reminders', async (req, res) => {
  try {
    const { reminders } = req.body;
    if (!Array.isArray(reminders)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: reminders array required' });
    }

    const userId = getEffectiveUserId(req);
    let syncedCount = 0;

    for (const rem of reminders) {
      await db.query(
        `INSERT INTO reminders (user_id, title, reminder_time, repeat_type, is_free_time, free_time_start, free_time_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          rem.title || 'Reminder',
          rem.reminderTime || rem.reminder_time || Date.now() + 3600000,
          rem.repeatType || rem.repeat_type || 'NONE',
          Boolean(rem.isFreeTime || rem.is_free_time),
          rem.freeTimeStart || rem.free_time_start || '',
          rem.freeTimeEnd || rem.free_time_end || ''
        ]
      );
      syncedCount++;
    }

    return res.json({
      success: true,
      syncedCount,
      timestamp: Date.now()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Sync Tasks (Preserving existing Android API)
router.post('/tasks', async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: tasks array required' });
    }

    const userId = getEffectiveUserId(req);
    let syncedCount = 0;

    for (const t of tasks) {
      await db.query(
        'INSERT INTO tasks (user_id, title, description, due_date) VALUES ($1, $2, $3, $4)',
        [userId, t.title || 'Task', t.description || '', t.dueDate || t.due_date || null]
      );
      syncedCount++;
    }

    return res.json({
      success: true,
      syncedCount,
      timestamp: Date.now()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Unified Push API (Notes, Reminders, Tasks in a single transaction)
router.post('/push', async (req, res) => {
  try {
    const { notes = [], reminders = [], tasks = [] } = req.body;
    const userId = getEffectiveUserId(req);

    let notesCount = 0;
    for (const note of notes) {
      const noteResult = await db.query(
        'INSERT INTO notes (user_id, title, category) VALUES ($1, $2, $3) RETURNING id',
        [userId, note.title || 'Note', note.category || 'General']
      );
      const noteId = noteResult.rows[0]?.id;
      if (noteId && Array.isArray(note.points)) {
        for (let i = 0; i < note.points.length; i++) {
          const pt = note.points[i];
          const text = typeof pt === 'string' ? pt : pt.pointText || pt.point_text || '';
          if (text.trim().length > 0) {
            await db.query(
              'INSERT INTO note_points (note_id, user_id, point_text, point_order) VALUES ($1, $2, $3, $4)',
              [noteId, userId, text.trim(), i + 1]
            );
          }
        }
      }
      notesCount++;
    }

    let remindersCount = 0;
    for (const rem of reminders) {
      await db.query(
        `INSERT INTO reminders (user_id, title, reminder_time, repeat_type, is_free_time, free_time_start, free_time_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          rem.title || 'Reminder',
          rem.reminderTime || rem.reminder_time || Date.now() + 3600000,
          rem.repeatType || rem.repeat_type || 'NONE',
          Boolean(rem.isFreeTime || rem.is_free_time),
          rem.freeTimeStart || rem.free_time_start || '',
          rem.freeTimeEnd || rem.free_time_end || ''
        ]
      );
      remindersCount++;
    }

    let tasksCount = 0;
    for (const t of tasks) {
      await db.query(
        'INSERT INTO tasks (user_id, title, description, due_date) VALUES ($1, $2, $3, $4)',
        [userId, t.title || 'Task', t.description || '', t.dueDate || t.due_date || null]
      );
      tasksCount++;
    }

    return res.json({
      success: true,
      message: 'Unified synchronization complete',
      counts: { notes: notesCount, reminders: remindersCount, tasks: tasksCount },
      timestamp: Date.now()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Pull all synced data for device restore (Preserving existing Android API)
router.get('/pull', async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);

    const notesRes = await db.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const notes = notesRes.rows;
    if (db.isPostgres()) {
      for (const n of notes) {
        const pts = await db.query('SELECT * FROM note_points WHERE note_id = $1 ORDER BY point_order ASC', [n.id]);
        n.points = pts.rows;
      }
    }

    const remindersRes = await db.query('SELECT * FROM reminders WHERE user_id = $1 ORDER BY reminder_time ASC', [userId]);
    const tasksRes = await db.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    return res.json({
      success: true,
      notes,
      reminders: remindersRes.rows,
      tasks: tasksRes.rows,
      syncTimestamp: Date.now()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
