const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route
router.get('/me', authenticate, authController.getMe);

module.exports = router;
