const analyticsService = require('./analytics.service');

class AnalyticsController {
  async getAnalyticsData(req, res, next) {
    try {
      const data = await analyticsService.getAnalyticsData(req.query);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
