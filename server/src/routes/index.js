const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const volunteerRoutes = require('../modules/volunteer/volunteer.routes');
const assignmentRoutes = require('../modules/assignment/assignment.routes');
const collectionRoutes = require('../modules/collection/collection.routes');
const distributionRoutes = require('../modules/distribution/distribution.routes');
const notificationRoutes = require('../modules/notification/notification.routes');
const uploadRoutes = require('../modules/upload/upload.routes');
const beneficiaryRoutes = require('../modules/beneficiary/beneficiary.routes');
const vehicleRoutes = require('../modules/vehicle/vehicle.routes');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Volunteer module routes
router.use('/volunteers', volunteerRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/collections', collectionRoutes);
router.use('/distributions', distributionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/vehicles', vehicleRoutes);

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
