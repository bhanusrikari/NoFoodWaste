const exceptionService = require('./exception.service');

class ExceptionController {
  async handleVolunteerRejection(req, res, next) {
    try {
      const { deliveryId, reason } = req.body;
      if (!deliveryId) {
        return res.status(400).json({
          success: false,
          message: 'deliveryId is required',
        });
      }

      const updated = await exceptionService.handleVolunteerRejection(
        deliveryId,
        { volunteerId: req.user ? req.user.id : null, reason },
        req.user
      );

      res.status(200).json({
        success: true,
        message: 'Volunteer rejection recorded. Delivery moved to PENDING_REASSIGNMENT',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async handlePartialFulfillment(req, res, next) {
    try {
      const { donationId, requestId, fulfilledQuantity, notes } = req.body;
      if (!donationId || !requestId || !fulfilledQuantity) {
        return res.status(400).json({
          success: false,
          message: 'donationId, requestId, and fulfilledQuantity are required',
        });
      }

      const result = await exceptionService.handlePartialFulfillment(
        donationId,
        requestId,
        { fulfilledQuantity, notes },
        req.user
      );

      res.status(200).json({
        success: true,
        message: `Partial fulfillment processed: ${result.fulfilled} meals fulfilled, ${result.remaining} meals remaining`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async handleCancellation(req, res, next) {
    try {
      const { entityType, entityId, reason } = req.body;
      if (!entityType || !entityId) {
        return res.status(400).json({
          success: false,
          message: 'entityType and entityId are required',
        });
      }

      const result = await exceptionService.handleCancellation(
        entityType,
        entityId,
        { reason },
        req.user
      );

      res.status(200).json({
        success: true,
        message: `${entityType} cancellation processed successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExceptionController();
