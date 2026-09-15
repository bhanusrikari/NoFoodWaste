const express = require('express');
const vehicleController = require('./vehicle.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// List available vehicles (for admin assignment matching)
router.get('/available', vehicleController.getAvailable);
router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);

// Admin-only creation
router.post('/', authorizeRoles('ADMIN'), vehicleController.create);

module.exports = router;
