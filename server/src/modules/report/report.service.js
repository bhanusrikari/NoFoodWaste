const Report = require('./report.model');
const notificationService = require('../notification/notification.service');
const activityLogService = require('../activityLog/activityLog.service');

class ReportService {
  async createReport(data, user = null) {
    const {
      reporterName,
      reporterEmail,
      reporterRole,
      issueType,
      relatedEntity,
      relatedEntityId,
      description,
      priority,
    } = data;

    const newReport = await Report.create({
      reporterName: reporterName || (user ? user.name : 'Anonymous Reporter'),
      reporterEmail: reporterEmail || (user ? user.email : ''),
      reporterRole: reporterRole || (user ? user.role : 'CUSTOMER'),
      issueType: issueType || 'OTHER',
      relatedEntity: relatedEntity || 'Delivery',
      relatedEntityId: relatedEntityId || '',
      description: description.trim(),
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      logs: [
        {
          status: 'OPEN',
          note: `Issue reported: ${description.slice(0, 80)}...`,
          updatedBy: reporterName || (user ? user.name : 'Reporter'),
          timestamp: new Date(),
        },
      ],
    });

    // Send Notification to Admin
    await notificationService.createNotification({
      title: `New Issue Report (${newReport.issueType})`,
      message: `Report ${newReport.reportId} submitted by ${newReport.reporterName}: ${newReport.description.slice(0, 60)}`,
      type: 'REPORT_SUBMITTED',
      relatedEntity: 'Report',
      relatedEntityId: newReport.reportId,
    });

    // Log Activity
    await activityLogService.logActivity({
      actorName: newReport.reporterName,
      actorEmail: newReport.reporterEmail,
      actorRole: newReport.reporterRole,
      actionType: 'USER_SUBMITTED_ISSUE_REPORT',
      relatedEntity: 'Report',
      relatedEntityId: newReport.reportId,
      previousStatus: '',
      newStatus: 'OPEN',
      details: `Reported issue '${newReport.issueType}' for ${newReport.relatedEntity} ${newReport.relatedEntityId}`,
    });

    return newReport.toJSON();
  }

  async getAllReports(query = {}) {
    const { status, issueType, priority, search } = query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    if (issueType && issueType !== 'ALL') {
      filter.issueType = issueType;
    }

    if (priority && priority !== 'ALL') {
      filter.priority = priority.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { reportId: searchRegex },
        { reporterName: searchRegex },
        { reporterEmail: searchRegex },
        { description: searchRegex },
        { relatedEntityId: searchRegex },
      ];
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 });
    const allReports = await Report.find({});

    const stats = {
      total: allReports.length,
      open: allReports.filter((r) => r.status === 'OPEN').length,
      investigating: allReports.filter((r) => r.status === 'INVESTIGATING').length,
      resolved: allReports.filter((r) => r.status === 'RESOLVED').length,
      closed: allReports.filter((r) => r.status === 'CLOSED').length,
      urgent: allReports.filter((r) => r.priority === 'URGENT').length,
    };

    return {
      reports: reports.map((r) => r.toJSON()),
      stats,
    };
  }

  async getReportById(id) {
    let report;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id);
    } else {
      report = await Report.findOne({ reportId: id });
    }

    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      throw error;
    }

    return report.toJSON();
  }

  async updateReportStatus(id, { status, priority, resolutionNotes }, adminUser = null) {
    let report;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id);
    } else {
      report = await Report.findOne({ reportId: id });
    }

    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      throw error;
    }

    const previousStatus = report.status;

    if (status) {
      const validStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        const error = new Error(`Invalid status '${status}'`);
        error.statusCode = 400;
        throw error;
      }
      report.status = status;
    }

    if (priority) {
      report.priority = priority;
    }

    if (resolutionNotes !== undefined) {
      report.resolutionNotes = resolutionNotes.trim();
    }

    report.logs.push({
      status: report.status,
      note: resolutionNotes ? `Resolution Note: ${resolutionNotes}` : `Status updated to ${report.status}`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    await report.save();

    // Log Activity Audit
    await activityLogService.logActivity({
      actorName: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      actorEmail: adminUser ? adminUser.email || '' : '',
      actorRole: 'ADMIN',
      actionType: 'ADMIN_UPDATED_ISSUE_REPORT',
      relatedEntity: 'Report',
      relatedEntityId: report.reportId,
      previousStatus,
      newStatus: report.status,
      details: `Report status updated to ${report.status} (Priority: ${report.priority})`,
    });

    return report.toJSON();
  }

  async seedSampleReports() {
    const count = await Report.countDocuments();
    if (count > 0) {
      return { seeded: false, count, message: 'Reports already exist' };
    }

    const sampleReports = [
      {
        reportId: 'REP-4001',
        reporterName: 'Hope Foundation Shelter',
        reporterEmail: 'hope@ngo.org',
        reporterRole: 'CUSTOMER',
        issueType: 'INCORRECT_QUANTITY',
        relatedEntity: 'Delivery',
        relatedEntityId: 'DEL-8001',
        description: 'Received 140 meals instead of 150 meals from Taj Hotel delivery.',
        priority: 'MEDIUM',
        status: 'INVESTIGATING',
        resolutionNotes: 'Contacted Taj Hotel kitchen staff to clarify dispatch count.',
        logs: [
          { status: 'OPEN', note: 'Discrepancy in meal count reported', updatedBy: 'Hope Shelter', timestamp: new Date(Date.now() - 7200000) },
          { status: 'INVESTIGATING', note: 'Assigned admin investigation', updatedBy: 'Admin', timestamp: new Date(Date.now() - 3600000) },
        ],
      },
      {
        reportId: 'REP-4002',
        reporterName: 'Vikram Singh',
        reporterEmail: 'vikram.volunteer@nofoodwaste.org',
        reporterRole: 'VOLUNTEER',
        issueType: 'DELIVERY_ISSUE',
        relatedEntity: 'Delivery',
        relatedEntityId: 'DEL-8005',
        description: 'Pickup location gate was locked and donor phone line was busy.',
        priority: 'HIGH',
        status: 'OPEN',
        resolutionNotes: '',
        logs: [
          { status: 'OPEN', note: 'Volunteer reported unable to complete pickup', updatedBy: 'Vikram Singh', timestamp: new Date(Date.now() - 10800000) },
        ],
      },
      {
        reportId: 'REP-4003',
        reporterName: 'St. Jude Orphanage',
        reporterEmail: 'stjude@home.org',
        reporterRole: 'CUSTOMER',
        issueType: 'FOOD_QUALITY',
        relatedEntity: 'Donation',
        relatedEntityId: 'DON-2003',
        description: 'All 200 packaged meal kits arrived in immaculate quality. Excellent service!',
        priority: 'LOW',
        status: 'RESOLVED',
        resolutionNotes: 'Positive feedback logged & forwarded to Fresh Mart Supermarket.',
        logs: [
          { status: 'OPEN', note: 'Quality report logged', updatedBy: 'St. Jude Home', timestamp: new Date(Date.now() - 86400000) },
          { status: 'RESOLVED', note: 'Verified and closed', updatedBy: 'Admin', timestamp: new Date(Date.now() - 43200000) },
        ],
      },
    ];

    const seeded = await Report.insertMany(sampleReports);
    return { seeded: true, count: seeded.length, message: 'Successfully seeded sample issue reports' };
  }
}

module.exports = new ReportService();
