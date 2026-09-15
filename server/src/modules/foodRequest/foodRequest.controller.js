const foodRequestService = require('./foodRequest.service');
const { validateCreateFoodRequestInput, validateStatusUpdateInput } = require('./foodRequest.validation');

class FoodRequestController {
  async getAllRequests(req, res, next) {
    try {
      const { status, date, location, foodType, foodCategory, search } = req.query;
      const result = await foodRequestService.getAllFoodRequests({
        status,
        date,
        location,
        foodType,
        foodCategory,
        search,
      });

      return res.status(200).json({
        success: true,
        data: result.requests,
        stats: result.stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const request = await foodRequestService.getFoodRequestById(id);
      return res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRequest(req, res, next) {
    try {
      const validation = validateCreateFoodRequestInput(req.body, req.user);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', '),
        });
      }

      const request = await foodRequestService.createFoodRequest(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Food requirement submitted successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const validation = validateStatusUpdateInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', '),
        });
      }

      const updatedRequest = await foodRequestService.updateRequestStatus(id, req.body, req.user);
      return res.status(200).json({
        success: true,
        message: `Food requirement status updated to ${updatedRequest.status}`,
        data: updatedRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async manualMatchDonor(req, res, next) {
    try {
      const { id } = req.params;
      const { donationId } = req.body;

      if (!donationId) {
        return res.status(400).json({
          success: false,
          message: 'Donation ID is required for donor matching',
        });
      }

      const updatedRequest = await foodRequestService.manualMatchDonor(id, donationId, req.user);
      return res.status(200).json({
        success: true,
        message: 'Donor successfully matched to food requirement',
        data: updatedRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableDonations(req, res, next) {
    try {
      const donations = await foodRequestService.getAvailableDonations();
      return res.status(200).json({
        success: true,
        data: donations,
      });
    } catch (error) {
      next(error);
    }
  }

  async seedRequests(req, res, next) {
    try {
      const result = await foodRequestService.seedSampleRequests();
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FoodRequestController();
