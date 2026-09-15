const express = require('express');
const router = express.Router();
const volunteerController = require('./volunteer.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

// Admin-Only Endpoints
router.use('/admin/volunteers', authenticate, authorizeRoles('ADMIN'));

router.get('/admin/volunteers', volunteerController.getAllVolunteers);
router.post('/admin/volunteers/assign-delivery', volunteerController.assignDelivery);
router.get('/admin/volunteers/:id', volunteerController.getVolunteerById);
router.put('/admin/volunteers/:id', volunteerController.updateVolunteerProfile);
router.patch('/admin/volunteers/:id/verify', volunteerController.verifyVolunteer);
router.patch('/admin/volunteers/:id/reject', volunteerController.rejectVolunteer);
router.patch('/admin/volunteers/:id/toggle-status', volunteerController.toggleStatus);
router.patch('/admin/volunteers/:id/availability', volunteerController.updateAvailability);

module.exports = router;
