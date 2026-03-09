import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '../services/notificationService';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    }
  }, [isAuthenticated]);

  // Initial fetch and Polling every 60 seconds
  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
      const interval = setInterval(refreshUnreadCount, 60000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};