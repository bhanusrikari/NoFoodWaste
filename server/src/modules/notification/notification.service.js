const Notification = require('./notification.model');

class NotificationService {
  async createNotification({ title, message, type, relatedEntity = 'System', relatedEntityId = '' }) {
    const notif = await Notification.create({
      title,
      message,
      type,
      relatedEntity,
      relatedEntityId,
      isRead: false,
    });
    return notif.toJSON();
  }

  async getAdminNotifications(query = {}) {
    const { isReadFilter, type, search } = query;
    const filter = {};

    if (isReadFilter === 'unread') {
      filter.isRead = false;
    } else if (isReadFilter === 'read') {
      filter.isRead = true;
    }

    if (type && type !== 'ALL') {
      filter.type = type;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { message: searchRegex },
        { relatedEntityId: searchRegex },
      ];
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });

    const allNotifs = await Notification.find({});
    const unreadCount = allNotifs.filter((n) => !n.isRead).length;

    return {
      notifications: notifications.map((n) => n.toJSON()),
      unreadCount,
      totalCount: allNotifs.length,
    };
  }

  async markAsRead(id) {
    let notif;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      notif = await Notification.findById(id);
    } else {
      notif = await Notification.findOne({ notificationId: id });
    }

    if (!notif) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    notif.isRead = true;
    await notif.save();
    return notif.toJSON();
  }

  async markAllAsRead() {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return { success: true, message: 'All notifications marked as read' };
  }

  async seedSampleNotifications() {
    const count = await Notification.countDocuments();
    if (count > 0) {
      return { seeded: false, count, message: 'Notifications already exist' };
    }

    const sampleNotifications = [
      {
        notificationId: 'NOTIF-1001',
        title: 'New Food Requirement Pending Verification',
        message: 'Hope Foundation Shelter submitted a requirement for 150 meals in MG Road.',
        type: 'NEW_FOOD_REQUEST',
        relatedEntity: 'FoodRequest',
        relatedEntityId: 'REQ-1001',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        notificationId: 'NOTIF-1002',
        title: 'Volunteer Rejected Delivery Assignment',
        message: 'Volunteer Vikram Singh rejected assignment for delivery DEL-8005. Action required.',
        type: 'VOLUNTEER_REJECTED',
        relatedEntity: 'Delivery',
        relatedEntityId: 'DEL-8005',
        isRead: false,
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        notificationId: 'NOTIF-1003',
        title: 'Delivery Delayed Alert',
        message: 'Delivery DEL-8005 for Metro Night Shelter is overdue by 2 hours.',
        type: 'DELIVERY_DELAYED',
        relatedEntity: 'Delivery',
        relatedEntityId: 'DEL-8005',
        isRead: false,
        createdAt: new Date(Date.now() - 10800000),
      },
      {
        notificationId: 'NOTIF-1004',
        title: 'New Donation Submitted',
        message: 'Green Bakery & Cafe submitted a donation of 80 bakery items.',
        type: 'NEW_DONATION',
        relatedEntity: 'Donation',
        relatedEntityId: 'DON-2002',
        isRead: true,
        createdAt: new Date(Date.now() - 14400000),
      },
      {
        notificationId: 'NOTIF-1005',
        title: 'New Operational Issue Report Submitted',
        message: 'Report REP-4001 submitted regarding food quantity discrepancy.',
        type: 'REPORT_SUBMITTED',
        relatedEntity: 'Report',
        relatedEntityId: 'REP-4001',
        isRead: false,
        createdAt: new Date(Date.now() - 18000000),
      },
    ];

    const seeded = await Notification.insertMany(sampleNotifications);
    return { seeded: true, count: seeded.length, message: 'Successfully seeded sample notifications' };
  }
}

module.exports = new NotificationService();
