import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export interface ChatMessage {
  senderId: string;
  recipientId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'PRODUCT' | 'STICKER' | 'ORDER';
  timestamp: string;
}

interface ChatContextType {
  connected: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  isMuted: boolean;
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
  
  // Track BOTH Token and Visitor ID
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [visitorId, setVisitorId] = useState(localStorage.getItem('chatGuestId'));
  
  const stompClient = useRef<Stomp.Client | null>(null);
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

  const resetChat = () => {
    setMessages([]);
    setUnreadCount(0);
    // Don't close the chat here, just disconnect the old socket
    if (stompClient.current?.connected) {
      stompClient.current.disconnect(() => setConnected(false));
    }
  };

  useEffect(() => {
    localStorage.setItem('chat_muted', isMuted.toString());
  }, [isMuted]);

  // Sync identities when they change (Login/Logout/Visitor ID generation)
  useEffect(() => {
    const syncIdentity = () => {
      setToken(localStorage.getItem('jwt_token'));
      setVisitorId(localStorage.getItem('chatGuestId'));
    };
    window.addEventListener('profileUpdate', syncIdentity);
    window.addEventListener('storage', syncIdentity);
    return () => {
      window.removeEventListener('profileUpdate', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  useEffect(() => {
    // FIX: Allow connection if there is a token OR a visitorId
    if (!token && !visitorId) {
      return; 
    }

    if (stompClient.current?.connected) return;

    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080' : `https://${window.location.hostname}`;
    const socket = new SockJS(`${baseUrl}/ws`);
    const client = Stomp.over(socket);
    stompClient.current = client;
    client.debug = () => {}; 

    // Headers: Pass token if it exists, otherwise connect anonymously
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    client.connect(headers, () => {
      setConnected(true);
      
      // Subscribe to personal queue
      client.subscribe('/user/queue/messages', (message) => {
        const receivedMsg: ChatMessage = JSON.parse(message.body);
        setMessages((prev) => {
            // Prevent duplicate messages if socket reconnects
            const exists = prev.some(m => m.timestamp === receivedMsg.timestamp && m.content === receivedMsg.content);
            return exists ? prev : [...prev, receivedMsg];
        });
        
        if (!isChatOpen) {
          setUnreadCount((prev) => prev + 1);
          if (!isMuted) {
            notificationSound.current.play().catch(() => {});
          }
        }
      });
    }, (error) => {
      console.warn("Socket Error:", error);
      setConnected(false);
    });

    return () => { 
      if (stompClient.current?.connected) {
        stompClient.current.disconnect(); 
      }
    };
  }, [token, visitorId, isChatOpen, isMuted]); 

  const sendMessage = (msg: ChatMessage) => {
    if (stompClient.current?.connected) {
      stompClient.current.send("/app/chat", {}, JSON.stringify(msg));
      setMessages((prev) => [...prev, msg]);
    } else {
      console.error("Cannot send: Socket disconnected.");
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
      setRecipientMessages: (msgs) => setMessages(Array.isArray(msgs) ? msgs : [])
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