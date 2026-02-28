import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
// Using the PNG logo with text from your assets
import logoImg from '../../assets/images/logo.png';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Update tab title specifically for this error state
  useEffect(() => {
    document.title = "404 - Không tìm thấy trang | AiNetsoft";
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirects user back to Home with the search query
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Main Logo from Assets */}
        <img src={logoImg} alt="AiNetsoft" className="not-found-logo" />
        
        <h1 className="error-code">404</h1>
        <p className="error-message">
          Trang bạn tìm kiếm không tồn tại. Thử tìm kiếm nội dung khác bên dưới nhé!
        </p>

        {/* Search Rescue Box */}
        <form className="search-box-404" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Bạn đang tìm kiếm gì?..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn-404">
            <FaSearch />
          </button>
        </form>
        
        <div className="action-links">
          <button className="back-home-btn" onClick={() => navigate('/')}>
            Quay về Trang Chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;