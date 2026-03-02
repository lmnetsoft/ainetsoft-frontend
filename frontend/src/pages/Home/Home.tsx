import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa'; // NEW: Added for fallback icon
import './Home.css';

const Home = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // NEW: State to track user identity
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  // Grab the search query from the URL
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  // Mock data for search results
  const mockProducts = [
    { id: 1, name: "Máy tính xách tay Dell XPS", price: "25.000.000đ" },
    { id: 2, name: "iPhone 15 Pro Max 256GB", price: "32.000.000đ" },
    { id: 3, name: "Bàn phím cơ Gaming RGB", price: "1.200.000đ" },
    { id: 4, name: "Dịch vụ cài đặt Server IT", price: "Liên hệ" },
    { id: 5, name: "Máy giặt Inverter Samsung", price: "8.500.000đ" },
  ];

  // Update Page Title and handle identity sync
  useEffect(() => {
    // UPDATED: Sync with the isAuthenticated key used in Header/Profile
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsLoggedIn(authStatus);

    if (authStatus) {
      setUserName(localStorage.getItem('userName') || 'Thành viên');
      setUserAvatar(localStorage.getItem('userAvatar') || '');
    }

    if (searchQuery) {
      setLoading(true);
      document.title = `Kết quả cho "${searchQuery}" | AiNetsoft`;
      const timer = setTimeout(() => setLoading(false), 500); 
      return () => clearTimeout(timer);
    } else {
      document.title = authStatus 
        ? "AiNetsoft - IT services and products online" 
        : "AiNetsoft - Kết nối công nghệ";
    }
  }, [searchQuery]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const categories = [
    "Máy Tính", "TiVi", "Âm Thanh", "Điện Thoại", "Dịch Vụ IT", "Máy Ảnh", 
    "Thiết Bị VP", "Thiết Bị Mạng", "Linh Kiện", "Gia Dụng", "Thời Trang", "Sức Khỏe",
    "Sách", "Đồ Chơi", "Văn Phòng", "Thể Thao", "Làm Đẹp", "Ô Tô",
    "Mẹ & Bé", "Giày Dép", "Túi Ví", "Đồng Hồ", "Trang Sức", "Phụ Kiện"
  ];

  const popularKeywords = [
    "Máy tính xách tay", "iPhone 15 Pro Max", "Máy giặt Inverter", 
    "Sách kỹ năng", "Giày thể thao nam", "Tủ lạnh Samsung", 
    "Bàn phím cơ", "Đồng hồ thông minh", "Gia dụng thông minh"
  ];

  const filteredResults = mockProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="home-page">
      {/* 1. Banner Section */}
      <div className="container">
        <div className="hero-banner">
          <h1>AiNetsoft Technology Hub</h1>
          <p>Giải pháp CNTT toàn diện cho doanh nghiệp</p>

          {/* NEW: Personal Welcome Section for logged in users */}
          {isLoggedIn && !searchQuery && (
            <div className="home-welcome-box" onClick={() => navigate('/user/profile')}>
              {userAvatar ? (
                <img src={userAvatar} className="home-avatar-img" alt="User" />
              ) : (
                <FaUserCircle className="home-avatar-icon" />
              )}
              <span className="welcome-text">Chào mừng trở lại, <strong>{userName}</strong>!</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Category Section */}
      <section className="container">
        <div className="category-section">
          <h3 className="section-title">Danh Mục Sản Phẩm</h3>
          <div className="category-wrapper">
            <button className="scroll-btn left" onClick={() => scroll('left')}>‹</button>
            <div className="category-grid" ref={scrollRef}>
              {categories.map((cat, index) => (
                <div key={index} className="category-item">
                  <div className="category-icon-placeholder"></div>
                  <span>{cat}</span>
                </div>
              ))}
            </div>
            <button className="scroll-btn right" onClick={() => scroll('right')}>›</button>
          </div>
        </div>
      </section>

      {/* 3. Info Section */}
      <div className="container">
        <div className="info-box">
          <h4 className="center-text info-header">
            {searchQuery ? `Kết quả tìm kiếm cho: "${searchQuery}"` : "Gợi ý dành cho bạn"}
          </h4>
          
          <div className="search-results-container">
            {loading ? (
              <div className="spinner-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Đang xử lý dữ liệu AiNetsoft...</p>
              </div>
            ) : searchQuery ? (
              filteredResults.length > 0 ? (
                <div className="results-grid">
                  {filteredResults.map(item => (
                    <div key={item.id} className="result-card">
                      <p className="result-name">{item.name}</p>
                      <p className="result-price">{item.price}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="center-text no-results">Không tìm thấy sản phẩm nào phù hợp.</p>
              )
            ) : (
              <p className="center-text default-info">Khám phá các giải pháp công nghệ mới nhất từ đối tác của chúng tôi.</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Popular Keywords Section */}
      <div className="container">
        <div className="keywords-section">
          <h4 className="keywords-title">Xu hướng tìm kiếm</h4>
          <div className="keywords-container">
            {popularKeywords.map((keyword, index) => (
              <span 
                key={index} 
                className="keyword-tag"
                onClick={() => navigate(`/?search=${encodeURIComponent(keyword)}`)}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;