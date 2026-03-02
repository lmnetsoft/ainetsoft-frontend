import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaChevronDown, FaShoppingCart, FaBell } from 'react-icons/fa'; // Added FaBell
import logoImg from '../../assets/images/logo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(3);
  const [notificationCount, setNotificationCount] = useState(5); // NEW: Mock notification count

  const loadUserData = () => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedName = localStorage.getItem('userName');
    const storedAvatar = localStorage.getItem('userAvatar');
    const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    
    if (authStatus === 'true') {
      setIsLoggedIn(true);
      setUserName(storedName || 'Thành viên');
      setUserAvatar(storedAvatar || '');
      setIsSeller(storedRoles.includes('SELLER'));
    } else {
      setIsLoggedIn(false);
      setIsSeller(false);
    }
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener('storage', loadUserData);
    window.addEventListener('profileUpdate', loadUserData);

    return () => {
      window.removeEventListener('storage', loadUserData);
      window.removeEventListener('profileUpdate', loadUserData);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userContact');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userAvatar');
    setIsLoggedIn(false);
    setIsSeller(false);
    setShowDropdown(false);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search')?.toString();
    if (query && query.trim()) {
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="main-header">
      <div className="container">
        {/* Row 1: Logo and Navigation */}
        <div className="top-bar">
          <div className="logo-small" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <img src={logoImg} alt="AiNetsoft" />
          </div>
          <nav className="top-nav">
            <a onClick={() => navigate('/')} className="blue-link">Trang chủ</a> 
            <span>|</span>
            
            {isLoggedIn && isSeller && (
              <>
                <a onClick={() => navigate('/my-shop')} className="blue-link">Gian hàng của tôi</a> <span>|</span>
                <a onClick={() => navigate('/chat')} className="blue-link">Chat với khách hàng</a> <span>|</span>
              </>
            )}
            
            {/* UPDATED: Notification Link with Icon and Badge */}
            <div className="notification-wrapper" onClick={() => navigate('/notifications')}>
              <FaBell className="nav-icon" />
              <span className="blue-link">Thông báo</span>
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </div>
            
            <span>|</span>
            <a href="#" className="blue-link">Thông tin khác...</a>
          </nav>
        </div>

        {/* Row 2: Search Bar and Auth Actions */}
        <div className="action-bar">
          <form className="search-wrapper" onSubmit={handleSearch}>
            <input 
              type="text" 
              name="search" 
              placeholder="Bạn muốn tìm gì hôm nay?..." 
              autoComplete="off"
            />
            <button type="submit" className="search-icon-btn">
              <FaSearch />
            </button>
          </form>

          <div className="user-actions">
            <div className="cart-wrapper" onClick={() => navigate('/cart')}>
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
                  className="user-account-wrapper"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div className="user-profile-trigger">
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt="User Avatar" 
                        className="user-avatar-small-header" 
                      />
                    ) : (
                      <FaUserCircle className="user-avatar-icon" />
                    )}
                    <span className="user-name-text">{userName}</span>
                    <FaChevronDown className={`chevron-icon ${showDropdown ? 'rotate' : ''}`} />
                  </div>

                  {showDropdown && (
                    <ul className="dropdown-menu">
                      <li onClick={() => navigate('/user/profile')}>Tài khoản của tôi</li>
                      <li onClick={() => navigate('/user/purchase')}>Đơn mua</li>
                      <li className="logout-item" onClick={handleLogout}>Đăng xuất</li>
                    </ul>
                  )}
                </div>

                {isSeller && (
                  <a onClick={() => navigate('/post-ad')} className="nav-text-bold blue-link">
                    Đăng Tin
                  </a>
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