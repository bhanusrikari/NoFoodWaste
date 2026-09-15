const Donation = require('./donation.model');
const Fulfillment = require('../fulfillment/fulfillment.model');

// Create a new donation offer
const createDonation = async (req, res, next) => {
  try {
    const {
      donorType,
      foodType,
      cuisine,
      foodItems,
      quantity,
      unit,
      description,
      preparedAt,
      expiry,
      pickupAddress,
      availableFrom,
      availableUntil,
      specialInstructions,
    } = req.body;

    if (!foodType || !cuisine || !foodItems || !quantity || !preparedAt || !expiry || !pickupAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (foodType, cuisine, foodItems, quantity, preparedAt, expiry, pickupAddress)',
      });
    }

    if (new Date(expiry) <= new Date(preparedAt)) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after prepared date',
      });
    }

    const donation = await Donation.create({
      donor: req.user.id,
      donorType: donorType || 'Individual',
      foodType,
      cuisine,
      foodItems,
      quantity: Number(quantity),
      unit: unit || 'Meals',
      description: description || '',
      preparedAt,
      expiry,
      pickupAddress,
      availableFrom: availableFrom || '09:00',
      availableUntil: availableUntil || '21:00',
      specialInstructions: specialInstructions || '',
      status: 'AVAILABLE',
    });

    res.status(201).json({
      success: true,
      message: 'Donation offer created successfully',
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// Get current donor's donations
const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

// Get donor impact statistics
const getDonorStats = async (req, res, next) => {
  try {
    const donorId = req.user.id;

    const fulfillments = await Fulfillment.find({ donor: donorId });
    const donations = await Donation.find({ donor: donorId });

    const activeDonations = fulfillments.filter(f =>
      !['COMPLETED', 'CANCELLED'].includes(f.status)
    ).length;

    const pendingDonations = fulfillments.filter(f =>
      ['MATCHED', 'DELIVERY_METHOD_SELECTED', 'VOLUNTEER_REQUESTED'].includes(f.status)
    ).length;

    const completedDonations = fulfillments.filter(f => f.status === 'COMPLETED').length;

    const totalMealsDonated = fulfillments.reduce((acc, f) => {
      return acc + (f.foodSummary?.quantity || 0);
    }, 0) + donations.reduce((acc, d) => acc + (d.quantity || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        activeDonations,
        pendingDonations,
        completedDonations,
        totalMealsDonated,
        totalOffersCreated: donations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single donation detail
const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    if (donation.donor._id.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this donation',
      });
    }

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getMyDonations,
  getDonorStats,
  getDonationById,
};
