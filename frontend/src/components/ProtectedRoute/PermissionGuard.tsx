import React, { ReactNode } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  permission: 'MANAGE_PRODUCTS' | 'MANAGE_CATEGORIES' | 'MANAGE_SELLERS' | 'VIEW_STATS' | 'CUSTOMER_SUPPORT';
  fallback?: ReactNode; // Optional: what to show if they DON'T have permission
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ children, permission, fallback = null }) => {
  // 1. Pull security state from localStorage (populated during login/verifySession)
  const isGlobalAdmin = localStorage.getItem('isGlobalAdmin') === 'true';
  const rawPermissions = localStorage.getItem('userPermissions') || '[]';
  
  let userPermissions: string[] = [];
  try {
    userPermissions = JSON.parse(rawPermissions);
  } catch (e) {
    userPermissions = [];
  }

  // 2. Authorization Logic:
  // Global Admin can see EVERYTHING. 
  // Sub-Admins only see if their permission list includes the specific key.
  const hasPermission = isGlobalAdmin || userPermissions.includes(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;