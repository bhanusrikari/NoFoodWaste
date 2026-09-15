const express = require('express');
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// Admin Dashboard Operations Center Endpoints (Protected: ADMIN only)
router.get(
  '/admin/dashboard',
  authenticate,
  authorizeRoles('ADMIN'),
  dashboardController.getDashboard
);

router.post(
  '/admin/dashboard/seed',
  authenticate,
  authorizeRoles('ADMIN'),
  dashboardController.seedDashboard
);

module.exports = router;
