const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', notificationController.getAdminNotifications);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
