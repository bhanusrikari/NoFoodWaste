const matchingService = require('./matching.service');

class MatchingController {
  async getSuggestedMatches(req, res, next) {
    try {
      const matches = await matchingService.getSuggestedMatches();
      return res.status(200).json({
        success: true,
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  }

  async findMatchesForRequest(req, res, next) {
    try {
      const { id } = req.params;
      const result = await matchingService.findMatchesForRequest(id);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findMatchesForDonation(req, res, next) {
    try {
      const { id } = req.params;
      const result = await matchingService.findMatchesForDonation(id);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveMatch(req, res, next) {
    try {
      const { requestId, donationId } = req.body;
      if (!requestId || !donationId) {
        return res.status(400).json({
          success: false,
          message: 'Both requestId and donationId are required to approve a match',
        });
      }

      const result = await matchingService.approveMatch(requestId, donationId, req.user);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectMatch(req, res, next) {
    try {
      const { requestId, donationId, reason } = req.body;
      const result = await matchingService.rejectMatch(requestId, donationId, reason, req.user);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MatchingController();
