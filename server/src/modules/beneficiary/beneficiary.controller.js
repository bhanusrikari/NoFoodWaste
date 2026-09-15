const beneficiaryService = require('./beneficiary.service');

class BeneficiaryController {
  async getAll(req, res, next) {
    try {
      const beneficiaries = await beneficiaryService.getAllBeneficiaries();
      return res.status(200).json({ success: true, beneficiaries });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const beneficiary = await beneficiaryService.createBeneficiary(req.body);
      return res.status(201).json({ success: true, beneficiary });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const beneficiary = await beneficiaryService.getBeneficiaryById(req.params.id);
      return res.status(200).json({ success: true, beneficiary });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BeneficiaryController();
