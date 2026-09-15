const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', analyticsController.getAnalyticsData);

module.exports = router;
