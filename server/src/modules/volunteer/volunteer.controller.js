const volunteerService = require('./volunteer.service');

class VolunteerController {
  /**
   * GET /api/volunteers/me
   */
  async getProfile(req, res, next) {
    try {
      const profile = await volunteerService.getOrCreateProfile(req.user.id);
      return res.status(200).json({
        success: true,
        volunteer: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/volunteers/me/availability
   */
  async updateAvailability(req, res, next) {
    try {
      const { availability } = req.body;

      if (!availability) {
        return res.status(400).json({
          success: false,
          message: 'Availability is required',
        });
      }

      const profile = await volunteerService.updateAvailability(req.user.id, availability);
      return res.status(200).json({
        success: true,
        message: `Availability updated to ${availability}`,
        volunteer: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/volunteers/me/location
   */
  async updateLocation(req, res, next) {
    try {
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required',
        });
      }

      const profile = await volunteerService.updateLocation(
        req.user.id,
        Number(latitude),
        Number(longitude)
      );

      return res.status(200).json({
        success: true,
        message: 'Location updated',
        volunteer: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VolunteerController();
