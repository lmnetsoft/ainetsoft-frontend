import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartBar, FaSync, FaHistory, FaShieldAlt,
  FaExclamationTriangle, FaStar, FaTrash, FaCheck, FaTimes, FaListUl, FaTags, FaPlus, FaSearch
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
  const [reasons, setReasons] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>([]); 
  const [logs, setLogs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // 🛠️ NEW: Search filter for Users
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [newReasonName, setNewReasonName] = useState("");

  // --- 1. DATA FETCHERS ---

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
          // Let fetchReports handle the report badge for accuracy
        }));
      }
      if (showToast) toast.success("Số liệu đã được đồng bộ");
    } catch (err) {
      console.error("Summary Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setTabLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data || []);
    } catch (err) { console.error("Users Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  const fetchLogs = async () => {
    try {
      setTabLoading(true);
      const data = await adminService.getAuditLogs();
      setLogs(data || []);
    } catch (err) { console.error("Logs Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  const fetchReports = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllReports();
      const data = Array.isArray(response) ? response : (response?.content || []);
      setReports(data);

      const pendingCount = data.filter((r: any) => 
        r.status !== 'RESOLVED' && r.status !== 'DISMISSED'
      ).length;

      setStats(prev => ({ ...prev, totalReports: pendingCount }));
    } catch (err) { console.error("Reports Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllReviews();
      const data = Array.isArray(response) ? response : (response?.content || []);
      setAllReviews(data);
    } catch (err) { console.error("Reviews Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  const fetchReasons = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getViolationReasons();
      const data = response.data || response;
      const mainList = data.filter((r: any) => r.name !== "Lý do khác...");
      const otherItem = data.filter((r: any) => r.name === "Lý do khác...");
      setReasons([...mainList, ...otherItem]);
    } catch (err) { console.error("Reasons Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  // --- 2. THE REFRESH ENGINE ---

  const handleManualRefresh = async () => {
    await fetchSummary(true);
    if (activeTab === 'users') await fetchUsers();
    if (activeTab === 'reports') await fetchReports();
    if (activeTab === 'reviews') await fetchReviews();
    if (activeTab === 'reasons') await fetchReasons();
    if (activeTab === 'logs') await fetchLogs();
  };

  useEffect(() => {
    fetchSummary();
    fetchReports();
    const interval = setInterval(() => { fetchSummary(); }, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'reasons') fetchReasons();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);


  // --- 3. ACTIONS ---

  const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminService.resolveReport(reportId, action);
      toast.success(action === 'RESOLVED' ? "Đã xác nhận vi phạm & Gỡ sản phẩm" : "Đã bác bỏ báo cáo");
      await fetchReports();
      fetchSummary();
    } catch (err) { toast.error("Thao tác thất bại."); }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Xóa vĩnh viễn bản ghi báo cáo này?")) return;
    try {
      await adminService.deleteReport(reportId);
      toast.success("Đã xóa báo cáo.");
      await fetchReports();
      fetchSummary();
    } catch (err) { toast.error("Không thể xóa báo cáo."); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Xác nhận xóa đánh giá này?")) return;
    try {
      await adminService.deleteReview(reviewId);
      toast.success("Đã xóa đánh giá.");
      fetchReviews();
    } catch (err) { toast.error("Thao tác thất bại."); }
  };

  const handleAddReason = async () => {
    if (!newReasonName.trim()) { toast.error("Vui lòng nhập tên lý do"); return; }
    try {
      setTabLoading(true);
      await adminService.saveViolationReason({ name: newReasonName.trim(), active: true });
      setNewReasonName("");
      toast.success("Đã thêm danh mục vi phạm mới!");
      await fetchReasons(); 
    } catch (err) { toast.error("Không thể thêm lý do."); } 
    finally { setTabLoading(false); }
  };

  const handleDeleteReason = async (id: string) => {
    if (!window.confirm("Xóa danh mục vi phạm này?")) return;
    try {
      await adminService.deleteViolationReason(id);
      toast.success("Đã xóa");
      fetchReasons();
    } catch (err) { toast.error("Không thể xóa"); }
  };

  // --- 4. RENDERER ---

  const renderContent = () => {
    if (tabLoading) return <div className="tab-loading-spinner">Đang xử lý dữ liệu...</div>;

    switch (activeTab) {
      case 'users': 
        const filteredUsers = users.filter(u => 
          u.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
          u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
        return (
          <div className="admin-table-container">
            <div className="table-filter-header">
              <div className="search-box-wrapper">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm người dùng theo tên hoặc email..." 
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email / SĐT</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? <tr><td colSpan={5} className="empty-row">Không tìm thấy người dùng phù hợp.</td></tr> : 
                  filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.fullName}</strong></td>
                      <td><small>{u.email}<br/>{u.phone}</small></td>
                      <td>{u.roles?.join(', ')}</td>
                      <td><span className={`status-badge ${u.accountStatus?.toLowerCase()}`}>{u.accountStatus}</span></td>
                      <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        );

      case 'sellers': return <SellerModeration />;
      
      case 'products':
      case 'products_mod': return <ProductModeration />;
      
      case 'reports': 
        return (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Lý do & Chi tiết</th>
                  <th>Người báo cáo</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? <tr><td colSpan={5} className="empty-row">Không có báo cáo vi phạm nào.</td></tr> : 
                  reports.map(r => {
                    const isProcessed = r.status === 'RESOLVED' || r.status === 'DISMISSED';
                    return (
                      <tr key={r.id} className={isProcessed ? 'resolved-row' : ''}>
                        <td><strong>{r.productName || "Sản phẩm ẩn"}</strong></td>
                        <td>
                          <div className="reason-container">
                            <span className="reason-tag">{r.reason}</span>
                            {r.details && <div className="report-detail-text"><small>Ghi chú: </small>{r.details}</div>}
                          </div>
                        </td>
                        <td>{r.reporterName || 'Người dùng ẩn'}</td>
                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '---'}</td>
                        <td className="action-btns">
                          {!isProcessed ? (
                            <>
                              <button className="mod-btn approve" onClick={() => handleResolveReport(r.id, 'RESOLVED')} title="Xác nhận vi phạm"><FaCheck /></button>
                              <button className="mod-btn reject" onClick={() => handleResolveReport(r.id, 'DISMISSED')} title="Bác bỏ"><FaTimes /></button>
                            </>
                          ) : (
                            <span className={`status-badge-mini ${r.status.toLowerCase()}`}>{r.status === 'RESOLVED' ? 'Đã xử lý' : 'Đã bác bỏ'}</span>
                          )}
                          <button className="mod-btn delete-grey" onClick={() => handleDeleteReport(r.id)} title="Xóa vĩnh viễn"><FaTrash /></button>
                        </td>
                      </tr>
                    );
                  })
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
                  <th>Người dùng</th>
                  <th>Sản phẩm</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Ngày</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {allReviews.length === 0 ? <tr><td colSpan={6} className="empty-row">Chưa có đánh giá nào.</td></tr> : 
                  allReviews.map(rev => (
                    <tr key={rev.id}>
                      <td><strong>{rev.userName}</strong></td>
                      <td>{rev.productName || 'N/A'}</td>
                      <td><span className="rating-badge">{rev.rating} <FaStar size={10} /></span></td>
                      <td className="comment-cell" title={rev.comment}>{rev.comment}</td>
                      <td>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="action-btns">
                        <button className="mod-btn reject" onClick={() => handleDeleteReview(rev.id)} title="Xóa đánh giá này"><FaTrash /></button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        );

      case 'reasons': 
        return (
          <div className="admin-table-container">
            <div className="reasons-header">
              <input 
                type="text" 
                placeholder="Thêm lý do báo cáo mới..." 
                value={newReasonName}
                onChange={e => setNewReasonName(e.target.value)}
              />
              <button className="btn-add-reason" onClick={handleAddReason}><FaPlus /> Thêm mới</button>
            </div>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Tên lý do vi phạm</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reasons.map(reason => (
                  <tr key={reason.id}>
                    <td><strong>{reason.name}</strong></td>
                    <td><span className="status-badge active">Đang hiển thị</span></td>
                    <td>{new Date(reason.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="action-btns">
                      <button className="mod-btn reject" onClick={() => handleDeleteReason(reason.id)}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'logs':
        return (
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Admin</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? <tr><td colSpan={5} className="empty-row">Chưa có nhật ký hoạt động nào.</td></tr> : 
                  logs.map(log => (
                    <tr key={log.id}>
                      <td><small>{new Date(log.timestamp).toLocaleString('vi-VN')}</small></td>
                      <td><strong>{log.adminEmail}</strong></td>
                      <td><span className="action-tag">{log.actionType}</span></td>
                      <td>{log.targetName}</td>
                      <td className="comment-cell">{log.description}</td>
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
               <div className="info-mini-card"><div className="mini-card-icon"><FaHistory /></div><div className="mini-card-text"><label>Đơn hàng thành công</label><strong>{stats.totalOrders}</strong></div></div>
               <div className="info-mini-card"><div className="mini-card-icon"><FaShieldAlt /></div><div className="mini-card-text"><label>Tỷ lệ duyệt Người bán</label><strong>{stats.totalSellers > 0 ? ((stats.totalSellers / (stats.totalSellers + stats.pendingSellers)) * 100).toFixed(0) : 0}%</strong></div></div>
            </div>
          </div>
        );

      default: return <div className="loading-placeholder">Vui lòng chọn một danh mục bên trên.</div>;
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
              <div className="badge-container"><span className="master-badge">GLOBAL ADMIN</span><span className="status-dot">Online</span></div>
            </div>
            <button className="btn-refresh" onClick={handleManualRefresh} disabled={loading}><FaSync className={loading ? 'spin' : ''} /><span>{loading ? 'Đang đồng bộ...' : 'Làm mới'}</span></button>
          </header>

          <section className="metrics-grid">
            <div className={`metric-card ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><div className="metric-icon users"><FaUsers /></div><div className="metric-data"><span className="metric-label">Tổng Người dùng</span><span className="metric-value">{stats.totalUsers.toLocaleString()}</span></div></div>
            <div className={`metric-card ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><div className="metric-icon products"><FaBox /></div><div className="metric-data"><span className="metric-label">Sản phẩm</span><span className="metric-value">{stats.totalProducts}</span></div></div>
            <div className={`metric-card ${stats.pendingProducts > 0 ? 'urgent' : ''}`} onClick={() => setActiveTab('products_mod')}><div className="metric-icon pending"><FaClock /></div><div className="metric-data"><span className="metric-label">Chờ Duyệt (SP)</span><span className="metric-value">{stats.pendingProducts}</span></div></div>
            <div className={`metric-card ${stats.pendingSellers > 0 ? 'urgent' : ''}`} onClick={() => setActiveTab('sellers')}><div className="metric-icon sellers"><FaStore /></div><div className="metric-data"><span className="metric-label">Chờ Duyệt (Shop)</span><span className="metric-value">{stats.pendingSellers}</span></div></div>
          </section>

          <nav className="content-tabs">
            <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Tổng quan</button>
            <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Người dùng</button>
            <button className={activeTab === 'products_mod' ? 'active' : ''} onClick={() => setActiveTab('products_mod')}>Duyệt Sản phẩm {stats.pendingProducts > 0 && <span className="notif-badge danger">{stats.pendingProducts}</span>}</button>
            <button className={activeTab === 'sellers' ? 'active' : ''} onClick={() => setActiveTab('sellers')}>Duyệt Shop {stats.pendingSellers > 0 && <span className="notif-badge">{stats.pendingSellers}</span>}</button>
            <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Báo cáo vi phạm {stats.totalReports > 0 && <span className="notif-badge danger">{stats.totalReports}</span>}</button>
            <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Quản lý đánh giá</button>
            <button className={activeTab === 'reasons' ? 'active' : ''} onClick={() => setActiveTab('reasons')}><FaTags size={12}/> Danh mục báo cáo</button>
            <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Nhật ký hệ thống</button>
          </nav>

          <section className="dynamic-view-area">
            {loading && activeTab === 'summary' ? <div className="loading-placeholder"><span>Đang tải dữ liệu...</span></div> : renderContent()}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;