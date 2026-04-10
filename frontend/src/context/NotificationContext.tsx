import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadCount, getPendingWithdrawalCount } from '../services/notificationService';

interface NotificationContextType {
  notificationCount: number;
  withdrawalCount: number; // 🚀 NEW: Track withdrawal requests
  refreshNotificationCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [withdrawalCount, setWithdrawalCount] = useState(0); // 🚀 NEW State
  
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
      
      // Fetch unread system notifications
      const count = await getUnreadCount();
      setNotificationCount(count);

      // 🚀 ELITE LOGIC: If Admin, also fetch pending withdrawals
      const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      if (roles.includes('ADMIN')) {
          const wCount = await getPendingWithdrawalCount();
          setWithdrawalCount(wCount);
      }
    } catch (error) {
      console.error("Failed to fetch notification counts", error);
    } finally {
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const status = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(prev => (prev !== status ? status : prev));
      
      if (status) {
        refreshNotificationCount();
      } else {
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
  }, [refreshNotificationCount]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotificationCount();
      const interval = setInterval(refreshNotificationCount, 60000);
      return () => clearInterval(interval);
    } else {
      setNotificationCount(0);
      setWithdrawalCount(0);
    }
  }, [isAuthenticated, refreshNotificationCount]);

  return (
    <NotificationContext.Provider value={{ notificationCount, withdrawalCount, refreshNotificationCount }}>
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