import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser, FaRegAddressCard, FaStore, FaShoppingBag } from 'react-icons/fa'; // Added FaShoppingBag
import './AccountSidebar.css';

const AccountSidebar = () => {
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Thành viên');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '');
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setUserName(localStorage.getItem('userName') || 'Thành viên');
      setUserAvatar(localStorage.getItem('userAvatar') || '');
      
      const updatedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      setIsSeller(updatedRoles.includes('SELLER'));
    };

    handleSync(); // Run on mount

    window.addEventListener('storage', handleSync);
    window.addEventListener('profileUpdate', handleSync);
    
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('profileUpdate', handleSync);
    };
  }, []);

  return (
    <aside className="account-sidebar">
      {/* 1. User Info Header */}
      <div className="sidebar-user-info">
        <div className="sidebar-avatar-wrapper">
          <img 
            src={userAvatar || "/src/assets/images/logo_without_text.png"} 
            alt="User Avatar" 
            className="sidebar-avatar-img"
          />
        </div>
        <div className="sidebar-user-text">
          <span className="sidebar-username">{userName}</span>
          <NavLink to="/user/profile" className="edit-profile-link">Sửa hồ sơ</NavLink>
        </div>
      </div>

      <nav className="sidebar-menu">
        {/* 2. Customer Section */}
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

        {/* 3. Purchase History */}
        <NavLink to="/user/purchase" className={({isActive}) => `menu-header single-item ${isActive ? 'active' : ''}`}>
          <FaShoppingBag className="menu-icon purchase-icon" />
          <span>Đơn mua</span>
        </NavLink>

        {/* 4. SELLER LOGIC: Show Enrollment if NOT a seller, show Dashboard if IS a seller */}
        {!isSeller ? (
          <NavLink to="/seller/register" className={({isActive}) => `menu-header single-item seller-invite ${isActive ? 'active' : ''}`}>
            <FaStore className="menu-icon" />
            <span>Trở thành Người bán</span>
          </NavLink>
        ) : (
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
      </nav>
    </aside>
  );
};

export default AccountSidebar;