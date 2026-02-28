import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa'; // Added Search Icon
import logoImg from '../../assets/images/logo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedName = localStorage.getItem('userName');
    
    if (authStatus === 'true') {
      setIsLoggedIn(true);
      setUserName(storedName || 'Thành viên');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userContact');
    setIsLoggedIn(false);
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
            <a onClick={() => navigate('/')} className="blue-link" style={{cursor: 'pointer'}}>Trang chủ</a> 
            <span>|</span>
            
            {isLoggedIn && (
              <>
                <a onClick={() => navigate('/my-shop')} className="blue-link" style={{cursor: 'pointer'}}>Gian hàng của tôi</a> <span>|</span>
                <a onClick={() => navigate('/chat')} className="blue-link" style={{cursor: 'pointer'}}>Chat với khách hàng</a> <span>|</span>
              </>
            )}
            
            <a href="#" className="blue-link">Thông báo</a> <span>|</span>
            <a href="#" className="blue-link">Thông tin khác...</a>
          </nav>
        </div>

        {/* Row 2: Search Bar (Refined) and Auth Actions */}
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
              <div className="logged-in-controls">
                <span className="user-name-display">Chào, {userName}</span>
                <button className="nav-text-bold highlight-btn" onClick={() => navigate('/post-ad')}>Đăng Tin</button>
                <button className="nav-text-bold logout-btn" onClick={handleLogout}>
                  Đăng Xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;