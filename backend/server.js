require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*', // Allow Web, PWA, and mobile apps
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to /api
app.use('/api', apiLimiter);

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'AURA AI Personal Assistant Shared Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'JWT Authentication & Multi-Tenancy',
      'PostgreSQL Relational DB Storage',
      'Notes & Ordered Points Engine',
      'Tasks & Reminders Scheduling',
      'Free-Time Window Reminders',
      'Device Registration & Presence',
      'Command History Audit Log',
      'Unified Cross-Platform Sync'
    ]
  });
});

// 2. Route Registration
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/alarms', require('./routes/alarms'));
app.use('/api/preferences', require('./routes/preferences'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/commands', require('./routes/commands'));
app.use('/api/sync', require('./routes/sync'));

// 3. Centralized 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.url}' not found.`
  });
});

// 4. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[AURA SERVER ERROR]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 5. Server Startup
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[AURA BACKEND] Server running on http://localhost:${PORT}`);
    console.log(`[AURA BACKEND] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[AURA BACKEND] Auth: http://localhost:${PORT}/api/auth/register`);
    console.log(`[AURA BACKEND] Sync: http://localhost:${PORT}/api/sync/pull`);
    console.log(`=======================================================`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
