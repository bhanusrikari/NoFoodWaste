const volunteerService = require('./volunteer.service');

class VolunteerController {
  async getAllVolunteers(req, res, next) {
    try {
      const volunteers = await volunteerService.getAllVolunteers(req.query);
      return res.status(200).json({
        success: true,
        data: volunteers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVolunteerById(req, res, next) {
    try {
      const { id } = req.params;
      const volunteer = await volunteerService.getVolunteerById(id);
      return res.status(200).json({
        success: true,
        data: volunteer,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVolunteerProfile(req, res, next) {
    try {
      const { id } = req.params;
      const volunteer = await volunteerService.updateVolunteerProfile(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Volunteer profile updated successfully',
        data: volunteer,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyVolunteer(req, res, next) {
    try {
      const { id } = req.params;
      const volunteer = await volunteerService.verifyVolunteer(id);
      return res.status(200).json({
        success: true,
        message: 'Volunteer verified successfully',
        data: volunteer,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectVolunteer(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const volunteer = await volunteerService.rejectVolunteer(id, reason);
      return res.status(200).json({
        success: true,
        message: 'Volunteer verification rejected',
        data: volunteer,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const volunteer = await volunteerService.toggleStatus(id);
      return res.status(200).json({
        success: true,
        message: `Volunteer account status updated to ${volunteer.accountStatus}`,
        data: volunteer,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { availabilityStatus } = req.body;
      const volunteer = await volunteerService.updateAvailability(id, availabilityStatus);
      return res.status(200).json({
        success: true,
        message: `Volunteer availability updated to ${volunteer.availabilityStatus}`,
        data: volunteer,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignDelivery(req, res, next) {
    try {
      const { deliveryId, volunteerId } = req.body;
      if (!deliveryId || !volunteerId) {
        return res.status(400).json({
          success: false,
          message: 'Both deliveryId and volunteerId are required for assignment',
        });
      }

      const result = await volunteerService.assignVolunteerToDelivery(deliveryId, volunteerId);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VolunteerController();
