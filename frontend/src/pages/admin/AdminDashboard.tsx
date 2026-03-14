import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartBar, FaSync, FaHistory, FaShieldAlt 
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import adminService from '../../services/admin.service';
import SellerModeration from './SellerModeration'; 
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingProducts: 0,
    pendingSellers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardSummary(); 
      if (data) {
        setStats({
          totalUsers: data.totalUsers || 0,
          totalSellers: data.totalSellers || 0,
          totalProducts: data.totalProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          pendingProducts: data.pendingProducts || 0,
          pendingSellers: data.pendingSellers || 0
        });
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      toast.error("Không thể kết nối với máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sellers': 
        return <SellerModeration />;
      case 'summary': 
        return (
          <div className="dashboard-render-area">
            {/* Revenue Section - Using Chat style gradient */}
            <div className="revenue-summary-card">
              <div className="rev-info">
                <label>Doanh thu tổng hệ thống</label>
                <div className="rev-value-row">
                    <h2>{stats.totalRevenue.toLocaleString('vi-VN')}</h2>
                    <span className="unit">VNĐ</span>
                </div>
                <p className="rev-subtitle">Cập nhật dựa trên các đơn hàng đã hoàn tất</p>
              </div>
              <div className="rev-visual">
                 <FaChartBar className="rev-bg-icon" />
              </div>
            </div>
            
            {/* Secondary Stats */}
            <div className="quick-info-grid">
               <div className="info-mini-card">
                  <div className="mini-card-icon"><FaHistory /></div>
                  <div className="mini-card-text">
                    <label>Đơn hàng thành công</label>
                    <strong>{stats.totalOrders}</strong>
                  </div>
               </div>
               <div className="info-mini-card">
                  <div className="mini-card-icon"><FaShieldAlt /></div>
                  <div className="mini-card-text">
                    <label>Tỷ lệ duyệt Người bán</label>
                    <strong>{stats.totalSellers > 0 ? ((stats.totalSellers / (stats.totalSellers + stats.pendingSellers)) * 100).toFixed(0) : 0}%</strong>
                  </div>
               </div>
            </div>
          </div>
        );
      default: 
        return (
          <div className="empty-state-container">
            <div className="empty-state-icon">🛠️</div>
            <p>Tính năng <strong>"{activeTab}"</strong> hiện đang được phát triển.</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-master-layout"> 
      {/* 1. Sidebar Column */}
      <div className="sidebar-fixed-column">
        <AccountSidebar />
      </div>

      {/* 2. Main View Container */}
      <main className="admin-main-view">
        <div className="admin-dashboard-wrapper">
          
          {/* Dashboard Header */}
          <header className="admin-page-header">
            <div className="header-left">
              <h1>Hệ thống Quản trị AiNetsoft</h1>
              <div className="badge-container">
                <span className="master-badge">GLOBAL ADMIN</span>
                <span className="status-dot">Online</span>
              </div>
            </div>
            <button className="btn-refresh" onClick={fetchSummary} disabled={loading}>
              <FaSync className={loading ? 'spin' : ''} />
              <span>{loading ? 'Đang đồng bộ...' : 'Làm mới'}</span>
            </button>
          </header>

          {/* Core Metrics Grid */}
          <section className="metrics-grid">
            <div className={`metric-card ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <div className="metric-icon users"><FaUsers /></div>
              <div className="metric-data">
                <span className="metric-label">Tổng Người dùng</span>
                <span className="metric-value">{stats.totalUsers.toLocaleString()}</span>
              </div>
            </div>

            <div className={`metric-card ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
              <div className="metric-icon products"><FaBox /></div>
              <div className="metric-data">
                <span className="metric-label">Sản phẩm</span>
                <span className="metric-value">{stats.totalProducts}</span>
              </div>
            </div>

            <div className="metric-card urgent" onClick={() => setActiveTab('products')}>
              <div className="metric-icon pending"><FaClock /></div>
              <div className="metric-data">
                <span className="metric-label">Chờ Duyệt (SP)</span>
                <span className="metric-value">{stats.pendingProducts}</span>
              </div>
            </div>

            <div className={`metric-card ${stats.pendingSellers > 0 ? 'urgent' : ''}`} onClick={() => setActiveTab('sellers')}>
              <div className="metric-icon sellers"><FaStore /></div>
              <div className="metric-data">
                <span className="metric-label">Chờ Duyệt (Shop)</span>
                <span className="metric-value">{stats.pendingSellers}</span>
              </div>
            </div>
          </section>

          {/* Content Tabs Navigation */}
          <nav className="content-tabs">
            <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>
              Tổng quan
            </button>
            <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
              Người dùng
            </button>
            <button className={activeTab === 'sellers' ? 'active' : ''} onClick={() => setActiveTab('sellers')}>
              Duyệt Shop {stats.pendingSellers > 0 && <span className="notif-badge">{stats.pendingSellers}</span>}
            </button>
            <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
              Nhật ký hệ thống
            </button>
          </nav>

          {/* Dynamic Content Rendering Area */}
          <section className="dynamic-view-area">
            {loading && activeTab === 'summary' ? (
              <div className="loading-placeholder">
                <div className="shimmer-effect"></div>
                <span>Đang tải dữ liệu hệ thống...</span>
              </div>
            ) : renderContent()}
          </section>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;