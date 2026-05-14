import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, FaChartPie, FaEdit, FaSitemap, FaBalanceScale, 
  FaList, FaBuilding, FaTruck, FaFileInvoiceDollar, FaComments, 
  FaHistory, FaChevronDown, FaChevronUp, FaArrowLeft, FaUsersCog,
  FaUsers, FaStore, FaFlag, FaTicketAlt
} from 'react-icons/fa';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    dashboard: path === '/admin/dashboard',
    users: path.includes('/admin/users'),
    stores: path.includes('/admin/stores'),
    moderation: path.includes('/admin/moderation'),
    content: path.includes('/admin/article') || path.includes('/admin/help-hierarchy') || path.includes('/admin/content'),
    marketing: path.includes('/admin/vouchers'), 
    config: path.includes('/admin/footer-menus') || path.includes('/admin/shipping'),
    finance: path.includes('/admin/withdrawals') || path.includes('/admin/coins') || path.includes('/admin/finance'), // 🚀 Đã thêm /admin/finance
    interaction: path.includes('/admin/chat'),
    system: path.includes('/admin/audit-logs')
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <aside className="admin-sidebar-wrapper">
      <div className="admin-sidebar-header">
        <div className="back-to-home" onClick={() => navigate('/')}>
          <FaArrowLeft /> <span>Trở về Trang chủ</span>
        </div>
        
        <div className="admin-logo-area" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', marginTop: '10px' }}>
          <FaShieldAlt className="admin-master-icon" style={{ color: '#ee4d2d', fontSize: '26px' }} />
          <h2 style={{
            fontFamily: 'var(--ui-font, -apple-system, "Segoe UI", Roboto, sans-serif)',
            fontSize: '18.5px',
            fontWeight: 800,
            color: '#1e293b',
            margin: 0,
            letterSpacing: '0.3px'
          }}>
            AiNetsoft Admin
          </h2>
        </div>
      </div>

      <nav className="admin-nav-menu">
        <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "admin-single-item active" : "admin-single-item"}>
          <FaChartPie className="admin-icon" style={{ color: '#ee4d2d' }} />
          <span>Tổng quan hệ thống</span>
        </NavLink>

        <hr className="admin-sidebar-divider" />

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('users')}>
            <span className="title-left"><FaUsers className="admin-icon" style={{ color: '#9b59b6' }}/> Quản lý Người dùng</span>
            {openGroups.users ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.users ? 'open' : ''}`}>
            <NavLink to="/admin/users" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Danh sách tài khoản</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('stores')}>
            <span className="title-left"><FaStore className="admin-icon" style={{ color: '#e67e22' }}/> Gian hàng & Sản phẩm</span>
            {openGroups.stores ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.stores ? 'open' : ''}`}>
            <NavLink to="/admin/stores?tab=sellers" className={({isActive}) => isActive || location.search.includes('sellers') ? "sub-item active" : "sub-item"}>Duyệt Shop</NavLink>
            <NavLink to="/admin/stores?tab=products_mod" className={({isActive}) => location.search.includes('products_mod') ? "sub-item active" : "sub-item"}>Duyệt Sản phẩm</NavLink>
            <NavLink to="/admin/stores?tab=products" className={({isActive}) => location.search.includes('tab=products') && !location.search.includes('_mod') ? "sub-item active" : "sub-item"}>Tất cả sản phẩm</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('moderation')}>
            <span className="title-left"><FaFlag className="admin-icon" style={{ color: '#e74c3c' }}/> Kiểm duyệt & Vi phạm</span>
            {openGroups.moderation ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.moderation ? 'open' : ''}`}>
            <NavLink to="/admin/moderation?tab=reports" className={({isActive}) => isActive || location.search.includes('reports') ? "sub-item active" : "sub-item"}>Báo cáo vi phạm</NavLink>
            <NavLink to="/admin/moderation?tab=reviews" className={({isActive}) => location.search.includes('reviews') ? "sub-item active" : "sub-item"}>Quản lý đánh giá</NavLink>
            <NavLink to="/admin/moderation?tab=reasons" className={({isActive}) => location.search.includes('reasons') ? "sub-item active" : "sub-item"}>Danh mục báo cáo</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('marketing')}>
            <span className="title-left"><FaTicketAlt className="admin-icon" style={{ color: '#ff4757' }}/> Marketing & Khuyến mãi</span>
            {openGroups.marketing ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.marketing ? 'open' : ''}`}>
            <NavLink to="/admin/vouchers" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Voucher Toàn Sàn</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('content')}>
            <span className="title-left"><FaEdit className="admin-icon" style={{ color: '#1abc9c' }}/> Quản lý Nội dung</span>
            {openGroups.content ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.content ? 'open' : ''}`}>
            <NavLink to="/admin/articles" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Bài viết & Tin tức</NavLink>
            <NavLink to="/admin/help-hierarchy" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Phân cấp trợ giúp</NavLink>
            <NavLink to="/admin/content/legal" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Chính sách pháp lý</NavLink>
            <NavLink to="/admin/content/company" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Thông tin Công ty</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('config')}>
            <span className="title-left"><FaUsersCog className="admin-icon" style={{ color: '#3498db' }}/> Cấu hình Hệ thống</span>
            {openGroups.config ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.config ? 'open' : ''}`}>
            <NavLink to="/admin/footer-menus" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Quản lý Menu Footer</NavLink>
            <NavLink to="/admin/shipping" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Cấu hình Vận chuyển</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('finance')}>
            <span className="title-left"><FaFileInvoiceDollar className="admin-icon" style={{ color: '#f1c40f' }}/> Quản lý Tài chính</span>
            {openGroups.finance ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.finance ? 'open' : ''}`}>
            <NavLink to="/admin/withdrawals" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Lệnh Rút Tiền</NavLink>
            <NavLink to="/admin/coins" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Quản lý AiNetsoft Xu</NavLink>
            {/* 🚀 BỔ SUNG: Nút Cấu hình Tài chính */}
            <NavLink to="/admin/finance" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Cấu hình Tài chính</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('interaction')}>
            <span className="title-left"><FaComments className="admin-icon" style={{ color: '#00d2d3' }}/> Tương tác</span>
            {openGroups.interaction ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.interaction ? 'open' : ''}`}>
            <NavLink to="/admin/chat" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Chat trực tuyến</NavLink>
          </div>
        </div>

        <div className="admin-nav-group">
          <div className="admin-group-title" onClick={() => toggleGroup('system')}>
            <span className="title-left"><FaHistory className="admin-icon" style={{ color: '#475569' }}/> Hệ thống</span>
            {openGroups.system ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`admin-sub-menu ${openGroups.system ? 'open' : ''}`}>
            <NavLink to="/admin/audit-logs" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Nhật ký hoạt động (Audit)</NavLink>
          </div>
        </div>

      </nav>
    </aside>
  );
};

export default AdminSidebar;
