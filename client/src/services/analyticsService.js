import api from './api';

export const getAnalyticsData = async (params = {}) => {
  const response = await api.get('/admin/analytics', { params });
  return response.data;
};
