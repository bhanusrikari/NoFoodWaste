const express = require('express');
const router = express.Router();
const deliveryController = require('./delivery.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

// Protect all delivery admin endpoints
router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/pending-assignments', deliveryController.getPendingAssignments);
router.get('/available-resources', deliveryController.getAvailableResources);
router.post('/:id/assign', deliveryController.assignDeliveryResources);
router.post('/:id/reassign', deliveryController.reassignDeliveryResources);
router.post('/:id/cancel-assignment', deliveryController.cancelDeliveryAssignment);

router.get('/', deliveryController.getAllDeliveries);
router.get('/:id', deliveryController.getDeliveryById);
router.patch('/:id/status', deliveryController.updateDeliveryStatus);

module.exports = router;
