import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
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

    // 🛠️ FIX: Only logout if it's a 401 AND we actually had a token (meaning the token expired)
    // Also ignore 401s for the login attempt itself to prevent loops
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const hasToken = !!localStorage.getItem('jwt_token');
      const currentPath = window.location.pathname;

      if (hasToken && !currentPath.includes('/login')) {
        console.warn("Session expired or invalid. Clearing session...");
        clearAuthData();
        window.dispatchEvent(new Event('profileUpdate'));
        
        // Use window.location.replace to prevent the user from "going back" to a dead session
        window.location.href = `/login?message=session_expired&redirect=${encodeURIComponent(currentPath)}`;
      }
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

export const submitReview = (reviewData: {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
  videoUrl?: string;
  variantInfo?: string;
}) => {
  return api.post('/reviews/submit', reviewData);
};

export const replyToReview = (reviewId: string, replyText: string) => {
  return api.post(`/reviews/${reviewId}/reply`, { replyText });
};

export default api;