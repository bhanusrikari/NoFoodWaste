const deliveryService = require('./delivery.service');

class DeliveryController {
  async getPendingAssignments(req, res, next) {
    try {
      const data = await deliveryService.getPendingAssignments(req.query);
      res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAvailableResources(req, res, next) {
    try {
      const numberOfMeals = req.query.numberOfMeals ? Number(req.query.numberOfMeals) : 0;
      const data = await deliveryService.getAvailableResources(numberOfMeals);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async assignDeliveryResources(req, res, next) {
    try {
      const { volunteerId, vehicleId } = req.body;
      if (!volunteerId || !vehicleId) {
        return res.status(400).json({
          success: false,
          message: 'Both volunteerId and vehicleId are required',
        });
      }

      const updated = await deliveryService.assignDeliveryResources(
        req.params.id,
        { volunteerId, vehicleId },
        req.user
      );

      res.status(200).json({
        success: true,
        message: `Successfully assigned Volunteer and Vehicle to Delivery`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async reassignDeliveryResources(req, res, next) {
    try {
      const { volunteerId, vehicleId } = req.body;
      if (!volunteerId || !vehicleId) {
        return res.status(400).json({
          success: false,
          message: 'Both volunteerId and vehicleId are required for reassignment',
        });
      }

      const updated = await deliveryService.reassignDeliveryResources(
        req.params.id,
        { volunteerId, vehicleId },
        req.user
      );

      res.status(200).json({
        success: true,
        message: `Successfully reassigned Delivery resources`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelDeliveryAssignment(req, res, next) {
    try {
      const { reason } = req.body;
      const updated = await deliveryService.cancelDeliveryAssignment(
        req.params.id,
        { reason },
        req.user
      );

      res.status(200).json({
        success: true,
        message: `Delivery assignment cancelled successfully`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllDeliveries(req, res, next) {
    try {
      const result = await deliveryService.getAllDeliveries(req.query);
      res.status(200).json({
        success: true,
        count: result.deliveries.length,
        stats: result.stats,
        data: result.deliveries,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDeliveryById(req, res, next) {
    try {
      const delivery = await deliveryService.getDeliveryById(req.params.id);
      res.status(200).json({
        success: true,
        data: delivery,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDeliveryStatus(req, res, next) {
    try {
      const { status, note, acknowledgement } = req.body;
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const updated = await deliveryService.updateDeliveryStatus(
        req.params.id,
        { status, note, acknowledgement },
        req.user
      );

      res.status(200).json({
        success: true,
        message: `Delivery status updated to ${status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DeliveryController();
