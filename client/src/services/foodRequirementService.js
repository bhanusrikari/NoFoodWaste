import api from './api';

export const foodRequirementService = {
  create: (data) => api.post('/food-requirements', data).then((res) => res.data),
  getOpen: () => api.get('/food-requirements/open').then((res) => res.data),
  getMy: () => api.get('/food-requirements/my').then((res) => res.data),
  getById: (id) => api.get(`/food-requirements/${id}`).then((res) => res.data),
};
