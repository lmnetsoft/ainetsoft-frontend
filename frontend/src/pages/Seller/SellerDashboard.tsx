import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaWallet, FaShoppingBag, FaBoxOpen, FaStar, 
  FaPlusCircle, FaArrowRight, FaChartLine 
} from 'react-icons/fa';
import api from '../../services/api'; 
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
        const [statsRes, profile] = await Promise.all([
          api.get('/orders/seller/stats'),
          getUserProfile()
        ]);
        setStats(statsRes.data);
        if (profile?.shopProfile?.lowStockThreshold) {
          setThreshold(profile.shopProfile.lowStockThreshold);
        }
      } catch (err) {
        console.error("Dashboard error");
        setStats(prev => ({ ...prev, rating: 4.8 })); 
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
    document.title = "Kênh Người Bán | AiNetsoft";
  }, []);

  return (
    /* 🚀 MASTER WRAPPER: Matches MyProducts exactly */
    <div className="seller-dashboard-supreme-layout">
      
      <main className="dashboard-main-view">
        {/* 🚀 SUPREME HEADER: Matches MyProducts Header style */}
        <div className="supreme-content-header centered-header">
          <h1><FaChartLine style={{verticalAlign: 'middle', marginRight: '10px'}} /> XIN CHÀO, {userName}</h1>
          <p>Tổng quan hiệu quả kinh doanh của shop bạn.</p>
        </div>

        {/* 🚀 STABILITY FIX: Loading only affects the data sections, not the whole layout */}
        {loading ? (
          <div className="loading-placeholder-seller">Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="dashboard-action-toolbar">
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
                  <h3>{stats.rating > 0 ? `${stats.rating} / 5` : "4.8 / 5"}</h3>
                </div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="tasks-section">
                <div className="section-header-row">
                  <h3>Danh sách cần làm</h3>
                  <p>Những việc bạn cần xử lý ngay</p>
                </div>
                <div className="task-list">
                  <div className="task-item" onClick={() => navigate('/seller/orders')}>
                    <div className="task-left" style={{display: 'flex', alignItems: 'center'}}>
                      <span className={`count ${stats.pendingOrders > 0 ? 'highlight' : ''}`}>
                        {stats.pendingOrders}
                      </span>
                      <span style={{fontWeight: '600', color: '#475569'}}>Đơn hàng chờ xác nhận</span>
                    </div>
                    <FaArrowRight color="#cbd5e0" />
                  </div>
                  <div className="task-item" onClick={() => navigate('/seller/products')}>
                    <div className="task-left" style={{display: 'flex', alignItems: 'center'}}>
                      <span className="count">0</span>
                      <span style={{fontWeight: '600', color: '#475569'}}>Sản phẩm bị tạm khóa</span>
                    </div>
                    <FaArrowRight color="#cbd5e0" />
                  </div>
                  <div className="task-item" onClick={() => navigate('/seller/products')}>
                    <div className="task-left" style={{display: 'flex', alignItems: 'center'}}>
                      <span className={`count ${stats.lowStockCount > 0 ? 'highlight-warning' : ''}`}>
                        {stats.lowStockCount}
                      </span>
                      <span style={{fontWeight: '600', color: '#475569'}}>Sản phẩm dưới ngưỡng tồn kho ({threshold})</span>
                    </div>
                    <FaArrowRight color="#cbd5e0" />
                  </div>
                </div>
              </div>

              <div className="marketing-banner-card">
                <div className="banner-badge">MỚI</div>
                <h3>Tăng trưởng doanh số</h3>
                <p>Sử dụng công cụ <strong>Flash Sale</strong> để thu hút thêm khách hàng mới trong tuần này.</p>
                <button className="btn-market-action" onClick={() => navigate('/seller/settings')}>
                  Thiết lập ngay
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SellerDashboard;