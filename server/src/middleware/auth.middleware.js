const { verifyToken } = require('../modules/auth/auth.utils');
const authService = require('../modules/auth/auth.service');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing or invalid',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token signature',
      });
    }

    const user = await authService.getUserById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user no longer exists',
      });
    }
    next(error);
  }
};

module.exports = { authenticate };
