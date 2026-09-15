const Notification = require('./notification.model');

class NotificationService {
  /**
   * Create a notification
   */
  async create(data) {
    const notification = await Notification.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'GENERAL',
      relatedAssignmentId: data.relatedAssignmentId || null,
    });
    return notification.toJSON();
  }

  /**
   * Get notifications for a user
   */
  async getByUserId(userId, limit = 20) {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    return notifications.map((n) => n.toJSON());
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, read: false });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    return notification.toJSON();
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.updateMany({ userId, read: false }, { read: true });
  }
}

module.exports = new NotificationService();
