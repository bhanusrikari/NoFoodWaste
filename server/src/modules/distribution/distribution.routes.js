const express = require('express');
const distributionController = require('./distribution.controller');
const upload = require('../../middleware/upload.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// POST /api/distributions (supports multipart/form-data with photo, or json)
router.post(
  '/',
  authorizeRoles('VOLUNTEER'),
  upload.single('photo'),
  distributionController.createDistribution
);

// GET /api/distributions/assignment/:assignmentId
router.get(
  '/assignment/:assignmentId',
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  distributionController.getByAssignment
);

module.exports = router;
