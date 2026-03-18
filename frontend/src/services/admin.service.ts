import api from './api'; // BaseURL is http://localhost:8080/api

/**
 * adminService fully synchronized with Backend Controllers
 * Added support for Violation Reports and Review Moderation
 */
export const adminService = {
  // --- STATS & OVERVIEW ---
  
  /**
   * Fetches summary data for dashboard cards.
   * Now includes 'totalReports' and 'pendingReviews' count.
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
   */
  approveSeller: (userId: string, approved: boolean, note: string = "") => {
    const payload = { 
      approved, 
      adminNote: note || (approved ? "Hồ sơ hợp lệ" : "Hồ sơ không đạt yêu cầu") 
    };
    return api.post(`/admin/sellers/process/${userId}`, payload).then(res => res.data);
  },

  // --- PRODUCT MODERATION ---
  
  /**
   * Fetches products waiting for approval.
   */
  getPendingProducts: () => api.get('/admin/products/pending').then(res => res.data),
  
  /**
   * FIX: Added optional payload to ensure backend receives the status change.
   */
  approveProduct: (productId: string) => 
    api.post(`/admin/products/approve/${productId}`, { status: 'APPROVED' }).then(res => res.data),

  /**
   * Rejects a product with a reason.
   */
  rejectProduct: (productId: string, reason: string) => 
    api.post(`/admin/products/reject/${productId}`, null, { params: { reason } }).then(res => res.data),

  // --- NEW: VIOLATION REPORT MANAGEMENT (BÁO VI PHẠM) ---

  /**
   * Fetches all product violation reports submitted by users.
   */
  getAllReports: () => api.get('/admin/reports/all').then(res => res.data),

  /**
   * Updates report status (e.g., RESOLVED, DISMISSED).
   */
  resolveReport: (reportId: string, action: 'RESOLVED' | 'DISMISSED') => 
    api.post(`/admin/reports/${reportId}/process`, { action }).then(res => res.data),

  // --- NEW: REVIEW MODERATION (QUẢN LÝ ĐÁNH GIÁ) ---

  /**
   * Fetches all reviews across the platform for moderation.
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
};

export default adminService;