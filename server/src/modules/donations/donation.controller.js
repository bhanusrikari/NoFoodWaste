const donationService = require('./donation.service');

class DonationController {
  async getAvailableDonations(req, res, next) {
    try {
      const donations = await donationService.getAvailableDonations();
      return res.status(200).json({
        success: true,
        data: donations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDonationById(req, res, next) {
    try {
      const customerId = req.user.id;
      const donationId = req.params.id;

      const donation = await donationService.getDonationById(donationId, customerId);

      return res.status(200).json({
        success: true,
        data: donation,
      });
    } catch (error) {
      next(error);
    }
  }

  async expressInterest(req, res, next) {
    try {
      const customerId = req.user.id;
      const donationId = req.params.id;

      const interest = await donationService.expressInterest(donationId, customerId);

      return res.status(201).json({
        success: true,
        message: 'Interest registered successfully',
        data: interest,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyInterests(req, res, next) {
    try {
      const customerId = req.user.id;
      const interests = await donationService.getCustomerInterests(customerId);

      return res.status(200).json({
        success: true,
        data: interests,
      });
    } catch (error) {
      next(error);
    }
  }

  async withdrawInterest(req, res, next) {
    try {
      const customerId = req.user.id;
      const interestId = req.params.id;

      const interest = await donationService.withdrawInterest(interestId, customerId);

      return res.status(200).json({
        success: true,
        message: 'Interest withdrawn successfully',
        data: interest,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DonationController();
