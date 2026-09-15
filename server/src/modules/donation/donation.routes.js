const express = require('express');
const {
  createDonation,
  getMyDonations,
  getDonorStats,
  getDonationById,
} = require('./donation.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createDonation);
router.get('/my', getMyDonations);
router.get('/stats', getDonorStats);
router.get('/:id', getDonationById);

module.exports = router;
