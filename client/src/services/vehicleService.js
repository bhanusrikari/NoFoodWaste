import api from './api';

export const getAllVehicles = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
  if (filters.vehicleType && filters.vehicleType !== 'ALL') params.append('vehicleType', filters.vehicleType);
  if (filters.accountStatus && filters.accountStatus !== 'ALL') params.append('accountStatus', filters.accountStatus);

  const response = await api.get(`/admin/vehicles?${params.toString()}`);
  return response.data;
};

export const getVehicleById = async (id) => {
  const response = await api.get(`/admin/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (data) => {
  const response = await api.post('/admin/vehicles', data);
  return response.data;
};

export const updateVehicle = async (id, data) => {
  const response = await api.put(`/admin/vehicles/${id}`, data);
  return response.data;
};

export const toggleStatus = async (id) => {
  const response = await api.patch(`/admin/vehicles/${id}/toggle-status`);
  return response.data;
};

export const updateVehicleStatus = async (id, status) => {
  const response = await api.patch(`/admin/vehicles/${id}/status`, { status });
  return response.data;
};

export const assignDelivery = async (vehicleId, deliveryId) => {
  const response = await api.post('/admin/vehicles/assign-delivery', { vehicleId, deliveryId });
  return response.data;
};

export const vehicleService = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  toggleStatus,
  updateVehicleStatus,
  assignDelivery,
};

export default vehicleService;
