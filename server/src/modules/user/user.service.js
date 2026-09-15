const User = require('../auth/auth.model');
const FoodRequest = require('../foodRequest/foodRequest.model');
const Donation = require('../donation/donation.model');
const Delivery = require('../delivery/delivery.model');
const Vehicle = require('../vehicle/vehicle.model');
const activityLogService = require('../activityLog/activityLog.service');

class UserService {
  async getAllUsers(query = {}) {
    const { role = 'ALL', accountStatus = 'ALL', verificationStatus = 'ALL', search } = query;
    const filter = {};

    if (role && role !== 'ALL') {
      filter.role = role.toUpperCase();
    }

    if (accountStatus && accountStatus !== 'ALL') {
      filter.accountStatus = accountStatus.toUpperCase();
    }

    if (verificationStatus && verificationStatus !== 'ALL') {
      filter.verificationStatus = verificationStatus.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { organizationName: searchRegex },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    // Aggregate activity summary metrics for each user
    const usersWithSummary = await Promise.all(
      users.map(async (u) => {
        const json = u.toJSON();
        let requestsCount = 0;
        let donationsCount = 0;
        let deliveriesCount = 0;

        if (json.role === 'CUSTOMER') {
          requestsCount = await FoodRequest.countDocuments({
            $or: [{ customer: json.id }, { customerName: json.name }],
          });
        } else if (json.role === 'DONOR') {
          donationsCount = await Donation.countDocuments({
            $or: [{ donor: json.id }, { donorName: json.name }],
          });
        } else if (json.role === 'VOLUNTEER') {
          deliveriesCount = await Delivery.countDocuments({
            $or: [{ volunteer: json.id }, { volunteerName: json.name }],
          });
        }

        json.activitySummary = {
          requestsCount,
          donationsCount,
          deliveriesCount,
        };

        return json;
      })
    );

    const allUsers = await User.find({});
    const stats = {
      total: allUsers.length,
      customers: allUsers.filter((u) => u.role === 'CUSTOMER').length,
      donors: allUsers.filter((u) => u.role === 'DONOR').length,
      volunteers: allUsers.filter((u) => u.role === 'VOLUNTEER').length,
      admins: allUsers.filter((u) => u.role === 'ADMIN').length,
      active: allUsers.filter((u) => u.accountStatus === 'ACTIVE').length,
      inactive: allUsers.filter((u) => u.accountStatus === 'INACTIVE').length,
      pendingVerification: allUsers.filter((u) => u.verificationStatus === 'PENDING_VERIFICATION').length,
    };

    return {
      users: usersWithSummary,
      stats,
    };
  }

  async getUserById(id) {
    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id).select('-password');
    } else {
      user = await User.findOne({ email: id }).select('-password');
    }

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const userData = user.toJSON();

    // Fetch related entity histories
    const requests = await FoodRequest.find({
      $or: [{ customer: userData.id }, { customerName: userData.name }],
    }).sort({ createdAt: -1 });

    const donations = await Donation.find({
      $or: [{ donor: userData.id }, { donorName: userData.name }],
    }).sort({ createdAt: -1 });

    const deliveries = await Delivery.find({
      $or: [
        { volunteer: userData.id },
        { volunteerName: userData.name },
        { customerName: userData.name },
        { donorName: userData.name },
      ],
    }).sort({ createdAt: -1 });

    return {
      user: userData,
      requests: requests.map((r) => r.toJSON()),
      donations: donations.map((d) => d.toJSON()),
      deliveries: deliveries.map((d) => d.toJSON()),
    };
  }

  async toggleUserAccountStatus(id, adminUser = null) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Protection: Prevent deactivating the last active ADMIN
    if (user.role === 'ADMIN' && user.accountStatus === 'ACTIVE') {
      const activeAdminsCount = await User.countDocuments({ role: 'ADMIN', accountStatus: 'ACTIVE' });
      if (activeAdminsCount <= 1) {
        const error = new Error('Cannot deactivate the sole active Administrator account');
        error.statusCode = 400;
        throw error;
      }
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = previousStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await user.save();

    await activityLogService.logActivity({
      actorName: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      actorEmail: adminUser ? adminUser.email || '' : '',
      actorRole: 'ADMIN',
      actionType: 'ADMIN_TOGGLED_USER_STATUS',
      relatedEntity: 'User',
      relatedEntityId: user.email,
      previousStatus,
      newStatus: user.accountStatus,
      details: `User ${user.name} (${user.email}) account status changed to ${user.accountStatus}`,
    });

    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }

  async verifyUserAccount(id, { verificationStatus, rejectionReason }, adminUser = null) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    user.verificationStatus = verificationStatus;
    if (verificationStatus === 'REJECTED' && rejectionReason) {
      user.rejectionReason = rejectionReason.trim();
    }
    await user.save();

    await activityLogService.logActivity({
      actorName: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      actorRole: 'ADMIN',
      actionType: 'ADMIN_VERIFIED_USER',
      relatedEntity: 'User',
      relatedEntityId: user.email,
      newStatus: verificationStatus,
      details: `User ${user.name} verification status set to ${verificationStatus}`,
    });

    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }

  async updateUserRole(id, { role }, adminUser = null) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const validRoles = ['CUSTOMER', 'DONOR', 'VOLUNTEER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      const error = new Error(`Invalid role '${role}'`);
      error.statusCode = 400;
      throw error;
    }

    // Safety check: Prevent demoting the last active ADMIN
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      const activeAdminsCount = await User.countDocuments({ role: 'ADMIN', accountStatus: 'ACTIVE' });
      if (activeAdminsCount <= 1) {
        const error = new Error('Cannot demote the sole active Administrator account');
        error.statusCode = 400;
        throw error;
      }
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await activityLogService.logActivity({
      actorName: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      actorRole: 'ADMIN',
      actionType: 'ADMIN_UPDATED_USER_ROLE',
      relatedEntity: 'User',
      relatedEntityId: user.email,
      previousStatus: previousRole,
      newStatus: role,
      details: `Updated role for user ${user.name} from ${previousRole} to ${role}`,
    });

    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }
}

module.exports = new UserService();
