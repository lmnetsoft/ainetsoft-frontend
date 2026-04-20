import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartBar, FaSync, FaHistory, FaShieldAlt,
  FaExclamationTriangle, FaStar, FaTrash, FaCheck, FaTimes, FaListUl, FaTags, FaPlus, FaSearch,
  FaFileAlt 
} from 'react-icons/fa';
import adminService from '../../services/admin.service';
import SellerModeration from './SellerModeration'; 
import ProductModeration from './ProductModeration'; 

// Modular components
import UserTable from './UserTable';
import UserProfileModal from './UserProfileModal'; 
import ReportTable from './ReportTable';
import ReviewTable from './ReviewTable';
import ReasonManagement from './ReasonManagement';
import LogTable from './LogTable';
import ProductTable from './ProductTable';
import SystemContentManagement from './SystemContentManagement'; 
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

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
  const [allProducts, setAllProducts] = useState<any[]>([]); 
  const [systemContents, setSystemContents] = useState<any[]>([]); 
  
  // Product Pagination States
  const [productPage, setProductPage] = useState(0);
  const [productPageSize, setProductPageSize] = useState(10);
  const [productTotalPages, setProductTotalPages] = useState(0);
  const [productTotalElements, setProductTotalElements] = useState(0);

  // User Pagination States
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userTotalElements, setUserTotalElements] = useState(0);

  // Log Pagination States
  const [logPage, setLogPage] = useState(0);
  const [logPageSize, setLogPageSize] = useState(10);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [logTotalElements, setLogTotalElements] = useState(0);

  // 🚀 NEW: Added Independent States for Reports and Reviews Pagination
  const [reportPage, setReportPage] = useState(0);
  const [reportPageSize, setReportPageSize] = useState(10);

  const [reviewPage, setReviewPage] = useState(0);
  const [reviewPageSize, setReviewPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");

  const [inspectingUser, setInspectingUser] = useState<any>(null);
  const [showInspectModal, setShowInspectModal] = useState(false);

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
        }));
      }
      if (showToast) toast.success("Số liệu đã được đồng bộ");
    } catch (err) {
      console.error("Summary Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersFiltered = async (search: string, role: string, status: string) => {
    try {
      setTabLoading(true);
      const params = {
        search,
        role: role === "ALL" ? "" : role,
        status: status === "ALL" ? "" : status,
        page: userPage,
        size: userPageSize
      };
      const res = await adminService.getAllUsers(params);
      
      const content = res.content || (Array.isArray(res) ? res : []);
      setUsers(content);
      
      const totalElements = res.totalElements || stats.totalUsers || content.length;
      const totalPages = res.totalPages || Math.ceil(totalElements / userPageSize);
      
      setUserTotalElements(totalElements);
      setUserTotalPages(totalPages);
    } catch (err) {
      toast.error("Lỗi khi tìm kiếm người dùng");
    } finally {
      setTabLoading(false);
    }
  };

  const handleInspectUser = async (userId: string) => {
    try {
      setTabLoading(true);
      const fullUser = await adminService.getUserDetails(userId);
      setInspectingUser(fullUser);
      setShowInspectModal(true);
    } catch (err) {
      toast.error("Không thể tải thông tin chi tiết hồ sơ.");
    } finally {
      setTabLoading(false);
    }
  };

  // --- USER HANDLERS ---

  const handlePromoteToAdmin = async (userId: string, permissions: string[]) => {
    try {
      setTabLoading(true);
      const msg = await adminService.promoteToAdmin(userId, permissions);
      toast.success(msg);
      await fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
    } catch (err: any) {
      toast.error(err.message || "Lỗi nâng cấp quyền.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    try {
      setTabLoading(true);
      const msg = await adminService.demoteFromAdmin(userId);
      toast.success(msg);
      await fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
    } catch (err: any) {
      toast.error(err.message || "Lỗi thu hồi quyền Quản trị.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setTabLoading(true);
      const msg = await adminService.toggleUserStatus(userId);
      toast.success(msg);
      await fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thay đổi trạng thái.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleRevokeSeller = async (userId: string) => {
    const reason = window.prompt("Nhập lý do thu hồi quyền Người bán:");
    if (reason === null) return;
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do."); return; }
    try {
      setTabLoading(true);
      const msg = await adminService.revokeSellerRights(userId, reason);
      toast.success(msg);
      await fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thu hồi quyền.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleBatchResolveReports = async (ids: string[], action: string) => {
    try {
      setTabLoading(true);
      const msg = await adminService.batchResolveReports(ids, action);
      toast.success(msg);
      await fetchReports();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xử lý hàng loạt.");
    } finally {
      setTabLoading(false);
    }
  };

  // --- SYSTEM CONTENT HANDLERS ---

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

  // --- FETCHERS ---

  const fetchProducts = async () => {
    try {
      setTabLoading(true);
      const data = await adminService.getAllProducts(productPage, productPageSize); 
      const content = data.content || (Array.isArray(data) ? data : []);
      setAllProducts(content);
      const totalElements = data.totalElements || stats.totalProducts || content.length;
      const totalPages = data.totalPages || Math.ceil(totalElements / productPageSize);
      setProductTotalElements(totalElements);
      setProductTotalPages(totalPages);
    } catch (err) { 
      setAllProducts([]); 
    } finally { 
      setTabLoading(false); 
    }
  };

  const fetchLogs = async () => {
    try {
      setTabLoading(true);
      const res = await adminService.getAuditLogs({ page: logPage, size: logPageSize });
      const content = res.content || (Array.isArray(res) ? res : []);
      setLogs(content);
      const totalElements = res.totalElements || content.length;
      const totalPages = res.totalPages || Math.ceil(totalElements / logPageSize);
      setLogTotalElements(totalElements);
      setLogTotalPages(totalPages);
    } catch (err) { 
      console.error("Logs Fetch Error:", err); 
    } finally { 
      setTabLoading(false); 
    }
  };

  const fetchReports = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllReports();
      const data = Array.isArray(response) ? response : (response?.content || []);
      setReports(data);
      const pendingCount = data.filter((r: any) => r.status !== 'RESOLVED' && r.status !== 'DISMISSED').length;
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

  // --- REFRESH & EFFECTS ---

  const handleManualRefresh = async () => {
    await fetchSummary(true);
    if (activeTab === 'users') await fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
    if (activeTab === 'products') await fetchProducts();
    if (activeTab === 'reports') await fetchReports();
    if (activeTab === 'reviews') await fetchReviews();
    if (activeTab === 'reasons') await fetchReasons();
    if (activeTab === 'logs') await fetchLogs();
    if (activeTab === 'system_content') await fetchSystemContents();
  };

  useEffect(() => {
    fetchSummary();
    fetchReports();
    const interval = setInterval(() => { fetchSummary(); }, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
  }, [userRoleFilter, userStatusFilter, activeTab, userPage, userPageSize, stats.totalUsers]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts(); 
  }, [activeTab, productPage, productPageSize, stats.totalProducts]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, logPage, logPageSize]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'reasons') fetchReasons();
    if (activeTab === 'system_content') fetchSystemContents(); 

    if (scrollAnchorRef.current) {
        scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  // --- ORIGINAL ACTIONS (RESTORED) ---

  const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminService.resolveReport(reportId, action);
      toast.success(action === 'RESOLVED' ? "Đã xác nhận vi phạm" : "Đã bác bỏ");
      await fetchReports();
      fetchSummary();
    } catch (err) { toast.error("Thao tác thất bại."); }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Xóa vĩnh viễn báo cáo này?")) return;
    try {
      await adminService.deleteReport(reportId);
      toast.success("Đã xóa.");
      await fetchReports();
      fetchSummary();
    } catch (err) { toast.error("Thất bại."); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Xác nhận xóa đánh giá?")) return;
    try {
      await adminService.deleteReview(reviewId);
      toast.success("Đã xóa.");
      fetchReviews();
    } catch (err) { toast.error("Thất bại."); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Xóa vĩnh viễn sản phẩm?")) return;
    try {
      await adminService.deleteProduct(id);
      toast.success("Đã xóa.");
      fetchProducts();
      fetchSummary();
    } catch (err) { toast.error("Lỗi xóa."); }
  };

  const handleAddReason = async () => {
    if (!newReasonName.trim()) { toast.error("Nhập tên lý do"); return; }
    try {
      setTabLoading(true);
      await adminService.saveViolationReason({ name: newReasonName.trim(), active: true });
      setNewReasonName("");
      toast.success("Đã thêm!");
      await fetchReasons(); 
    } catch (err) { toast.error("Lỗi thêm."); } 
    finally { setTabLoading(false); }
  };

  const handleDeleteReason = async (id: string) => {
    if (!window.confirm("Xóa danh mục?")) return;
    try {
      await adminService.deleteViolationReason(id);
      toast.success("Đã xóa");
      fetchReasons();
    } catch (err) { toast.error("Thất bại"); }
  };

  // --- RENDERER ---

  const renderContent = () => {
    if (tabLoading) return <div className="tab-loading-spinner">Đang xử lý dữ liệu...</div>;

    switch (activeTab) {
      case 'users': 
        return (
          <>
            <UserTable 
              users={users} 
              userSearchTerm={userSearchTerm} 
              setUserSearchTerm={setUserSearchTerm} 
              roleFilter={userRoleFilter}
              setRoleFilter={setUserRoleFilter}
              statusFilter={userStatusFilter}
              setStatusFilter={setUserStatusFilter}
              onSearchTrigger={() => { setUserPage(0); fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter); }}
              onView={handleInspectUser}
              onPromote={handlePromoteToAdmin}
              onDemote={handleDemoteFromAdmin} 
              onToggleStatus={handleToggleUserStatus}
              onRevokeSeller={handleRevokeSeller}
              currentPage={userPage}
              pageSize={userPageSize}
              totalElements={userTotalElements}
              totalPages={userTotalPages}
              onPageChange={setUserPage}
              onPageSizeChange={(newSize) => { setUserPageSize(newSize); setUserPage(0); }}
            />
            {showInspectModal && inspectingUser && (
              <UserProfileModal user={inspectingUser} onClose={() => setShowInspectModal(false)} />
            )}
          </>
        );

      case 'sellers': return <SellerModeration />;
      
      case 'products': 
        return (
          <ProductTable 
            products={allProducts} 
            onDelete={handleDeleteProduct} 
            currentPage={productPage}
            pageSize={productPageSize}
            totalElements={productTotalElements}
            totalPages={productTotalPages}
            onPageChange={setProductPage}
            onPageSizeChange={(newSize) => { setProductPageSize(newSize); setProductPage(0); }}
          />
        );

      case 'products_mod': return <ProductModeration />; 
      
      case 'reports': 
        return (
          <ReportTable 
            reports={reports} 
            handleResolveReport={handleResolveReport} 
            handleDeleteReport={handleDeleteReport}
            onBatchResolve={handleBatchResolveReports}
            // 🚀 ADDED PROPS TO ENABLE SLICING LOGIC
            currentPage={reportPage}
            pageSize={reportPageSize}
            onPageChange={setReportPage}
            onPageSizeChange={(newSize) => { setReportPageSize(newSize); setReportPage(0); }}
          />
        );

      case 'reviews':
        return (
          <ReviewTable 
            allReviews={allReviews} 
            handleDeleteReview={handleDeleteReview} 
            // 🚀 ADDED PROPS TO ENABLE SLICING LOGIC
            currentPage={reviewPage}
            pageSize={reviewPageSize}
            onPageChange={setReviewPage}
            onPageSizeChange={(newSize) => { setReviewPageSize(newSize); setReviewPage(0); }}
          />
        );

      case 'reasons': 
        return <ReasonManagement reasons={reasons} newReasonName={newReasonName} setNewReasonName={setNewReasonName} handleAddReason={handleAddReason} handleDeleteReason={handleDeleteReason} />;

      case 'logs': 
        return (
          <LogTable 
            logs={logs} 
            currentPage={logPage}
            pageSize={logPageSize}
            totalElements={logTotalElements}
            totalPages={logTotalPages}
            onPageChange={setLogPage}
            onPageSizeChange={(newSize) => { setLogPageSize(newSize); setLogPage(0); }}
          />
        );

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
        <div className={`metric-card ${stats.pendingProducts > 0 || activeTab === 'products_mod' ? 'urgent active' : ''}`} onClick={() => setActiveTab('products_mod')}><div className="metric-icon pending"><FaClock /></div><div className="metric-data"><span className="metric-label">Chờ Duyệt (SP)</span><span className="metric-value">{stats.pendingProducts}</span></div></div>
        <div className={`metric-card ${stats.pendingSellers > 0 || activeTab === 'sellers' ? 'urgent active' : ''}`} onClick={() => setActiveTab('sellers')}><div className="metric-icon sellers"><FaStore /></div><div className="metric-data"><span className="metric-label">Chờ Duyệt (Shop)</span><span className="metric-value">{stats.pendingSellers}</span></div></div>
      </section>

      <nav className="content-tabs" ref={scrollAnchorRef}> 
        <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Tổng quan</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Người dùng</button>
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Tất cả sản phẩm</button>
        <button className={activeTab === 'products_mod' ? 'active' : ''} onClick={() => setActiveTab('products_mod')}>Duyệt Sản phẩm {stats.pendingProducts > 0 && <span className="notif-badge danger">{stats.pendingProducts}</span>}</button>
        <button className={activeTab === 'sellers' ? 'active' : ''} onClick={() => setActiveTab('sellers')}>Duyệt Shop {stats.pendingSellers > 0 && <span className="notif-badge">{stats.pendingSellers}</span>}</button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Báo cáo vi phạm {stats.totalReports > 0 && <span className="notif-badge danger">{stats.totalReports}</span>}</button>
        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Quản lý đánh giá</button>
        <button className={activeTab === 'system_content' ? 'active' : ''} onClick={() => setActiveTab('system_content')}><FaFileAlt size={12}/> Quản lý nội dung</button>
        <button className={activeTab === 'reasons' ? 'active' : ''} onClick={() => setActiveTab('reasons')}><FaTags size={12}/> Danh mục báo cáo</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Nhật ký hệ thống</button>
      </nav>

      <section className="dynamic-view-area">
        {loading && activeTab === 'summary' ? <div className="loading-placeholder"><span>Đang tải dữ liệu...</span></div> : renderContent()}
      </section>
    </div>
  );
};

export default AdminDashboard;