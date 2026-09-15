const express = require('express');
const upload = require('../../middleware/upload.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorizeRoles } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate, authorizeRoles('VOLUNTEER'));

/**
 * POST /api/uploads/photo
 * Upload a single photo (collection or delivery)
 */
router.post('/photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No photo uploaded',
    });
  }

  const photoUrl = `/uploads/${req.file.filename}`;

  return res.status(200).json({
    success: true,
    message: 'Photo uploaded successfully',
    photoUrl,
  });
});

module.exports = router;
