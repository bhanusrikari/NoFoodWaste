const FoodRequirement = require('./foodRequirement.model');

// Create a new food requirement (Recipient/Customer)
const createRequirement = async (req, res, next) => {
  try {
    const { organizationName, location, peopleCount, foodType, cuisine, requiredDate, requiredTime, notes } = req.body;

    if (!organizationName || !location || !peopleCount || !requiredDate || !requiredTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide organizationName, location, peopleCount, requiredDate, and requiredTime',
      });
    }

    const requirement = await FoodRequirement.create({
      recipient: req.user.id,
      organizationName,
      location,
      peopleCount: Number(peopleCount),
      foodType: foodType || 'Cooked Meal',
      cuisine: cuisine || 'Any',
      requiredDate,
      requiredTime,
      notes: notes || '',
      status: 'OPEN',
    });

    res.status(201).json({
      success: true,
      message: 'Food requirement created successfully',
      requirement,
    });
  } catch (error) {
    next(error);
  }
};

// Get all open food requirements (for Donors to browse & fulfill)
const getOpenRequirements = async (req, res, next) => {
  try {
    const requirements = await FoodRequirement.find({ status: 'OPEN' })
      .populate('recipient', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requirements.length,
      requirements,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's food requirements
const getMyRequirements = async (req, res, next) => {
  try {
    const requirements = await FoodRequirement.find({ recipient: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requirements.length,
      requirements,
    });
  } catch (error) {
    next(error);
  }
};

// Get single requirement by ID
const getRequirementById = async (req, res, next) => {
  try {
    const requirement = await FoodRequirement.findById(req.params.id)
      .populate('recipient', 'name email phone');

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Food requirement not found',
      });
    }

    res.status(200).json({
      success: true,
      requirement,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequirement,
  getOpenRequirements,
  getMyRequirements,
  getRequirementById,
};
