import React from 'react';
import { Outlet } from 'react-router-dom'; // 🚀 Added Outlet
import AccountSidebar from '../AccountSidebar/AccountSidebar';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="admin-master-layout">
      {/* 🚀 THE SUPREME FIX: This container locks sidebar and content together in the center */}
      <div className="admin-layout-inner-container">
        
        <aside className="sidebar-column">
          {/* This sidebar now stays persistent (doesn't reload) when clicking links */}
          <AccountSidebar />
        </aside>

        <main className="admin-main-view">
          <div className="admin-content-wrapper">
            {/* 🚀 Outlet renders the specific page content (Profile, Address, etc.) */}
            <Outlet /> 
          </div>
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;