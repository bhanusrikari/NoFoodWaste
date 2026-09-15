const express = require('express');
const matchingController = require('./matching.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// Admin Supply-Demand Matching endpoints (Protected: ADMIN only)
router.get(
  '/admin/matching/suggested',
  authenticate,
  authorizeRoles('ADMIN'),
  matchingController.getSuggestedMatches
);

router.get(
  '/admin/matching/request/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  matchingController.findMatchesForRequest
);

router.get(
  '/admin/matching/donation/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  matchingController.findMatchesForDonation
);

router.post(
  '/admin/matching/approve',
  authenticate,
  authorizeRoles('ADMIN'),
  matchingController.approveMatch
);

router.post(
  '/admin/matching/reject',
  authenticate,
  authorizeRoles('ADMIN'),
  matchingController.rejectMatch
);

module.exports = router;
