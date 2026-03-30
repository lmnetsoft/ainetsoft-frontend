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

/**
 * 🛠️ FIX: Renamed to getMyNotifications to match the imports in 
 * NotificationPage.tsx and other components.
 */
export const getMyNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

/**
 * 🔔 Live count for the Bell icon
 * 🛠️ FIX: Removed '.count' because the backend returns a raw number.
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data; 
};

export const markAsRead = async (id: string) => {
  return await api.put(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
  return await api.put('/notifications/read-all');
};

// Alias to keep compatibility if you used the old name elsewhere
export const getNotifications = getMyNotifications;