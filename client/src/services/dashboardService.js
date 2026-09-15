import api from './api';

export const getAdminDashboardData = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const seedDashboardData = async () => {
  const response = await api.post('/admin/dashboard/seed');
  return response.data;
};
