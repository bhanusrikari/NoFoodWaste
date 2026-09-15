const express = require('express');
const router = express.Router();
const vehicleController = require('./vehicle.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

// Admin-Only Endpoints
router.use('/admin/vehicles', authenticate, authorizeRoles('ADMIN'));

router.get('/admin/vehicles', vehicleController.getAllVehicles);
router.post('/admin/vehicles', vehicleController.createVehicle);
router.post('/admin/vehicles/assign-delivery', vehicleController.assignDelivery);
router.get('/admin/vehicles/:id', vehicleController.getVehicleById);
router.put('/admin/vehicles/:id', vehicleController.updateVehicle);
router.patch('/admin/vehicles/:id/toggle-status', vehicleController.toggleStatus);
router.patch('/admin/vehicles/:id/status', vehicleController.updateVehicleStatus);

module.exports = router;
