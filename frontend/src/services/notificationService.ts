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

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data.count;
};

export const markAsRead = async (id: string) => {
  return await api.put(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
  return await api.put('/notifications/read-all');
};