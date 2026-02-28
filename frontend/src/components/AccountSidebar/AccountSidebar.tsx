import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser, FaRegAddressCard, FaLock, FaCreditCard } from 'react-icons/fa';
import './AccountSidebar.css';

const AccountSidebar = () => {
  const userName = localStorage.getItem('userName') || 'Thành viên';

  return (
    <aside className="account-sidebar">
      <div className="sidebar-user-info">
        <div className="sidebar-avatar-wrapper">
          <img src="/src/assets/images/logo_without_text.png" alt="User Avatar" />
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
            <NavLink to="/user/bank">Ngân hàng</NavLink>
            <NavLink to="/user/address">Địa chỉ</NavLink>
            <NavLink to="/user/password">Đổi mật khẩu</NavLink>
          </div>
        </div>

        <NavLink to="/user/purchase" className="menu-header single-item">
          <FaRegAddressCard className="menu-icon purchase-icon" />
          <span>Đơn mua</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default AccountSidebar;