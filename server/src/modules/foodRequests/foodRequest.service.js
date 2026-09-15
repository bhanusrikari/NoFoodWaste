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

  async getTrackingInfo(requestId, customerId) {
    const request = await this.getRequestById(requestId, customerId);

    const isActive = ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(request.status);

    return {
      requestId: request.id,
      status: request.status,
      tracking: {
        active: isActive,
        vehicleLocation: request.currentLocation && request.currentLocation.latitude
          ? request.currentLocation
          : null,
        destination: request.destinationCoords && request.destinationCoords.latitude
          ? request.destinationCoords
          : null,
        pickupLocation: request.pickupCoords && request.pickupCoords.latitude
          ? request.pickupCoords
          : null,
        volunteer: request.assignedVolunteer && request.assignedVolunteer.name
          ? request.assignedVolunteer
          : null,
        vehicle: request.assignedVehicle && request.assignedVehicle.type
          ? request.assignedVehicle
          : null,
        eta: request.eta && request.eta.minutes
          ? request.eta
          : null,
      },
    };
  }

  async acknowledgeRequest(requestId, customerId) {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      const error = new Error('Food request not found');
      error.statusCode = 404;
      throw error;
    }

    const request = await FoodRequest.findById(requestId);

    if (!request) {
      const error = new Error('Food request not found');
      error.statusCode = 404;
      throw error;
    }

    // Ownership Authorization Check
    if (request.customer.toString() !== customerId.toString()) {
      const error = new Error('Forbidden: You can only acknowledge your own food requests');
      error.statusCode = 403;
      throw error;
    }

    // Idempotency Check: if already ACKNOWLEDGED, return existing record
    if (request.status === 'ACKNOWLEDGED') {
      return request.toJSON();
    }

    if (['REJECTED', 'CANCELLED'].includes(request.status)) {
      const error = new Error('Cannot acknowledge a cancelled or rejected food request');
      error.statusCode = 409;
      throw error;
    }

    if (request.status !== 'DELIVERED') {
      const error = new Error('Food delivery has not been completed yet.');
      error.statusCode = 409;
      throw error;
    }

    // Atomic / Race-safe transition from DELIVERED -> ACKNOWLEDGED
    const updatedRequest = await FoodRequest.findOneAndUpdate(
      {
        _id: requestId,
        customer: customerId,
        status: 'DELIVERED',
      },
      {
        $set: {
          status: 'ACKNOWLEDGED',
          'acknowledgement.acknowledged': true,
          'acknowledgement.acknowledgedAt': new Date(),
          'acknowledgement.acknowledgedBy': customerId,
        },
      },
      { new: true }
    );

    if (!updatedRequest) {
      const rechecked = await FoodRequest.findById(requestId);
      if (rechecked && rechecked.customer.toString() === customerId.toString() && rechecked.status === 'ACKNOWLEDGED') {
        return rechecked.toJSON();
      }
      const error = new Error('Food delivery has not been completed yet.');
      error.statusCode = 409;
      throw error;
    }

    return updatedRequest.toJSON();
  }
}

module.exports = new FoodRequestService();
