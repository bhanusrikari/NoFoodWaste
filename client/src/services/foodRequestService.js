import api from './api';

export const getAllFoodRequests = async (params = {}) => {
  const response = await api.get('/admin/food-requests', { params });
  return response.data;
};

export const getFoodRequestById = async (id) => {
  const response = await api.get(`/admin/food-requests/${id}`);
  return response.data;
};

export const updateFoodRequestStatus = async (id, statusData) => {
  const response = await api.patch(`/admin/food-requests/${id}/status`, statusData);
  return response.data;
};

export const manualMatchDonor = async (id, donationId) => {
  const response = await api.post(`/admin/food-requests/${id}/match-donor`, { donationId });
  return response.data;
};

export const getAvailableDonations = async () => {
  const response = await api.get('/admin/donations/available');
  return response.data;
};

export const createFoodRequest = async (requestData) => {
  const response = await api.post('/food-requests', requestData);
  return response.data;
};

export const seedFoodRequests = async () => {
  const response = await api.post('/admin/food-requests/seed');
  return response.data;
};
