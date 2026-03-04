import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaChevronDown, FaShoppingCart, FaBell } from 'react-icons/fa';
import logoImg from '../../assets/images/logo.png';
import { getUserProfile, logoutUser } from '../../services/authService';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(3);
  const [notificationCount, setNotificationCount] = useState(5);

  /**
   * Reads data from LocalStorage and updates component state.
   * STRICT VALIDATION: Ensures no "undefined", "null", or ghost fallbacks.
   */
  const loadUserData = () => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const rawName = localStorage.getItem('userName') || '';
    const rawAvatar = localStorage.getItem('userAvatar') || '';
    const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

    const isValidName =
      !!rawName &&
      rawName !== 'undefined' &&
      rawName !== 'null' &&
      rawName.trim().length > 0 &&
      rawName !== 'Thành viên'; // FIXED: Prevents ghost 'Thành viên' for guests

    if (authStatus === 'true' && isValidName) {
      setIsLoggedIn(true);
      setUserName(rawName);
      setUserAvatar(rawAvatar !== 'undefined' && rawAvatar !== 'null' ? rawAvatar : '');
      setIsSeller(Array.isArray(storedRoles) && storedRoles.includes('SELLER'));
    } else {
      // RESET: Treat as guest if validation fails
      setIsLoggedIn(false);
      setIsSeller(false);
      setUserName('');
      setUserAvatar('');
    }
  };

  useEffect(() => {
    loadUserData();

    const verifySession = async () => {
      try {
        const profile = await getUserProfile();

        // Only persist data when backend returns a real profile with a real fullName
        if (profile && profile.fullName) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userName', profile.fullName);
          localStorage.setItem('userAvatar', profile.avatarUrl || profile.avatar || '');
          localStorage.setItem('userRoles', JSON.stringify(profile.roles || []));
          loadUserData();
        } else {
          // SESSION INVALID: Clear identity info
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userName');
          localStorage.removeItem('userAvatar');
          localStorage.removeItem('userRoles');
          loadUserData();
        }
      } catch (err) {
        // ERROR/EXPIRED: Remove ghost data immediately
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userName');
        localStorage.removeItem('userAvatar');
        localStorage.removeItem('userRoles');
        loadUserData();
      }
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
      // CLEAN WIPE: Ensuring local storage is purged
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userRoles');
      setIsLoggedIn(false);
      setIsSeller(false);
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

  return (
    <header className="main-header">
      <div className="container">
        <div className="top-bar">
          <div
            className="logo-small"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <img src={logoImg} alt="AiNetsoft" />
          </div>

          <nav className="top-nav">
            <a onClick={() => navigate('/')} className="blue-link">Trang chủ</a>
            <span>|</span>

            {isLoggedIn && isSeller && (
              <>
                <a onClick={() => navigate('/my-shop')} className="blue-link">Gian hàng của tôi</a>
                <span>|</span>
                <a onClick={() => navigate('/chat')} className="blue-link">Chat với khách hàng</a>
                <span>|</span>
              </>
            )}

            <div
              className="notification-wrapper"
              onClick={() => navigate('/notifications')}
              style={{ cursor: 'pointer' }}
            >
              <FaBell className="nav-icon" />
              <span className="blue-link">Thông báo</span>
              {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
            </div>

            <span>|</span>
            <a href="#" className="blue-link">Thông tin khác...</a>
          </nav>
        </div>

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
            <div className="cart-wrapper" onClick={() => navigate('/cart')} style={{ cursor: 'pointer' }}>
              <FaShoppingCart className="cart-main-icon" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>

            <a href="#" className="nav-text-bold blue-link share-corner">Góc Chia Sẻ</a>

            {/* GUEST VS USER UI SWITCH */}
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
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          setUserAvatar('');
                        }}
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