import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadCount, getPendingWithdrawalCount } from '../services/notificationService';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import alarmSound from '../assets/sounds/Alarm01.wav';
import toast from 'react-hot-toast';

interface NotificationContextType {
  notificationCount: number;
  withdrawalCount: number; 
  refreshNotificationCount: () => Promise<void>;
  latestNotification: any | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 🚀 HÀM GIẢI MÃ JWT ĐỂ LẤY EMAIL/SỐ ĐIỆN THOẠI ĐỊNH TUYẾN
const getIdentifierFromToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).sub; 
    } catch (e) {
        return null;
    }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [withdrawalCount, setWithdrawalCount] = useState(0); 
  const [latestNotification, setLatestNotification] = useState<any | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const isFetching = useRef(false);

  const refreshNotificationCount = useCallback(async () => {
    if (isFetching.current) return;

    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    if (!authStatus) {
      setNotificationCount(0);
      setWithdrawalCount(0);
      return;
    }

    try {
      isFetching.current = true;
      const count = await getUnreadCount();
      setNotificationCount(count);

      const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) {
          const wCount = await getPendingWithdrawalCount();
          setWithdrawalCount(wCount);
      }
    } catch (error) {
      console.error("Failed to fetch notification counts", error);
    } finally {
      isFetching.current = false;
    }
  }, []);

  // 🚀 LẮNG NGHE WEBSOCKET BẰNG ĐƯỜNG ỐNG BYPASS
  useEffect(() => {
    if (!isAuthenticated) return;

    refreshNotificationCount();

    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    // Tự động phân tích Token để tìm đúng ống dẫn của mình
    const identifier = getIdentifierFromToken(token);
    if (!identifier) return;

    const stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        connectHeaders: { Authorization: `Bearer ${token}` },
        debug: (str) => console.log('🚀 [STOMP]: ' + str), // Bật Radar dò lỗi
        reconnectDelay: 5000,
        onConnect: () => {
            console.log(`🟢 [WebSocket] Đã kết nối! Lắng nghe tại: /topic/notifications/${identifier}`);
            
            // 🚀 BẮT ĐÚNG KÊNH CHỨA TÊN MÌNH, BỎ QUA LỖI ẨN DANH CỦA SPRING
            stompClient.subscribe(`/topic/notifications/${identifier}`, (message) => {
                console.log("🔔 [WebSocket] TIN NHẮN TỚI:", message.body);
                if (message.body) {
                    const notif = JSON.parse(message.body);
                    
                    // Nảy số tức thì
                    setNotificationCount(prev => prev + 1);
                    setLatestNotification(notif);

                    // Hiện Toast nổi bật góc màn hình
                    toast(notif.title || "Có thông báo hệ thống mới!", {
                        icon: '🔔',
                        style: { background: '#2d3436', color: '#fff', borderRadius: '8px' }
                    });

                    // Phát tiếng Ting
                    try {
                        const audio = new Audio(alarmSound);
                        audio.play().catch(e => console.log('Autoplay chặn âm thanh'));
                    } catch(e) {}
                }
            });
        },
        onStompError: (frame) => {
            console.error('🔴 Broker báo lỗi: ' + frame.headers['message']);
        }
    });

    stompClient.activate();

    return () => {
        stompClient.deactivate();
    };
  }, [isAuthenticated, refreshNotificationCount]);

  useEffect(() => {
    const handleAuthChange = () => {
      const status = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(prev => (prev !== status ? status : prev));
      if (!status) {
        setNotificationCount(0);
        setWithdrawalCount(0);
      }
    };

    window.addEventListener('profileUpdate', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('profileUpdate', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notificationCount, withdrawalCount, refreshNotificationCount, latestNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};