const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/admin/login  { password }  -> { token }
router.post('/login', (req, res) => {
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
