const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const foodRequestRoutes = require('../modules/foodRequests/foodRequest.routes');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Food Request routes
router.use('/food-requests', foodRequestRoutes);

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
