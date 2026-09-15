const express = require('express');
const volunteerController = require('./volunteer.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// All volunteer routes require authentication + VOLUNTEER role
router.use(authenticate, authorizeRoles('VOLUNTEER'));

// GET /api/volunteers/me
router.get('/me', volunteerController.getProfile);

// PATCH /api/volunteers/me/availability
router.patch('/me/availability', volunteerController.updateAvailability);

// PATCH /api/volunteers/me/location
router.patch('/me/location', volunteerController.updateLocation);

module.exports = router;
