const express = require('express');
const {
  createDonation,
  getMyDonations,
  getDonorStats,
  getAvailableDonations,
  getDonationById,
  expressInterest,
  getMyInterests,
  withdrawInterest,
  getDonationInterests,
  updateInterestStatus,
} = require('./donation.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// CUSTOMER routes
router.get('/available', authorizeRoles('CUSTOMER'), getAvailableDonations);
router.get('/interests/my', authorizeRoles('CUSTOMER'), getMyInterests);
router.patch('/interests/:id/withdraw', authorizeRoles('CUSTOMER'), withdrawInterest);
router.post('/:id/interests', authorizeRoles('CUSTOMER'), expressInterest);

// DONOR routes
router.post('/', authorizeRoles('DONOR'), createDonation);
router.get('/my', authorizeRoles('DONOR'), getMyDonations);
router.get('/stats', authorizeRoles('DONOR'), getDonorStats);
router.get('/:id/interests', authorizeRoles('DONOR', 'ADMIN'), getDonationInterests);
router.patch('/:id/interests/:interestId/status', authorizeRoles('DONOR', 'ADMIN'), updateInterestStatus);

// Shared route (accessible by any authenticated user)
router.get('/:id', getDonationById);

module.exports = router;
