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
      console.warn("Session expired or unauthorized. Redirecting to login...");
      // Optional: Clear local storage and redirect if session is dead
      // localStorage.clear();
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;