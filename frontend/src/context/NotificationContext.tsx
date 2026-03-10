import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '../services/notificationService';

interface NotificationContextType {
  notificationCount: number; // Renamed to avoid conflict with Chat unreadCount
  refreshNotificationCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  
  // We determine auth status dynamically to handle login/logout without refresh
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');

  const refreshNotificationCount = useCallback(async () => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    if (!authStatus) {
      setNotificationCount(0);
      return;
    }

    try {
      const count = await getUnreadCount();
      setNotificationCount(count);
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    }
  }, []);

  // Update auth state and fetch count when login/logout events happen
  const handleAuthChange = useCallback(() => {
    const status = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(status);
    if (status) {
      refreshNotificationCount();
    } else {
      setNotificationCount(0);
    }
  }, [refreshNotificationCount]);

  useEffect(() => {
    // Initial check
    handleAuthChange();

    // Polling every 60 seconds
    let interval: NodeJS.Timeout;
    if (isAuthenticated) {
      interval = setInterval(refreshNotificationCount, 60000);
    }

    // Listen for custom login/profile events
    window.addEventListener('profileUpdate', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('profileUpdate', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [isAuthenticated, refreshNotificationCount, handleAuthChange]);

  return (
    <NotificationContext.Provider value={{ notificationCount, refreshNotificationCount }}>
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