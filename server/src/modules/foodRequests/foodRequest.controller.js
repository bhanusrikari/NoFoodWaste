const foodRequestService = require('./foodRequest.service');
const { validateFoodRequestInput } = require('./foodRequest.validation');

class FoodRequestController {
  async createRequest(req, res, next) {
    try {
      const validation = validateFoodRequestInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', '),
        });
      }

      // Customer ID derived strictly from req.user (JWT payload)
      const customerId = req.user.id;
      const request = await foodRequestService.createRequest(customerId, req.body);

      return res.status(201).json({
        success: true,
        message: 'Food request created successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyRequests(req, res, next) {
    try {
      const customerId = req.user.id;
      const requests = await foodRequestService.getCustomerRequests(customerId);

      return res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRequestById(req, res, next) {
    try {
      const customerId = req.user.id;
      const requestId = req.params.id;

      const request = await foodRequestService.getRequestById(requestId, customerId);

      return res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FoodRequestController();
