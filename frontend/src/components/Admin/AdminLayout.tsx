import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getUserProfile } from '../../services/authService';

import AccountSidebar from '../AccountSidebar/AccountSidebar';
import SellerSidebar from '../SellerSidebar/SellerSidebar'; 
import AdminSidebar from '../AdminSidebar/AdminSidebar'; 

import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const path = location.pathname;
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserProfile();
        setUserProfile(data);
      } catch (e) {
        console.error("Failed to load user profile in layout");
      }
    };
    fetchUser();
  }, []);

  const renderSidebar = () => {
    if (path.startsWith('/admin')) {
       return <AdminSidebar />; 
    }
    if (path.startsWith('/seller')) {
       return <SellerSidebar />; 
    }
    return <AccountSidebar />;
  };

  return (
    <div className="admin-master-layout">
      <div className="admin-layout-inner-container">
        <aside className="sidebar-column">
          {renderSidebar()}
        </aside>
        <main className="admin-main-view">
          <div className="admin-content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;