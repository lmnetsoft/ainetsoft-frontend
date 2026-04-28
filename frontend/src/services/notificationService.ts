import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

export const getMyNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data; 
};

/**
 * 🚀 NEW: Get the count of pending withdrawals for Admin alerts
 */
export const getPendingWithdrawalCount = async (): Promise<number> => {
  try {
    const response = await api.get('/withdrawals/admin/pending-count');
    return response.data; // Expected raw number from backend
  } catch (error) {
    return 0; // Fallback for non-admin or errors
  }
};

export const markAsRead = async (id: string) => {
  return await api.put(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
  return await api.put('/notifications/read-all');
};

// 📢 API CHUYÊN DỤNG CHO ADMIN: PHÁT SÓNG THÔNG BÁO (BROADCAST)
export const sendBroadcastNotification = async (audience: string, title: string, message: string) => {
  const response = await api.post('/notifications/admin/broadcast', { audience, title, message });
  return response.data;
};

export const getNotifications = getMyNotifications;