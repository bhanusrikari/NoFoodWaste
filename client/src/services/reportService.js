import api from './api';

export const submitReport = async (reportData) => {
  const response = await api.post('/admin/reports/submit', reportData);
  return response.data;
};

export const getAllReports = async (params = {}) => {
  const response = await api.get('/admin/reports', { params });
  return response.data;
};

export const getReportById = async (reportId) => {
  const response = await api.get(`/admin/reports/${reportId}`);
  return response.data;
};

export const updateReportStatus = async (reportId, { status, priority, resolutionNotes }) => {
  const response = await api.patch(`/admin/reports/${reportId}/status`, {
    status,
    priority,
    resolutionNotes,
  });
  return response.data;
};
