const ActivityLog = require('./activityLog.model');

class ActivityLogService {
  async logActivity({
    actorName = 'System',
    actorEmail = '',
    actorRole = 'SYSTEM',
    actionType,
    relatedEntity = 'System',
    relatedEntityId = '',
    previousStatus = '',
    newStatus = '',
    details = '',
  }) {
    const logEntry = await ActivityLog.create({
      actorName,
      actorEmail,
      actorRole,
      actionType,
      relatedEntity,
      relatedEntityId,
      previousStatus,
      newStatus,
      details,
      timestamp: new Date(),
    });

    return logEntry.toJSON();
  }

  async getAllActivityLogs(query = {}) {
    const { user, role, actionType, startDate, endDate, relatedEntityId, search } = query;
    const filter = {};

    if (role && role !== 'ALL') {
      filter.actorRole = role.toUpperCase();
    }

    if (actionType && actionType !== 'ALL') {
      filter.actionType = actionType;
    }

    if (relatedEntityId && relatedEntityId.trim()) {
      filter.relatedEntityId = relatedEntityId.trim();
    }

    if (user && user.trim()) {
      const userRegex = new RegExp(user.trim(), 'i');
      filter.$or = [{ actorName: userRegex }, { actorEmail: userRegex }];
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { logId: searchRegex },
        { actorName: searchRegex },
        { actorEmail: searchRegex },
        { actionType: searchRegex },
        { details: searchRegex },
        { relatedEntityId: searchRegex },
      ];
    }

    const logs = await ActivityLog.find(filter).sort({ timestamp: -1 });
    return logs.map((l) => l.toJSON());
  }

  async seedSampleLogs() {
    const count = await ActivityLog.countDocuments();
    if (count > 0) {
      return { seeded: false, count, message: 'Activity logs already exist' };
    }

    const now = Date.now();
    const sampleLogs = [
      {
        logId: 'LOG-9001',
        actorName: 'Hope Foundation Shelter',
        actorEmail: 'hope@ngo.org',
        actorRole: 'CUSTOMER',
        actionType: 'CUSTOMER_CREATED_FOOD_REQUEST',
        relatedEntity: 'FoodRequest',
        relatedEntityId: 'REQ-1001',
        previousStatus: '',
        newStatus: 'SUBMITTED',
        details: 'Submitted requirement for 150 meals in MG Road, Secunderabad',
        timestamp: new Date(now - 86400000),
      },
      {
        logId: 'LOG-9002',
        actorName: 'Admin System',
        actorEmail: 'admin@nofoodwaste.org',
        actorRole: 'ADMIN',
        actionType: 'ADMIN_VERIFIED_REQUEST',
        relatedEntity: 'FoodRequest',
        relatedEntityId: 'REQ-1001',
        previousStatus: 'SUBMITTED',
        newStatus: 'VERIFIED',
        details: 'Verified requirement and marked open for matching',
        timestamp: new Date(now - 80000000),
      },
      {
        logId: 'LOG-9003',
        actorName: 'Taj Hotel Kitchen',
        actorEmail: 'kitchen@taj.com',
        actorRole: 'DONOR',
        actionType: 'DONOR_CREATED_DONATION',
        relatedEntity: 'Donation',
        relatedEntityId: 'DON-2001',
        previousStatus: '',
        newStatus: 'SUBMITTED',
        details: 'Submitted donation of 150 Fresh Rice & Curry meals',
        timestamp: new Date(now - 72000000),
      },
      {
        logId: 'LOG-9004',
        actorName: 'Admin System',
        actorEmail: 'admin@nofoodwaste.org',
        actorRole: 'ADMIN',
        actionType: 'ADMIN_MATCHED_SUPPLY_DEMAND',
        relatedEntity: 'Donation',
        relatedEntityId: 'DON-2001',
        previousStatus: 'AVAILABLE',
        newStatus: 'MATCHED',
        details: 'Matched donation DON-2001 to food requirement REQ-1001 (Match Score: 98%)',
        timestamp: new Date(now - 54000000),
      },
      {
        logId: 'LOG-9005',
        actorName: 'Admin System',
        actorEmail: 'admin@nofoodwaste.org',
        actorRole: 'ADMIN',
        actionType: 'ADMIN_ASSIGNED_VOLUNTEER_VEHICLE',
        relatedEntity: 'Delivery',
        relatedEntityId: 'DEL-8001',
        previousStatus: 'PENDING_ASSIGNMENT',
        newStatus: 'ASSIGNED',
        details: 'Assigned Volunteer Rahul Sharma and Vehicle TS 09 EQ 4521 to delivery DEL-8001',
        timestamp: new Date(now - 36000000),
      },
      {
        logId: 'LOG-9006',
        actorName: 'Rahul Sharma',
        actorEmail: 'rahul.volunteer@nofoodwaste.org',
        actorRole: 'VOLUNTEER',
        actionType: 'VOLUNTEER_ACCEPTED_DELIVERY',
        relatedEntity: 'Delivery',
        relatedEntityId: 'DEL-8001',
        previousStatus: 'ASSIGNED',
        newStatus: 'ACCEPTED',
        details: 'Volunteer accepted delivery assignment DEL-8001',
        timestamp: new Date(now - 18000000),
      },
    ];

    const seeded = await ActivityLog.insertMany(sampleLogs);
    return { seeded: true, count: seeded.length, message: 'Successfully seeded sample activity logs' };
  }
}

module.exports = new ActivityLogService();
