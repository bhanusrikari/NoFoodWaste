const authService = require('./auth.service');
const { validateRegisterInput, validateLoginInput } = require('./auth.validation');

class AuthController {
  async register(req, res, next) {
    try {
      const validation = validateRegisterInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', '),
        });
      }

      const user = await authService.registerUser(req.body);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const validation = validateLoginInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', '),
        });
      }

      const { token, user } = await authService.loginUser(req.body);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      // req.user is attached by auth.middleware.js
      return res.status(200).json({
        success: true,
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
