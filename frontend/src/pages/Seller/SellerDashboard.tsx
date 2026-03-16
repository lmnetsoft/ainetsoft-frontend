import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaWallet, FaShoppingBag, FaBoxOpen, FaStar, 
  FaPlusCircle, FaArrowRight, FaChartLine, FaExclamationTriangle 
} from 'react-icons/fa';
import api from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import { getUserProfile } from '../../services/authService';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeProducts: 0,
    lowStockCount: 0, 
    rating: 0.0,
    reviewCount: 0
  });
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem('userName') || 'Người bán';

  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Seller Stats and Shop Settings in parallel
        const [statsRes, profile] = await Promise.all([
          api.get('/orders/seller/stats'),
          getUserProfile()
        ]);

        setStats(statsRes.data);
        
        // 2. Sync Global Low Stock Threshold
        if (profile?.shopProfile?.lowStockThreshold) {
          setThreshold(profile.shopProfile.lowStockThreshold);
        }
      } catch (err) {
        console.error("Failed to load seller dashboard data.");
        setStats(prev => ({ ...prev, rating: 4.8 })); 
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
    document.title = "Kênh Người Bán | AiNetsoft";
  }, []);

  if (loading) return <LoadingOverlay />;

  return (
    <div className="seller-dashboard-wrapper">
      <div className="container seller-container">
        <AccountSidebar />

        <main className="seller-main-content">
          <div className="dashboard-header">
            <div className="welcome-text-group">
              <h1><FaChartLine className="header-icon" /> Xin chào, {userName}</h1>
              <p>Tổng quan hiệu quả kinh doanh của shop bạn.</p>
            </div>
            {/* FIXED: Path synchronized with App.tsx to prevent 404 */}
            <button className="btn-add-quick" onClick={() => navigate('/seller/add')}>
              <FaPlusCircle /> Đăng sản phẩm mới
            </button>
          </div>

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

          <div className="dashboard-sections">
            <div className="tasks-section">
              <div className="section-header-row">
                <h3>Danh sách cần làm</h3>
                <span className="subtitle">Những việc bạn cần xử lý ngay</span>
              </div>
              
              <div className="task-list">
                <div className="task-item" onClick={() => navigate('/seller/orders')}>
                  <div className="task-left">
                    <span className={`count ${stats.pendingOrders > 0 ? 'highlight' : ''}`}>
                      {stats.pendingOrders}
                    </span>
                    <span className="label">Đơn hàng chờ xác nhận</span>
                  </div>
                  <FaArrowRight className="arrow-link" />
                </div>

                <div className="task-item" onClick={() => navigate('/seller/products')}>
                  <div className="task-left">
                    <span className="count">0</span>
                    <span className="label">Sản phẩm bị tạm khóa</span>
                  </div>
                  <FaArrowRight className="arrow-link" />
                </div>

                <div className="task-item" onClick={() => navigate('/seller/products')}>
                  <div className="task-left">
                    <span className={`count ${stats.lowStockCount > 0 ? 'highlight-warning' : ''}`}>
                      {stats.lowStockCount}
                    </span>
                    <span className="label">
                      Sản phẩm dưới ngưỡng tồn kho ({threshold})
                    </span>
                  </div>
                  {stats.lowStockCount > 0 && <FaExclamationTriangle className="warning-icon-dash" />}
                  <FaArrowRight className="arrow-link" />
                </div>
              </div>
            </div>

            <div className="marketing-banner-card">
              <div className="banner-badge">MỚI</div>
              <h3>Tăng trưởng doanh số</h3>
              <p>Sử dụng công cụ <strong>Flash Sale</strong> để thu hút thêm 40% khách hàng mới trong tuần này.</p>
              <button className="btn-market-action" onClick={() => navigate('/seller/settings')}>
                Thiết lập ngay
              </button>
              <div className="banner-bg-decoration"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;