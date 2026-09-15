import api from './api';

export const getPendingDeliveryAssignments = async (params = {}) => {
  const response = await api.get('/admin/deliveries/pending-assignments', { params });
  return response.data;
};

export const getAvailableDeliveryResources = async (numberOfMeals = 0) => {
  const response = await api.get('/admin/deliveries/available-resources', {
    params: { numberOfMeals },
  });
  return response.data;
};

export const assignDeliveryResources = async (deliveryId, { volunteerId, vehicleId }) => {
  const response = await api.post(`/admin/deliveries/${deliveryId}/assign`, {
    volunteerId,
    vehicleId,
  });
  return response.data;
};

export const reassignDeliveryResources = async (deliveryId, { volunteerId, vehicleId }) => {
  const response = await api.post(`/admin/deliveries/${deliveryId}/reassign`, {
    volunteerId,
    vehicleId,
  });
  return response.data;
};

export const cancelDeliveryAssignment = async (deliveryId, reason = '') => {
  const response = await api.post(`/admin/deliveries/${deliveryId}/cancel-assignment`, {
    reason,
  });
  return response.data;
};

export const getAllDeliveries = async (params = {}) => {
  const response = await api.get('/admin/deliveries', { params });
  return response.data;
};

export const getDeliveryById = async (deliveryId) => {
  const response = await api.get(`/admin/deliveries/${deliveryId}`);
  return response.data;
};

export const updateDeliveryStatus = async (deliveryId, { status, note = '', acknowledgement = null }) => {
  const response = await api.patch(`/admin/deliveries/${deliveryId}/status`, {
    status,
    note,
    acknowledgement,
  });
  return response.data;
};
