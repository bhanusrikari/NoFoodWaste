const notificationService = require('./notification.service');

class NotificationController {
  async getAdminNotifications(req, res, next) {
    try {
      const result = await notificationService.getAdminNotifications(req.query);
      res.status(200).json({
        success: true,
        unreadCount: result.unreadCount,
        totalCount: result.totalCount,
        data: result.notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
