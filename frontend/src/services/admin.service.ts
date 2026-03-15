import api from './api'; // BaseURL is http://localhost:8080/api

/**
 * adminService fully synchronized with Backend Controllers
 */
export const adminService = {
  // --- STATS & OVERVIEW ---
  
  /**
   * FIXED: Added '/stats' to match AdminStatsController.java @RequestMapping("/api/admin/stats")
   * This is what turns that "0" into a "2" on your dashboard cards.
   */
  getDashboardSummary: () => api.get('/admin/stats/summary').then(res => res.data),

  // --- SELLER MODERATION ---
  
  /**
   * Fetches the list of users waiting for seller approval.
   * Matches: AdminController @GetMapping("/sellers/pending")
   */
  getPendingSellers: async () => {
    const response = await api.get('/admin/sellers/pending');
    return response.data;
  },

  /**
   * Fetches FULL verification details for a specific user.
   * Matches: AdminController @GetMapping("/sellers/review/{userId}")
   */
  getSellerDetails: (userId: string) => {
    return api.get(`/admin/sellers/review/${userId}`).then(res => res.data);
  },
  
  /**
   * Approves or Rejects a seller upgrade request.
   * Matches: AdminController @PostMapping("/sellers/process/{userId}")
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
   * Matches: AdminController @GetMapping("/products/pending")
   */
  getPendingProducts: () => api.get('/admin/products/pending').then(res => res.data),
  
  /**
   * Matches: AdminController @PostMapping("/products/approve/{productId}")
   */
  approveProduct: (productId: string) => 
    api.post(`/admin/products/approve/${productId}`).then(res => res.data),

  /**
   * Matches: AdminController @PostMapping("/products/reject/{productId}")
   */
  rejectProduct: (productId: string, reason: string) => 
    api.post(`/admin/products/reject/${productId}`, null, { params: { reason } }).then(res => res.data),

  // --- USER MANAGEMENT & DELEGATION ---
  
  /**
   * Matches: AdminController @GetMapping("/users/all")
   */
  getAllUsers: () => api.get('/admin/users/all').then(res => res.data),

  /**
   * Matches: AdminController @PostMapping("/users/promote/{userId}")
   */
  promoteToAdmin: (userId: string, permissions: string[]) => 
    api.post(`/admin/users/promote/${userId}`, permissions).then(res => res.data),

  /**
   * Matches: AdminController @PostMapping("/users/ban/{userId}")
   */
  banUser: (userId: string) => 
    api.post(`/admin/users/ban/${userId}`).then(res => res.data),
    
  /**
   * Matches: AdminController @GetMapping("/audit-logs")
   */
  getAuditLogs: () => api.get('/admin/audit-logs').then(res => res.data),
};

export default adminService;