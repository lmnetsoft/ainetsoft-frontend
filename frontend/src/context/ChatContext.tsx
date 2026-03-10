import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import type { ChatMessage } from '../services/chatService';

interface ChatContextType {
  connected: boolean;
  messages: ChatMessage[];
  unreadCount: number;
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

    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    stompClient.current = client;
    client.debug = () => {};

    client.connect({}, () => {
      setConnected(true);
      client.subscribe('/user/queue/messages', (message) => {
        const receivedMsg: ChatMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, receivedMsg]);
        if (!isChatOpen) setUnreadCount((prev) => prev + 1);
      });
    }, () => setConnected(false));

    return () => { if (stompClient.current?.connected) stompClient.current.disconnect(); };
  }, [token, isChatOpen]);

  const sendMessage = (msg: ChatMessage) => {
    if (stompClient.current?.connected) {
      stompClient.current.send("/app/chat", {}, JSON.stringify(msg));
      setMessages((prev) => [...prev, msg]);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      connected, messages, unreadCount, sendMessage, 
      isChatOpen, setIsChatOpen, resetChat,
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