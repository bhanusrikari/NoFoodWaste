const activityLogService = require('./activityLog.service');

class ActivityLogController {
  async getAllActivityLogs(req, res, next) {
    try {
      const logs = await activityLogService.getAllActivityLogs(req.query);
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ActivityLogController();
