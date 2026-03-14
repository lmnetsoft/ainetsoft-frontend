import React, { useEffect, useState } from 'react';
import { FaUsers, FaBox, FaStore, FaClock } from 'react-icons/fa';
import { adminService } from '../../services/admin.service';
import './AdminDashboard.css';

const AdminStatsHeader: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSellers: 0,
    pendingProducts: 0,
    pendingSellers: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      // Don't set loading to true every time to avoid flickering on refresh
      const res = await adminService.getDashboardSummary();
      
      /**
       * AXIOS LOGIC CHECK: 
       * If your adminService returns 'api.get(...)', the data is in 'res.data'.
       * If your adminService already returns 'response.data', then 'res' IS the stats.
       */
      const data = res.data ? res.data : res;

      if (data) {
        setStats({
          totalUsers: data.totalUsers || 0,
          totalProducts: data.totalProducts || 0,
          totalSellers: data.totalSellers || 0,
          pendingProducts: data.pendingProducts || 0,
          pendingSellers: data.pendingSellers || 0
        });
      }
    } catch (error) {
      console.error("Failed to load summary stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    /**
     * GLOBAL REFRESH EVENT
     * This allows AdminSellers.tsx to tell this header: "Hey, I just approved someone, update the numbers!"
     */
    window.addEventListener('refreshAdminStats', loadStats);
    
    return () => {
      window.removeEventListener('refreshAdminStats', loadStats);
    };
  }, []);

  return (
    <div className="admin-stats-grid">
      {/* Total Users */}
      <div className="stat-card">
        <div className="stat-icon users"><FaUsers /></div>
        <div className="stat-info">
          <span className="stat-label">Tổng Người dùng</span>
          <span className="stat-value">{loading ? "..." : stats.totalUsers.toLocaleString()}</span>
        </div>
      </div>

      {/* Total Products */}
      <div className="stat-card">
        <div className="stat-icon products"><FaBox /></div>
        <div className="stat-info">
          <span className="stat-label">Sản phẩm</span>
          <span className="stat-value">{loading ? "..." : stats.totalProducts.toLocaleString()}</span>
        </div>
      </div>

      {/* Pending Products (Urgent) */}
      <div className="stat-card urgent">
        <div className="stat-icon pending"><FaClock /></div>
        <div className="stat-info">
          <span className="stat-label">Chờ Duyệt (SP)</span>
          <span className="stat-value">{loading ? "..." : stats.pendingProducts}</span>
        </div>
        {stats.pendingProducts > 0 && <span className="urgent-badge">Cần xử lý</span>}
      </div>

      {/* Pending Sellers (Urgent) */}
      <div className="stat-card urgent">
        <div className="stat-icon sellers"><FaStore /></div>
        <div className="stat-info">
          <span className="stat-label">Chờ Duyệt (Shop)</span>
          <span className="stat-value">{loading ? "..." : stats.pendingSellers}</span>
        </div>
        {stats.pendingSellers > 0 && <span className="urgent-badge">Cần xử lý</span>}
      </div>
    </div>
  );
};

export default AdminStatsHeader;