const express = require('express');
const assignmentController = require('./assignment.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// --- Admin route: create assignment ---
router.post('/', authorizeRoles('ADMIN'), assignmentController.createAssignment);

// --- Volunteer routes ---
router.get('/my', authorizeRoles('VOLUNTEER'), assignmentController.getMyAssignments);
router.get('/my-active', authorizeRoles('VOLUNTEER'), assignmentController.getMyActiveAssignment);
router.get('/my-history', authorizeRoles('VOLUNTEER'), assignmentController.getMyHistory);

// Assignment detail (volunteer or admin)
router.get('/:id', authorizeRoles('VOLUNTEER', 'ADMIN'), assignmentController.getAssignment);

// Status transition endpoints (volunteer only)
router.patch('/:id/accept', authorizeRoles('VOLUNTEER'), assignmentController.acceptAssignment);
router.patch('/:id/start-pickup', authorizeRoles('VOLUNTEER'), assignmentController.startPickup);
router.patch('/:id/collect', authorizeRoles('VOLUNTEER'), assignmentController.confirmCollection);
router.patch('/:id/start-transport', authorizeRoles('VOLUNTEER'), assignmentController.startTransport);
router.patch('/:id/deliver', authorizeRoles('VOLUNTEER'), assignmentController.confirmDelivery);

// Beneficiary acknowledgement (ADMIN or BENEFICIARY/CUSTOMER, strictly NOT volunteer)
router.patch('/:id/acknowledge', assignmentController.acknowledgeReceipt);

// Admin cancellation
router.patch('/:id/cancel', authorizeRoles('ADMIN'), assignmentController.cancelAssignment);

module.exports = router;
