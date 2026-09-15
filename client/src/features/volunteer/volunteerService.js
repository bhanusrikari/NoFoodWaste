import api from '../../services/api';

const volunteerService = {
  // Profile
  getProfile: async () => {
    const response = await api.get('/volunteers/me');
    return response.data;
  },

  updateAvailability: async (availability) => {
    const response = await api.patch('/volunteers/me/availability', { availability });
    return response.data;
  },

  updateLocation: async (latitude, longitude) => {
    const response = await api.patch('/volunteers/me/location', { latitude, longitude });
    return response.data;
  },

  // Assignments
  getMyAssignments: async () => {
    const response = await api.get('/assignments/my');
    return response.data;
  },

  getMyActiveAssignment: async () => {
    const response = await api.get('/assignments/my-active');
    return response.data;
  },

  getMyHistory: async () => {
    const response = await api.get('/assignments/my-history');
    return response.data;
  },

  getAssignment: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  // Assignment volunteer workflow actions
  acceptAssignment: async (id) => {
    const response = await api.patch(`/assignments/${id}/accept`);
    return response.data;
  },

  startPickup: async (id) => {
    const response = await api.patch(`/assignments/${id}/start-pickup`);
    return response.data;
  },

  confirmCollection: async (id) => {
    const response = await api.patch(`/assignments/${id}/collect`);
    return response.data;
  },

  startTransport: async (id) => {
    const response = await api.patch(`/assignments/${id}/start-transport`);
    return response.data;
  },

  confirmDelivery: async (id) => {
    const response = await api.patch(`/assignments/${id}/deliver`);
    return response.data;
  },

  // Beneficiary / Admin acknowledgement
  acknowledgeAssignment: async (id) => {
    const response = await api.patch(`/assignments/${id}/acknowledge`);
    return response.data;
  },

  // Collections (supports FormData or JSON)
  createCollection: async (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/collections', data, config);
    return response.data;
  },

  getCollection: async (assignmentId) => {
    const response = await api.get(`/collections/assignment/${assignmentId}`);
    return response.data;
  },

  // Distributions (supports FormData or JSON)
  createDistribution: async (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/distributions', data, config);
    return response.data;
  },

  getDistribution: async (assignmentId) => {
    const response = await api.get(`/distributions/assignment/${assignmentId}`);
    return response.data;
  },

  // Direct Photo upload
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post('/uploads/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export default volunteerService;
