const express = require('express');
const {
  createRequirement,
  getOpenRequirements,
  getMyRequirements,
  getRequirementById,
} = require('./foodRequirement.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createRequirement);
router.get('/open', getOpenRequirements);
router.get('/my', getMyRequirements);
router.get('/:id', getRequirementById);

module.exports = router;
