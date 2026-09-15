const express = require('express');
const collectionController = require('./collection.controller');
const upload = require('../../middleware/upload.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// POST /api/collections (supports multipart/form-data with photo, or json)
router.post(
  '/',
  authorizeRoles('VOLUNTEER'),
  upload.single('photo'),
  collectionController.createCollection
);

// GET /api/collections/assignment/:assignmentId
router.get(
  '/assignment/:assignmentId',
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  collectionController.getByAssignment
);

module.exports = router;
