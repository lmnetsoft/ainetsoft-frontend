import React from 'react';
import { Outlet } from 'react-router-dom';
import AccountSidebar from '../AccountSidebar/AccountSidebar';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="admin-master-layout">
      <div className="admin-layout-inner-container">
        <aside className="sidebar-column">
          <AccountSidebar />
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