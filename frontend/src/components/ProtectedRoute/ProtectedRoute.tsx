import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('jwt_token');
  const isAuthenticated = !!token && localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!isAuthenticated) {
        setIsVerifying(false);
        return;
      }

      try {
        // 1. Get roles from storage initially
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        
        // 2. If user is trying to access a SELLER/ADMIN route but roles are missing locally,
        // force a quick profile sync to check real-time database status.
        const needsSync = allowedRoles && allowedRoles.some(role => !storedRoles.includes(role));

        if (needsSync) {
          // --- FIXED: Changed /auth/profile to /auth/me to match backend GET endpoint ---
          const res = await api.get('/auth/me');
          const latestUser = res.data;
          
          // Sync storage with fresh database state
          localStorage.setItem('user', JSON.stringify(latestUser));
          localStorage.setItem('userRoles', JSON.stringify(latestUser.roles || []));
          setCurrentRoles(latestUser.roles || []);
        } else {
          setCurrentRoles(storedRoles);
        }
      } catch (err) {
        console.error("Auth Guard Sync failed:", err);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAccess();
  }, [isAuthenticated, allowedRoles]);

  // 1. Show nothing (or a spinner) while checking real-time permissions
  if (isAuthenticated && isVerifying) {
    return null; 
  }

  // 2. Check Authentication
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  // 3. Check Authorization (with the fresh roles)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => currentRoles.includes(role));

    if (!hasRequiredRole) {
      // If after syncing they still don't have the role, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;