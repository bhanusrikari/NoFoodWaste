import api from './api';

export const getAdminNotifications = async (params = {}) => {
  const response = await api.get('/admin/notifications', { params });
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/admin/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/admin/notifications/mark-all-read');
  return response.data;
};
