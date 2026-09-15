const vehicleService = require('./vehicle.service');

class VehicleController {
  async getAll(req, res, next) {
    try {
      const vehicles = await vehicleService.getAllVehicles();
      return res.status(200).json({ success: true, vehicles });
    } catch (error) {
      next(error);
    }
  }

  async getAvailable(req, res, next) {
    try {
      const vehicles = await vehicleService.getAvailableVehicles();
      return res.status(200).json({ success: true, vehicles });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
      return res.status(201).json({ success: true, vehicle });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id);
      return res.status(200).json({ success: true, vehicle });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VehicleController();
