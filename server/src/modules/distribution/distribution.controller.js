const distributionService = require('./distribution.service');

class DistributionController {
  /**
   * POST /api/distributions
   * Supports both multipart/form-data (with req.file) and application/json
   */
  async createDistribution(req, res, next) {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.deliveryPhotoUrl = `/uploads/${req.file.filename}`;
      }

      // If distributedQuantity is sent as number or string from form-data
      if (data.distributedQuantity && typeof data.distributedQuantity !== 'object') {
        try {
          data.distributedQuantity = JSON.parse(data.distributedQuantity);
        } catch (e) {
          data.distributedQuantity = {
            value: Number(data.distributedQuantity),
            unit: data.quantityUnit || 'MEALS',
          };
        }
      }

      const distribution = await distributionService.createDistribution(data, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Distribution recorded successfully',
        distribution,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributions/assignment/:assignmentId
   */
  async getByAssignment(req, res, next) {
    try {
      const distribution = await distributionService.getByAssignmentId(req.params.assignmentId);
      if (!distribution) {
        return res.status(404).json({
          success: false,
          message: 'Distribution not found for this assignment',
        });
      }
      return res.status(200).json({
        success: true,
        distribution,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DistributionController();
