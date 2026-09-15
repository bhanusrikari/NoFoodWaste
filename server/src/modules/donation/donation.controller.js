const donationService = require('./donation.service');

class DonationController {
  async getAllDonations(req, res, next) {
    try {
      const { status, origin, foodType, foodCategory, search } = req.query;
      const result = await donationService.getAllDonations({
        status,
        origin,
        foodType,
        foodCategory,
        search,
      });

      return res.status(200).json({
        success: true,
        data: result.donations,
        stats: result.stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableDonations(req, res, next) {
    try {
      const donations = await donationService.getAllDonations({ status: 'AVAILABLE' });
      return res.status(200).json({
        success: true,
        data: donations.donations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDonationById(req, res, next) {
    try {
      const { id } = req.params;
      const donation = await donationService.getDonationById(id);
      return res.status(200).json({
        success: true,
        data: donation,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDonation(req, res, next) {
    try {
      const donation = await donationService.createDonation(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Donation created successfully',
        data: donation,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyDonation(req, res, next) {
    try {
      const { id } = req.params;
      const updatedDonation = await donationService.verifyDonation(id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Donation verified successfully',
        data: updatedDonation,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignBeneficiary(req, res, next) {
    try {
      const { id } = req.params;
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: 'Food Request ID is required for beneficiary assignment',
        });
      }

      const updatedDonation = await donationService.assignBeneficiary(id, requestId, req.user);
      return res.status(200).json({
        success: true,
        message: 'Beneficiary assigned and delivery workflow initiated',
        data: updatedDonation,
      });
    } catch (error) {
      next(error);
    }
  }

  async flagOrCancel(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!action || !['FLAG', 'CANCEL'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either FLAG or CANCEL',
        });
      }

      const updatedDonation = await donationService.flagOrCancelDonation(id, { action, reason }, req.user);
      return res.status(200).json({
        success: true,
        message: `Donation ${action === 'FLAG' ? 'flagged' : 'cancelled'} successfully`,
        data: updatedDonation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOpenRequests(req, res, next) {
    try {
      const openRequests = await donationService.getOpenRequestsForMatching();
      return res.status(200).json({
        success: true,
        data: openRequests,
      });
    } catch (error) {
      next(error);
    }
  }

  async seedDonations(req, res, next) {
    try {
      const result = await donationService.seedSampleDonations();
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DonationController();
