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
        'userName', 
        'userEmail', 
        'userPhone', 
        'userAvatar', 
        'userRoles'
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

    // FIX: If the data is FormData (like our seller registration), 
    // we MUST let the browser set the Content-Type automatically 
    // to include the boundary string.
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
      console.warn("Session expired or unauthorized. Cleaning up authentication...");
      clearAuthData();
      window.dispatchEvent(new Event('profileUpdate'));
      
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
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