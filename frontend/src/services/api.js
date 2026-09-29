import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const ProductService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
};

export const BatchService = {
  getAll: () => api.get('/batches'),
  getById: (batchId) => api.get(`/batches/${batchId}`),
  create: (data) => api.post('/batches', data),
  getInspections: (batchId) => api.get(`/batches/${batchId}/inspections`),
  getReport: (batchId) => api.get(`/batches/${batchId}/report`),
  getPdfUrl: (batchId) => `/api/batches/${batchId}/report/pdf`,
  getExcelUrl: (batchId) => `/api/batches/${batchId}/report/excel`,
};

export const InspectionService = {
  inspectImage: (formData) => api.post('/inspect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitFeedback: (inspectionId, data) => api.post(`/inspections/${inspectionId}/feedback`, data),
};

export const AlertService = {
  getAll: (statusFilter) => api.get('/alerts', { params: { status_filter: statusFilter } }),
  update: (id, data) => api.patch(`/alerts/${id}`, data),
  createCorrectiveAction: (alertId, data) => api.post(`/alerts/${alertId}/corrective-action`, data),
};

export const CorrectiveActionService = {
  getAll: () => api.get('/corrective-actions'),
};

export const AnalyticsService = {
  getOverview: () => api.get('/analytics/overview'),
  getAuditLogs: () => api.get('/audit-logs'),
  reseed: () => api.post('/reseed'),
};

export default api;
