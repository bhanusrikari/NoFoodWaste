const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

// Public/Authenticated users can submit issue reports
router.post('/submit', authenticate, reportController.createReport);

// Admin-only endpoints
router.get('/', authenticate, authorizeRoles('ADMIN'), reportController.getAllReports);
router.get('/:id', authenticate, authorizeRoles('ADMIN'), reportController.getReportById);
router.patch('/:id/status', authenticate, authorizeRoles('ADMIN'), reportController.updateReportStatus);

module.exports = router;
