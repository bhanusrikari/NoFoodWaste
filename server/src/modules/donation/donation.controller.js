const mongoose = require('mongoose');
const Donation = require('./donation.model');
const DonationInterest = require('./donationInterest.model');
const Fulfillment = require('../fulfillment/fulfillment.model');

// Create a new donation offer (DONOR)
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
      // Fallback aliases
      location,
      availableDate,
      availableTime,
      notes,
    } = req.body;

    const actualFoodType = foodType || 'Cooked Meal';
    const actualQuantity = Number(quantity || 1);
    const actualPickupAddress = pickupAddress || location || 'Location not specified';
    const actualPreparedAt = preparedAt ? new Date(preparedAt) : (availableDate ? new Date(availableDate) : new Date());
    const actualExpiry = expiry ? new Date(expiry) : new Date(actualPreparedAt.getTime() + 24 * 60 * 60 * 1000);

    if (actualExpiry <= actualPreparedAt) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after prepared date',
      });
    }

    const donation = await Donation.create({
      donor: req.user.id,
      donorType: donorType || 'Individual',
      foodType: actualFoodType,
      cuisine: cuisine || 'Mixed',
      foodItems: foodItems || 'Food items',
      quantity: actualQuantity,
      unit: unit || 'Meals',
      description: description || notes || '',
      preparedAt: actualPreparedAt,
      expiry: actualExpiry,
      pickupAddress: actualPickupAddress,
      availableFrom: availableFrom || availableTime || '09:00',
      availableUntil: availableUntil || '21:00',
      specialInstructions: specialInstructions || notes || '',
      status: 'AVAILABLE',
    });

    res.status(201).json({
      success: true,
      message: 'Donation offer created successfully',
      donation,
      data: donation.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Get current donor's created donations with interested customer counts (DONOR)
const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donor: req.user.id }).sort({ createdAt: -1 });

    const donationsWithInterests = await Promise.all(
      donations.map(async (doc) => {
        const dObj = doc.toJSON();
        const interestedCount = await DonationInterest.countDocuments({
          donation: doc._id,
          status: { $in: ['INTERESTED', 'SELECTED'] },
        });
        dObj.interestedCount = interestedCount;
        return dObj;
      })
    );

    res.status(200).json({
      success: true,
      count: donationsWithInterests.length,
      donations: donationsWithInterests,
      data: donationsWithInterests,
    });
  } catch (error) {
    next(error);
  }
};

// Get donor impact statistics (DONOR)
const getDonorStats = async (req, res, next) => {
  try {
    const donorId = req.user.id;

    const fulfillments = await Fulfillment.find({ donor: donorId });
    const donations = await Donation.find({ donor: donorId });

    const activeDonations = fulfillments.filter(
      (f) => !['COMPLETED', 'CANCELLED'].includes(f.status)
    ).length;

    const pendingDonations = fulfillments.filter((f) =>
      ['MATCHED', 'DELIVERY_METHOD_SELECTED', 'VOLUNTEER_REQUESTED'].includes(f.status)
    ).length;

    const completedDonations = fulfillments.filter((f) => f.status === 'COMPLETED').length;

    const totalMealsDonated =
      fulfillments.reduce((acc, f) => acc + (f.foodSummary?.quantity || 0), 0) +
      donations.reduce((acc, d) => acc + (d.quantity || 0), 0);

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

// Get available food donations (CUSTOMER)
const getAvailableDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ status: 'AVAILABLE' }).sort({ createdAt: -1 });
    const formatted = donations.map((d) => d.toJSON());
    res.status(200).json({
      success: true,
      data: formatted,
      donations: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// Get single donation detail (CUSTOMER or DONOR)
const getDonationById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const donation = await Donation.findById(req.params.id).populate('donor', 'name email phone');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    const donationObj = donation.toJSON();

    if (req.user && req.user.role === 'CUSTOMER') {
      const interest = await DonationInterest.findOne({
        donation: req.params.id,
        customer: req.user.id,
      });
      donationObj.myInterest = interest ? interest.toJSON() : null;
    }

    res.status(200).json({
      success: true,
      donation: donationObj,
      data: donationObj,
    });
  } catch (error) {
    next(error);
  }
};

// Express interest in a food donation (CUSTOMER)
const expressInterest = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const donationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status !== 'AVAILABLE') {
      return res.status(409).json({
        success: false,
        message: 'This donation is no longer available.',
      });
    }

    let existingInterest = await DonationInterest.findOne({
      donation: donationId,
      customer: customerId,
    });

    if (existingInterest) {
      if (['INTERESTED', 'SELECTED'].includes(existingInterest.status)) {
        return res.status(409).json({
          success: false,
          message: 'You have already expressed interest in this food donation.',
        });
      }

      existingInterest.status = 'INTERESTED';
      await existingInterest.save();
      return res.status(200).json({
        success: true,
        message: 'Interest registered successfully',
        data: existingInterest.toJSON(),
      });
    }

    const newInterest = await DonationInterest.create({
      donation: donationId,
      customer: customerId,
      status: 'INTERESTED',
    });

    res.status(201).json({
      success: true,
      message: 'Interest registered successfully',
      data: newInterest.toJSON(),
      interest: newInterest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Get current customer's expressed interests (CUSTOMER)
const getMyInterests = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const interests = await DonationInterest.find({ customer: customerId })
      .populate('donation')
      .sort({ createdAt: -1 });

    const formatted = interests.map((doc) => doc.toJSON());

    res.status(200).json({
      success: true,
      data: formatted,
      interests: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// Withdraw interest record (CUSTOMER)
const withdrawInterest = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const interestId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(interestId)) {
      return res.status(404).json({ success: false, message: 'Interest record not found' });
    }

    const interest = await DonationInterest.findById(interestId);
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest record not found' });
    }

    if (interest.customer.toString() !== customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only manage your own donation interests',
      });
    }

    if (interest.status === 'SELECTED') {
      return res.status(409).json({
        success: false,
        message: 'Cannot withdraw interest after selection.',
      });
    }

    if (interest.status === 'WITHDRAWN') {
      return res.status(200).json({
        success: true,
        message: 'Interest withdrawn successfully',
        data: interest.toJSON(),
      });
    }

    interest.status = 'WITHDRAWN';
    await interest.save();

    res.status(200).json({
      success: true,
      message: 'Interest withdrawn successfully',
      data: interest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// View customers interested in a specific donation (DONOR - OWNERSHIP PROTECTED)
const getDonationInterests = async (req, res, next) => {
  try {
    const donationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // STRICT SECURITY: Ownership verification
    if (donation.donor.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Not authorized to view interests for this donation',
      });
    }

    const interests = await DonationInterest.find({ donation: donationId })
      .populate('customer', 'name email phone location')
      .sort({ createdAt: -1 });

    const formattedInterests = interests.map((i) => {
      const obj = i.toJSON();
      if (i.customer) {
        obj.customerName = i.customer.name;
        obj.customerEmail = i.customer.email;
        obj.customerPhone = i.customer.phone || '';
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      donation: donation.toJSON(),
      interests: formattedInterests,
      count: formattedInterests.length,
    });
  } catch (error) {
    next(error);
  }
};

// Update interest status by Donor (DONOR - e.g. SELECT / REJECT)
const updateInterestStatus = async (req, res, next) => {
  try {
    const { id: donationId, interestId } = req.params;
    const { status } = req.body;

    if (!['SELECTED', 'REJECTED', 'INTERESTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status update. Allowed: SELECTED, REJECTED, INTERESTED',
      });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // STRICT SECURITY: Ownership verification
    if (donation.donor.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Not authorized to manage interests for this donation',
      });
    }

    const interest = await DonationInterest.findById(interestId);
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest record not found' });
    }

    interest.status = status;
    await interest.save();

    res.status(200).json({
      success: true,
      message: `Customer interest status updated to ${status}`,
      interest: interest.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getMyDonations,
  getDonorStats,
  getAvailableDonations,
  getDonationById,
  expressInterest,
  getMyInterests,
  withdrawInterest,
  getDonationInterests,
  updateInterestStatus,
};
