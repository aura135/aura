function validateRegistration(req, res, next) {
  const { email, password, full_name } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }
  if (full_name && typeof full_name !== 'string') {
    return res.status(400).json({ success: false, message: 'Full name must be a valid string.' });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  next();
}

function validateNote(req, res, next) {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Note title cannot be blank.' });
  }
  next();
}

function validateTask(req, res, next) {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Task title cannot be blank.' });
  }
  next();
}

function validateReminder(req, res, next) {
  const { title, reminder_time } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, message: 'Reminder title is required.' });
  }
  if (!reminder_time || isNaN(Number(reminder_time))) {
    return res.status(400).json({ success: false, message: 'Valid reminder timestamp is required.' });
  }
  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateNote,
  validateTask,
  validateReminder
};
