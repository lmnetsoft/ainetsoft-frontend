import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartBar, FaSync, FaHistory, FaShieldAlt,
  FaFileAlt, FaArrowUp, FaWallet, FaBullhorn
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/admin.service';
import SystemContentManagement from './SystemContentManagement'; 
import AdminBroadcastModal from '../../components/Admin/AdminBroadcastModal';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

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
  
  const [systemContents, setSystemContents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const fetchSummary = async (showToast = false) => {
    try {
      if (showToast) setLoading(true);
      const data = await adminService.getDashboardSummary();
      if (data) {
        setStats(prev => ({
          ...prev,
          totalUsers: data.totalUsers || 0,
          totalSellers: data.totalSellers || 0,
          totalProducts: data.totalProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          pendingProducts: data.pendingProducts || 0,
          pendingSellers: data.pendingSellers || 0,
        }));
      }
      
      const reportsRes = await adminService.getAllReports();
      const reportsData = Array.isArray(reportsRes) ? reportsRes : (reportsRes?.content || []);
      const pendingCount = reportsData.filter((r: any) => r.status !== 'RESOLVED' && r.status !== 'DISMISSED').length;
      setStats(prev => ({ ...prev, totalReports: pendingCount }));

      if (showToast) toast.success("Số liệu đã được đồng bộ");
    } catch (err) {
      console.error("Summary Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemContents = async () => {
    try {
      setTabLoading(true);
      const data = await adminService.getAllSystemContents();
      setSystemContents(data || []);
    } catch (err) {
      console.error("System Content Fetch Error:", err);
    } finally {
      setTabLoading(false);
    }
  };

  const handleSaveSystemContent = async (content: any) => {
    try {
      setTabLoading(true);
      await adminService.saveSystemContent(content);
      toast.success("Đã cập nhật nội dung hệ thống!");
      fetchSystemContents();
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu nội dung.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleDeleteSystemContent = async (id: string) => {
    if (!window.confirm("Xóa vĩnh viễn trang nội dung này?")) return;
    try {
      setTabLoading(true);
      await adminService.deleteSystemContent(id);
      toast.success("Đã xóa nội dung.");
      fetchSystemContents();
    } catch (err) {
      toast.error("Không thể xóa.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchSummary(true);
    if (activeTab === 'system_content') await fetchSystemContents();
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => { fetchSummary(); }, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'system_content') fetchSystemContents(); 
  }, [activeTab]);

  const renderContent = () => {
    if (tabLoading) return <div className="tab-loading-spinner">Đang xử lý dữ liệu...</div>;

    switch (activeTab) {
      case 'system_content':
        return (
          <SystemContentManagement 
            contents={systemContents}
            onSave={handleSaveSystemContent}
            onDelete={handleDeleteSystemContent}
          />
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
                <div className="rev-trend">
                    <FaArrowUp /> <span>+12.5% so với tháng trước</span>
                </div>
              </div>
              
              <div className="rev-visual-container">
                  <FaWallet className="rev-icon-main" />
              </div>
              <FaChartBar className="rev-bg-icon" />
            </div>

            <div className="quick-info-grid">
                <div className="info-mini-card"><div className="mini-card-icon"><FaHistory /></div><div className="mini-card-text"><label>Đơn hàng thành công</label><strong>{stats.totalOrders}</strong></div></div>
                <div className="info-mini-card"><div className="mini-card-icon"><FaShieldAlt /></div><div className="mini-card-text"><label>Tỷ lệ duyệt Người bán</label><strong>{stats.totalSellers > 0 ? ((stats.totalSellers / (stats.totalSellers + stats.pendingSellers)) * 100).toFixed(0) : 0}%</strong></div></div>
            </div>
          </div>
        );

      default: return <div className="loading-placeholder">Vui lòng chọn một danh mục bên trên.</div>;
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      
      <header className="admin-page-header">
        {/* KHỐI TRÁI: TIÊU ĐỀ VÀ BADGE (Giữ nguyên theo CSS gốc để căn giữa) */}
        <div className="header-left">
          <h1>Hệ thống Quản trị AiNetsoft</h1>
          <div className="badge-container">
            <span className="master-badge">GLOBAL ADMIN</span>
            <span className="status-dot">Online</span>
          </div>
        </div>
        
        {/* 🚀 BẢN VÁ LỖI CỨNG: ÉP CẢ 2 NÚT VÀO MỘT HỘP Ở GÓC TRÊN CÙNG BÊN PHẢI */}
        <div style={{
            position: 'absolute',
            right: 0,
            top: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px'
        }}>
            <button 
                className="btn-refresh" 
                onClick={handleManualRefresh} 
                disabled={loading} 
                // Ghi đè CSS absolute của nút Làm mới để nó nằm gọn trong hộp này
                style={{ position: 'relative', top: 'auto', right: 'auto', margin: 0 }}
            >
                <FaSync className={loading ? 'spin' : ''} />
                <span>{loading ? 'Đang đồng bộ...' : 'Làm mới'}</span>
            </button>

            <button 
                onClick={() => setIsBroadcastOpen(true)}
                style={{
                    background: 'linear-gradient(135deg, #ee4d2d, #ff7355)', color: '#fff', border: 'none', 
                    padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, 
                    fontSize: '13px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(238,77,45,0.25)',
                    whiteSpace: 'nowrap'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <FaBullhorn size={15} /> Phát thông báo
            </button>
        </div>
      </header>

      <section className="metrics-grid">
        <div className="metric-card" onClick={() => navigate('/admin/users')}>
          <div className="metric-icon users"><FaUsers /></div>
          <div className="metric-data"><span className="metric-label">Tổng Người dùng</span><span className="metric-value">{stats.totalUsers.toLocaleString()}</span></div>
        </div>
        <div className="metric-card" onClick={() => navigate('/admin/stores?tab=products')}>
          <div className="metric-icon products"><FaBox /></div>
          <div className="metric-data"><span className="metric-label">Sản phẩm</span><span className="metric-value">{stats.totalProducts}</span></div>
        </div>
        <div className={`metric-card ${stats.pendingProducts > 0 ? 'urgent' : ''}`} onClick={() => navigate('/admin/stores?tab=products_mod')}>
          <div className="metric-icon pending"><FaClock /></div>
          <div className="metric-data"><span className="metric-label">Chờ Duyệt (SP)</span><span className="metric-value">{stats.pendingProducts}</span></div>
        </div>
        <div className={`metric-card ${stats.pendingSellers > 0 ? 'urgent' : ''}`} onClick={() => navigate('/admin/stores?tab=sellers')}>
          <div className="metric-icon sellers"><FaStore /></div>
          <div className="metric-data"><span className="metric-label">Chờ Duyệt (Shop)</span><span className="metric-value">{stats.pendingSellers}</span></div>
        </div>
      </section>

      <nav className="content-tabs"> 
        <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Tổng quan</button>
        <button className={activeTab === 'system_content' ? 'active' : ''} onClick={() => setActiveTab('system_content')}><FaFileAlt size={12}/> Quản lý nội dung (Lối tắt)</button>
      </nav>

      <section className="dynamic-view-area">
        {loading && activeTab === 'summary' ? <div className="loading-placeholder"><span>Đang tải dữ liệu...</span></div> : renderContent()}
      </section>

      <AdminBroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />
    </div>
  );
};

export default AdminDashboard;