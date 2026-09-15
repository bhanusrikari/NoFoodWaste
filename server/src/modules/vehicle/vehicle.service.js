const Vehicle = require('./vehicle.model');

class VehicleService {
  async createVehicle(data) {
    const vehicle = await Vehicle.create({
      ownerId: data.ownerId || null,
      vehicleNumber: data.vehicleNumber,
      vehicleType: data.vehicleType,
      capacity: data.capacity,
      status: data.status || 'AVAILABLE',
      currentLocation: data.currentLocation || {},
    });
    return vehicle.toJSON();
  }

  async getAllVehicles(filter = {}) {
    const vehicles = await Vehicle.find(filter).sort({ vehicleNumber: 1 });
    return vehicles.map((v) => v.toJSON());
  }

  async getAvailableVehicles() {
    const vehicles = await Vehicle.find({ status: 'AVAILABLE' }).sort({ vehicleNumber: 1 });
    return vehicles.map((v) => v.toJSON());
  }

  async getVehicleById(id) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      const error = new Error('Vehicle not found');
      error.statusCode = 404;
      throw error;
    }
    return vehicle.toJSON();
  }
}

module.exports = new VehicleService();
