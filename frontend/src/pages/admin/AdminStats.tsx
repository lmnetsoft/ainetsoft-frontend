import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaStore, FaBox, FaMoneyBillWave, 
  FaChartLine, FaExclamationCircle, FaCheckCircle 
} from 'react-icons/fa';
import { adminService } from '../../services/admin.service';
import './AdminStats.css';

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalRevenue: 542000000, // Placeholder or fetched from backend
    totalUsers: 1240,
    totalSellers: 85,
    pendingProducts: 12,
    pendingSellers: 5,
    totalOrders: 432
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch this from a specialized @GetMapping("/api/admin/stats")
    // fetchGlobalStats();
  }, []);

  return (
    <div className="admin-stats-wrapper">
      <div className="stats-header">
        <h1>Tổng Quan Hệ Thống AiNetsoft</h1>
        <p>Báo cáo chi tiết về tăng trưởng và hoạt động của nền tảng.</p>
      </div>

      {/* 1. KEY PERFORMANCE INDICATORS (KPIs) */}
      <div className="admin-kpi-grid">
        <div className="kpi-card purple">
          <div className="kpi-icon"><FaMoneyBillWave /></div>
          <div className="kpi-data">
            <span>Tổng GMV (Doanh số)</span>
            <h3>₫{stats.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="kpi-trend">+12% tháng này</div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon"><FaUsers /></div>
          <div className="kpi-data">
            <span>Tổng Người Dùng</span>
            <h3>{stats.totalUsers.toLocaleString()}</h3>
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-icon"><FaStore /></div>
          <div className="kpi-data">
            <span>Đối Tác Người Bán</span>
            <h3>{stats.totalSellers}</h3>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon"><FaBox /></div>
          <div className="kpi-data">
            <span>Đơn Hàng Thành Công</span>
            <h3>{stats.totalOrders}</h3>
          </div>
        </div>
      </div>

      <div className="admin-secondary-grid">
        {/* 2. MODERATION HEALTH */}
        <div className="admin-section-box">
          <h3>Trạng Thái Kiểm Duyệt</h3>
          <div className="moderation-summary">
            <div className="mod-item">
              <FaExclamationCircle className="warn" />
              <div className="info">
                <strong>{stats.pendingSellers}</strong>
                <span>Yêu cầu nâng cấp Shop đang chờ</span>
              </div>
              <button onClick={() => window.location.href='/admin/dashboard'}>Xử lý ngay</button>
            </div>
            <div className="mod-item">
              <FaExclamationCircle className="warn" />
              <div className="info">
                <strong>{stats.pendingProducts}</strong>
                <span>Sản phẩm đang chờ phê duyệt</span>
              </div>
              <button onClick={() => window.location.href='/admin/dashboard'}>Xử lý ngay</button>
            </div>
          </div>
        </div>

        {/* 3. GROWTH TRENDS (SIMULATED) */}
        <div className="admin-section-box">
          <h3>Biểu Đồ Tăng Trưởng</h3>
          <div className="chart-placeholder">
            {/* You can integrate Recharts or Chart.js here */}
            <div className="simulated-bar-chart">
              {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
                <div key={i} className="bar" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="chart-labels">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;