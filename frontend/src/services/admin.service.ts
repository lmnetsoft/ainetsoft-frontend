import api from './api'; // BaseURL is http://localhost:8080/api

/**
 * adminService fully synchronized with Backend Controllers
 * Optimized for Violation Reports, Review Moderation, and Dynamic Categories
 */
export const adminService = {
  // --- STATS & OVERVIEW ---
  
  getDashboardSummary: () => api.get('/admin/stats/summary').then(res => res.data),

  // --- SELLER MODERATION ---
  
  getPendingSellers: async () => {
    const response = await api.get('/admin/sellers/pending');
    return response.data;
  },

  getSellerDetails: (userId: string) => {
    return api.get(`/admin/sellers/review/${userId}`).then(res => res.data);
  },
  
  approveSeller: (userId: string, approved: boolean, note: string = "") => {
    const payload = { 
      approved, 
      adminNote: note || (approved ? "Hồ sơ hợp lệ" : "Hồ sơ không đạt yêu cầu") 
    };
    return api.post(`/admin/sellers/process/${userId}`, payload).then(res => res.data);
  },

  // --- PRODUCT MODERATION & MANAGEMENT (PAGINATION UPDATE) ---
  
  getAllProducts: (page = 0, size = 10) => 
    api.get('/admin/products/all', { params: { page, size } }).then(res => res.data),

  getPendingProducts: () => api.get('/admin/products/pending').then(res => res.data),
  
  approveProduct: (productId: string) => 
    api.post(`/admin/products/approve/${productId}`).then(res => res.data),

  rejectProduct: (productId: string, reason: string) => 
    api.post(`/admin/products/reject/${productId}`, null, { params: { reason } }).then(res => res.data),

  deleteProduct: (productId: string) => 
    api.delete(`/admin/products/${productId}`).then(res => res.data),

  // --- VIOLATION REPORT MANAGEMENT ---

  getAllReports: () => api.get('/admin/reports').then(res => res.data),

  resolveReport: (reportId: string, action: 'RESOLVED' | 'DISMISSED') => 
    api.post(`/admin/reports/${reportId}/process`, { action }).then(res => res.data),

  deleteReport: (reportId: string) => 
    api.delete(`/admin/reports/${reportId}`).then(res => res.data),

  // --- DYNAMIC VIOLATION CATEGORIES ---

  getViolationReasons: () => api.get('/report-reasons'),

  saveViolationReason: (data: { name: string }) => 
    api.post('/report-reasons/admin/save', data).then(res => res.data),

  deleteViolationReason: (id: string) => 
    api.delete(`/report-reasons/admin/${id}`).then(res => res.data),

  // --- DYNAMIC SHIPPING CONFIGURATION ---

  getAllShippingMethods: () => api.get('/shipping-methods').then(res => res.data),

  createShippingMethod: (data: any) => api.post('/shipping-methods', data).then(res => res.data),

  updateShippingMethod: (id: string, data: any) => api.put(`/shipping-methods/${id}`, data).then(res => res.data),

  deleteShippingMethod: (id: string) => api.delete(`/shipping-methods/${id}`).then(res => res.data),

  // --- REVIEW MODERATION ---

  getAllReviews: () => api.get('/admin/reviews/all').then(res => res.data),

  deleteReview: (reviewId: string) => 
    api.delete(`/admin/reviews/${reviewId}`).then(res => res.data),

  // --- USER MANAGEMENT & DELEGATION (PHASE 2 UPDATED) ---
  
  /**
   * 🚀 UPDATED: Supports advanced filtering params (search, role, status, page, size)
   */
  getAllUsers: (params: any = {}) => 
    api.get('/admin/users/all', { params }).then(res => res.data),

  /** 🚀 NEW PHASE 2: Fetch full profile data for inspection */
  getUserDetails: (userId: string) => 
    api.get(`/admin/users/detail/${userId}`).then(res => res.data),

  promoteToAdmin: (userId: string, permissions: string[]) => 
    api.post(`/admin/users/promote/${userId}`, permissions).then(res => res.data),

  banUser: (userId: string) => 
    api.post(`/admin/users/ban/${userId}`).then(res => res.data),
    
  getAuditLogs: () => api.get('/admin/audit-logs').then(res => res.data),

  // --- QUICK RESPONSE TEMPLATES ---

  getFeedbackTemplates: (type: string) => 
    api.get('/admin/feedback-templates', { params: { type } }).then(res => res.data),

  saveFeedbackTemplate: (data: any) => 
    api.post('/admin/feedback-templates', data).then(res => res.data),

  deleteFeedbackTemplate: (id: string) => 
    api.delete(`/feedback-templates/${id}`).then(res => res.data),
};

export default adminService;