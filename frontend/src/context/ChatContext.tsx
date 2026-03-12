import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

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
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const stompClient = useRef<Stomp.Client | null>(null);

  // Sound notification ref
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

  const resetChat = () => {
    setMessages([]);
    setUnreadCount(0);
    setIsChatOpen(false);
    if (stompClient.current?.connected) {
      stompClient.current.disconnect(() => setConnected(false));
    }
  };

  useEffect(() => {
    localStorage.setItem('chat_muted', isMuted.toString());
  }, [isMuted]);

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

    // Use current location to help WSL2/Production environments resolve 'localhost' vs 'IP'
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080' : `http://${window.location.hostname}:8080`;
    const socket = new SockJS(`${baseUrl}/ws`);
    const client = Stomp.over(socket);
    stompClient.current = client;
    client.debug = () => {}; 

    client.connect({}, () => {
      setConnected(true);
      client.subscribe('/user/queue/messages', (message) => {
        const receivedMsg: ChatMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, receivedMsg]);
        
        // Notification Logic
        if (!isChatOpen) {
          setUnreadCount((prev) => prev + 1);
          if (!isMuted) {
            notificationSound.current.play().catch(e => console.log("Sound play blocked by browser"));
          }
        }
      });
    }, () => setConnected(false));

    return () => { 
      if (stompClient.current?.connected) {
        stompClient.current.disconnect(); 
      }
    };
  }, [token, isChatOpen, isMuted]); // Added isMuted to dependency to ensure sound logic stays fresh

  const sendMessage = (msg: ChatMessage) => {
    if (stompClient.current?.connected) {
      stompClient.current.send("/app/chat", {}, JSON.stringify(msg));
      setMessages((prev) => [...prev, msg]);
    } else {
      console.warn("WebSocket not connected.");
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