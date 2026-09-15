const collectionService = require('./collection.service');

class CollectionController {
  /**
   * POST /api/collections
   * Supports both multipart/form-data (with req.file) and application/json
   */
  async createCollection(req, res, next) {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.collectionPhotoUrl = `/uploads/${req.file.filename}`;
      }

      // If collectedQuantity is sent as number or string from form-data
      if (data.collectedQuantity && typeof data.collectedQuantity !== 'object') {
        try {
          data.collectedQuantity = JSON.parse(data.collectedQuantity);
        } catch (e) {
          data.collectedQuantity = {
            value: Number(data.collectedQuantity),
            unit: data.quantityUnit || 'MEALS',
          };
        }
      }

      const collection = await collectionService.createCollection(data, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Collection recorded successfully',
        collection,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/collections/assignment/:assignmentId
   */
  async getByAssignment(req, res, next) {
    try {
      const collection = await collectionService.getByAssignmentId(req.params.assignmentId);
      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Collection not found for this assignment',
        });
      }
      return res.status(200).json({
        success: true,
        collection,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CollectionController();
