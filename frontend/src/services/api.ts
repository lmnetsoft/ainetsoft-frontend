import axios from 'axios';

/**
 * 🚀 PRODUCTION READY: Syncing with your .env file.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

/**
 * Utility to clear ONLY authentication data.
 */
const clearAuthData = () => {
    const authKeys = [
        'jwt_token', 
        'isAuthenticated', 
        'user', 
        'userName', 
        'userEmail', 
        'userPhone', 
        'userAvatar', 
        'userRoles',
        'userPermissions',
        'isGlobalAdmin'
    ];
    authKeys.forEach(key => localStorage.removeItem(key));
};

// Request interceptor: Attach JWT and handle Multipart data
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    /**
     * 🛠️ ENHANCED FIX: Prevent aggressive redirects on public pages.
     * We only want to force a logout/error screen if the user WAS logged in and their token expired.
     */
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const hasToken = !!localStorage.getItem('jwt_token');
      const currentPath = window.location.pathname;

      // 🚀 List of public paths where we should NOT trigger the "Unauthorized" error screen.
      const publicPaths = ['/login', '/verify-email', '/register', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some(path => currentPath.includes(path));

      if (hasToken && !isPublicPath) {
        console.warn("Session expired. Clearing data and redirecting...");
        clearAuthData();
        window.dispatchEvent(new Event('profileUpdate'));
        
        window.location.href = `/login?message=session_expired&redirect=${encodeURIComponent(currentPath)}`;
      } 
      // If no token exists or we are on a public path, we just let the error pass 
      // so the specific component (like VerifyEmail) can handle it silently.
    }
    
    return Promise.reject(error);
  }
);

/**
 * SMART DYNAMIC ENDPOINTS
 */
export const getCategories = () => api.get('/categories');
export const getProductsByCategory = (categoryId: string) => api.get(`/products/category/${categoryId}`);

/**
 * SOCIAL & REPORTING ENDPOINTS
 */
export const shareProduct = (productId: string) => api.post(`/products/${productId}/share`);

export const reportProduct = (productId: string, reportData: { reason: string; details: string; evidenceUrls?: string[] }) => {
  return api.post(`/products/${productId}/report`, {
    ...reportData,
    createdAt: new Date().toISOString()
  });
};

/**
 * PROFESSIONAL REVIEW SYSTEM ENDPOINTS
 */
export const getProductReviews = (productId: string, rating?: number, hasImages?: boolean) => {
  const params = new URLSearchParams();
  if (rating) params.append('rating', rating.toString());
  if (hasImages) params.append('hasImages', 'true');
  return api.get(`/reviews/product/${productId}`, { params });
};

export const getReviewStats = (productId: string) => api.get(`/reviews/product/${productId}/stats`);

// 🚀 FIXED: Cập nhật hàm submitReview để hỗ trợ FormData (Upload File)
export const submitReview = (formData: FormData) => {
  return api.post('/reviews/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const replyToReview = (reviewId: string, replyText: string) => {
  return api.post(`/reviews/${reviewId}/reply`, { replyText });
};

export default api;