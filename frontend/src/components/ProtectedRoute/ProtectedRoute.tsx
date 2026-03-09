import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  // --- THE FIX: Use the JWT token as the primary check ---
  const token = localStorage.getItem('jwt_token');
  const isAuthenticated = !!token && localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();

  // 1. Check Authentication (Are they logged in with a valid token?)
  if (!isAuthenticated) {
    // Redirect to login and save the path (e.g., /user/purchase) 
    // so Login.tsx can send them back automatically.
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  // 2. Check Authorization (Do they have the right role?)
  if (allowedRoles && allowedRoles.length > 0) {
    // Parse the roles saved during login
    const userRoles: string[] = JSON.parse(localStorage.getItem('userRoles') || '[]');
    
    // Check if the user has at least one of the required roles
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      // User is logged in, but not authorized for this specific page 
      // (e.g., a standard User trying to access /admin/dashboard)
      return <Navigate to="/" replace />;
    }
  }

  // If authenticated and authorized, render the requested page
  return <>{children}</>;
};

export default ProtectedRoute;