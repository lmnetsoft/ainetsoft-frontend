import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartBar, FaSync, FaHistory, FaShieldAlt,
  FaExclamationTriangle, FaStar, FaTrash, FaCheck, FaTimes, FaListUl
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import adminService from '../../services/admin.service';
import SellerModeration from './SellerModeration'; 
import ProductModeration from './ProductModeration'; 
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
    pendingSellers: 0,
    totalReports: 0 
  });
  
  const [reports, setReports] = useState<any[]>([]); 
  const [allReviews, setAllReviews] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

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
          totalReports: data.totalReports || 0
        });
      }
      if (showToast) toast.success("Số liệu đã được đồng bộ");
    } catch (err) {
      console.error("Summary Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllReports();
      const data = Array.isArray(response) ? response : (response?.content || []);
      setReports(data);
      
      // Sync badge count with real list length if they differ
      if (data.length !== stats.totalReports) {
        setStats(prev => ({ ...prev, totalReports: data.length }));
      }
    } catch (err) { 
      console.error("Reports Fetch Error:", err);
    } finally { 
      setTabLoading(false); 
    }
  };

  const fetchReviews = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllReviews();
      const data = Array.isArray(response) ? response : (response?.content || []);
      setAllReviews(data);
    } catch (err) { 
      console.error("Reviews Fetch Error:", err);
    } finally { 
      setTabLoading(false); 
    }
  };

  // --- 2. THE REFRESH ENGINE ---

  // Handle manual "Làm mới" click
  const handleManualRefresh = async () => {
    // Always refresh the summary
    await fetchSummary(true);
    
    // Check which tab is active and refresh its specific data
    if (activeTab === 'reports') await fetchReports();
    if (activeTab === 'reviews') await fetchReviews();
    if (activeTab === 'sellers' || activeTab === 'products_mod') {
       // These are sub-components, triggering a re-render or internal refresh might be needed
       // For now, refreshing summary updates their badge counts.
    }
  };

  // Auto-Refresh Logic (Every 2 minutes)
  useEffect(() => {
    fetchSummary(); // Initial load

    const interval = setInterval(() => {
      console.log("Dashboard Auto-Syncing...");
      fetchSummary();
      if (activeTab === 'reports') fetchReports();
    }, 120000); // 120,000ms = 2 minutes

    return () => clearInterval(interval);
  }, [activeTab]);

  // Sync when switching tabs
  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);


  // --- 3. ACTIONS ---

  const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminService.resolveReport(reportId, action);
      toast.success(action === 'RESOLVED' ? "Đã xác nhận vi phạm & Gỡ sản phẩm" : "Đã bác bỏ báo cáo");
      // Immediate re-fetch to keep numbers consistent
      fetchReports();
      fetchSummary();
    } catch (err) { toast.error("Thao tác thất bại."); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Xác nhận xóa đánh giá này?")) return;
    try {
      await adminService.deleteReview(reviewId);
      toast.success("Đã xóa đánh giá.");
      fetchReviews();
    } catch (err) { toast.error("Thao tác thất bại."); }
  };

  const renderContent = () => {
    if (tabLoading) return <div className="tab-loading-spinner">Đang xử lý dữ liệu...</div>;

    switch (activeTab) {
      case 'sellers': return <SellerModeration />;
      case 'products_mod': return <ProductModeration />;
      
      case 'reports': 
        return (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Lý do</th>
                  <th>Người báo cáo</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? <tr><td colSpan={5} className="empty-row">Không có báo cáo vi phạm nào.</td></tr> : 
                  reports.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.productName || "Sản phẩm ẩn"}</strong></td>
                      <td><span className="reason-tag">{r.reason}</span></td>
                      <td>{r.reporterName || 'Người dùng ẩn'}</td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '---'}</td>
                      <td className="action-btns">
                        <button className="mod-btn approve" onClick={() => handleResolveReport(r.id, 'RESOLVED')} title="Xác nhận vi phạm">
                          <FaCheck />
                        </button>
                        <button className="mod-btn reject" onClick={() => handleResolveReport(r.id, 'DISMISSED')} title="Bác bỏ">
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        );

      case 'reviews':
        return (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {allReviews.length === 0 ? <tr><td colSpan={4} className="empty-row">Chưa có đánh giá nào.</td></tr> : 
                  allReviews.map(rev => (
                    <tr key={rev.id}>
                      <td>{rev.productName}</td>
                      <td><span className="rating-badge">{rev.rating} <FaStar size={10} /></span></td>
                      <td className="comment-cell">{rev.comment}</td>
                      <td className="action-btns">
                        <button className="mod-btn reject" onClick={() => handleDeleteReview(rev.id)}><FaTrash /></button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        );

      case 'summary': 
        return (
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
                    <strong>{stats.totalSellers > 0 ? ((stats.totalSellers / (stats.totalSellers + stats.pendingSellers)) * 100).toFixed(0) : 0}%</strong>
                  </div>
               </div>
            </div>
          </div>
        );

      default: return <div className="loading-placeholder">Đang tải...</div>;
    }
  };

  return (
    <div className="admin-master-layout"> 
      <div className="sidebar-fixed-column"><AccountSidebar /></div>

      <main className="admin-main-view">
        <div className="admin-dashboard-wrapper">
          <header className="admin-page-header">
            <div className="header-left">
              <h1>Hệ thống Quản trị AiNetsoft</h1>
              <div className="badge-container">
                <span className="master-badge">GLOBAL ADMIN</span>
                <span className="status-dot">Online</span>
              </div>
            </div>
            {/* FIXED: Button now calls handleManualRefresh to sync everything */}
            <button className="btn-refresh" onClick={handleManualRefresh} disabled={loading}>
              <FaSync className={loading ? 'spin' : ''} />
              <span>{loading ? 'Đang đồng bộ...' : 'Làm mới'}</span>
            </button>
          </header>

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
            <div className={`metric-card ${stats.pendingProducts > 0 ? 'urgent' : ''}`} onClick={() => setActiveTab('products_mod')}>
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

          <nav className="content-tabs">
            <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Tổng quan</button>
            <button className={activeTab === 'products_mod' ? 'active' : ''} onClick={() => setActiveTab('products_mod')}>
              Duyệt Sản phẩm {stats.pendingProducts > 0 && <span className="notif-badge danger">{stats.pendingProducts}</span>}
            </button>
            <button className={activeTab === 'sellers' ? 'active' : ''} onClick={() => setActiveTab('sellers')}>
              Duyệt Shop {stats.pendingSellers > 0 && <span className="notif-badge">{stats.pendingSellers}</span>}
            </button>
            <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
              Báo cáo vi phạm {stats.totalReports > 0 && <span className="notif-badge danger">{stats.totalReports}</span>}
            </button>
            <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Quản lý đánh giá</button>
            <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Nhật ký hệ thống</button>
          </nav>

          <section className="dynamic-view-area">
            {loading && activeTab === 'summary' ? (
              <div className="loading-placeholder"><span>Đang tải dữ liệu...</span></div>
            ) : renderContent()}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;