const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token containing only necessary non-sensitive claims (userId, role)
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id ? user._id.toString() : user.id,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
