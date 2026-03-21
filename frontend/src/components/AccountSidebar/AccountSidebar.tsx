import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser, FaStore, FaShoppingBag, FaShieldAlt, FaComments, FaTruck } from 'react-icons/fa'; 
import api from '../../services/api'; 
import './AccountSidebar.css';

const AccountSidebar = () => {
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Thành viên');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '');
  const [isSeller, setIsSeller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setUserName(localStorage.getItem('userName') || 'Thành viên');
      setUserAvatar(localStorage.getItem('userAvatar') || '');
      
      const userStr = localStorage.getItem('user');
      const rolesStr = localStorage.getItem('userRoles');
      
      let roles: string[] = [];
      if (userStr) {
        const userObj = JSON.parse(userStr);
        roles = userObj.roles || [];
      } else if (rolesStr) {
        roles = JSON.parse(rolesStr);
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
    <aside className="account-sidebar">
      <div className="sidebar-user-info">
        <div className="sidebar-avatar-wrapper">
          <img 
            src={userAvatar || "/logo_without_text.png"} 
            alt="User Avatar" 
            className="sidebar-avatar-img"
            onError={(e) => { e.currentTarget.src = "/logo_without_text.png"; }}
          />
        </div>
        <div className="sidebar-user-text">
          <span className="sidebar-username">{userName}</span>
          <NavLink to="/user/profile" className="edit-profile-link">Sửa hồ sơ</NavLink>
        </div>
      </div>

      <nav className="sidebar-menu">
        <div className="menu-section">
          <div className="menu-header">
            <FaUser className="menu-icon profile-icon" />
            <span>Tài khoản của tôi</span>
          </div>
          <div className="menu-sub-items">
            <NavLink to="/user/profile" className={({isActive}) => isActive ? 'active' : ''}>Hồ sơ</NavLink>
            <NavLink to="/user/bank" className={({isActive}) => isActive ? 'active' : ''}>Ngân hàng</NavLink>
            <NavLink to="/user/address" className={({isActive}) => isActive ? 'active' : ''}>Địa chỉ</NavLink>
            <NavLink to="/user/password" className={({isActive}) => isActive ? 'active' : ''}>Đổi mật khẩu</NavLink>
          </div>
        </div>

        <NavLink to="/user/purchase" className={({isActive}) => `menu-header single-item ${isActive ? 'active' : ''}`}>
          <FaShoppingBag className="menu-icon purchase-icon" />
          <span>Đơn mua</span>
        </NavLink>

        {isSeller && (
          <div className="menu-section seller-menu-section">
            <div className="menu-header">
              <FaStore className="menu-icon seller-icon" />
              <span className="seller-title">Kênh Người Bán</span>
            </div>
            <div className="menu-sub-items">
              <NavLink to="/seller/dashboard" className={({isActive}) => isActive ? 'active' : ''}>Quản lý shop</NavLink>
              <NavLink to="/seller/products" className={({isActive}) => isActive ? 'active' : ''}>Sản phẩm của tôi</NavLink>
              <NavLink to="/seller/orders" className={({isActive}) => isActive ? 'active' : ''}>Đơn hàng bán</NavLink>
              <NavLink to="/seller/settings" className={({isActive}) => isActive ? 'active' : ''}>Thiết lập shop</NavLink>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="menu-section admin-menu-section">
            <div className="menu-header">
              <FaShieldAlt className="menu-icon admin-icon" />
              <span className="admin-title">Quản trị viên</span>
            </div>
            <div className="menu-sub-items">
              <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
                Tổng quan Admin
              </NavLink>
              <NavLink to="/admin/shipping" className={({isActive}) => isActive ? 'active' : ''}>
                <FaTruck className="sub-menu-icon" /> 
                Cấu hình vận chuyển
              </NavLink>
              <NavLink to="/admin/chat" className={({isActive}) => isActive ? 'active' : ''}>
                <FaComments className="sub-menu-icon" /> 
                Quản lý Chat
              </NavLink>
            </div>
          </div>
        )}

        {!isSeller && !isAdmin && (
          <NavLink to="/seller/register" className={({isActive}) => `menu-header single-item seller-invite ${isActive ? 'active' : ''}`}>
            <FaStore className="menu-icon" />
            <span>Trở thành Người bán</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default AccountSidebar;