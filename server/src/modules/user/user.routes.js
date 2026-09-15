const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/toggle-status', userController.toggleUserAccountStatus);
router.patch('/:id/verify', userController.verifyUserAccount);
router.patch('/:id/role', userController.updateUserRole);

module.exports = router;
