const vehicleService = require('./vehicle.service');

class VehicleController {
  async getAllVehicles(req, res, next) {
    try {
      const vehicles = await vehicleService.getAllVehicles(req.query);
      return res.status(200).json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVehicleById(req, res, next) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getVehicleById(id);
      return res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req, res, next) {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
      return res.status(201).json({
        success: true,
        message: 'Vehicle added successfully',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.updateVehicle(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Vehicle details updated successfully',
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.toggleStatus(id);
      return res.status(200).json({
        success: true,
        message: `Vehicle account status updated to ${vehicle.accountStatus}`,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVehicleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const vehicle = await vehicleService.updateVehicleStatus(id, status);
      return res.status(200).json({
        success: true,
        message: `Vehicle operational status updated to ${vehicle.status}`,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignDelivery(req, res, next) {
    try {
      const { vehicleId, deliveryId } = req.body;
      if (!vehicleId || !deliveryId) {
        return res.status(400).json({
          success: false,
          message: 'Both vehicleId and deliveryId are required for assignment',
        });
      }

      const result = await vehicleService.assignVehicleToDelivery(vehicleId, deliveryId);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VehicleController();
