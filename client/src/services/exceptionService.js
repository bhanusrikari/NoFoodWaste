import api from './api';

export const volunteerRejectDelivery = async (deliveryId, reason = '') => {
  const response = await api.post('/admin/exceptions/volunteer-reject', {
    deliveryId,
    reason,
  });
  return response.data;
};

export const processPartialFulfillment = async ({ donationId, requestId, fulfilledQuantity, notes = '' }) => {
  const response = await api.post('/admin/exceptions/partial-fulfillment', {
    donationId,
    requestId,
    fulfilledQuantity,
    notes,
  });
  return response.data;
};

export const cancelEntity = async (entityType, entityId, reason = '') => {
  const response = await api.post('/admin/exceptions/cancel-entity', {
    entityType,
    entityId,
    reason,
  });
  return response.data;
};
