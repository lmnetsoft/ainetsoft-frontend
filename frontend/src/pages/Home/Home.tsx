import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaStore } from 'react-icons/fa';
import axios from 'axios';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  shopName: string;
  stock: number;
}

const Home = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Real Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User Identity State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  // 1. Fetch Real Products from Backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Identity Sync & Title Update
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsLoggedIn(authStatus);

    if (authStatus) {
      setUserName(localStorage.getItem('userName') || 'Thành viên');
      setUserAvatar(localStorage.getItem('userAvatar') || '');
    }

    document.title = searchQuery 
      ? `Kết quả cho "${searchQuery}" | AiNetsoft` 
      : "AiNetsoft - Kết nối công nghệ";
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
    "Sách", "Đồ Chơi", "Văn Phòng", "Thể Thao", "Làm Đẹp", "Ô Tô"
  ];

  const popularKeywords = [
    "Máy tính xách tay", "iPhone 15", "Máy giặt Inverter", "Bàn phím cơ", "Đồng hồ thông minh"
  ];

  // Real Filtering Logic
  const displayProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery) || 
    p.category.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="home-page">
      {/* 1. Banner Section */}
      <div className="container">
        <div className="hero-banner">
          <h1>AiNetsoft Technology Hub</h1>
          <p>Giải pháp CNTT và Sản phẩm Công nghệ hàng đầu</p>

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
                <div key={index} className="category-item" onClick={() => navigate(`/?search=${cat}`)}>
                  <div className="category-icon-placeholder"></div>
                  <span>{cat}</span>
                </div>
              ))}
            </div>
            <button className="scroll-btn right" onClick={() => scroll('right')}>›</button>
          </div>
        </div>
      </section>

      {/* 3. Main Product Results Section */}
      <div className="container">
        <div className="info-box">
          <h4 className="info-header">
            {searchQuery ? `Kết quả tìm kiếm cho: "${searchQuery}"` : "Gợi ý dành cho bạn"}
          </h4>
          
          <div className="search-results-container">
            {loading ? (
              <div className="spinner-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Đang xử lý dữ liệu AiNetsoft...</p>
              </div>
            ) : displayProducts.length > 0 ? (
              <div className="results-grid">
                {displayProducts.map(product => (
                  <div key={product.id} className="result-card" onClick={() => navigate(`/product/${product.id}`)}>
                    <div className="product-image-wrapper">
                       <img src={product.images[0] || "/placeholder.png"} alt={product.name} />
                    </div>
                    <div className="product-details">
                      <p className="result-name">{product.name}</p>
                      <div className="price-row">
                        <span className="result-price">₫{product.price.toLocaleString()}</span>
                        <span className="stock-label">Kho: {product.stock}</span>
                      </div>
                      <p className="shop-tag"><FaStore size={10} /> {product.shopName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="center-text no-results">Không tìm thấy sản phẩm nào phù hợp.</p>
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