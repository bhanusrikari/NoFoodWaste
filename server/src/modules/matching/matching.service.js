const FoodRequest = require('../foodRequest/foodRequest.model');
const Donation = require('../donation/donation.model');
const Delivery = require('../delivery/delivery.model');

class MatchingService {
  // Core Scoring Engine - Can later be augmented with AI/ML embeddings
  calculateMatchScore(request, donation) {
    const reasons = [];

    // 1. Food Type Compatibility Check (Mandatory filter)
    if (request.foodType === 'Veg' && donation.foodType === 'Non-Veg') {
      return { score: 0, distanceKm: 8.5, reasons: ['Incompatible food type: Veg requirement cannot accept Non-Veg donation'] };
    }

    let foodTypeScore = 100;
    if (request.foodType === donation.foodType) {
      reasons.push(`Compatible Food Type (${donation.foodType})`);
    } else if (request.foodType === 'Both' || donation.foodType === 'Both') {
      foodTypeScore = 90;
      reasons.push(`Flexibly compatible Food Type (${donation.foodType} for ${request.foodType})`);
    } else {
      foodTypeScore = 60;
    }

    // 2. Meal Quantity Score (Weight: 30%)
    const reqMeals = Number(request.numberOfMeals) || 100;
    const donMeals = Number(donation.numberOfMeals) || 100;
    let quantityScore = 100;

    if (reqMeals === donMeals) {
      reasons.push(`Exact meal quantity match (${donMeals} meals)`);
    } else if (donMeals >= reqMeals) {
      const excess = donMeals - reqMeals;
      quantityScore = Math.max(70, 95 - excess * 0.2);
      reasons.push(`Sufficient quantity (${donMeals} meals available for ${reqMeals} requested)`);
    } else {
      const deficit = reqMeals - donMeals;
      quantityScore = Math.max(50, 90 - deficit * 0.4);
      reasons.push(`Partial fulfillment capability (${donMeals} of ${reqMeals} meals)`);
    }

    // 3. Category Compatibility Score (Weight: 15%)
    let categoryScore = 80;
    if (request.foodCategory === donation.foodCategory) {
      categoryScore = 100;
      reasons.push(`Matching Food Category (${donation.foodCategory})`);
    }

    // 4. Date & Time Score (Weight: 15%)
    let dateTimeScore = 70;
    if (request.requiredDate === donation.availableDate) {
      dateTimeScore = 100;
      reasons.push(`Date alignment (${donation.availableDate})`);
    } else {
      reasons.push(`Date proximity (${donation.availableDate || 'Today'} vs ${request.requiredDate})`);
    }

    // 5. Distance Estimate Score (Weight: 15%)
    let distanceKm = 3.2; // Default realistic distance in km
    const reqLoc = (request.location || '').toLowerCase();
    const donLoc = (donation.pickupLocation || '').toLowerCase();

    if (reqLoc && donLoc && (reqLoc.includes(donLoc) || donLoc.includes(reqLoc))) {
      distanceKm = 1.5;
    } else if (request.city && donation.city && request.city.toLowerCase() === donation.city.toLowerCase()) {
      distanceKm = 3.8;
    } else {
      distanceKm = 7.2;
    }

    const distanceScore = Math.max(40, 100 - distanceKm * 5);
    reasons.push(`Nearby location (~${distanceKm.toFixed(1)} km distance)`);

    // Weighted Final Composite Score Calculation
    const weightedScore = Math.round(
      quantityScore * 0.3 +
        foodTypeScore * 0.25 +
        categoryScore * 0.15 +
        dateTimeScore * 0.15 +
        distanceScore * 0.15
    );

    return {
      score: Math.min(99, Math.max(10, weightedScore)), // Percentage e.g. 94%
      distanceKm: Number(distanceKm.toFixed(1)),
      reasons,
    };
  }

  // Dual Entry Point 1: Customer Food Requirement ➔ Find Suitable Donors
  async findMatchesForRequest(requestId) {
    let request;
    if (requestId.match(/^[0-9a-fA-F]{24}$/)) {
      request = await FoodRequest.findById(requestId);
    } else {
      request = await FoodRequest.findOne({ requestId });
    }

    if (!request) {
      const error = new Error('Food request not found');
      error.statusCode = 404;
      throw error;
    }

    const availableDonations = await Donation.find({
      status: { $in: ['AVAILABLE', 'VERIFIED', 'SUBMITTED'] },
    });

    const matches = availableDonations
      .map((donation) => {
        const evaluation = this.calculateMatchScore(request, donation);
        return {
          request: request.toJSON(),
          donation: donation.toJSON(),
          matchScore: evaluation.score,
          distanceKm: evaluation.distanceKm,
          reasons: evaluation.reasons,
        };
      })
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    return {
      request: request.toJSON(),
      matches,
    };
  }

  // Dual Entry Point 2: Donor Donation ➔ Find Suitable Food Requirements / Beneficiaries
  async findMatchesForDonation(donationId) {
    let donation;
    if (donationId.match(/^[0-9a-fA-F]{24}$/)) {
      donation = await Donation.findById(donationId);
    } else {
      donation = await Donation.findOne({ donationId });
    }

    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    const openRequests = await FoodRequest.find({
      status: { $in: ['SUBMITTED', 'PENDING', 'VERIFIED', 'OPEN'] },
    });

    const matches = openRequests
      .map((request) => {
        const evaluation = this.calculateMatchScore(request, donation);
        return {
          request: request.toJSON(),
          donation: donation.toJSON(),
          matchScore: evaluation.score,
          distanceKm: evaluation.distanceKm,
          reasons: evaluation.reasons,
        };
      })
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    return {
      donation: donation.toJSON(),
      matches,
    };
  }

  // System-wide Global Suggested Matches
  async getSuggestedMatches() {
    const openRequests = await FoodRequest.find({
      status: { $in: ['SUBMITTED', 'PENDING', 'VERIFIED', 'OPEN'] },
    });

    const availableDonations = await Donation.find({
      status: { $in: ['AVAILABLE', 'VERIFIED', 'SUBMITTED'] },
    });

    const candidateMatches = [];

    for (const request of openRequests) {
      for (const donation of availableDonations) {
        const evaluation = this.calculateMatchScore(request, donation);
        if (evaluation.score >= 50) {
          candidateMatches.push({
            id: `${request._id}_${donation._id}`,
            request: request.toJSON(),
            donation: donation.toJSON(),
            matchScore: evaluation.score,
            distanceKm: evaluation.distanceKm,
            reasons: evaluation.reasons,
          });
        }
      }
    }

    // Sort by highest match score percentage
    candidateMatches.sort((a, b) => b.matchScore - a.matchScore);

    return candidateMatches;
  }

  // Admin Approve Match Action
  async approveMatch(requestId, donationId, adminUser = null) {
    let request = await FoodRequest.findById(requestId);
    if (!request) request = await FoodRequest.findOne({ requestId });

    let donation = await Donation.findById(donationId);
    if (!donation) donation = await Donation.findOne({ donationId });

    if (!request || !donation) {
      const error = new Error('Request or Donation record not found for match approval');
      error.statusCode = 404;
      throw error;
    }

    const evaluation = this.calculateMatchScore(request, donation);

    // Update Request
    request.matchedDonor = donation._id;
    request.matchedDonorDetails = {
      donorName: donation.donorName,
      phone: donation.phone,
      foodTitle: donation.foodTitle,
      pickupLocation: donation.pickupLocation,
    };
    request.status = 'DONOR_MATCHED';
    request.lifecycleLogs.push({
      status: 'DONOR_MATCHED',
      note: `Match approved by admin (Score: ${evaluation.score}% - ${donation.donorName})`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    // Update Donation
    donation.matchedRequest = request._id;
    donation.matchedBeneficiary = {
      customerName: request.customerName,
      organizationName: request.organizationName || '',
      phone: request.phone,
      location: request.location,
      requestId: request.requestId,
    };
    donation.status = 'MATCHED';
    donation.lifecycleLogs.push({
      status: 'MATCHED',
      note: `Match approved by admin (Score: ${evaluation.score}% - ${request.customerName})`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    // Create / Link Converged Delivery Record
    const delivery = await Delivery.create({
      foodRequest: request._id,
      donation: donation._id,
      customerName: request.customerName,
      donorName: donation.donorName,
      volunteerName: 'Rahul Sharma',
      volunteerPhone: '+91 91234 11111',
      numberOfMeals: Math.min(donation.numberOfMeals, request.numberOfMeals),
      pickupLocation: donation.pickupLocation,
      deliveryLocation: request.location,
      status: 'ASSIGNED',
      currentStage: 'Volunteer Assigned',
    });

    request.delivery = delivery._id;
    request.deliveryDetails = {
      deliveryId: delivery.deliveryId,
      volunteerName: 'Rahul Sharma',
      status: 'ASSIGNED',
    };

    donation.delivery = delivery._id;
    donation.volunteerDetails = {
      volunteerName: 'Rahul Sharma',
      vehicleNumber: 'TS 09 EQ 4521',
      phone: '+91 91234 11111',
    };

    await request.save();
    await donation.save();

    return {
      success: true,
      message: `Match approved successfully (${evaluation.score}% Match Score)`,
      request: request.toJSON(),
      donation: donation.toJSON(),
      delivery: delivery.toJSON(),
    };
  }

  // Admin Reject Match Action
  async rejectMatch(requestId, donationId, reason, adminUser = null) {
    let request = await FoodRequest.findById(requestId);
    if (!request) request = await FoodRequest.findOne({ requestId });

    if (request) {
      request.lifecycleLogs.push({
        status: request.status,
        note: `Suggested match rejected by admin: ${reason || 'Incompatible pair'}`,
        updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
        timestamp: new Date(),
      });
      await request.save();
    }

    return {
      success: true,
      message: 'Match suggestion rejected',
    };
  }
}

module.exports = new MatchingService();
