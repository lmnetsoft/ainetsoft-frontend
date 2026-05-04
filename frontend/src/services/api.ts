import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const hasToken = !!localStorage.getItem('jwt_token');
      const currentPath = window.location.pathname;

      const publicPaths = ['/login', '/verify-email', '/register', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some(path => currentPath.includes(path));

      if (hasToken && !isPublicPath) {
        console.warn("Phiên đăng nhập hết hạn. Đang làm sạch dữ liệu và chuyển hướng...");
        clearAuthData();
        window.dispatchEvent(new Event('profileUpdate'));
        
        window.location.href = `/login?message=session_expired&redirect=${encodeURIComponent(currentPath)}`;
      } 
    }
    
    return Promise.reject(error);
  }
);

export const getCategories = () => api.get('/categories');

export const getProductsByCategory = (categoryId: string) => api.get(`/products/category/${categoryId}`);

export const shareProduct = (productId: string) => api.post(`/products/${productId}/share`);

export const reportProduct = (productId: string, reportData: { reason: string; details: string; evidenceUrls?: string[] }) => {
  return api.post(`/products/${productId}/report`, {
    ...reportData,
    createdAt: new Date().toISOString()
  });
};

export const getProductReviews = (productId: string, rating?: number, hasImages?: boolean) => {
  const params = new URLSearchParams();
  if (rating) params.append('rating', rating.toString());
  if (hasImages) params.append('hasImages', 'true');
  return api.get(`/reviews/product/${productId}`, { params });
};

export const getReviewStats = (productId: string) => api.get(`/reviews/product/${productId}/stats`);

export const replyToReview = (reviewId: string, replyText: string) => {
  return api.post(`/reviews/${reviewId}/reply`, { replyText });
};

export const confirmOrderReceived = (orderId: string) => {
  return api.put(`/orders/${orderId}/status`, { status: 'COMPLETED' }); 
};

export const submitReview = async (formData: FormData) => {
  const token = localStorage.getItem('jwt_token');
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const response = await fetch(`${API_URL}/api/reviews/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    let errorMsg = "Lỗi khi upload đánh giá!";
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch (e) {}
    throw { response: { data: { message: errorMsg } } };
  }

  return response.json();
};

export default api;