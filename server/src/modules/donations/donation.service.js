const mongoose = require('mongoose');
const Donation = require('./donation.model');
const DonationInterest = require('./donationInterest.model');

class DonationService {
  async getAvailableDonations() {
    const donations = await Donation.find({ status: 'AVAILABLE' }).sort({ createdAt: -1 });
    return donations.map((doc) => doc.toJSON());
  }

  async getDonationById(donationId, customerId) {
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    const donationObj = donation.toJSON();

    if (customerId) {
      const interest = await DonationInterest.findOne({
        donation: donationId,
        customer: customerId,
      });
      donationObj.myInterest = interest ? interest.toJSON() : null;
    }

    return donationObj;
  }

  async expressInterest(donationId, customerId) {
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      throw error;
    }

    if (donation.status !== 'AVAILABLE') {
      const error = new Error('This donation is no longer available.');
      error.statusCode = 409;
      throw error;
    }

    // Check existing interest
    let existingInterest = await DonationInterest.findOne({
      donation: donationId,
      customer: customerId,
    });

    if (existingInterest) {
      if (['INTERESTED', 'SELECTED'].includes(existingInterest.status)) {
        const error = new Error('You have already expressed interest in this food donation.');
        error.statusCode = 409;
        throw error;
      }

      // Re-activate if previously withdrawn
      existingInterest.status = 'INTERESTED';
      await existingInterest.save();
      return existingInterest.toJSON();
    }

    const newInterest = await DonationInterest.create({
      donation: donationId,
      customer: customerId,
      status: 'INTERESTED',
    });

    return newInterest.toJSON();
  }

  async getCustomerInterests(customerId) {
    const interests = await DonationInterest.find({ customer: customerId })
      .populate('donation')
      .sort({ createdAt: -1 });

    return interests.map((doc) => doc.toJSON());
  }

  async withdrawInterest(interestId, customerId) {
    if (!mongoose.Types.ObjectId.isValid(interestId)) {
      const error = new Error('Interest record not found');
      error.statusCode = 404;
      throw error;
    }

    const interest = await DonationInterest.findById(interestId);
    if (!interest) {
      const error = new Error('Interest record not found');
      error.statusCode = 404;
      throw error;
    }

    if (interest.customer.toString() !== customerId.toString()) {
      const error = new Error('Forbidden: You can only manage your own donation interests');
      error.statusCode = 403;
      throw error;
    }

    if (interest.status === 'SELECTED') {
      const error = new Error('Cannot withdraw interest after selection.');
      error.statusCode = 409;
      throw error;
    }

    if (interest.status === 'WITHDRAWN') {
      return interest.toJSON();
    }

    interest.status = 'WITHDRAWN';
    await interest.save();

    return interest.toJSON();
  }
}

module.exports = new DonationService();
