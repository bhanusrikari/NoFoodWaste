const express = require('express');
const router = express.Router();
const exceptionController = require('./exception.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

router.use(authenticate);

// Volunteer rejection can be posted by VOLUNTEER or ADMIN
router.post('/volunteer-reject', exceptionController.handleVolunteerRejection);

// Admin-only exception management
router.post('/partial-fulfillment', authorizeRoles('ADMIN'), exceptionController.handlePartialFulfillment);
router.post('/cancel-entity', authorizeRoles('ADMIN'), exceptionController.handleCancellation);

module.exports = router;
