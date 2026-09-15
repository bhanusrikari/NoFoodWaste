const express = require('express');
const foodRequestController = require('./foodRequest.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// Admin food request management endpoints (Protected: ADMIN only)
router.get(
  '/admin/food-requests',
  authenticate,
  authorizeRoles('ADMIN'),
  foodRequestController.getAllRequests
);

router.get(
  '/admin/food-requests/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  foodRequestController.getRequestById
);

router.patch(
  '/admin/food-requests/:id/status',
  authenticate,
  authorizeRoles('ADMIN'),
  foodRequestController.updateStatus
);

router.post(
  '/admin/food-requests/:id/match-donor',
  authenticate,
  authorizeRoles('ADMIN'),
  foodRequestController.manualMatchDonor
);

router.get(
  '/admin/donations/available',
  authenticate,
  authorizeRoles('ADMIN'),
  foodRequestController.getAvailableDonations
);

router.post(
  '/admin/food-requests/seed',
  authenticate,
  authorizeRoles('ADMIN'),
  foodRequestController.seedRequests
);

// Public / Customer endpoint for submitting food requirements
router.post('/food-requests', foodRequestController.createRequest);

module.exports = router;
