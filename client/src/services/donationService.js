import api from './api';

export const donationService = {
  create: (data) => api.post('/donations', data).then((res) => res.data),
  getMy: () => api.get('/donations/my').then((res) => res.data),
  getStats: () => api.get('/donations/stats').then((res) => res.data),
  getById: (id) => api.get(`/donations/${id}`).then((res) => res.data),
  getInterests: (donationId) => api.get(`/donations/${donationId}/interests`).then((res) => res.data),
  updateInterestStatus: (donationId, interestId, status) =>
    api.patch(`/donations/${donationId}/interests/${interestId}/status`, { status }).then((res) => res.data),
};
