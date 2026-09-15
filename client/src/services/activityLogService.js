import api from './api';

export const getAllActivityLogs = async (params = {}) => {
  const response = await api.get('/admin/activity-logs', { params });
  return response.data;
};
