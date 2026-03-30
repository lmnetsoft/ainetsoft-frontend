import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronDown, FaShoppingCart, FaBell, FaUserShield, FaCrown } from 'react-icons/fa';
import logoImg from '../../assets/images/logo.png';
import { getUserProfile, logoutUser } from '../../services/authService';

// Integrated Contexts - PRESERVED
import { useChat } from '../../context/ChatContext'; 
import { useNotification } from '../../context/NotificationContext';

import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();

  // PRESERVED: Chat and Notification logic
  const { unreadCount, resetChat, setIsChatOpen } = useChat(); 
  const { notificationCount: systemCount } = useNotification(); 

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false); 
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(3);

  const avatarFallback = '/logo.svg';

  const loadUserData = () => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const rawName = localStorage.getItem('userName') || '';
    const rawAvatar = localStorage.getItem('userAvatar') || '';
    const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    const isGlobal = localStorage.getItem('isGlobalAdmin') === 'true';

    const isValidName =
      !!rawName &&
      rawName !== 'undefined' &&
      rawName !== 'null' &&
      rawName.trim().length > 0;

    if (authStatus === 'true' && isValidName) {
      setIsLoggedIn(true);
      setUserName(rawName);
      setUserAvatar(rawAvatar !== 'undefined' && rawAvatar !== 'null' ? rawAvatar : '');
      setIsSeller(Array.isArray(storedRoles) && storedRoles.includes('SELLER'));
      setIsAdmin(Array.isArray(storedRoles) && storedRoles.includes('ADMIN')); 
      setIsGlobalAdmin(isGlobal); 
    } else {
      setIsLoggedIn(false);
      setIsSeller(false);
      setIsAdmin(false);
      setIsGlobalAdmin(false);
      setUserName('');
      setUserAvatar('');
    }
  };

  useEffect(() => {
    loadUserData();

    const verifySession = async () => {
      try {
        const profile = await getUserProfile();
        if (profile && profile.fullName) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userName', profile.fullName);
          localStorage.setItem('userAvatar', profile.avatarUrl || profile.avatar || '');
          localStorage.setItem('userRoles', JSON.stringify(profile.roles || []));
          localStorage.setItem('userPermissions', JSON.stringify(profile.permissions || []));
          localStorage.setItem('isGlobalAdmin', profile.isGlobalAdmin ? 'true' : 'false');
          
          loadUserData();
        } else {
          clearStorage();
        }
      } catch (err) {
        // Silently fail to allow offline mode or handle in interceptors
      }
    };

    const clearStorage = () => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('userPermissions'); 
      localStorage.removeItem('isGlobalAdmin'); 
      loadUserData();
    };

    verifySession();

    window.addEventListener('storage', loadUserData);
    window.addEventListener('profileUpdate', loadUserData);

    return () => {
      window.removeEventListener('storage', loadUserData);
      window.removeEventListener('profileUpdate', loadUserData);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      resetChat(); 

      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('userPermissions'); 
      localStorage.removeItem('isGlobalAdmin');
      localStorage.removeItem('jwt_token');

      setIsLoggedIn(false);
      setIsSeller(false);
      setIsAdmin(false);
      setIsGlobalAdmin(false);
      setUserName('');
      setUserAvatar('');
      setShowDropdown(false);
      navigate('/');
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search')?.toString();
    if (query && query.trim()) {
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  const handleNotificationClick = () => {
    if (isAdmin) {
      // Admins go to Chat if they have messages, otherwise Dashboard
      if (unreadCount > 0) {
        navigate('/admin/chat');
      } else {
        navigate('/admin/dashboard');
      }
    } else {
      // Users/Sellers go to the unified notification list
      navigate('/user/notifications');
    }
  };

  // 🛠️ LOGIC: Combine chat messages + system warnings (fake email alerts)
  const totalAlerts = unreadCount + (systemCount || 0);

  return (
    <header className="main-header">
      <div className="container">
        <div className="top-bar">
          <div className="logo-small" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={logoImg} alt="AiNetsoft" />
          </div>

          <nav className="top-nav">
            <a onClick={() => navigate('/')} className="blue-link">Trang chủ</a>
            <span>|</span>

            {isLoggedIn && isSeller && (
              <>
                <a onClick={() => navigate('/my-shop')} className="blue-link">Gian hàng của tôi</a>
                <span>|</span>
                <a onClick={() => setIsChatOpen(true)} className="blue-link" style={{ cursor: 'pointer' }}>
                    Chat với khách hàng
                </a>
                <span>|</span>
              </>
            )}

              {/* 🛠️ NOTIFICATION BELL: Pickups SYSTEM_WARNINGS from DB automatically */}
              <div
                className={`notification-wrapper ${totalAlerts > 0 ? 'active-alerts' : ''}`}
                onClick={handleNotificationClick}
                style={{ cursor: 'pointer' }}
              >
                {/* Icon pulses if there are critical system warnings */}
                <FaBell className={`nav-icon ${systemCount > 0 ? 'pulse-animation' : ''}`} />
                
                {/* 🔴 Text turns red if there are ANY alerts (Chat or System) */}
                <span className={`blue-link ${totalAlerts > 0 ? 'alert-red-text' : ''}`}>
                  Thông báo
                </span>

                {/* Badge logic - showing the total count */}
                {totalAlerts > 0 && (
                  <span className={`notification-badge ${systemCount > 0 ? 'pulse' : ''}`}>
                    {totalAlerts > 99 ? '99+' : totalAlerts}
                  </span>
                )}
              </div>

            <span>|</span>
            <a href="#" className="blue-link">Thông tin khác...</a>
          </nav>
        </div>

        <div className="action-bar">
          <form className="search-wrapper" onSubmit={handleSearch}>
            <input type="text" name="search" placeholder="Bạn muốn tìm gì hôm nay?..." autoComplete="off" />
            <button type="submit" className="search-icon-btn">
              <FaSearch />
            </button>
          </form>

          <div className="user-actions">
            <div className="cart-wrapper" onClick={() => navigate('/cart')} style={{ cursor: 'pointer' }}>
              <FaShoppingCart className="cart-main-icon" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>

            <a href="#" className="nav-text-bold blue-link share-corner">Góc Chia Sẻ</a>

            {!isLoggedIn ? (
              <div className="auth-buttons">
                <a onClick={() => navigate('/login')} className="nav-text-bold blue-link">Đăng Nhập</a>
                <span className="separator">|</span>
                <a onClick={() => navigate('/register')} className="nav-text-bold blue-link">Đăng Ký</a>
              </div>
            ) : (
              <div className="logged-in-controls">
                <div
                  className={`user-account-wrapper ${isGlobalAdmin ? 'is-global' : ''}`}
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div className="user-profile-trigger">
                    <img
                      src={userAvatar || avatarFallback}
                      alt="User"
                      className="user-avatar-small-header"
                      onError={(e) => { (e.target as HTMLImageElement).src = avatarFallback; }}
                    />
                    <span className="user-name-text">
                        {isGlobalAdmin && <FaCrown className="global-crown-icon" style={{color: '#FFD700', marginRight: '5px'}} />}
                        {userName}
                    </span>
                    <FaChevronDown className={`chevron-icon ${showDropdown ? 'rotate' : ''}`} />
                  </div>

                  {showDropdown && (
                    <ul className="dropdown-menu">
                      {isAdmin && (
                        <>
                          <li onClick={() => navigate('/admin/dashboard')} className="admin-menu-item">
                            <FaUserShield /> {isGlobalAdmin ? 'Quản trị Hệ thống' : 'Tổng quan Admin'}
                          </li>
                          <li onClick={() => navigate('/admin/chat')}>Quản lý Chat</li>
                          <hr className="dropdown-divider" />
                        </>
                      )}
                      
                      <li onClick={() => navigate('/user/profile')}>Tài khoản của tôi</li>
                      <li onClick={() => navigate('/user/purchase')}>Đơn mua</li>
                      <li className="logout-item" onClick={handleLogout}>Đăng xuất</li>
                    </ul>
                  )}
                </div>

                {isSeller && (
                  <a onClick={() => navigate('/post-ad')} className="nav-text-bold blue-link">Đăng Tin</a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;