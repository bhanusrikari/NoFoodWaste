const Fulfillment = require('./fulfillment.model');
const FoodRequirement = require('../foodRequirement/foodRequirement.model');
const Donation = require('../donation/donation.model');
const Notification = require('../notification/notification.model');

// Helper to generate unique Fulfillment ID
const generateFulfillmentId = () => {
  return `FUL-${Math.floor(100000 + Math.random() * 900000)}`;
};

// Verified Beneficiaries List for "Donate to Someone in Need" -> "Find Beneficiary"
const VERIFIED_BENEFICIARIES = [
  {
    id: 'ben-001',
    name: 'ABC Children\'s Home',
    location: 'Central Community Zone, 3 km away',
    currentNeed: '80 meals',
    contactPerson: 'Sister Mary',
    phone: '+91 98765 43210',
    type: 'Orphanage',
  },
  {
    id: 'ben-002',
    name: 'XYZ Night Shelter',
    location: 'North Transit Station, 5 km away',
    currentNeed: '120 meals',
    contactPerson: 'David Kumar',
    phone: '+91 98765 43211',
    type: 'Homeless Shelter',
  },
  {
    id: 'ben-003',
    name: 'Hope Community Kitchen',
    location: 'East Ward Market, 7 km away',
    currentNeed: '100 meals',
    contactPerson: 'Anitha Rao',
    phone: '+91 98765 43212',
    type: 'Community Kitchen',
  },
  {
    id: 'ben-004',
    name: 'St. Jude Care Center',
    location: 'South City Block, 4.5 km away',
    currentNeed: '60 meals',
    contactPerson: 'Brother Paul',
    phone: '+91 98765 43213',
    type: 'Care Home',
  },
];

// Get list of verified beneficiaries
const getVerifiedBeneficiaries = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      beneficiaries: VERIFIED_BENEFICIARIES,
    });
  } catch (error) {
    next(error);
  }
};

// Flow 1: Fulfill an Existing Requirement (Customer already posted requirement, so already matched!)
const fulfillRequirement = async (req, res, next) => {
  try {
    const { requirementId, deliveryMethod, foodDetails } = req.body;

    if (!requirementId || !deliveryMethod) {
      return res.status(400).json({
        success: false,
        message: 'requirementId and deliveryMethod are required',
      });
    }

    const requirement = await FoodRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Food requirement not found',
      });
    }

    if (requirement.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: 'This requirement is no longer open for fulfillment',
      });
    }

    const initialStatus = deliveryMethod === 'DIRECT' ? 'MATCHED' : 'VOLUNTEER_REQUESTED';

    const fulfillment = await Fulfillment.create({
      fulfillmentId: generateFulfillmentId(),
      requirement: requirement._id,
      donor: req.user.id,
      recipient: requirement.recipient,
      recipientName: requirement.organizationName,
      recipientLocation: requirement.location,
      deliveryMethod,
      status: initialStatus,
      pickupAddress: foodDetails?.pickupAddress || 'Donor Address Specified',
      pickupWindow: foodDetails?.availableFrom ? `${foodDetails.availableFrom} - ${foodDetails.availableUntil}` : '09:00 - 21:00',
      foodSummary: {
        foodType: foodDetails?.foodType || requirement.foodType,
        cuisine: foodDetails?.cuisine || requirement.cuisine,
        quantity: foodDetails?.quantity || requirement.peopleCount,
        unit: foodDetails?.unit || 'Meals',
        foodItems: foodDetails?.foodItems || 'Cooked Meals',
        expiry: foodDetails?.expiry ? new Date(foodDetails.expiry) : new Date(Date.now() + 86400000),
      },
    });

    requirement.status = 'MATCHED';
    await requirement.save();

    if (requirement.recipient) {
      await Notification.create({
        user: requirement.recipient,
        title: 'Donation Matched! 🎉',
        message: `Donor accepted your requirement (${requirement.organizationName}) via ${deliveryMethod === 'DIRECT' ? 'Direct Delivery' : 'Volunteer'}.`,
        type: 'REQUIREMENT_MATCHED',
        fulfillmentId: fulfillment._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Fulfillment initiated successfully',
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Flow 2: Donate to Beneficiary / Donate-First Flow (Donor selects beneficiary -> status BENEFICIARY_PENDING)
const fulfillBeneficiary = async (req, res, next) => {
  try {
    const { beneficiaryId, beneficiaryName, beneficiaryLocation, deliveryMethod, foodDetails } = req.body;

    if (!beneficiaryName || !deliveryMethod || !foodDetails) {
      return res.status(400).json({
        success: false,
        message: 'beneficiaryName, deliveryMethod, and foodDetails are required',
      });
    }

    const donation = await Donation.create({
      donor: req.user.id,
      donorType: foodDetails.donorType || 'Individual',
      foodType: foodDetails.foodType || 'Cooked Meal',
      cuisine: foodDetails.cuisine || 'Mixed',
      foodItems: foodDetails.foodItems || 'Meals',
      quantity: Number(foodDetails.quantity),
      unit: foodDetails.unit || 'Meals',
      description: foodDetails.description || '',
      preparedAt: foodDetails.preparedAt || new Date(),
      expiry: foodDetails.expiry || new Date(Date.now() + 86400000),
      pickupAddress: foodDetails.pickupAddress,
      availableFrom: foodDetails.availableFrom || '09:00',
      availableUntil: foodDetails.availableUntil || '21:00',
      specialInstructions: foodDetails.specialInstructions || '',
      status: 'MATCHED',
    });

    // Initial status for donor-initiated beneficiary offer is BENEFICIARY_PENDING
    const fulfillment = await Fulfillment.create({
      fulfillmentId: generateFulfillmentId(),
      donation: donation._id,
      donor: req.user.id,
      recipientName: beneficiaryName,
      recipientLocation: beneficiaryLocation || 'City Center',
      deliveryMethod,
      status: 'BENEFICIARY_PENDING',
      pickupAddress: foodDetails.pickupAddress,
      pickupWindow: `${foodDetails.availableFrom || '09:00'} - ${foodDetails.availableUntil || '21:00'}`,
      foodSummary: {
        foodType: foodDetails.foodType,
        cuisine: foodDetails.cuisine,
        quantity: Number(foodDetails.quantity),
        unit: foodDetails.unit || 'Meals',
        foodItems: foodDetails.foodItems,
        expiry: new Date(foodDetails.expiry),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Donation offer sent to beneficiary for acceptance',
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Accept Beneficiary Offer (Recipient accepts donation offer)
const acceptBeneficiary = async (req, res, next) => {
  try {
    const fulfillment = await Fulfillment.findById(req.params.id);
    if (!fulfillment) {
      return res.status(404).json({ success: false, message: 'Fulfillment not found' });
    }

    if (fulfillment.status !== 'BENEFICIARY_PENDING') {
      return res.status(400).json({ success: false, message: 'Fulfillment is not in pending acceptance state' });
    }

    // Next status depends on delivery method
    fulfillment.status = fulfillment.deliveryMethod === 'DIRECT' ? 'MATCHED' : 'VOLUNTEER_REQUESTED';
    await fulfillment.save();

    // Notify Donor
    await Notification.create({
      user: fulfillment.donor,
      title: 'Beneficiary Accepted Donation! 🎉',
      message: `${fulfillment.recipientName} has accepted your food donation (${fulfillment.fulfillmentId}).`,
      type: 'BENEFICIARY_ACCEPTED',
      fulfillmentId: fulfillment._id,
    });

    res.status(200).json({
      success: true,
      message: 'Donation offer accepted by beneficiary',
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Reject Beneficiary Offer (Recipient declines donation offer)
const rejectBeneficiary = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const fulfillment = await Fulfillment.findById(req.params.id);
    if (!fulfillment) {
      return res.status(404).json({ success: false, message: 'Fulfillment not found' });
    }

    fulfillment.status = 'BENEFICIARY_REJECTED';
    await fulfillment.save();

    // Notify Donor
    await Notification.create({
      user: fulfillment.donor,
      title: 'Donation Offer Declined',
      message: `${fulfillment.recipientName} was unable to accept your donation (${fulfillment.fulfillmentId}). Reason: ${reason || 'Capacity reached'}.`,
      type: 'BENEFICIARY_REJECTED',
      fulfillmentId: fulfillment._id,
    });

    res.status(200).json({
      success: true,
      message: 'Donation offer declined',
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Safety Verification Step (Volunteer / Admin inspects food after collection)
const safetyVerify = async (req, res, next) => {
  try {
    const { hygieneCheck, freshnessCheck, temperatureCheck, packagingCondition, notes, result } = req.body;

    const fulfillment = await Fulfillment.findById(req.params.id);
    if (!fulfillment) {
      return res.status(404).json({ success: false, message: 'Fulfillment not found' });
    }

    const isApproved = result === 'APPROVED';
    const nextStatus = isApproved ? 'SAFETY_APPROVED' : 'SAFETY_REJECTED';

    fulfillment.safetyVerification = {
      isVerified: true,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      hygieneCheck: hygieneCheck || 'Pass',
      freshnessCheck: freshnessCheck || 'Pass',
      temperatureCheck: temperatureCheck || 'Normal',
      packagingCondition: packagingCondition || 'Intact',
      notes: notes || '',
      result: result || 'APPROVED',
    };

    fulfillment.status = nextStatus;
    await fulfillment.save();

    // Notify Donor & Admin
    await Notification.create({
      user: fulfillment.donor,
      title: isApproved ? 'Food Safety Verified ✅' : 'Food Safety Issue ⚠️',
      message: isApproved
        ? `Food safety verification passed for ${fulfillment.fulfillmentId}. Out for delivery!`
        : `Food safety verification failed for ${fulfillment.fulfillmentId}. Delivery paused for safety.`,
      type: isApproved ? 'SAFETY_VERIFIED' : 'SAFETY_REJECTED',
      fulfillmentId: fulfillment._id,
    });

    res.status(200).json({
      success: true,
      message: `Safety verification completed: ${result}`,
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Get current donor's fulfillments
const getMyFulfillments = async (req, res, next) => {
  try {
    const fulfillments = await Fulfillment.find({ donor: req.user.id })
      .populate('requirement')
      .populate('donation')
      .populate('volunteer', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: fulfillments.length,
      fulfillments,
    });
  } catch (error) {
    next(error);
  }
};

// Get recipient's fulfillments
const getRecipientFulfillments = async (req, res, next) => {
  try {
    const fulfillments = await Fulfillment.find({
      $or: [{ recipient: req.user.id }, { recipientName: new RegExp(req.user.name, 'i') }],
    })
      .populate('donor', 'name email phone')
      .populate('volunteer', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: fulfillments.length,
      fulfillments,
    });
  } catch (error) {
    next(error);
  }
};

// Get single fulfillment detail
const getFulfillmentById = async (req, res, next) => {
  try {
    const fulfillment = await Fulfillment.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('recipient', 'name email phone')
      .populate('volunteer', 'name phone')
      .populate('requirement')
      .populate('donation');

    if (!fulfillment) {
      return res.status(404).json({
        success: false,
        message: 'Fulfillment record not found',
      });
    }

    res.status(200).json({
      success: true,
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Update fulfillment status
const updateStatus = async (req, res, next) => {
  try {
    const { status, vehicleInfo, volunteerId } = req.body;

    const fulfillment = await Fulfillment.findById(req.params.id);
    if (!fulfillment) {
      return res.status(404).json({
        success: false,
        message: 'Fulfillment not found',
      });
    }

    if (status) fulfillment.status = status;
    if (vehicleInfo) fulfillment.vehicleInfo = vehicleInfo;
    if (volunteerId) fulfillment.volunteer = volunteerId;

    await fulfillment.save();

    await Notification.create({
      user: fulfillment.donor,
      title: `Status Update: ${status}`,
      message: `Your food donation (${fulfillment.fulfillmentId}) status updated to ${status}.`,
      type: 'STATUS_UPDATE',
      fulfillmentId: fulfillment._id,
    });

    res.status(200).json({
      success: true,
      message: 'Fulfillment status updated',
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Acknowledge Receipt by Recipient
const acknowledgeReceipt = async (req, res, next) => {
  try {
    const { note, receivedQuantity } = req.body;

    const fulfillment = await Fulfillment.findById(req.params.id);
    if (!fulfillment) {
      return res.status(404).json({
        success: false,
        message: 'Fulfillment record not found',
      });
    }

    fulfillment.acknowledgement = {
      isAcknowledged: true,
      acknowledgedBy: req.user.name || 'Recipient',
      acknowledgedAt: new Date(),
      receivedQuantity: receivedQuantity ? Number(receivedQuantity) : fulfillment.foodSummary.quantity,
      note: note || 'Food received in good condition. Thank you!',
    };

    fulfillment.status = 'COMPLETED';
    await fulfillment.save();

    await Notification.create({
      user: fulfillment.donor,
      title: 'Donation Completed & Acknowledged! ❤️',
      message: `${fulfillment.recipientName} has acknowledged receiving ${fulfillment.foodSummary.quantity} ${fulfillment.foodSummary.unit}! Thank you for your impact!`,
      type: 'ACKNOWLEDGEMENT_RECEIVED',
      fulfillmentId: fulfillment._id,
    });

    res.status(200).json({
      success: true,
      message: 'Receipt acknowledged successfully',
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Fulfillment
const cancelFulfillment = async (req, res, next) => {
  try {
    const fulfillment = await Fulfillment.findById(req.params.id);
    if (!fulfillment) {
      return res.status(404).json({
        success: false,
        message: 'Fulfillment not found',
      });
    }

    if (['DELIVERED', 'ACKNOWLEDGED', 'COMPLETED'].includes(fulfillment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a fulfillment that is already delivered or completed',
      });
    }

    fulfillment.status = 'CANCELLED';
    await fulfillment.save();

    if (fulfillment.requirement) {
      await FoodRequirement.findByIdAndUpdate(fulfillment.requirement, { status: 'OPEN' });
    }

    res.status(200).json({
      success: true,
      message: 'Fulfillment cancelled successfully',
      fulfillment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVerifiedBeneficiaries,
  fulfillRequirement,
  fulfillBeneficiary,
  acceptBeneficiary,
  rejectBeneficiary,
  safetyVerify,
  getMyFulfillments,
  getRecipientFulfillments,
  getFulfillmentById,
  updateStatus,
  acknowledgeReceipt,
  cancelFulfillment,
};
