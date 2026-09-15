const beneficiaryService = require('./beneficiary.service');

class BeneficiaryController {
  async getAllBeneficiaries(req, res, next) {
    try {
      const beneficiaries = await beneficiaryService.getAllBeneficiaries(req.query);
      return res.status(200).json({
        success: true,
        data: beneficiaries,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVerifiedBeneficiaries(req, res, next) {
    try {
      const verified = await beneficiaryService.getVerifiedBeneficiaries();
      return res.status(200).json({
        success: true,
        data: verified,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBeneficiaryById(req, res, next) {
    try {
      const { id } = req.params;
      const beneficiary = await beneficiaryService.getBeneficiaryById(id);
      return res.status(200).json({
        success: true,
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBeneficiary(req, res, next) {
    try {
      const beneficiary = await beneficiaryService.createBeneficiary(req.body);
      return res.status(201).json({
        success: true,
        message: 'Beneficiary organization created successfully',
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBeneficiary(req, res, next) {
    try {
      const { id } = req.params;
      const beneficiary = await beneficiaryService.updateBeneficiary(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Beneficiary details updated successfully',
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyBeneficiary(req, res, next) {
    try {
      const { id } = req.params;
      const beneficiary = await beneficiaryService.verifyBeneficiary(id);
      return res.status(200).json({
        success: true,
        message: 'Beneficiary verified successfully',
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectBeneficiary(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const beneficiary = await beneficiaryService.rejectBeneficiary(id, reason);
      return res.status(200).json({
        success: true,
        message: 'Beneficiary verification rejected',
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const beneficiary = await beneficiaryService.toggleStatus(id);
      return res.status(200).json({
        success: true,
        message: `Beneficiary account status updated to ${beneficiary.accountStatus}`,
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BeneficiaryController();
