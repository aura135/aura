const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'aura_super_secure_jwt_secret_2026_dev_key';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing or invalid format. Please log in.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
}

// Optional Auth (for routes that allow guests or legacy sync)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
  JWT_SECRET
};
