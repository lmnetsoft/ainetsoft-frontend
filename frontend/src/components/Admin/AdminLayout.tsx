import React from 'react';
import AccountSidebar from '../AccountSidebar/AccountSidebar';
import './AdminLayout.css';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="admin-master-layout">
      <div className="sidebar-fixed-column">
        <AccountSidebar />
      </div>
      <main className="admin-main-view">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;