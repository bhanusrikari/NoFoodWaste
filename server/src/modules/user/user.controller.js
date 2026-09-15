const userService = require('./user.service');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);
      res.status(200).json({
        success: true,
        count: result.users.length,
        stats: result.stats,
        data: result.users,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const data = await userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleUserAccountStatus(req, res, next) {
    try {
      const updated = await userService.toggleUserAccountStatus(req.params.id, req.user);
      res.status(200).json({
        success: true,
        message: `User account status updated to ${updated.accountStatus}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyUserAccount(req, res, next) {
    try {
      const { verificationStatus, rejectionReason } = req.body;
      if (!verificationStatus) {
        return res.status(400).json({
          success: false,
          message: 'verificationStatus is required',
        });
      }

      const updated = await userService.verifyUserAccount(
        req.params.id,
        { verificationStatus, rejectionReason },
        req.user
      );

      res.status(200).json({
        success: true,
        message: `User verification status set to ${verificationStatus}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'role is required',
        });
      }

      const updated = await userService.updateUserRole(req.params.id, { role }, req.user);
      res.status(200).json({
        success: true,
        message: `User role updated to ${updated.role}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
