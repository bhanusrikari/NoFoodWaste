import api from './api';

// Public / Donor Endpoint (Only returns Verified & Active Beneficiaries)
export const getVerifiedBeneficiaries = async () => {
  const response = await api.get('/beneficiaries/verified');
  return response.data;
};

// Admin Endpoints
export const getAllBeneficiaries = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
  if (filters.verificationStatus && filters.verificationStatus !== 'ALL') params.append('verificationStatus', filters.verificationStatus);
  if (filters.accountStatus && filters.accountStatus !== 'ALL') params.append('accountStatus', filters.accountStatus);

  const response = await api.get(`/admin/beneficiaries?${params.toString()}`);
  return response.data;
};

export const getBeneficiaryById = async (id) => {
  const response = await api.get(`/admin/beneficiaries/${id}`);
  return response.data;
};

export const createBeneficiary = async (data) => {
  const response = await api.post('/admin/beneficiaries', data);
  return response.data;
};

export const updateBeneficiary = async (id, data) => {
  const response = await api.put(`/admin/beneficiaries/${id}`, data);
  return response.data;
};

export const verifyBeneficiary = async (id) => {
  const response = await api.patch(`/admin/beneficiaries/${id}/verify`);
  return response.data;
};

export const rejectBeneficiary = async (id, reason) => {
  const response = await api.patch(`/admin/beneficiaries/${id}/reject`, { reason });
  return response.data;
};

export const toggleStatus = async (id) => {
  const response = await api.patch(`/admin/beneficiaries/${id}/toggle-status`);
  return response.data;
};

export const beneficiaryService = {
  getVerifiedBeneficiaries,
  getAllBeneficiaries,
  getBeneficiaryById,
  createBeneficiary,
  updateBeneficiary,
  verifyBeneficiary,
  rejectBeneficiary,
  toggleStatus,
};

export default beneficiaryService;
