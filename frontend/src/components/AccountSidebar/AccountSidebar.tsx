import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaUser, FaStore, FaShoppingBag, FaShieldAlt, FaComments, FaTruck, 
  FaBalanceScale, FaList, FaSitemap, FaEdit, FaCog, FaUserCircle, 
  FaUniversity, FaMapMarkerAlt, FaKey, FaChartPie, FaBoxes, FaClipboardList, FaBuilding,
  FaWallet, FaFileInvoiceDollar, FaMoneyCheckAlt, FaBell, FaHourglassHalf,
  FaTicketAlt, FaCoins, FaUserEdit
} from 'react-icons/fa'; 
import api from '../../services/api'; 

import defaultLogo from '../../assets/images/logo.png'; 
import './AccountSidebar.css';

const AccountSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Thành viên');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '');
  const [isSeller, setIsSeller] = useState(false);

  const isAccountPageActive = path.includes('/user/');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(isAccountPageActive);

  useEffect(() => {
    const handleSync = () => {
      setUserName(localStorage.getItem('userName') || 'Thành viên');
      
      const storedAvatar = localStorage.getItem('userAvatar');
      setUserAvatar(storedAvatar && storedAvatar !== 'null' ? storedAvatar : '');
      
      const userStr = localStorage.getItem('user');
      const rolesStr = localStorage.getItem('userRoles');
      
      let roles: string[] = [];
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          roles = userObj.roles || [];
          if (userObj.sellerVerification === 'VERIFIED') {
             if (!roles.includes('SELLER')) roles.push('SELLER');
          }
        } catch (e) { roles = []; }
      } else if (rolesStr) {
        try {
          roles = JSON.parse(rolesStr);
        } catch (e) { roles = []; }
      }

      setIsSeller(roles.includes('SELLER'));
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
    <aside className="user-sidebar-wrapper">
      <div className="sidebar-user-header">
        <img 
          src={userAvatar ? userAvatar : defaultLogo} 
          alt="User Avatar" 
          className="sidebar-avatar" 
          onError={(e) => { e.currentTarget.src = "bitnamilegacy"; }}
        />
        <div className="sidebar-user-info">
          <span className="sidebar-username">{userName}</span>
          <NavLink to="/user/profile" className="sidebar-edit-profile">
            <FaEdit /> Sửa hồ sơ
          </NavLink>
        </div>
      </div>

      <hr className="sidebar-divider" />

      <nav className="sidebar-nav-menu">
        <div className="nav-group">
          <div 
            className={`nav-group-title ${isAccountPageActive ? 'active-group' : ''}`}
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          >
            <FaUser className="menu-icon" style={{ color: '#ee4d2d' }} />
            <span>Tài Khoản Của Tôi</span>
          </div>
          
          <div className={`nav-sub-menu ${isAccountMenuOpen ? 'open' : ''}`}>
            <NavLink to="/user/profile" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>
              Hồ Sơ
            </NavLink>
            <NavLink to="/user/bank" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>
              Ngân Hàng
            </NavLink>
            <NavLink to="/user/address" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>
              Địa Chỉ
            </NavLink>
            <NavLink to="/user/password" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>
              Đổi Mật Khẩu
            </NavLink>
            <NavLink to="/user/notifications" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>
              Cài Đặt Thông Báo
            </NavLink>
            <NavLink to="/user/privacy" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>
              Những Thiết Lập Riêng Tư
            </NavLink>
          </div>
        </div>

        <NavLink to="/user/purchase" className={({isActive}) => isActive ? "nav-single-item active" : "nav-single-item"}>
          <FaClipboardList className="menu-icon" style={{ color: '#096dd9' }} />
          <span>Đơn Mua</span>
        </NavLink>

        <NavLink to="/user/wallet" className={({isActive}) => isActive ? "nav-single-item active" : "nav-single-item"}>
          <FaWallet className="menu-icon" style={{ color: '#eb2f96' }} />
          <span>Ví Của Tôi</span>
        </NavLink>

        <NavLink to="/user/vouchers" className={({isActive}) => isActive ? "nav-single-item active" : "nav-single-item"}>
          <FaTicketAlt className="menu-icon" style={{ color: '#fa541c' }} />
          <span>Kho Voucher</span>
        </NavLink>

        <NavLink to="/user/coins" className={({isActive}) => isActive ? "nav-single-item active" : "nav-single-item"}>
          <FaCoins className="menu-icon" style={{ color: '#fadb14' }} />
          <span>AiNetsoft Xu</span>
        </NavLink>

        <hr className="sidebar-divider" style={{ margin: '15px 0' }} />

        {isSeller ? (
          <NavLink to="/seller/dashboard" className={({isActive}) => isActive ? "nav-single-item nav-seller-highlight active" : "nav-single-item nav-seller-highlight"}>
            <FaStore className="menu-icon" style={{ color: '#ee4d2d' }} />
            <span style={{ fontWeight: 'bold', color: '#ee4d2d' }}>Kênh Người Bán</span>
          </NavLink>
        ) : (
          <NavLink to="/seller/register" className={({isActive}) => isActive ? "nav-single-item nav-seller-highlight active" : "nav-single-item nav-seller-highlight"}>
            <FaStore className="menu-icon" style={{ color: '#ee4d2d' }} />
            <span style={{ fontWeight: 'bold', color: '#ee4d2d' }}>Trở thành Người bán</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default AccountSidebar;
