import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

/**
 * Utility to clear ONLY authentication data.
 * This ensures 'chatGuestId' is preserved so visitors don't lose chat history.
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

// Request interceptor to attach the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      
      // FIXED: Use targeted removal instead of .clear() to protect Visitor/Guest IDs
      clearAuthData();
      
      // Notify components (like Header/Chat) that the user is now logged out
      window.dispatchEvent(new Event('profileUpdate'));
      
      // Only redirect to login if we aren't already there and if the user was actually logged in
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        // Redirect to login and preserve the current path for post-login return
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;