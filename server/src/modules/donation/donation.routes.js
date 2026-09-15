const express = require('express');
const donationController = require('./donation.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// Admin Donation Management endpoints (Protected: ADMIN only)
router.get(
  '/admin/donations',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.getAllDonations
);

router.get(
  '/admin/donations/available',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.getAvailableDonations
);

router.post(
  '/admin/donations/seed',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.seedDonations
);

router.get(
  '/admin/donations/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.getDonationById
);

router.patch(
  '/admin/donations/:id/verify',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.verifyDonation
);

router.post(
  '/admin/donations/:id/assign-beneficiary',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.assignBeneficiary
);

router.patch(
  '/admin/donations/:id/flag-cancel',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.flagOrCancel
);

router.get(
  '/admin/food-requests/open',
  authenticate,
  authorizeRoles('ADMIN'),
  donationController.getOpenRequests
);

// Public / Donor endpoint to post donations
router.post('/donations', donationController.createDonation);

module.exports = router;
