import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaUser, FaStore, FaShoppingBag, FaShieldAlt, FaComments, FaTruck, 
  FaBalanceScale, FaList, FaSitemap, FaEdit, FaCog, FaUserCircle, 
  FaUniversity, FaMapMarkerAlt, FaKey, FaChartPie, FaBoxes, FaClipboardList, FaBuilding
} from 'react-icons/fa'; 
import api from '../../services/api'; 

// 🚀 FIX: Import the logo so Vite bundles it correctly
// Make sure this path points exactly to your logo file
import defaultLogo from '../../assets/images/logo.png'; 

import './AccountSidebar.css';

const AccountSidebar = () => {
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Thành viên');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '');
  const [isSeller, setIsSeller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setUserName(localStorage.getItem('userName') || 'Thành viên');
      
      const storedAvatar = localStorage.getItem('userAvatar');
      // 🚀 FIX: Ensure we don't use the string "null" as a path
      setUserAvatar(storedAvatar && storedAvatar !== 'null' ? storedAvatar : '');
      
      const userStr = localStorage.getItem('user');
      const rolesStr = localStorage.getItem('userRoles');
      
      let roles: string[] = [];
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          roles = userObj.roles || [];
        } catch (e) { roles = []; }
      } else if (rolesStr) {
        try {
          roles = JSON.parse(rolesStr);
        } catch (e) { roles = []; }
      }

      setIsSeller(roles.includes('SELLER'));
      setIsAdmin(roles.includes('ADMIN'));
    };

    const fetchLatestProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const latestUser = res.data;
        localStorage.setItem('user', JSON.stringify(latestUser));
        localStorage.setItem('userName', latestUser.fullName || latestUser.username);
        localStorage.setItem('userAvatar', latestUser.avatarUrl || '');
        localStorage.setItem('userRoles', JSON.stringify(latestUser.roles || []));
        handleSync(); 
      } catch (err) {
        console.error("Sidebar background sync failed:", err);
      }
    };

    handleSync(); 
    fetchLatestProfile(); 

    window.addEventListener('storage', handleSync);
    window.addEventListener('profileUpdate', handleSync);
    
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('profileUpdate', handleSync);
    };
  }, []);

  return (
    <aside className="account-sidebar-supreme">
      {/* --- Profile Box --- */}
      <div className="sidebar-profile-box">
        <div className="avatar-circle">
          <img 
            /* 🚀 FIX: Use the imported defaultLogo if userAvatar is missing */
            src={userAvatar ? userAvatar : defaultLogo} 
            alt="User" 
            onError={(e) => { 
              const target = e.currentTarget;
              if (target.src !== defaultLogo) {
                target.src = defaultLogo; 
              }
            }}
          />
        </div>
        <div className="profile-info">
          <span className="display-name">{userName}</span>
          <NavLink to="/user/profile" className="edit-trigger"><FaEdit /> Sửa hồ sơ</NavLink>
        </div>
      </div>

      <nav className="sidebar-navigation">
        
        {/* --- Section: My Account --- */}
        <div className="nav-section">
          <div className="section-header">
            <FaUser className="header-icon icon-blue" />
            <span>Tài khoản của tôi</span>
          </div>
          <div className="section-links">
            <NavLink to="/user/profile" className={({isActive}) => isActive ? 'active' : ''}>
              <FaUserCircle className="icon-blue" /> Hồ sơ cá nhân
            </NavLink>
            <NavLink to="/user/bank" className={({isActive}) => isActive ? 'active' : ''}>
              <FaUniversity className="icon-green" /> Tài khoản ngân hàng
            </NavLink>
            <NavLink to="/user/address" className={({isActive}) => isActive ? 'active' : ''}>
              <FaMapMarkerAlt className="icon-red" /> Địa chỉ nhận hàng
            </NavLink>
            <NavLink to="/user/password" className={({isActive}) => isActive ? 'active' : ''}>
              <FaKey className="icon-gold" /> Đổi mật khẩu
            </NavLink>
          </div>
        </div>

        {/* --- Standalone: Purchase History --- */}
        <NavLink to="/user/purchase" className={({isActive}) => `standalone-link ${isActive ? 'active' : ''}`}>
          <FaShoppingBag className="header-icon icon-orange-red" />
          <span>Đơn mua của tôi</span>
        </NavLink>

        {/* --- Section: Seller --- */}
        {isSeller && (
          <div className="nav-section merged-group">
            <div className="section-header">
              <FaStore className="header-icon icon-orange" />
              <span>Kênh Người Bán</span>
            </div>
            <div className="section-links">
              <NavLink to="/seller/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
                <FaChartPie className="icon-orange" /> Quản lý cửa hàng
              </NavLink>
              <NavLink to="/seller/products" className={({isActive}) => isActive ? 'active' : ''}>
                <FaBoxes className="icon-purple" /> Danh sách sản phẩm
              </NavLink>
              <NavLink to="/seller/orders" className={({isActive}) => isActive ? 'active' : ''}>
                <FaClipboardList className="icon-blue" /> Quản lý đơn hàng
              </NavLink>
              <NavLink to="/seller/settings" className={({isActive}) => isActive ? 'active' : ''}>
                <FaCog className="icon-slate" /> Thiết lập shop
              </NavLink>
            </div>
          </div>
        )}

        {/* --- Section: Admin --- */}
        {isAdmin && (
          <div className="nav-section merged-group">
            <div className="section-header">
              <FaShieldAlt className="header-icon icon-navy" />
              <span>Quản trị viên</span>
            </div>
            <div className="section-links">
              <NavLink 
                to="/admin/dashboard" 
                className={({isActive}) => `always-red ${isActive ? 'active' : ''}`}
              >
                <FaChartPie className="icon-orange" /> Tổng quan hệ thống
              </NavLink>
              
              <div className="group-label">Quản lý nội dung</div>
              <NavLink to="/admin/articles" className={({isActive}) => isActive ? 'active' : ''}><FaEdit className="icon-teal" /> Quản lý bài viết</NavLink>
              <NavLink to="/admin/help-hierarchy" className={({isActive}) => isActive ? 'active' : ''}><FaSitemap className="icon-purple" /> Phân cấp trợ giúp</NavLink>
              <NavLink to="/admin/content/legal" className={({isActive}) => isActive ? 'active' : ''}><FaBalanceScale className="icon-slate" /> Chính sách pháp lý</NavLink>
              
              <div className="group-label">Cấu hình hệ thống</div>
              <NavLink to="/admin/footer-menus" className={({isActive}) => isActive ? 'active' : ''}><FaList className="icon-blue" /> Quản lý Menu Footer</NavLink>
              <NavLink to="/admin/content/company" className={({isActive}) => isActive ? 'active' : ''}><FaBuilding className="icon-indigo" /> Thông tin Công ty</NavLink>
              <NavLink to="/admin/shipping" className={({isActive}) => isActive ? 'active' : ''}><FaTruck className="icon-green" /> Cấu hình vận chuyển</NavLink>
              
              <div className="group-label">Tương tác</div>
              <NavLink to="/admin/chat" className={({isActive}) => isActive ? 'active' : ''}><FaComments className="icon-cyan" /> Quản lý Chat trực tuyến</NavLink>
            </div>
          </div>
        )}

        {!isSeller && !isAdmin && (
          <NavLink to="/seller/register" className={({isActive}) => `standalone-link ${isActive ? 'active' : ''}`}>
            <FaStore className="header-icon icon-orange" />
            <span>Trở thành Người bán</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default AccountSidebar;