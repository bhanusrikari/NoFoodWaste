import api from './api';

export const fulfillmentService = {
  getBeneficiaries: () => api.get('/fulfillments/beneficiaries').then((res) => res.data),
  fulfillRequirement: (data) => api.post('/fulfillments/fulfill-requirement', data).then((res) => res.data),
  fulfillBeneficiary: (data) => api.post('/fulfillments/fulfill-beneficiary', data).then((res) => res.data),
  getMy: () => api.get('/fulfillments/my').then((res) => res.data),
  getRecipientMy: () => api.get('/fulfillments/recipient-my').then((res) => res.data),
  getById: (id) => api.get(`/fulfillments/${id}`).then((res) => res.data),
  acceptBeneficiary: (id) => api.patch(`/fulfillments/${id}/accept`).then((res) => res.data),
  rejectBeneficiary: (id, data) => api.patch(`/fulfillments/${id}/reject`, data).then((res) => res.data),
  safetyVerify: (id, data) => api.patch(`/fulfillments/${id}/safety-verify`, data).then((res) => res.data),
  updateStatus: (id, data) => api.patch(`/fulfillments/${id}/status`, data).then((res) => res.data),
  acknowledge: (id, data) => api.patch(`/fulfillments/${id}/acknowledge`, data).then((res) => res.data),
  cancel: (id) => api.patch(`/fulfillments/${id}/cancel`).then((res) => res.data),
};
