const express = require('express');
const notificationController = require('./notification.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', notificationController.getNotifications);

// PATCH /api/notifications/read-all
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
