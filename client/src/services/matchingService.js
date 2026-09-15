import api from './api';

export const getSuggestedMatches = async () => {
  const response = await api.get('/admin/matching/suggested');
  return response.data;
};

export const findMatchesForRequest = async (id) => {
  const response = await api.get(`/admin/matching/request/${id}`);
  return response.data;
};

export const findMatchesForDonation = async (id) => {
  const response = await api.get(`/admin/matching/donation/${id}`);
  return response.data;
};

export const approveMatch = async (requestId, donationId) => {
  const response = await api.post('/admin/matching/approve', { requestId, donationId });
  return response.data;
};

export const rejectMatch = async (requestId, donationId, reason = '') => {
  const response = await api.post('/admin/matching/reject', { requestId, donationId, reason });
  return response.data;
};
