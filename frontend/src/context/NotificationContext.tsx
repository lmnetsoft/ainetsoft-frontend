import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadCount } from '../services/notificationService';

interface NotificationContextType {
  notificationCount: number;
  refreshNotificationCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Track auth status to control polling
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  
  // 🛠️ USE A REF: Prevents concurrent API calls if multiple events fire at once (fixes request storm)
  const isFetching = useRef(false);

  const refreshNotificationCount = useCallback(async () => {
    if (isFetching.current) return;

    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    if (!authStatus) {
      setNotificationCount(0);
      return;
    }

    try {
      isFetching.current = true;
      const count = await getUnreadCount();
      // Ensure we set the raw number directly
      setNotificationCount(count);
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    } finally {
      isFetching.current = false;
    }
  }, []);

  // 🛠️ EFFECT 1: EVENT LISTENERS
  // Listens for changes in login status or profile updates
  useEffect(() => {
    const handleAuthChange = () => {
      const status = localStorage.getItem('isAuthenticated') === 'true';
      
      // Only update state if it actually changed to prevent re-render loops
      setIsAuthenticated(prev => (prev !== status ? status : prev));
      
      if (status) {
        refreshNotificationCount();
      } else {
        setNotificationCount(0);
      }
    };

    window.addEventListener('profileUpdate', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('profileUpdate', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshNotificationCount]);

  // 🛠️ EFFECT 2: INITIAL FETCH & POLLING
  // Controls the background timer (60s)
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch once immediately on mount or login
      refreshNotificationCount();

      // Set polling interval
      const interval = setInterval(refreshNotificationCount, 60000);
      
      return () => clearInterval(interval);
    } else {
      setNotificationCount(0);
    }
  }, [isAuthenticated, refreshNotificationCount]);

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