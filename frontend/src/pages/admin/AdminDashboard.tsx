import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaUsers, FaBox, FaStore, FaClock, 
  FaChartBar, FaSync, FaHistory, FaShieldAlt,
  FaExclamationTriangle, FaStar, FaTrash, FaCheck, FaTimes, FaListUl, FaTags, FaPlus, FaSearch
} from 'react-icons/fa';
import adminService from '../../services/admin.service';
import SellerModeration from './SellerModeration'; 
import ProductModeration from './ProductModeration'; 

// Modular components
import UserTable from './UserTable';
import ReportTable from './ReportTable';
import ReviewTable from './ReviewTable';
import ReasonManagement from './ReasonManagement';
import LogTable from './LogTable';
import ProductTable from './ProductTable';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  // 🚀 Anchor for smooth scrolling to prevent window "jumping"
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
  
  // 🚀 Pagination states for products
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // 🚀 PHASE 1: LIFTED FILTER STATES (For Auto-Show functionality)
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");

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

  /**
   * 🚀 PHASE 1 UPDATE: fetchUsers now handles the Page object.
   * Default call for the "Users" tab.
   */
  const fetchUsers = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllUsers({ page: 0, size: 10 });
      // Backend returns Page<User>, so we extract .content
      setUsers(response.content || []);
    } catch (err) { 
      console.error("Users Fetch Error:", err); 
      setUsers([]);
    } finally { 
      setTabLoading(false); 
    }
  };

  /**
   * 🚀 NEW PHASE 1 HELPER: Specifically for Filtering & Searching
   */
  const fetchUsersFiltered = async (search: string, role: string, status: string) => {
    try {
      setTabLoading(true);
      const params = {
        search,
        role: role === "ALL" ? "" : role,
        status: status === "ALL" ? "" : status,
        page: 0,
        size: 10
      };
      const res = await adminService.getAllUsers(params);
      setUsers(res.content || []);
    } catch (err) {
      toast.error("Lỗi khi tìm kiếm người dùng");
    } finally {
      setTabLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setTabLoading(true);
      const data = await adminService.getAllProducts(productPage, 10); 
      setAllProducts(data.content || []);
      setProductTotalPages(data.totalPages || 0);
    } catch (err) { 
      console.error("Products Fetch Error:", err); 
      setAllProducts([]);
    } finally { 
      setTabLoading(false); 
    }
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
    // 🚀 Update: Manual refresh now respects existing filters
    if (activeTab === 'users') await fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
    if (activeTab === 'products') await fetchProducts();
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

  // 🚀 NEW: AUTO-SHOW BEHAVIOR (Triggers when dropdowns change)
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
    }
  }, [userRoleFilter, userStatusFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts(); 
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'reasons') fetchReasons();
    if (activeTab === 'logs') fetchLogs();

    // 🚀 THE SMOOTH FIX: Scroll back to the top of the table area smoothly
    if (scrollAnchorRef.current) {
        scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab, productPage]);


  // --- 3. ACTIONS (PRESERVED UNTOUCHED) ---

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

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Xác nhận xóa vĩnh viễn sản phẩm này?")) return;
    try {
      await adminService.deleteProduct(id);
      toast.success("Đã xóa sản phẩm thành công.");
      fetchProducts();
      fetchSummary();
    } catch (err) { toast.error("Lỗi khi xóa sản phẩm."); }
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
        return (
          <UserTable 
            users={users} 
            userSearchTerm={userSearchTerm} 
            setUserSearchTerm={setUserSearchTerm} 
            // 🚀 Passing Filter States and Setters to enable "Auto-Show" behavior
            roleFilter={userRoleFilter}
            setRoleFilter={setUserRoleFilter}
            statusFilter={userStatusFilter}
            setStatusFilter={setUserStatusFilter}
            onSearchTrigger={() => {
                fetchUsersFiltered(userSearchTerm, userRoleFilter, userStatusFilter);
            }}
          />
        );

      case 'sellers': return <SellerModeration />;
      
      case 'products': 
        return (
          <ProductTable 
            products={allProducts} 
            onDelete={handleDeleteProduct} 
            currentPage={productPage}
            totalPages={productTotalPages}
            onPageChange={setProductPage}
          />
        );

      case 'products_mod': return <ProductModeration />; 
      
      case 'reports': 
        return <ReportTable reports={reports} handleResolveReport={handleResolveReport} handleDeleteReport={handleDeleteReport} />;

      case 'reviews':
        return <ReviewTable allReviews={allReviews} handleDeleteReview={handleDeleteReview} />;

      case 'reasons': 
        return <ReasonManagement reasons={reasons} newReasonName={newReasonName} setNewReasonName={setNewReasonName} handleAddReason={handleAddReason} handleDeleteReason={handleDeleteReason} />;

      case 'logs': return <LogTable logs={logs} />;

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

      {/* 🚀 Anchor for smooth scroll - Attached to nav */}
      <nav className="content-tabs" ref={scrollAnchorRef}> 
        <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Tổng quan</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Người dùng</button>
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Tất cả sản phẩm</button>
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
  );
};

export default AdminDashboard;