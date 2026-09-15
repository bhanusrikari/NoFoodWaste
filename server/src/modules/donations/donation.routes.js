const express = require('express');
const donationController = require('./donation.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

// All routes require authentication and CUSTOMER role
router.use(authenticate, authorizeRoles('CUSTOMER'));

router.get('/available', donationController.getAvailableDonations);
router.get('/interests/my', donationController.getMyInterests);
router.patch('/interests/:id/withdraw', donationController.withdrawInterest);
router.post('/:id/interests', donationController.expressInterest);
router.get('/:id', donationController.getDonationById);

module.exports = router;
