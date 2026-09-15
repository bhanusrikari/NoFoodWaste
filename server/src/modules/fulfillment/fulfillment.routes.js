const express = require('express');
const {
  getVerifiedBeneficiaries,
  fulfillRequirement,
  fulfillBeneficiary,
  acceptBeneficiary,
  rejectBeneficiary,
  safetyVerify,
  getMyFulfillments,
  getRecipientFulfillments,
  getFulfillmentById,
  updateStatus,
  acknowledgeReceipt,
  cancelFulfillment,
} = require('./fulfillment.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/beneficiaries', getVerifiedBeneficiaries);
router.post('/fulfill-requirement', fulfillRequirement);
router.post('/fulfill-beneficiary', fulfillBeneficiary);
router.get('/my', getMyFulfillments);
router.get('/recipient-my', getRecipientFulfillments);
router.get('/:id', getFulfillmentById);
router.patch('/:id/accept', acceptBeneficiary);
router.patch('/:id/reject', rejectBeneficiary);
router.patch('/:id/safety-verify', safetyVerify);
router.patch('/:id/status', updateStatus);
router.patch('/:id/acknowledge', acknowledgeReceipt);
router.patch('/:id/cancel', cancelFulfillment);

module.exports = router;
