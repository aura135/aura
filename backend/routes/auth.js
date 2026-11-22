const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

// 1. User Registration
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    const { email, password, full_name, preferred_language = 'en' } = req.body;

    // Check if user already exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name, preferred_language) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, preferred_language, created_at',
      [email.toLowerCase().trim(), passwordHash, full_name || 'AURA User', preferred_language]
    );

    const user = result.rows[0];

    // Seed default preferences
    await db.query(
      'INSERT INTO user_preferences (user_id, pref_key, pref_value) VALUES ($1, $2, $3) ON CONFLICT (user_id, pref_key) DO NOTHING',
      [user.id, 'selected_language', preferred_language]
    );
    await db.query(
      'INSERT INTO user_preferences (user_id, pref_key, pref_value) VALUES ($1, $2, $3) ON CONFLICT (user_id, pref_key) DO NOTHING',
      [user.id, 'voice_enrolled', 'true']
    );

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        preferred_language: user.preferred_language
      }
    });
  } catch (err) {
    console.error('[AUTH ERROR] Register failed:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 2. User Login
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        preferred_language: user.preferred_language,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error('[AUTH ERROR] Login failed:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// 3. Current User Profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, full_name, avatar_url, preferred_language, created_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update Profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { full_name, preferred_language } = req.body;
    const result = await db.query(
      'UPDATE users SET full_name = $1, preferred_language = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, full_name, preferred_language',
      [full_name, preferred_language, req.userId]
    );
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
