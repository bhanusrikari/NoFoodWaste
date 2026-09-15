const express = require('express');
const foodRequestController = require('./foodRequest.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// All routes require authentication and CUSTOMER role
router.use(authenticate, authorizeRoles('CUSTOMER'));

router.post('/', foodRequestController.createRequest);
router.get('/my', foodRequestController.getMyRequests);
router.get('/:id', foodRequestController.getRequestById);

module.exports = router;
