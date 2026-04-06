import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartLine, FaSync, FaHistory, FaShieldAlt,
  FaArrowUp, FaChartBar
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

  // --- 1. DATA FETCHING (Summary Only) ---
  const fetchSummary = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
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
      if (isManual) toast.success("Số liệu hệ thống đã được cập nhật");
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      toast.error("Không thể đồng bộ dữ liệu mới nhất.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Auto-refresh every 2 minutes to keep the "Online" feel
    const interval = setInterval(() => { fetchSummary(); }, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-dashboard-wrapper">
      {/* 🚀 PAGE HEADER: Standardized Supreme Style */}
      <header className="admin-page-header">
        <div className="header-left">
          <h1>Hệ thống Quản trị AiNetsoft</h1>
          <div className="badge-container">
            <span className="master-badge">GLOBAL ADMIN</span>
            <span className="status-dot">Online</span>
          </div>
        </div>
        <button 
          className="btn-refresh" 
          onClick={() => fetchSummary(true)} 
          disabled={loading}
        >
          <FaSync className={loading ? 'spin' : ''} />
          <span>{loading ? 'Đang đồng bộ...' : 'Làm mới'}</span>
        </button>
      </header>

      {/* 🚀 KPI STATS: 4-Column High-Level Data */}
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
            <span className="metric-value">{stats.totalProducts.toLocaleString()}</span>
          </div>
        </div>

        <div className="metric-card highlight-orange">
          <div className="metric-icon pending"><FaClock /></div>
          <div className="metric-data">
            <span className="metric-label">Chờ Duyệt (SP)</span>
            <span className="metric-value">{stats.pendingProducts}</span>
          </div>
        </div>

        <div className="metric-card highlight-red">
          <div className="metric-icon sellers"><FaStore /></div>
          <div className="metric-data">
            <span className="metric-label">Chờ Duyệt (Shop)</span>
            <span className="metric-value">{stats.pendingSellers}</span>
          </div>
        </div>
      </section>

      {/* 🚀 MAIN CONTENT AREA: Focused on Revenue & Efficiency */}
      <section className="dashboard-main-content">
        
        {/* Large Revenue Summary */}
        <div className="revenue-summary-card">
          <div className="rev-header">
            <div className="rev-title">
              <label><FaChartLine /> Doanh thu tổng hệ thống</label>
              <div className="rev-value-row">
                <h2>{stats.totalRevenue.toLocaleString('vi-VN')}</h2>
                <span className="unit">VNĐ</span>
              </div>
            </div>
            <div className="rev-badge">
              <FaArrowUp /> 15% <small>so với tháng trước</small>
            </div>
          </div>
          
          <div className="rev-visual-area">
             <div className="chart-bar-container">
                <div className="bar" style={{height: '35%'}}></div>
                <div className="bar" style={{height: '55%'}}></div>
                <div className="bar" style={{height: '40%'}}></div>
                <div className="bar active" style={{height: '85%'}}></div>
                <div className="bar" style={{height: '50%'}}></div>
                <div className="bar" style={{height: '65%'}}></div>
                <div className="bar" style={{height: '45%'}}></div>
             </div>
          </div>
        </div>

        {/* Bottom Row Mini-Cards */}
        <div className="secondary-stats-row">
           <div className="info-mini-card">
              <div className="mini-card-icon"><FaHistory /></div>
              <div className="mini-card-text">
                <label>Đơn hàng thành công</label>
                <strong>{stats.totalOrders.toLocaleString()}</strong>
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
      </section>
    </div>
  );
};

export default AdminDashboard;