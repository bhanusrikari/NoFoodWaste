const FoodRequest = require('./foodRequest.model');

class FoodRequestService {
  async createRequest(customerId, requestData) {
    const { peopleCount, foodType, location, requiredDate, requiredTime, notes } = requestData;

    const newRequest = await FoodRequest.create({
      customer: customerId,
      peopleCount: Number(peopleCount),
      foodType: foodType.trim(),
      location: location.trim(),
      requiredDate: new Date(requiredDate),
      requiredTime: requiredTime.trim(),
      notes: notes ? notes.trim() : '',
      status: 'OPEN',
    });

    return newRequest.toJSON();
  }

  async getCustomerRequests(customerId) {
    const requests = await FoodRequest.find({ customer: customerId }).sort({ createdAt: -1 });
    return requests.map((req) => req.toJSON());
  }

  async getRequestById(requestId, customerId) {
    const request = await FoodRequest.findById(requestId);

    if (!request) {
      const error = new Error('Food request not found');
      error.statusCode = 404;
      throw error;
    }

    // Ownership Authorization Check
    if (request.customer.toString() !== customerId.toString()) {
      const error = new Error('Forbidden: You can only view your own food requests');
      error.statusCode = 403;
      throw error;
    }

    return request.toJSON();
  }
}

module.exports = new FoodRequestService();
