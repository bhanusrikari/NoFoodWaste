import api from './api';

export const getAllVolunteers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.verificationStatus && filters.verificationStatus !== 'ALL') params.append('verificationStatus', filters.verificationStatus);
  if (filters.availabilityStatus && filters.availabilityStatus !== 'ALL') params.append('availabilityStatus', filters.availabilityStatus);
  if (filters.accountStatus && filters.accountStatus !== 'ALL') params.append('accountStatus', filters.accountStatus);

  const response = await api.get(`/admin/volunteers?${params.toString()}`);
  return response.data;
};

export const getVolunteerById = async (id) => {
  const response = await api.get(`/admin/volunteers/${id}`);
  return response.data;
};

export const updateVolunteerProfile = async (id, data) => {
  const response = await api.put(`/admin/volunteers/${id}`, data);
  return response.data;
};

export const verifyVolunteer = async (id) => {
  const response = await api.patch(`/admin/volunteers/${id}/verify`);
  return response.data;
};

export const rejectVolunteer = async (id, reason) => {
  const response = await api.patch(`/admin/volunteers/${id}/reject`, { reason });
  return response.data;
};

export const toggleStatus = async (id) => {
  const response = await api.patch(`/admin/volunteers/${id}/toggle-status`);
  return response.data;
};

export const updateAvailability = async (id, availabilityStatus) => {
  const response = await api.patch(`/admin/volunteers/${id}/availability`, { availabilityStatus });
  return response.data;
};

export const assignDelivery = async (deliveryId, volunteerId) => {
  const response = await api.post('/admin/volunteers/assign-delivery', { deliveryId, volunteerId });
  return response.data;
};

export const volunteerService = {
  getAllVolunteers,
  getVolunteerById,
  updateVolunteerProfile,
  verifyVolunteer,
  rejectVolunteer,
  toggleStatus,
  updateAvailability,
  assignDelivery,
};

export default volunteerService;
