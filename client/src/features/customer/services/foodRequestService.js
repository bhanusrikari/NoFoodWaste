import api from '../../../services/api';

export const createFoodRequest = async (requestData) => {
  const response = await api.post('/food-requests', requestData);
  return response.data;
};

export const getMyFoodRequests = async () => {
  const response = await api.get('/food-requests/my');
  return response.data;
};

export const getFoodRequestById = async (id) => {
  const response = await api.get(`/food-requests/${id}`);
  return response.data;
};

export const acknowledgeFoodRequest = async (id) => {
  const response = await api.patch(`/food-requests/${id}/acknowledge`);
  return response.data;
};

const foodRequestService = {
  createFoodRequest,
  getMyFoodRequests,
  getFoodRequestById,
  acknowledgeFoodRequest,
};

export default foodRequestService;
