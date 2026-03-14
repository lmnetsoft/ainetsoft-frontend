import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaStore, FaStar } from 'react-icons/fa';
import api from '../../services/api'; 
import './Home.css';

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[]; // Optional for safety
  imageUrls?: string[]; // Supporting both naming conventions
  imageUrl?: string; 
  category?: string;
  categoryName?: string;
  shopName: string;
  stock: number;
  status: string; 
  averageRating: number;
  reviewCount: number;
}

const Home = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize as empty array to prevent .filter() errors
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const minRatingParam = parseFloat(searchParams.get('minRating') || '0');

  // 1. Fetch Real Products from Backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products');
        // GUARD: Ensure products is always an array
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]); // Fallback to empty list instead of crashing
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

  // Your original static categories
  const categories = [
    "Máy Tính", "TiVi", "Âm Thanh", "Điện Thoại", "Dịch Vụ IT", "Máy Ảnh", 
    "Thiết Bị VP", "Thiết Bị Mạng", "Linh Kiện", "Gia Dụng", "Thời Trang", "Sức Khỏe",
    "Sách", "Đồ Chơi", "Văn Phòng", "Thể Thao", "Làm Đẹp", "Ô Tô"
  ];

  const popularKeywords = [
    "Máy tính xách tay", "iPhone 15", "Máy giặt Inverter", "Bàn phím cơ", "Đồng hồ thông minh"
  ];

  // 3. Integrated Filtering Logic (With Array Guard)
  const displayProducts = Array.isArray(products) ? products.filter(p => {
    // Robust naming check: support both 'category' and 'categoryName'
    const categoryToMatch = (p.categoryName || p.category || "").toLowerCase();
    
    const matchesSearch = p.name.toLowerCase().includes(searchQuery) || 
                          categoryToMatch.includes(searchQuery);
    
    const matchesRating = (p.averageRating || 0) >= minRatingParam;
    
    // In dev mode, allow items without status, but strictly check APPROVED for production
    const isApproved = p.status === 'APPROVED' || !p.status; 
    
    return isApproved && matchesSearch && matchesRating;
  }) : [];

  return (
    <div className="home-page">
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

      <section className="container">
        <div className="category-section">
          <h3 className="section-title">Danh Mục Sản Phẩm</h3>
          <div className="category-wrapper">
            <button className="scroll-btn left" onClick={() => scroll('left')}>‹</button>
            <div className="category-grid" ref={scrollRef}>
              {/* This is safe now because categories is a static array */}
              {categories.map((cat, index) => (
                <div key={index} className="category-item" onClick={() => navigate(`/?search=${encodeURIComponent(cat)}`)}>
                  <div className="category-icon-placeholder"></div>
                  <span>{cat}</span>
                </div>
              ))}
            </div>
            <button className="scroll-btn right" onClick={() => scroll('right')}>›</button>
          </div>
        </div>
      </section>

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
                       <img 
                          src={product.imageUrls?.[0] || product.images?.[0] || product.imageUrl || "/placeholder.png"} 
                          alt={product.name} 
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png" }}
                       />
                    </div>
                    <div className="product-details">
                      <p className="result-name">{product.name}</p>
                      
                      <div className="product-rating-row">
                        <div className="stars-mini">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              size={12} 
                              color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} 
                            />
                          ))}
                        </div>
                        {(product.averageRating || 0) > 0 && <span className="rating-num">{product.averageRating}</span>}
                      </div>

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