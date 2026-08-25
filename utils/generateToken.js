// Wraps jsonwebtoken so the signing details (secret, expiry)
// live in exactly one place instead of being repeated everywhere
// a token needs to be issued.

const jwt = require('jsonwebtoken');

function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = generateToken;
