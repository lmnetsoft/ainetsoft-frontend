import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaWallet, FaShoppingBag, FaBoxOpen, FaStar, 
  FaPlusCircle, FaArrowRight, FaChartLine 
} from 'react-icons/fa';
import api from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeProducts: 0,
    rating: 0.0,
    reviewCount: 0
  });
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem('userName') || 'Người bán';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        /**
         * Matches Backend: This endpoint will aggregate data from the 
         * Orders and Products collections for the current logged-in seller.
         */
        const res = await api.get('/orders/seller/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load seller stats. Check if /api/orders/seller/stats exists.");
        // Fallback for UI testing if endpoint is not yet deployed
        setStats(prev => ({ ...prev, rating: 4.8 })); 
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    document.title = "Kênh Người Bán | AiNetsoft";
  }, []);

  if (loading) return <LoadingOverlay />;

  return (
    <div className="seller-dashboard-wrapper">
      <div className="container seller-container">
        <AccountSidebar />

        <main className="seller-main-content">
          {/* HEADER SECTION */}
          <div className="dashboard-header">
            <div className="welcome-text-group">
              <h1><FaChartLine className="header-icon" /> Xin chào, {userName}</h1>
              <p>Tổng quan hiệu quả kinh doanh của shop bạn.</p>
            </div>
            <button className="btn-add-quick" onClick={() => navigate('/seller/add-product')}>
              <FaPlusCircle /> Đăng sản phẩm mới
            </button>
          </div>

          {/* 1. KEY PERFORMANCE INDICATORS (KPIs) */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon rev"><FaWallet /></div>
              <div className="stat-info">
                <span>Doanh thu (₫)</span>
                <h3>{stats.totalRevenue.toLocaleString('vi-VN')}</h3>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon ord"><FaShoppingBag /></div>
              <div className="stat-info">
                <span>Tổng đơn hàng</span>
                <h3>{stats.totalOrders}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pen"><FaBoxOpen /></div>
              <div className="stat-info">
                <span>Chờ xác nhận</span>
                <h3>{stats.pendingOrders}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rat"><FaStar /></div>
              <div className="stat-info">
                <span>Đánh giá Shop</span>
                <h3>{stats.rating > 0 ? `${stats.rating} / 5` : "Chưa có"}</h3>
              </div>
            </div>
          </div>

          {/* 2. OPERATIONAL TASKS & INSIGHTS */}
          <div className="dashboard-sections">
            <div className="tasks-section">
              <div className="section-header-row">
                <h3>Danh sách cần làm</h3>
                <span className="subtitle">Những việc bạn cần xử lý ngay</span>
              </div>
              
              <div className="task-list">
                <div className="task-item" onClick={() => navigate('/seller/orders')}>
                  <div className="task-left">
                    <span className="count highlight">{stats.pendingOrders}</span>
                    <span className="label">Đơn hàng chờ xác nhận</span>
                  </div>
                  <FaArrowRight className="arrow-link" />
                </div>

                <div className="task-item" onClick={() => navigate('/seller/my-products')}>
                  <div className="task-left">
                    <span className="count">0</span>
                    <span className="label">Sản phẩm bị tạm khóa</span>
                  </div>
                  <FaArrowRight className="arrow-link" />
                </div>

                <div className="task-item" onClick={() => navigate('/seller/my-products')}>
                  <div className="task-left">
                    <span className="count">{stats.activeProducts === 0 ? '!' : '0'}</span>
                    <span className="label">Sản phẩm hết hàng</span>
                  </div>
                  <FaArrowRight className="arrow-link" />
                </div>
              </div>
            </div>

            {/* MARKETING & GROWTH */}
            <div className="marketing-banner-card">
              <div className="banner-badge">MỚI</div>
              <h3>Tăng trưởng doanh số</h3>
              <p>Sử dụng công cụ <strong>Flash Sale</strong> để thu hút thêm 40% khách hàng mới trong tuần này.</p>
              <button className="btn-market-action">Khám phá ngay</button>
              <div className="banner-bg-decoration"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;