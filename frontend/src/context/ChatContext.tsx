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
  // NEW: State for the global popup
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  resetChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false); // Global state for Shopee popup
  const stompClient = useRef<Stomp.Client | null>(null);

  /**
   * FIX ISSUE #3: Clear all data on logout
   */
  const resetChat = () => {
    setMessages([]);
    setUnreadCount(0);
    setIsChatOpen(false);
    if (stompClient.current?.connected) {
      stompClient.current.disconnect(() => setConnected(false));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    
    // If no token, wipe everything immediately
    if (!token) {
      resetChat();
      return;
    }

    try {
      const socket = new SockJS('http://localhost:8080/ws');
      const client = Stomp.over(socket);
      stompClient.current = client;
      client.debug = () => {};

      client.connect({}, () => {
        setConnected(true);
        // Subscribe to private queue
        client.subscribe('/user/queue/messages', (message) => {
          const receivedMsg: ChatMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, receivedMsg]);
          
          // Only increment unread if chat window is closed
          if (!isChatOpen) {
            setUnreadCount((prev) => prev + 1);
          }
        });
      }, (err) => {
        console.error("WebSocket Connection Lost:", err);
        setConnected(false);
      });
    } catch (err) {
      console.error("Chat Provider failed to init:", err);
    }

    return () => {
      if (stompClient.current?.connected) stompClient.current.disconnect(() => {});
    };
    // Re-run if token changes or open state changes to sync unread logic
  }, [isChatOpen, localStorage.getItem('jwt_token')]); 

  const sendMessage = (msg: ChatMessage) => {
    if (stompClient.current?.connected) {
      stompClient.current.send("/app/chat", {}, JSON.stringify(msg));
      setMessages((prev) => [...prev, msg]);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      connected, 
      messages, 
      unreadCount, 
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