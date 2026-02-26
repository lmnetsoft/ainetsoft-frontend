import React, { useRef } from 'react';
import './Home.css';

const Home = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="home-page">
      {/* 1. Banner Section */}
      <div className="container">
        <div className="hero-banner">
          <h1>Banner Quảng Cáo</h1>
        </div>
      </div>

      {/* 2. Category Section */}
      <section className="container">
        <div className="category-section">
          <h3>Danh Mục Sản Phẩm</h3>
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

      {/* 3. Info Section (Tin bạn đang tìm kiếm) */}
      <div className="container">
        <div className="info-box">
          <h4 className="center-text" style={{ fontWeight: 'bold', color: '#002147', marginBottom: '10px' }}>
            Tin bạn đang tìm kiếm
          </h4>
          <p className="center-text">Show các tin liên quan đến sản phẩm người dùng đang tìm kiếm...</p>
        </div>
      </div>

      {/* 4. NEW: Popular Keywords Section */}
      <div className="container">
        <div className="keywords-section">
          <h4 className="keywords-title">Các từ khóa tìm kiếm phổ biến</h4>
          <div className="keywords-container">
            {popularKeywords.map((keyword, index) => (
              <span key={index} className="keyword-tag">{keyword}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;