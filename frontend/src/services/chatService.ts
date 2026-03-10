import api from './api';

export interface ChatMessage {
  id?: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'TEXT' | 'IMAGE'; // Added: Match your backend enum
  timestamp?: string;
  isRead?: boolean;
}

/**
 * Fetches historical messages between two users.
 * Ensure your backend endpoint matches this structure.
 */
export const getChatHistory = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
  try {
    const response = await api.get(`/chat/history/${userId1}/${userId2}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch history", error);
    return [];
  }
};