const jwt = require('jsonwebtoken');

// Protects routes so only a logged-in admin (holding a valid JWT) can use them.
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'change_this_to_a_long_random_string';
    const payload = jwt.verify(token, secret);
    if (!payload.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAdmin;
