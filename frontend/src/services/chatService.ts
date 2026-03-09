import api from './api';

// CRITICAL: "export" is required so ChatPage.tsx can "see" this type
export interface ChatMessage {
  id?: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp?: string;
  isRead?: boolean;
}

export const getChatHistory = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat/history/${userId1}/${userId2}`);
  return response.data;
};