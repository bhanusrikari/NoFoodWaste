const Beneficiary = require('./beneficiary.model');
const FoodRequest = require('../foodRequest/foodRequest.model');
const Donation = require('../donation/donation.model');
const Delivery = require('../delivery/delivery.model');

class BeneficiaryService {
  async getAllBeneficiaries(filters = {}) {
    const query = {};

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { organizationName: searchRegex },
        { contactPerson: searchRegex },
        { phone: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { beneficiaryId: searchRegex },
      ];
    }

    if (filters.category && filters.category !== 'ALL') {
      query.category = filters.category;
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'ALL') {
      query.verificationStatus = filters.verificationStatus;
    }

    if (filters.accountStatus && filters.accountStatus !== 'ALL') {
      query.accountStatus = filters.accountStatus;
    }

    const beneficiaries = await Beneficiary.find(query).sort({ createdAt: -1 });

    // Enrich each beneficiary with current open requirements and donation history counts
    const enriched = await Promise.all(
      beneficiaries.map(async (ben) => {
        const json = ben.toJSON();

        // Find active requirements matching organization name or customer phone
        const openReqs = await FoodRequest.find({
          $or: [
            { organizationName: ben.organizationName },
            { customerName: ben.organizationName },
            { phone: ben.phone },
          ],
          status: { $in: ['SUBMITTED', 'PENDING', 'VERIFIED', 'OPEN', 'DONOR_MATCHED', 'DELIVERY_ARRANGED'] },
        });

        // Find completed donations / fulfillments delivered to this organization
        const completedDonations = await Donation.find({
          $or: [
            { 'matchedBeneficiary.organizationName': ben.organizationName },
            { 'matchedBeneficiary.customerName': ben.organizationName },
            { 'matchedBeneficiary.phone': ben.phone },
          ],
          status: { $in: ['MATCHED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED'] },
        });

        json.currentRequirementsCount = openReqs.length;
        json.previousDonationsCount = completedDonations.length;
        json.openRequirements = openReqs;
        json.previousDonations = completedDonations;

        return json;
      })
    );

    return enriched;
  }

  async getVerifiedBeneficiaries() {
    const verified = await Beneficiary.find({
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
    }).sort({ organizationName: 1 });

    return verified.map((b) => b.toJSON());
  }

  async getBeneficiaryById(id) {
    let beneficiary;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      beneficiary = await Beneficiary.findById(id);
    } else {
      beneficiary = await Beneficiary.findOne({ beneficiaryId: id });
    }

    if (!beneficiary) {
      const error = new Error('Beneficiary organization not found');
      error.statusCode = 404;
      throw error;
    }

    const json = beneficiary.toJSON();

    // Fetch full food requirements history
    const foodRequests = await FoodRequest.find({
      $or: [
        { organizationName: beneficiary.organizationName },
        { customerName: beneficiary.organizationName },
        { phone: beneficiary.phone },
      ],
    }).sort({ createdAt: -1 });

    // Fetch full donation history
    const donations = await Donation.find({
      $or: [
        { 'matchedBeneficiary.organizationName': beneficiary.organizationName },
        { 'matchedBeneficiary.customerName': beneficiary.organizationName },
        { 'matchedBeneficiary.phone': beneficiary.phone },
      ],
    }).sort({ createdAt: -1 });

    json.foodRequests = foodRequests.map((r) => r.toJSON());
    json.donations = donations.map((d) => d.toJSON());
    json.currentRequirementsCount = foodRequests.filter((r) =>
      ['SUBMITTED', 'PENDING', 'VERIFIED', 'OPEN', 'DONOR_MATCHED', 'DELIVERY_ARRANGED'].includes(r.status)
    ).length;
    json.previousDonationsCount = donations.length;

    return json;
  }

  async createBeneficiary(data) {
    const beneficiary = await Beneficiary.create(data);
    return beneficiary.toJSON();
  }

  async updateBeneficiary(id, data) {
    let beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) beneficiary = await Beneficiary.findOne({ beneficiaryId: id });

    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      throw error;
    }

    Object.assign(beneficiary, data);
    await beneficiary.save();
    return beneficiary.toJSON();
  }

  async verifyBeneficiary(id) {
    let beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) beneficiary = await Beneficiary.findOne({ beneficiaryId: id });

    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      throw error;
    }

    beneficiary.verificationStatus = 'VERIFIED';
    beneficiary.rejectionReason = '';
    await beneficiary.save();
    return beneficiary.toJSON();
  }

  async rejectBeneficiary(id, reason) {
    let beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) beneficiary = await Beneficiary.findOne({ beneficiaryId: id });

    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      throw error;
    }

    beneficiary.verificationStatus = 'REJECTED';
    beneficiary.rejectionReason = reason || 'Documentation or eligibility verification failed';
    await beneficiary.save();
    return beneficiary.toJSON();
  }

  async toggleStatus(id) {
    let beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) beneficiary = await Beneficiary.findOne({ beneficiaryId: id });

    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      throw error;
    }

    beneficiary.accountStatus = beneficiary.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await beneficiary.save();
    return beneficiary.toJSON();
  }

  async seedInitialBeneficiaries() {
    const count = await Beneficiary.countDocuments();
    if (count === 0) {
      await Beneficiary.create([
        {
          organizationName: 'St. Jude Children Home',
          category: "Children's Home",
          contactPerson: 'Sister Mary Joseph',
          phone: '+91 91234 56789',
          email: 'stjude@childrenhome.org',
          location: 'Banjara Hills, Hyderabad',
          city: 'Hyderabad',
          peopleServed: 120,
          verificationStatus: 'VERIFIED',
          accountStatus: 'ACTIVE',
          notes: 'Verified non-profit children care center.',
        },
        {
          organizationName: 'Hope Foundation Shelter',
          category: 'Shelter',
          contactPerson: 'Ramesh Reddy',
          phone: '+91 98765 11111',
          email: 'contact@hopeshelter.org',
          location: 'Jubilee Hills, Hyderabad',
          city: 'Hyderabad',
          peopleServed: 85,
          verificationStatus: 'VERIFIED',
          accountStatus: 'ACTIVE',
          notes: 'Verified night shelter for homeless individuals.',
        },
        {
          organizationName: 'Sunshine Old Age Home',
          category: 'Old-Age Home',
          contactPerson: 'Anuradha Rao',
          phone: '+91 99887 76655',
          email: 'info@sunshineoldage.org',
          location: 'Secunderabad, Hyderabad',
          city: 'Hyderabad',
          peopleServed: 60,
          verificationStatus: 'PENDING_VERIFICATION',
          accountStatus: 'ACTIVE',
          notes: 'Registration submitted, awaiting government trust certificate verification.',
        },
        {
          organizationName: 'City Angels Orphanage',
          category: 'Orphanage',
          contactPerson: 'David Kumar',
          phone: '+91 94400 33221',
          email: 'david@cityangels.org',
          location: 'Kukatpally, Hyderabad',
          city: 'Hyderabad',
          peopleServed: 150,
          verificationStatus: 'VERIFIED',
          accountStatus: 'ACTIVE',
          notes: 'Provides shelter and education to orphaned children.',
        },
      ]);
      console.log('✓ Initial seed beneficiaries created successfully');
    }
  }
}

module.exports = new BeneficiaryService();
