const express = require('express');
const router = express.Router();
const activityLogController = require('./activityLog.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', activityLogController.getAllActivityLogs);

module.exports = router;
