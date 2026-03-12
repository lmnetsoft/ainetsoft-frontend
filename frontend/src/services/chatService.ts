import api from './api';

export interface ChatMessage {
  id?: string;
  senderId: string;
  recipientId: string;
  content: string;
  // UPDATED: Included 'VIDEO' to match your ChatPage logic and backend uploads
  type: 'TEXT' | 'IMAGE' | 'VIDEO'; 
  timestamp?: string;
  isRead?: boolean;
}

/**
 * Fetches historical messages between two users.
 */
export const getChatHistory = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
  try {
    // Normalizes IDs (e.g., 'admin' vs 'user@email.com') as handled in ChatPage.tsx
    const response = await api.get(`/chat/history/${userId1}/${userId2}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
};

/**
 * Optional: Marks messages as read when opening a conversation
 */
export const markMessagesAsRead = async (senderId: string, recipientId: string) => {
  try {
    await api.post(`/chat/read/${senderId}/${recipientId}`);
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
  }
};