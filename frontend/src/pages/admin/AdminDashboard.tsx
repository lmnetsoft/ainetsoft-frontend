import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartBar, FaSync, FaHistory, FaShieldAlt
} from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingProducts: 0,
    pendingSellers: 0,
  });
  
  const [loading, setLoading] = useState(true);

  // --- 1. DATA FETCHERS ---
  const fetchSummary = async (showToast = false) => {
    try {
      if (showToast) setLoading(true);
      const data = await adminService.getDashboardSummary(); 
      if (data) {
        setStats({
          totalUsers: data.totalUsers || 0,
          totalSellers: data.totalSellers || 0,
          totalProducts: data.totalProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          pendingProducts: data.pendingProducts || 0,
          pendingSellers: data.pendingSellers || 0,
        });
      }
      if (showToast) toast.success("Số liệu đã được đồng bộ");
    } catch (err) {
      console.error("Summary Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => { fetchSummary(); }, 120000); // Auto-refresh every 2 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-dashboard-wrapper">
      <header className="admin-page-header">
        <div className="header-left">
          <h1>Hệ thống Quản trị AiNetsoft</h1>
          <div className="badge-container">
            <span className="master-badge">GLOBAL ADMIN</span>
            <span className="status-dot">Online</span>
          </div>
        </div>
        <button className="btn-refresh" onClick={() => fetchSummary(true)} disabled={loading}>
          <FaSync className={loading ? 'spin' : ''} />
          <span>{loading ? 'Đang đồng bộ...' : 'Làm mới'}</span>
        </button>
      </header>

      {/* Top 4 Stat Cards */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon users"><FaUsers /></div>
          <div className="metric-data">
            <span className="metric-label">Tổng Người dùng</span>
            <span className="metric-value">{stats.totalUsers.toLocaleString()}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon products"><FaBox /></div>
          <div className="metric-data">
            <span className="metric-label">Sản phẩm</span>
            <span className="metric-value">{stats.totalProducts}</span>
          </div>
        </div>
        <div className="metric-card urgent">
          <div className="metric-icon pending"><FaClock /></div>
          <div className="metric-data">
            <span className="metric-label">Chờ Duyệt (SP)</span>
            <span className="metric-value">{stats.pendingProducts}</span>
          </div>
        </div>
        <div className="metric-card urgent">
          <div className="metric-icon sellers"><FaStore /></div>
          <div className="metric-data">
            <span className="metric-label">Chờ Duyệt (Shop)</span>
            <span className="metric-value">{stats.pendingSellers}</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Visuals */}
      <section className="dynamic-view-area">
        <div className="dashboard-render-area">
          <div className="revenue-summary-card">
            <div className="rev-info">
              <label>Doanh thu tổng hệ thống</label>
              <div className="rev-value-row">
                <h2>{stats.totalRevenue.toLocaleString('vi-VN')}</h2>
                <span className="unit">VNĐ</span>
              </div>
            </div>
            <div className="rev-visual"><FaChartBar className="rev-bg-icon" /></div>
          </div>

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
                  <strong>
                    {stats.totalSellers > 0 
                      ? ((stats.totalSellers / (stats.totalSellers + stats.pendingSellers)) * 100).toFixed(0) 
                      : 0}%
                  </strong>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;