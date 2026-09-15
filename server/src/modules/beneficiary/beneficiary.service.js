const Beneficiary = require('./beneficiary.model');

class BeneficiaryService {
  async createBeneficiary(data) {
    const beneficiary = await Beneficiary.create({
      name: data.name,
      type: data.type || 'NGO',
      phone: data.phone || '',
      address: data.address,
      location: data.location || {},
      verified: data.verified !== undefined ? data.verified : true,
      userId: data.userId || null,
    });
    return beneficiary.toJSON();
  }

  async getAllBeneficiaries() {
    const list = await Beneficiary.find().sort({ name: 1 });
    return list.map((b) => b.toJSON());
  }

  async getBeneficiaryById(id) {
    const beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) {
      const error = new Error('Beneficiary not found');
      error.statusCode = 404;
      throw error;
    }
    return beneficiary.toJSON();
  }
}

module.exports = new BeneficiaryService();
