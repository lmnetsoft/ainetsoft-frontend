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
 * Updated to include the 'user' object and extra permission keys.
 */
const clearAuthData = () => {
    const authKeys = [
        'jwt_token', 
        'isAuthenticated', 
        'user',             // FIX: Essential to clear the verification status
        'userName', 
        'userEmail', 
        'userPhone', 
        'userAvatar', 
        'userRoles',
        'userPermissions',  // FIX: Added
        'isGlobalAdmin'     // FIX: Added
    ];
    authKeys.forEach(key => localStorage.removeItem(key));
};

// Request interceptor to attach JWT and handle Multipart data
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
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;

      // FIX: Prevent loop if already on login page
      if (!currentPath.includes('/login')) {
        console.warn("Session invalid. Forcing re-authentication...");
        clearAuthData();
        window.dispatchEvent(new Event('profileUpdate'));
        
        // Include 'message' flag so Login.tsx knows to stop the auto-redirect
        window.location.href = `/login?message=session_updated&redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * SMART DYNAMIC ENDPOINTS
 */
export const getCategories = async () => {
  return await api.get('/categories');
};

export const getProductsByCategory = async (categoryId: string) => {
  return await api.get(`/products/category/${categoryId}`);
};

export default api;