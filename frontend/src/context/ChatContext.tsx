import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

// Define the interface locally to ensure all new types are supported app-wide
export interface ChatMessage {
  senderId: string;
  recipientId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'PRODUCT' | 'STICKER';
  timestamp: string;
}

interface ChatContextType {
  connected: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>; // Required for Admin Reset
  isMuted: boolean; // Required for Sound Toggle
  setIsMuted: (muted: boolean) => void;
  sendMessage: (msg: ChatMessage) => void;
  clearUnread: () => void;
  setRecipientMessages: (msgs: ChatMessage[]) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(localStorage.getItem('chat_muted') === 'true');
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const stompClient = useRef<Stomp.Client | null>(null);

  const resetChat = () => {
    setMessages([]);
    setUnreadCount(0);
    setIsChatOpen(false);
    if (stompClient.current?.connected) {
      stompClient.current.disconnect(() => setConnected(false));
    }
  };

  // Persist Mute Preference
  useEffect(() => {
    localStorage.setItem('chat_muted', isMuted.toString());
  }, [isMuted]);

  // Sync token state immediately on login/logout events
  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem('jwt_token'));
    window.addEventListener('profileUpdate', syncToken);
    window.addEventListener('storage', syncToken);
    return () => {
      window.removeEventListener('profileUpdate', syncToken);
      window.removeEventListener('storage', syncToken);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      resetChat();
      return;
    }

    if (stompClient.current?.connected) return;

    // Adjust this URL to match your production/dev server
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    stompClient.current = client;
    client.debug = () => {}; // Keeps console clean

    client.connect({}, () => {
      setConnected(true);
      client.subscribe('/user/queue/messages', (message) => {
        const receivedMsg: ChatMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, receivedMsg]);
        
        // Update unread count if user is not currently looking at the chat
        if (!isChatOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      });
    }, () => setConnected(false));

    return () => { 
      if (stompClient.current?.connected) {
        stompClient.current.disconnect(); 
      }
    };
  }, [token, isChatOpen]);

  const sendMessage = (msg: ChatMessage) => {
    if (stompClient.current?.connected) {
      stompClient.current.send("/app/chat", {}, JSON.stringify(msg));
      setMessages((prev) => [...prev, msg]);
    } else {
      console.warn("WebSocket not connected. Message not sent.");
    }
  };

  return (
    <ChatContext.Provider value={{ 
      connected, 
      messages, 
      unreadCount, 
      setUnreadCount,
      isMuted,
      setIsMuted,
      sendMessage, 
      isChatOpen, 
      setIsChatOpen, 
      resetChat,
      clearUnread: () => setUnreadCount(0),
      setRecipientMessages: (msgs) => setMessages(msgs)
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};