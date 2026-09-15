const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const foodRequestRoutes = require('../modules/foodRequest/foodRequest.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const donationRoutes = require('../modules/donation/donation.routes');
const matchingRoutes = require('../modules/matching/matching.routes');
const beneficiaryRoutes = require('../modules/beneficiary/beneficiary.routes');
const beneficiaryService = require('../modules/beneficiary/beneficiary.service');
const volunteerRoutes = require('../modules/volunteer/volunteer.routes');
const volunteerService = require('../modules/volunteer/volunteer.service');
const vehicleRoutes = require('../modules/vehicle/vehicle.routes');
const vehicleService = require('../modules/vehicle/vehicle.service');
const deliveryRoutes = require('../modules/delivery/delivery.routes');
const deliveryService = require('../modules/delivery/delivery.service');
const activityLogRoutes = require('../modules/activityLog/activityLog.routes');
const activityLogService = require('../modules/activityLog/activityLog.service');
const notificationRoutes = require('../modules/notification/notification.routes');
const notificationService = require('../modules/notification/notification.service');
const reportRoutes = require('../modules/report/report.routes');
const reportService = require('../modules/report/report.service');
const exceptionRoutes = require('../modules/exception/exception.routes');
const userRoutes = require('../modules/user/user.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');

const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const authService = require('../modules/auth/auth.service');

const router = express.Router();

// Seed initial users, beneficiaries, volunteers, vehicles, deliveries, notifications, reports & logs asynchronously
authService.seedInitialUsers().catch((err) => console.error('Auth seed error:', err));
beneficiaryService.seedInitialBeneficiaries().catch((err) => console.error('Beneficiary seed error:', err));
volunteerService.seedInitialVolunteers().catch((err) => console.error('Volunteer seed error:', err));
vehicleService.seedInitialVehicles().catch((err) => console.error('Vehicle seed error:', err));
deliveryService.seedSampleDeliveries().catch((err) => console.error('Delivery seed error:', err));
activityLogService.seedSampleLogs().catch((err) => console.error('ActivityLog seed error:', err));
notificationService.seedSampleNotifications().catch((err) => console.error('Notification seed error:', err));
reportService.seedSampleReports().catch((err) => console.error('Report seed error:', err));

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Dashboard routes
router.use('/', dashboardRoutes);

// Mount Matching routes
router.use('/', matchingRoutes);

// Mount Beneficiary routes
router.use('/', beneficiaryRoutes);

// Mount Volunteer routes
router.use('/', volunteerRoutes);

// Mount Vehicle routes
router.use('/', vehicleRoutes);

// Mount Delivery routes
router.use('/admin/deliveries', deliveryRoutes);

// Mount Activity Log routes
router.use('/admin/activity-logs', activityLogRoutes);

// Mount Notification routes
router.use('/admin/notifications', notificationRoutes);

// Mount Report routes
router.use('/admin/reports', reportRoutes);

// Mount Exception routes
router.use('/admin/exceptions', exceptionRoutes);

// Mount User routes
router.use('/admin/users', userRoutes);

// Mount Analytics routes
router.use('/admin/analytics', analyticsRoutes);

// Mount Donation routes
router.use('/', donationRoutes);

// Mount Food Request routes
router.use('/', foodRequestRoutes);

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

