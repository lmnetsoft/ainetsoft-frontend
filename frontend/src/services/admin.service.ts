import api from './api'; // BaseURL is http://localhost:8080/api

/**
 * adminService fully synchronized with Backend Controllers
 * Optimized for Violation Reports, Review Moderation, and Dynamic Categories
 */
export const adminService = {
  // --- STATS & OVERVIEW ---
  
  /**
   * Fetches summary data for dashboard cards.
   */
  getDashboardSummary: () => api.get('/admin/stats/summary').then(res => res.data),

  // --- SELLER MODERATION ---
  
  /**
   * Fetches the list of users waiting for seller approval.
   */
  getPendingSellers: async () => {
    const response = await api.get('/admin/sellers/pending');
    return response.data;
  },

  /**
   * Fetches FULL verification details for a specific user.
   */
  getSellerDetails: (userId: string) => {
    return api.get(`/admin/sellers/review/${userId}`).then(res => res.data);
  },
  
  /**
   * Approves or Rejects a seller upgrade request.
   * NOTE: Backend returns a string. If the email is invalid, the string contains a warning.
   */
  approveSeller: (userId: string, approved: boolean, note: string = "") => {
    const payload = { 
      approved, 
      adminNote: note || (approved ? "Hồ sơ hợp lệ" : "Hồ sơ không đạt yêu cầu") 
    };
    // .then(res => res.data) captures the backend's success or warning message string
    return api.post(`/admin/sellers/process/${userId}`, payload).then(res => res.data);
  },

  // --- PRODUCT MODERATION ---
  
  /**
   * Fetches products waiting for approval.
   */
  getPendingProducts: () => api.get('/admin/products/pending').then(res => res.data),
  
  /**
   * Approves a product to make it public.
   * FIXED: Removed body payload because the backend @PostMapping for approve 
   * does not accept a RequestBody.
   */
  approveProduct: (productId: string) => 
    api.post(`/admin/products/approve/${productId}`).then(res => res.data),

  /**
   * Rejects a product with a reason.
   */
  rejectProduct: (productId: string, reason: string) => 
    api.post(`/admin/products/reject/${productId}`, null, { params: { reason } }).then(res => res.data),

  // --- VIOLATION REPORT MANAGEMENT (BÁO VI PHẠM) ---

  /**
   * Fetches all product violation reports.
   */
  getAllReports: () => api.get('/admin/reports').then(res => res.data),

  /**
   * Updates report status (e.g., RESOLVED, DISMISSED).
   */
  resolveReport: (reportId: string, action: 'RESOLVED' | 'DISMISSED') => 
    api.post(`/admin/reports/${reportId}/process`, { action }).then(res => res.data),

  /**
   * Permanently removes a violation report record from the database.
   */
  deleteReport: (reportId: string) => 
    api.delete(`/admin/reports/${reportId}`).then(res => res.data),

  // --- 🛠️ NEW: DYNAMIC VIOLATION CATEGORIES (DANH MỤC BÁO CÁO) ---

  /**
   * Fetches the list of reasons (Sản phẩm giả, Lừa đảo, v.v.) from DB.
   */
  getViolationReasons: () => api.get('/report-reasons'),

  /**
   * Adds or updates a violation category.
   */
  saveViolationReason: (data: { name: string }) => 
    api.post('/report-reasons/admin/save', data).then(res => res.data),

  /**
   * Deletes a violation category from the DB.
   */
  deleteViolationReason: (id: string) => 
    api.delete(`/report-reasons/admin/${id}`).then(res => res.data),

  // --- 🚚 NEW: DYNAMIC SHIPPING CONFIGURATION (CẤU HÌNH VẬN CHUYỂN) ---

  /**
   * Fetches all shipping methods (including inactive ones) for Admin.
   */
  getAllShippingMethods: () => api.get('/shipping-methods').then(res => res.data),

  /**
   * Creates a new global shipping method (Hỏa tốc, Nhanh, v.v.).
   */
  createShippingMethod: (data: any) => api.post('/shipping-methods', data).then(res => res.data),

  /**
   * Updates an existing shipping method or toggles its active status.
   */
  updateShippingMethod: (id: string, data: any) => api.put(`/shipping-methods/${id}`, data).then(res => res.data),

  /**
   * Deletes a shipping method permanently.
   */
  deleteShippingMethod: (id: string) => api.delete(`/shipping-methods/${id}`).then(res => res.data),

  // --- REVIEW MODERATION (QUẢN LÝ ĐÁNH GIÁ) ---

  /**
   * Fetches all reviews across the platform.
   */
  getAllReviews: () => api.get('/admin/reviews/all').then(res => res.data),

  /**
   * Deletes an offensive or fake review.
   */
  deleteReview: (reviewId: string) => 
    api.delete(`/admin/reviews/${reviewId}`).then(res => res.data),

  // --- USER MANAGEMENT & DELEGATION ---
  
  getAllUsers: () => api.get('/admin/users/all').then(res => res.data),

  promoteToAdmin: (userId: string, permissions: string[]) => 
    api.post(`/admin/users/promote/${userId}`, permissions).then(res => res.data),

  banUser: (userId: string) => 
    api.post(`/admin/users/ban/${userId}`).then(res => res.data),
    
  getAuditLogs: () => api.get('/admin/audit-logs').then(res => res.data),

  // --- 🚀 NEW: QUICK RESPONSE TEMPLATES (PHẢN HỒI NHANH) ---

  /**
   * Fetches predefined feedback templates for quick moderation responses.
   * @param type e.g., 'SELLER_REJECTION' or 'PRODUCT_REJECTION'
   */
  getFeedbackTemplates: (type: string) => 
    api.get('/admin/feedback-templates', { params: { type } }).then(res => res.data),

  /**
   * Creates or updates a response template.
   */
  saveFeedbackTemplate: (data: any) => 
    api.post('/admin/feedback-templates', data).then(res => res.data),

  /**
   * Deletes a response template by ID.
   */
  deleteFeedbackTemplate: (id: string) => 
    api.delete(`/admin/feedback-templates/${id}`).then(res => res.data),
};

export default adminService;