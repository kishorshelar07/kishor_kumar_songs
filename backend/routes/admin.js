const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Brute-force protection: max 5 login attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/admin/login  { password }  -> { token }
router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const secret = process.env.JWT_SECRET || 'change_this_to_a_long_random_string';
  const token = jwt.sign({ isAdmin: true }, secret, { expiresIn: '12h' });

  res.json({ token });
});

module.exports = router;
