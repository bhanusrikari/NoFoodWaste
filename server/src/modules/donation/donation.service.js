const Donation = require('./donation.model');
const FoodRequest = require('../foodRequest/foodRequest.model');
const Delivery = require('../delivery/delivery.model');

class DonationService {
  async getAllDonations(query = {}) {
    const { status, origin, foodType, foodCategory, search } = query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    if (origin && origin !== 'ALL') {
      filter.donationOrigin = origin.toUpperCase();
    }

    if (foodType && foodType !== 'ALL') {
      filter.foodType = foodType;
    }

    if (foodCategory && foodCategory !== 'ALL') {
      filter.foodCategory = foodCategory;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { donationId: searchRegex },
        { donorName: searchRegex },
        { foodTitle: searchRegex },
        { pickupLocation: searchRegex },
        { city: searchRegex },
      ];
    }

    const donations = await Donation.find(filter)
      .populate('matchedRequest')
      .populate('delivery')
      .sort({ createdAt: -1 });

    const allDonations = await Donation.find({});
    const stats = {
      total: allDonations.length,
      submitted: allDonations.filter((d) => d.status === 'SUBMITTED').length,
      verified: allDonations.filter((d) => d.status === 'VERIFIED' || d.status === 'AVAILABLE').length,
      matched: allDonations.filter((d) => d.status === 'MATCHED' || d.status === 'ASSIGNED').length,
      completed: allDonations.filter((d) => d.status === 'COMPLETED' || d.status === 'IN_TRANSIT').length,
      flagged: allDonations.filter((d) => d.status === 'FLAGGED').length,
      cancelled: allDonations.filter((d) => d.status === 'CANCELLED').length,
    };

    return {
      donations: donations.map((d) => d.toJSON()),
      stats,
    };
  }

  async getDonationById(id) {
    let donation;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      donation = await Donation.findById(id).populate('matchedRequest').populate('delivery');
    } else {
      donation = await Donation.findOne({ donationId: id }).populate('matchedRequest').populate('delivery');
    }

    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    return donation.toJSON();
  }

  async createDonation(data, user = null) {
    const {
      donorName,
      phone,
      email,
      foodTitle,
      numberOfMeals,
      foodType,
      foodCategory,
      donationOrigin,
      availableDate,
      availableTime,
      pickupLocation,
      city,
      deliveryMethod,
      notes,
    } = data;

    const newDonation = await Donation.create({
      donorName: donorName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      foodTitle: foodTitle.trim(),
      numberOfMeals: Number(numberOfMeals),
      foodType,
      foodCategory,
      donationOrigin: donationOrigin || 'DIRECT_DONATION',
      availableDate: availableDate || new Date().toISOString().split('T')[0],
      availableTime: availableTime || '14:00',
      pickupLocation: pickupLocation.trim(),
      city: city ? city.trim() : '',
      deliveryMethod: deliveryMethod || 'VOLUNTEER_PICKUP',
      notes: notes ? notes.trim() : '',
      donor: user ? user.id : null,
      status: 'SUBMITTED',
      lifecycleLogs: [
        {
          status: 'SUBMITTED',
          note: `Donation submitted via ${donationOrigin || 'DIRECT_DONATION'}`,
          updatedBy: donorName.trim(),
          timestamp: new Date(),
        },
      ],
    });

    return newDonation.toJSON();
  }

  async verifyDonation(id, adminUser = null) {
    let donation;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      donation = await Donation.findById(id);
    } else {
      donation = await Donation.findOne({ donationId: id });
    }

    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    donation.status = 'AVAILABLE';
    donation.lifecycleLogs.push({
      status: 'AVAILABLE',
      note: 'Donation verified by admin and available for beneficiary assignment',
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    await donation.save();
    return donation.toJSON();
  }

  async assignBeneficiary(id, requestId, adminUser = null) {
    let donation;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      donation = await Donation.findById(id);
    } else {
      donation = await Donation.findOne({ donationId: id });
    }

    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    const foodRequest = await FoodRequest.findById(requestId);
    if (!foodRequest) {
      const error = new Error('Target food requirement not found');
      error.statusCode = 404;
      throw error;
    }

    // Link matched request & beneficiary details
    donation.matchedRequest = foodRequest._id;
    donation.matchedBeneficiary = {
      customerName: foodRequest.customerName,
      organizationName: foodRequest.organizationName || '',
      phone: foodRequest.phone,
      location: foodRequest.location,
      requestId: foodRequest.requestId,
    };

    donation.status = 'MATCHED';
    donation.lifecycleLogs.push({
      status: 'MATCHED',
      note: `Assigned beneficiary ${foodRequest.customerName} (${foodRequest.requestId})`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    // Update food request
    foodRequest.matchedDonor = donation._id;
    foodRequest.matchedDonorDetails = {
      donorName: donation.donorName,
      phone: donation.phone,
      foodTitle: donation.foodTitle,
      pickupLocation: donation.pickupLocation,
    };
    foodRequest.status = 'DONOR_MATCHED';
    foodRequest.lifecycleLogs.push({
      status: 'DONOR_MATCHED',
      note: `Matched with donation ${donation.donationId} (${donation.donorName})`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    // Create / Link Converged Delivery Record
    const isSelfDrop = donation.deliveryMethod === 'DONOR_SELF_DROP';
    const delivery = await Delivery.create({
      foodRequest: foodRequest._id,
      donation: donation._id,
      customerName: foodRequest.customerName,
      donorName: donation.donorName,
      volunteerName: isSelfDrop ? 'Donor Self-Drop' : 'Unassigned',
      volunteerPhone: isSelfDrop ? donation.phone : '',
      numberOfMeals: Math.min(donation.numberOfMeals, foodRequest.numberOfMeals),
      pickupLocation: donation.pickupLocation,
      deliveryLocation: foodRequest.location,
      deliveryMethod: donation.deliveryMethod || 'VOLUNTEER_PICKUP',
      requiredDeliveryDate: donation.availableDate || '',
      requiredDeliveryTime: donation.availableTime || '',
      status: isSelfDrop ? 'ASSIGNED' : 'PENDING_ASSIGNMENT',
      currentStage: isSelfDrop ? 'Donor Self-Drop' : 'Delivery Assistance Requested',
      lifecycleLogs: [
        {
          status: isSelfDrop ? 'ASSIGNED' : 'PENDING_ASSIGNMENT',
          note: isSelfDrop ? 'Donor opted for direct self-drop delivery' : 'Delivery assistance requested by donor',
          updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
          timestamp: new Date(),
        },
      ],
    });

    donation.delivery = delivery._id;
    donation.volunteerDetails = {
      volunteerName: isSelfDrop ? 'Donor Self-Drop' : 'Unassigned',
      vehicleNumber: isSelfDrop ? 'Self-Transport' : '',
      phone: isSelfDrop ? donation.phone : '',
    };

    foodRequest.delivery = delivery._id;
    foodRequest.deliveryDetails = {
      deliveryId: delivery.deliveryId,
      volunteerName: isSelfDrop ? 'Donor Self-Drop' : 'Unassigned',
      status: delivery.status,
    };

    await donation.save();
    await foodRequest.save();

    return donation.toJSON();
  }

  async flagOrCancelDonation(id, updateData, adminUser = null) {
    const { action, reason } = updateData; // action: 'FLAG' or 'CANCEL'
    let donation;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      donation = await Donation.findById(id);
    } else {
      donation = await Donation.findOne({ donationId: id });
    }

    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    if (action === 'FLAG') {
      donation.status = 'FLAGGED';
      donation.flagReason = reason || 'Flagged by administrator for review';
      donation.lifecycleLogs.push({
        status: 'FLAGGED',
        note: `Flagged: ${donation.flagReason}`,
        updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
        timestamp: new Date(),
      });
    } else {
      donation.status = 'CANCELLED';
      donation.cancellationReason = reason || 'Cancelled by administrator';
      donation.lifecycleLogs.push({
        status: 'CANCELLED',
        note: `Cancelled: ${donation.cancellationReason}`,
        updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
        timestamp: new Date(),
      });
    }

    await donation.save();
    return donation.toJSON();
  }

  async getOpenRequestsForMatching() {
    const requests = await FoodRequest.find({
      status: { $in: ['SUBMITTED', 'PENDING', 'VERIFIED', 'OPEN'] },
    }).sort({ createdAt: -1 });

    return requests.map((r) => r.toJSON());
  }

  async seedSampleDonations() {
    const count = await Donation.countDocuments();
    if (count > 0) {
      return { seeded: false, count, message: 'Donations already exist in database' };
    }

    const sampleDonations = [
      {
        donationId: 'DON-2001',
        donorName: 'Taj Hotel Kitchen',
        phone: '+91 98765 00001',
        email: 'kitchen@taj.com',
        foodTitle: '150 Meals Fresh Rice & Curry',
        numberOfMeals: 150,
        foodType: 'Veg',
        foodCategory: 'Cooked',
        donationOrigin: 'REQUEST_FULFILLMENT',
        availableDate: new Date().toISOString().split('T')[0],
        availableTime: '13:00',
        pickupLocation: 'Banjara Hills, Hyderabad',
        deliveryMethod: 'VOLUNTEER_PICKUP',
        status: 'MATCHED',
        matchedBeneficiary: {
          customerName: 'Hope Foundation Shelter',
          organizationName: 'Hope NGO',
          phone: '+91 98765 43210',
          location: 'MG Road, Secunderabad',
          requestId: 'REQ-1001',
        },
        volunteerDetails: {
          volunteerName: 'Rahul Sharma',
          vehicleNumber: 'TS 09 EQ 4521',
          phone: '+91 91234 11111',
        },
        lifecycleLogs: [
          { status: 'SUBMITTED', note: 'Created via request fulfillment', updatedBy: 'Taj Hotel', timestamp: new Date(Date.now() - 7200000) },
          { status: 'VERIFIED', note: 'Verified by admin', updatedBy: 'Admin', timestamp: new Date(Date.now() - 3600000) },
          { status: 'MATCHED', note: 'Matched to Hope Shelter', updatedBy: 'Admin', timestamp: new Date() },
        ],
      },
      {
        donationId: 'DON-2002',
        donorName: 'Green Bakery & Cafe',
        phone: '+91 98765 00002',
        email: 'bakery@green.com',
        foodTitle: '80 Assorted Breads & Pastries',
        numberOfMeals: 80,
        foodType: 'Veg',
        foodCategory: 'Bakery',
        donationOrigin: 'DIRECT_DONATION',
        availableDate: new Date().toISOString().split('T')[0],
        availableTime: '18:00',
        pickupLocation: 'Jubilee Hills, Hyderabad',
        deliveryMethod: 'VOLUNTEER_PICKUP',
        status: 'AVAILABLE',
        lifecycleLogs: [
          { status: 'SUBMITTED', note: 'Spontaneous Birthday Celebration Donation', updatedBy: 'Green Bakery', timestamp: new Date(Date.now() - 3600000) },
          { status: 'AVAILABLE', note: 'Verified by admin', updatedBy: 'Admin', timestamp: new Date() },
        ],
      },
      {
        donationId: 'DON-2003',
        donorName: 'Fresh Mart Supermarket',
        phone: '+91 98765 00003',
        email: 'mart@fresh.com',
        foodTitle: '200 Packaged Meal Kits',
        numberOfMeals: 200,
        foodType: 'Both',
        foodCategory: 'Packaged',
        donationOrigin: 'DIRECT_DONATION',
        availableDate: new Date().toISOString().split('T')[0],
        availableTime: '11:00',
        pickupLocation: 'Hitec City, Hyderabad',
        deliveryMethod: 'DONOR_SELF_DROP',
        status: 'COMPLETED',
        matchedBeneficiary: {
          customerName: 'St. Jude Orphanage',
          organizationName: 'St. Jude Home',
          phone: '+91 91234 56789',
          location: 'Park Avenue, Banjara Hills',
          requestId: 'REQ-1002',
        },
        volunteerDetails: {
          volunteerName: 'Donor Self-Drop (Vehicle AP 28 B 1234)',
          vehicleNumber: 'AP 28 B 1234',
          phone: '+91 98765 00003',
        },
        lifecycleLogs: [
          { status: 'SUBMITTED', note: 'Submitted', updatedBy: 'Fresh Mart', timestamp: new Date(Date.now() - 14400000) },
          { status: 'VERIFIED', note: 'Verified', updatedBy: 'Admin', timestamp: new Date(Date.now() - 10800000) },
          { status: 'MATCHED', note: 'Matched', updatedBy: 'Admin', timestamp: new Date(Date.now() - 7200000) },
          { status: 'COMPLETED', note: 'Delivered and acknowledged', updatedBy: 'System', timestamp: new Date() },
        ],
      },
    ];

    const seeded = await Donation.insertMany(sampleDonations);
    return { seeded: true, count: seeded.length, message: 'Successfully seeded sample donations' };
  }
}

module.exports = new DonationService();
