import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import './AdminDashboard.css'; // Ensure you have this CSS file

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('sellers');

  useEffect(() => {
    document.title = "Bảng điều khiển Admin | AiNetsoft";
  }, []);

  return (
    <div className="profile-wrapper">
      <div className="container profile-container admin-dashboard-layout">
        {/* RESTORED: Resident Left Menu */}
        <AccountSidebar />
        
        <main className="profile-main-content">
          <div className="admin-dashboard-header">
            <h1>Bảng điều khiển Admin</h1>
          </div>

          <div className="admin-dashboard-content-box">
            <div className="dashboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'sellers' ? 'active' : ''}`}
                onClick={() => setActiveTab('sellers')}
              >
                Duyệt Người Bán (0)
              </button>
              <button 
                className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Duyệt Sản Phẩm
              </button>
            </div>

            <div className="dashboard-table-container">
              <div className="table-header-info">
                <span><strong>Tên người dùng</strong></span>
                <span><strong>Email/Phone</strong></span>
                <span><strong>Hành động</strong></span>
              </div>
              
              <div className="table-body-empty">
                <p>Hiện không có yêu cầu nào cần xử lý.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;