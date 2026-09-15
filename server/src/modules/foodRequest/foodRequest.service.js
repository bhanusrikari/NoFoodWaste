const FoodRequest = require('./foodRequest.model');
const Donation = require('../donation/donation.model');
const Delivery = require('../delivery/delivery.model');

class FoodRequestService {
  async getAllFoodRequests(query = {}) {
    const { status, date, location, foodType, foodCategory, search } = query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    if (date && date.trim()) {
      filter.requiredDate = date.trim();
    }

    if (location && location.trim()) {
      filter.location = new RegExp(location.trim(), 'i');
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
        { requestId: searchRegex },
        { customerName: searchRegex },
        { organizationName: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { foodType: searchRegex },
        { foodCategory: searchRegex },
      ];
    }

    const requests = await FoodRequest.find(filter)
      .populate('matchedDonor')
      .populate('delivery')
      .sort({ createdAt: -1 });

    const allRequests = await FoodRequest.find({});
    const stats = {
      total: allRequests.length,
      submitted: allRequests.filter((r) => r.status === 'SUBMITTED' || r.status === 'PENDING').length,
      verified: allRequests.filter((r) => r.status === 'VERIFIED' || r.status === 'OPEN').length,
      matched: allRequests.filter((r) => r.status === 'DONOR_MATCHED' || r.status === 'DELIVERY_ARRANGED').length,
      completed: allRequests.filter((r) => r.status === 'DELIVERED' || r.status === 'ACKNOWLEDGED' || r.status === 'COMPLETED').length,
      rejected: allRequests.filter((r) => r.status === 'REJECTED').length,
      cancelled: allRequests.filter((r) => r.status === 'CANCELLED').length,
    };

    return {
      requests: requests.map((r) => r.toJSON()),
      stats,
    };
  }

  async getFoodRequestById(id) {
    let request;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      request = await FoodRequest.findById(id).populate('matchedDonor').populate('delivery');
    } else {
      request = await FoodRequest.findOne({ requestId: id }).populate('matchedDonor').populate('delivery');
    }

    if (!request) {
      const error = new Error('Food request not found');
      error.statusCode = 404;
      throw error;
    }

    return request.toJSON();
  }

  async createFoodRequest(data, user = null) {
    const {
      customerName,
      organizationName,
      phone,
      email,
      numberOfMeals,
      foodType,
      foodCategory,
      location,
      city,
      requiredDate,
      requiredTime,
      adminNotes,
    } = data;

    const newRequest = await FoodRequest.create({
      customerName: customerName.trim(),
      organizationName: organizationName ? organizationName.trim() : '',
      phone: phone.trim(),
      email: email ? email.trim() : '',
      numberOfMeals: Number(numberOfMeals),
      foodType,
      foodCategory,
      location: location.trim(),
      city: city ? city.trim() : '',
      requiredDate,
      requiredTime,
      adminNotes: adminNotes ? adminNotes.trim() : '',
      createdBy: user ? user.id : null,
      status: 'SUBMITTED',
      lifecycleLogs: [
        {
          status: 'SUBMITTED',
          note: 'Customer food requirement submitted',
          updatedBy: customerName.trim(),
          timestamp: new Date(),
        },
      ],
    });

    return newRequest.toJSON();
  }

  async updateRequestStatus(id, updateData, adminUser = null) {
    const { status, adminNotes, rejectionReason, cancellationReason } = updateData;

    let request;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      request = await FoodRequest.findById(id);
    } else {
      request = await FoodRequest.findOne({ requestId: id });
    }

    if (!request) {
      const error = new Error('Food request not found');
      error.statusCode = 404;
      throw error;
    }

    const previousStatus = request.status;
    request.status = status;

    if (adminNotes !== undefined) request.adminNotes = adminNotes.trim();
    if (status === 'REJECTED' && rejectionReason !== undefined) request.rejectionReason = rejectionReason.trim();
    if (status === 'CANCELLED' && cancellationReason !== undefined) request.cancellationReason = cancellationReason.trim();

    // Append lifecycle log entry
    let logNote = `Status changed from ${previousStatus} to ${status}`;
    if (status === 'VERIFIED') logNote = 'Requirement verified and approved by admin';
    if (status === 'REJECTED') logNote = `Rejected: ${request.rejectionReason}`;
    if (status === 'CANCELLED') logNote = `Cancelled: ${request.cancellationReason}`;

    request.lifecycleLogs.push({
      status,
      note: logNote,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    await request.save();
    return request.toJSON();
  }

  async manualMatchDonor(id, donationId, adminUser = null) {
    let request;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      request = await FoodRequest.findById(id);
    } else {
      request = await FoodRequest.findOne({ requestId: id });
    }

    if (!request) {
      const error = new Error('Food request not found');
      error.statusCode = 404;
      throw error;
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    // Link donation to request
    request.matchedDonor = donation._id;
    request.matchedDonorDetails = {
      donorName: donation.donorName,
      phone: donation.phone,
      foodTitle: donation.foodTitle,
      pickupLocation: donation.pickupLocation,
    };

    donation.status = 'MATCHED';
    await donation.save();

    // Create or link Delivery record
    const delivery = await Delivery.create({
      foodRequest: request._id,
      donation: donation._id,
      customerName: request.customerName,
      donorName: donation.donorName,
      volunteerName: 'Unassigned',
      numberOfMeals: request.numberOfMeals,
      pickupLocation: donation.pickupLocation,
      deliveryLocation: request.location,
      status: 'PENDING_ASSIGNMENT',
      currentStage: 'Volunteer Assignment',
    });

    request.delivery = delivery._id;
    request.deliveryDetails = {
      deliveryId: delivery.deliveryId,
      volunteerName: 'Unassigned',
      status: 'PENDING_ASSIGNMENT',
    };

    request.status = 'DONOR_MATCHED';
    request.lifecycleLogs.push({
      status: 'DONOR_MATCHED',
      note: `Manually matched with donor ${donation.donorName} (${donation.foodTitle})`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    await request.save();
    return request.toJSON();
  }

  async getAvailableDonations() {
    const donations = await Donation.find({ status: 'AVAILABLE' }).sort({ createdAt: -1 });
    return donations.map((d) => d.toJSON());
  }

  async seedSampleRequests() {
    const count = await FoodRequest.countDocuments();
    if (count > 0) {
      return { seeded: false, count, message: 'Food requests already exist in database' };
    }

    const sampleData = [
      {
        requestId: 'REQ-1001',
        customerName: 'Hope Foundation Shelter',
        organizationName: 'Hope Foundation NGO',
        phone: '+91 98765 43210',
        email: 'contact@hopefoundation.org',
        numberOfMeals: 150,
        foodType: 'Veg',
        foodCategory: 'Cooked',
        location: '12-B MG Road, Secunderabad',
        city: 'Hyderabad',
        requiredDate: '2026-09-20',
        requiredTime: '13:00',
        status: 'SUBMITTED',
        adminNotes: 'Awaiting phone verification with shelter manager',
        lifecycleLogs: [
          { status: 'SUBMITTED', note: 'Food requirement submitted by customer', updatedBy: 'Hope Foundation', timestamp: new Date() },
        ],
      },
      {
        requestId: 'REQ-1002',
        customerName: 'St. Jude Orphanage',
        organizationName: 'St. Jude Children Home',
        phone: '+91 91234 56789',
        email: 'info@stjudehome.org',
        numberOfMeals: 80,
        foodType: 'Both',
        foodCategory: 'Cooked',
        location: '45 Park Avenue, Banjara Hills',
        city: 'Hyderabad',
        requiredDate: '2026-09-18',
        requiredTime: '19:30',
        status: 'VERIFIED',
        adminNotes: 'Verified via phone call with Sister Mary.',
        lifecycleLogs: [
          { status: 'SUBMITTED', note: 'Submitted', updatedBy: 'St. Jude', timestamp: new Date(Date.now() - 3600000) },
          { status: 'VERIFIED', note: 'Verified by admin', updatedBy: 'Admin', timestamp: new Date() },
        ],
      },
      {
        requestId: 'REQ-1003',
        customerName: 'Sunrise Community Kitchen',
        organizationName: 'Sunrise Trust',
        phone: '+91 94400 11223',
        email: 'kitchen@sunrisetrust.org',
        numberOfMeals: 250,
        foodType: 'Veg',
        foodCategory: 'Raw/Groceries',
        location: '88 Industrial Area, Kukatpally',
        city: 'Hyderabad',
        requiredDate: '2026-09-22',
        requiredTime: '10:00',
        status: 'OPEN',
        adminNotes: 'Bulk raw food requirement for weekend drive',
        lifecycleLogs: [
          { status: 'SUBMITTED', note: 'Submitted', updatedBy: 'Sunrise Trust', timestamp: new Date(Date.now() - 7200000) },
          { status: 'VERIFIED', note: 'Verified', updatedBy: 'Admin', timestamp: new Date(Date.now() - 3600000) },
          { status: 'OPEN', note: 'Open for donor matching', updatedBy: 'Admin', timestamp: new Date() },
        ],
      },
    ];

    const seeded = await FoodRequest.insertMany(sampleData);
    return { seeded: true, count: seeded.length, message: 'Successfully seeded sample food requests' };
  }
}

module.exports = new FoodRequestService();
