import api from './api';

export const getAllUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const toggleUserAccountStatus = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/toggle-status`);
  return response.data;
};

export const verifyUserAccount = async (userId, { verificationStatus, rejectionReason = '' }) => {
  const response = await api.patch(`/admin/users/${userId}/verify`, {
    verificationStatus,
    rejectionReason,
  });
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};
