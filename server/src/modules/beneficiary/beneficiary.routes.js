const express = require('express');
const router = express.Router();
const beneficiaryController = require('./beneficiary.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

// Public / Donor Endpoint (Only returns Verified & Active Beneficiaries for donation selection)
router.get('/beneficiaries/verified', beneficiaryController.getVerifiedBeneficiaries);

// Admin-Only Endpoints
router.use('/admin/beneficiaries', authenticate, authorizeRoles('ADMIN'));

router.get('/admin/beneficiaries', beneficiaryController.getAllBeneficiaries);
router.post('/admin/beneficiaries', beneficiaryController.createBeneficiary);
router.get('/admin/beneficiaries/:id', beneficiaryController.getBeneficiaryById);
router.put('/admin/beneficiaries/:id', beneficiaryController.updateBeneficiary);
router.patch('/admin/beneficiaries/:id/verify', beneficiaryController.verifyBeneficiary);
router.patch('/admin/beneficiaries/:id/reject', beneficiaryController.rejectBeneficiary);
router.patch('/admin/beneficiaries/:id/toggle-status', beneficiaryController.toggleStatus);

module.exports = router;
