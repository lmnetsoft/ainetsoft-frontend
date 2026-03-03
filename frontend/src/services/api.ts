import axios from 'axios';

// The Backend is running on 8080 based on your logs
const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: This allows the browser to send/receive the JSESSIONID cookie
  withCredentials: true, 
});

// Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized. Cleaning up...");
      
      // Clear local state so the UI stays in sync with the backend
      localStorage.clear();
      
      // Trigger the profileUpdate event we set up in Header.tsx and authService.ts
      window.dispatchEvent(new Event('profileUpdate'));
      
      // Optional: Redirect only if we aren't already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;