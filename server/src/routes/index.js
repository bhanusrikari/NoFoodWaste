const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const foodRequirementRoutes = require('../modules/foodRequirement/foodRequirement.routes');
const donationRoutes = require('../modules/donation/donation.routes');
const fulfillmentRoutes = require('../modules/fulfillment/fulfillment.routes');
const notificationRoutes = require('../modules/notification/notification.routes');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

// Mount Feature routes
router.use('/auth', authRoutes);
router.use('/food-requirements', foodRequirementRoutes);
router.use('/donations', donationRoutes);
router.use('/fulfillments', fulfillmentRoutes);
router.use('/notifications', notificationRoutes);

// Temporary Test Endpoints for Role Verification
router.get('/admin/test', authenticate, authorizeRoles('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome ADMIN! Authorization successful.',
    user: req.user,
  });
});

router.get('/volunteer/test', authenticate, authorizeRoles('VOLUNTEER'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome VOLUNTEER! Authorization successful.',
    user: req.user,
  });
});

router.get('/donor/test', authenticate, authorizeRoles('DONOR'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome DONOR! Authorization successful.',
    user: req.user,
  });
});

module.exports = router;
