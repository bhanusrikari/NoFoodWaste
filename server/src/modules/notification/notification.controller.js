const notificationService = require('./notification.service');

class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getByUserId(req.user.id);
      const unreadCount = await notificationService.getUnreadCount(req.user.id);
      return res.status(200).json({
        success: true,
        notifications,
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        notification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
