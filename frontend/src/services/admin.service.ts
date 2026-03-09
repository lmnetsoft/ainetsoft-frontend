import api from './api'; // Use the shared instance with the JWT interceptor

/**
 * UPDATED: adminService now uses the shared 'api' instance.
 * This ensures that admin requests (like approving products) 
 * always include the Bearer token in the header.
 */
export const adminService = {
  // --- SELLER MODERATION ---
  // Paths now relative to BASE_URL (http://localhost:8080/api)
  getPendingSellers: () => api.get('/admin/sellers/pending'),
  
  processSeller: (userId: string, approved: boolean, note: string) => 
    api.post(`/admin/sellers/process/${userId}`, { approved, adminNote: note }),

  // --- PRODUCT MODERATION ---
  getPendingProducts: () => api.get('/admin/products/pending'),
  
  approveProduct: (productId: string) => 
    api.post(`/admin/products/approve/${productId}`),

  rejectProduct: (productId: string, reason: string) => 
    api.post(`/admin/products/reject/${productId}`, null, { params: { reason } }),
};