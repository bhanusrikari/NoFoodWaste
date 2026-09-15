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
const authService = require('../modules/auth/auth.service');

// Additional remote main module imports if present
let assignmentRoutes, collectionRoutes, distributionRoutes, uploadRoutes, foodRequirementRoutes, fulfillmentRoutes;
try { assignmentRoutes = require('../modules/assignment/assignment.routes'); } catch (e) {}
try { collectionRoutes = require('../modules/collection/collection.routes'); } catch (e) {}
try { distributionRoutes = require('../modules/distribution/distribution.routes'); } catch (e) {}
try { uploadRoutes = require('../modules/upload/upload.routes'); } catch (e) {}
try { foodRequirementRoutes = require('../modules/foodRequirement/foodRequirement.routes'); } catch (e) {}
try { fulfillmentRoutes = require('../modules/fulfillment/fulfillment.routes'); } catch (e) {}

const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

// Seed initial users, beneficiaries, volunteers, vehicles, deliveries, notifications, reports & logs asynchronously
authService.seedInitialUsers().catch((err) => console.error('Auth seed error:', err));
if (beneficiaryService.seedInitialBeneficiaries) beneficiaryService.seedInitialBeneficiaries().catch((err) => console.error('Beneficiary seed error:', err));
if (volunteerService.seedInitialVolunteers) volunteerService.seedInitialVolunteers().catch((err) => console.error('Volunteer seed error:', err));
if (vehicleService.seedInitialVehicles) vehicleService.seedInitialVehicles().catch((err) => console.error('Vehicle seed error:', err));
if (deliveryService.seedSampleDeliveries) deliveryService.seedSampleDeliveries().catch((err) => console.error('Delivery seed error:', err));
if (activityLogService.seedSampleLogs) activityLogService.seedSampleLogs().catch((err) => console.error('ActivityLog seed error:', err));
if (notificationService.seedSampleNotifications) notificationService.seedSampleNotifications().catch((err) => console.error('Notification seed error:', err));
if (reportService.seedSampleReports) reportService.seedSampleReports().catch((err) => console.error('Report seed error:', err));

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Admin & Operational Core routes
router.use('/admin/deliveries', deliveryRoutes);
router.use('/admin/activity-logs', activityLogRoutes);
router.use('/admin/notifications', notificationRoutes);
router.use('/admin/reports', reportRoutes);
router.use('/admin/exceptions', exceptionRoutes);
router.use('/admin/users', userRoutes);
router.use('/admin/analytics', analyticsRoutes);

// Mount Domain Core routes
router.use('/donations', donationRoutes);
router.use('/food-requests', foodRequestRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/notifications', notificationRoutes);

if (foodRequirementRoutes) router.use('/food-requirements', foodRequirementRoutes);
if (fulfillmentRoutes) router.use('/fulfillments', fulfillmentRoutes);
if (assignmentRoutes) router.use('/assignments', assignmentRoutes);
if (collectionRoutes) router.use('/collections', collectionRoutes);
if (distributionRoutes) router.use('/distributions', distributionRoutes);
if (uploadRoutes) router.use('/uploads', uploadRoutes);

// Mount Dashboard & Matching routes
router.use('/', dashboardRoutes);
router.use('/', matchingRoutes);
router.use('/', beneficiaryRoutes);
router.use('/', volunteerRoutes);
router.use('/', vehicleRoutes);
router.use('/', donationRoutes);
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
