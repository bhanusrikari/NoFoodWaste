const assignmentService = require('./assignment.service');

class AssignmentController {
  /**
   * POST /api/assignments (Admin creates assignment)
   */
  async createAssignment(req, res, next) {
    try {
      const assignment = await assignmentService.createAssignment(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/assignments/my
   */
  async getMyAssignments(req, res, next) {
    try {
      const assignments = await assignmentService.getMyAssignments(req.user.id);
      return res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/assignments/my-active
   */
  async getMyActiveAssignment(req, res, next) {
    try {
      const assignment = await assignmentService.getMyActiveAssignment(req.user.id);
      return res.status(200).json({
        success: true,
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/assignments/my-history
   */
  async getMyHistory(req, res, next) {
    try {
      const assignments = await assignmentService.getMyHistory(req.user.id);
      return res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/assignments/:id
   */
  async getAssignment(req, res, next) {
    try {
      const assignment = await assignmentService.getAssignmentById(
        req.params.id,
        req.user.id,
        req.user.role
      );
      return res.status(200).json({
        success: true,
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/assignments/:id/accept
   */
  async acceptAssignment(req, res, next) {
    try {
      const assignment = await assignmentService.acceptAssignment(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Assignment accepted',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/assignments/:id/start-pickup
   */
  async startPickup(req, res, next) {
    try {
      const assignment = await assignmentService.startPickup(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Pickup started',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/assignments/:id/collect
   */
  async confirmCollection(req, res, next) {
    try {
      const assignment = await assignmentService.confirmCollection(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Collection confirmed',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/assignments/:id/start-transport
   */
  async startTransport(req, res, next) {
    try {
      const assignment = await assignmentService.startTransport(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Transport started',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/assignments/:id/deliver
   */
  async confirmDelivery(req, res, next) {
    try {
      const assignment = await assignmentService.confirmDelivery(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Delivery confirmed. Awaiting beneficiary acknowledgement.',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/assignments/:id/acknowledge
   * (Beneficiary acknowledgement / Admin verification)
   */
  async acknowledgeReceipt(req, res, next) {
    try {
      const assignment = await assignmentService.acknowledgeReceipt(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Delivery receipt acknowledged. Assignment completed.',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/assignments/:id/cancel
   */
  async cancelAssignment(req, res, next) {
    try {
      const assignment = await assignmentService.cancelAssignment(
        req.params.id,
        req.user.id,
        req.body.reason
      );
      return res.status(200).json({
        success: true,
        message: 'Assignment cancelled',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssignmentController();
