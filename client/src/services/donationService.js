import api from './api';

export const getAllDonations = async (params = {}) => {
  const response = await api.get('/admin/donations', { params });
  return response.data;
};

export const getDonationById = async (id) => {
  const response = await api.get(`/admin/donations/${id}`);
  return response.data;
};

export const verifyDonation = async (id) => {
  const response = await api.patch(`/admin/donations/${id}/verify`);
  return response.data;
};

export const assignBeneficiary = async (id, requestId) => {
  const response = await api.post(`/admin/donations/${id}/assign-beneficiary`, { requestId });
  return response.data;
};

export const flagOrCancelDonation = async (id, action, reason) => {
  const response = await api.patch(`/admin/donations/${id}/flag-cancel`, { action, reason });
  return response.data;
};

export const getOpenRequestsForMatching = async () => {
  const response = await api.get('/admin/food-requests/open');
  return response.data;
};

export const createDonation = async (donationData) => {
  const response = await api.post('/donations', donationData);
  return response.data;
};
