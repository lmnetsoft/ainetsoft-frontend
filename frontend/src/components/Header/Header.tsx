import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/images/logo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  
  // Temporary state: In a real app, this would come from a Global State (like Redux or Context)
  // For now, you can toggle this to 'true' to see how the "Logged In" view looks.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="main-header">
      <div className="container">
        {/* Row 1: Logo and Dynamic Navigation */}
        <div className="top-bar">
          <div className="logo-small" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <img src={logoImg} alt="AiNetsoft" />
          </div>
          <nav className="top-nav">
            <a onClick={() => navigate('/')} className="blue-link" style={{cursor: 'pointer'}}>Trang chủ</a> 
            <span>|</span>
            
            {/* LOGIC: Hide Shop and Chat if not logged in */}
            {isLoggedIn && (
              <>
                <a href="#" className="blue-link">Gian hàng của tôi</a> <span>|</span>
                <a href="#" className="blue-link">Chat với khách hàng</a> <span>|</span>
              </>
            )}
            
            <a href="#" className="blue-link">Thông báo</a> <span>|</span>
            <a href="#" className="blue-link">Thông tin khác...</a>
          </nav>
        </div>

        {/* Row 2: Search Bar and Auth Actions */}
        <div className="action-bar">
          <div className="search-wrapper">
            <input type="text" placeholder="SEARCHING" />
          </div>

          <div className="user-actions">
            <a href="#" className="nav-text-bold blue-link">Góc Chia Sẻ</a>
            
            {!isLoggedIn ? (
              <>
                <button className="nav-text-bold" onClick={() => navigate('/login')}>
                  Đăng Nhập
                </button>
                <button 
                  className="nav-text-bold register-btn" 
                  onClick={() => navigate('/register')}
                >
                  Đăng Ký
                </button>
              </>
            ) : (
              <>
                {/* LOGIC: Show 'Đăng Tin' only when logged in */}
                <button className="nav-text-bold highlight-btn">Đăng Tin</button>
                <button className="nav-text-bold logout-btn" onClick={handleLogout}>
                  Đăng Xuất
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;