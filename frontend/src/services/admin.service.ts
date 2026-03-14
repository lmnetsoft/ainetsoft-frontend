import api from './api'; // BaseURL is likely http://localhost:8080/api

/**
 * adminService fully synchronized with AdminController.java
 */
export const adminService = {
  // --- STATS & OVERVIEW ---
  // Matches: @GetMapping("/summary")
  getDashboardSummary: () => api.get('/admin/summary').then(res => res.data),

  // --- SELLER MODERATION ---
  
  /**
   * Fetches the list of users waiting for seller approval.
   * Matches: @GetMapping("/sellers/pending")
   */
  getPendingSellers: async () => {
    const response = await api.get('/admin/sellers/pending');
    return response.data;
  },

  /**
   * Fetches FULL verification details for a specific user.
   * Matches: @GetMapping("/sellers/review/{userId}")
   */
  getSellerDetails: (userId: string) => {
    return api.get(`/admin/sellers/review/${userId}`).then(res => res.data);
  },
  
  /**
   * Approves or Rejects a seller upgrade request.
   * Matches: @PostMapping("/sellers/process/{userId}")
   */
  approveSeller: (userId: string, approved: boolean, note: string = "") => {
    const payload = { 
      approved, 
      adminNote: note || (approved ? "Hồ sơ hợp lệ" : "Hồ sơ không đạt yêu cầu") 
    };
    return api.post(`/admin/sellers/process/${userId}`, payload).then(res => res.data);
  },

  // --- PRODUCT MODERATION ---
  // Matches: @GetMapping("/products/pending")
  getPendingProducts: () => api.get('/admin/products/pending').then(res => res.data),
  
  // Matches: @PostMapping("/products/approve/{productId}")
  approveProduct: (productId: string) => 
    api.post(`/admin/products/approve/${productId}`).then(res => res.data),

  // Matches: @PostMapping("/products/reject/{productId}")
  rejectProduct: (productId: string, reason: string) => 
    api.post(`/admin/products/reject/${productId}`, null, { params: { reason } }).then(res => res.data),

  // --- USER MANAGEMENT & DELEGATION ---
  
  // Matches: @GetMapping("/users/all")
  getAllUsers: () => api.get('/admin/users/all').then(res => res.data),

  // Matches: @PostMapping("/users/promote/{userId}")
  promoteToAdmin: (userId: string, permissions: string[]) => 
    api.post(`/admin/users/promote/${userId}`, permissions).then(res => res.data),

  // Matches: @PostMapping("/users/ban/{userId}")
  banUser: (userId: string) => 
    api.post(`/admin/users/ban/${userId}`).then(res => res.data),
    
  // Matches: @GetMapping("/audit-logs")
  // FIXED: Ensure path consistency with the other methods
  getAuditLogs: () => api.get('/admin/audit-logs').then(res => res.data),
};

export default adminService;