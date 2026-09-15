import api from '../../../services/api';

export const getAvailableDonations = async () => {
  const response = await api.get('/donations/available');
  return response.data;
};

export const getDonationById = async (id) => {
  const response = await api.get(`/donations/${id}`);
  return response.data;
};

export const expressInterest = async (donationId) => {
  const response = await api.post(`/donations/${donationId}/interests`);
  return response.data;
};

export const getMyInterests = async () => {
  const response = await api.get('/donations/interests/my');
  return response.data;
};

export const withdrawInterest = async (interestId) => {
  const response = await api.patch(`/donations/interests/${interestId}/withdraw`);
  return response.data;
};

const donationService = {
  getAvailableDonations,
  getDonationById,
  expressInterest,
  getMyInterests,
  withdrawInterest,
};

export default donationService;
