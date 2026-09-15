const express = require('express');
const beneficiaryController = require('./beneficiary.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// Publicly readable for authenticated users (volunteers, admins, donors)
router.get('/', beneficiaryController.getAll);
router.get('/:id', beneficiaryController.getById);

// Admin-only creation
router.post('/', authorizeRoles('ADMIN'), beneficiaryController.create);

module.exports = router;
