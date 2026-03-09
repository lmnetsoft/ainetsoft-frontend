import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaStore, FaShieldAlt, FaTruck, FaStar } from 'react-icons/fa';
import axios from 'axios';
import ToastNotification from '../../components/Toast/ToastNotification';
import './ProductDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  videoUrl?: string; 
  shopName: string;
  averageRating?: number; // NEW
  reviewCount?: number;   // NEW
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]); // NEW: State for reviews
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0); 
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        setLoading(true);
        // Fetch Product Data
        const prodRes = await axios.get(`${API_URL}/products/${id}`);
        setProduct(prodRes.data);
        document.title = `${prodRes.data.name} | AiNetsoft`;

        // Fetch Review Data for this product
        const revRes = await axios.get(`${API_URL}/reviews/product/${id}`);
        setReviews(revRes.data);

      } catch (error) {
        setToastMessage("Không tìm thấy sản phẩm.");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndReviews();
  }, [id]);

  const handleAddToCart = async () => {
    if (!localStorage.getItem('isAuthenticated')) {
      navigate('/login');
      return;
    }

    try {
      const cartItem = {
        productId: product?.id,
        productName: product?.name,
        productImage: product?.images[0],
        price: product?.price,
        quantity: quantity,
        shopName: product?.shopName
      };

      await axios.post(`${API_URL}/auth/sync-cart`, { items: [cartItem] }, { withCredentials: true });
      
      setToastMessage("Đã thêm vào giỏ hàng!");
      setShowToast(true);
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      setToastMessage("Lỗi khi thêm vào giỏ hàng.");
      setShowToast(true);
    }
  };

  if (loading) return <div className="detail-loading">Đang tải chi tiết sản phẩm...</div>;
  if (!product) return <div className="detail-error">Sản phẩm không tồn tại.</div>;

  return (
    <div className="product-detail-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container detail-container">
        {/* LEFT: Media Gallery (Unchanged) */}
        <div className="detail-media-section">
          <div className="main-display">
            {product.videoUrl && activeMedia === product.images.length ? (
               <video controls className="main-video">
                 <source src={product.videoUrl} type="video/mp4" />
                 Trình duyệt của bạn không hỗ trợ video.
               </video>
            ) : (
               <img src={product.images[activeMedia] || "/placeholder.png"} alt={product.name} />
            )}
          </div>
          
          <div className="thumbnail-list">
            {product.images.map((img, idx) => (
              <div key={idx} className={`thumb-item ${activeMedia === idx ? 'active' : ''}`} onMouseEnter={() => setActiveMedia(idx)}>
                <img src={img} alt="thumb" />
              </div>
            ))}
            {product.videoUrl && (
              <div className={`thumb-item video-thumb ${activeMedia === product.images.length ? 'active' : ''}`} onMouseEnter={() => setActiveMedia(product.images.length)}>
                <div className="play-icon-overlay">▶</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="detail-info-section">
          <h1 className="product-title">{product.name}</h1>
          
          {/* NEW: Star Rating Display */}
          <div className="product-rating-overview" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', color: '#ee4d2d' }}>
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} />
              ))}
            </div>
            <span style={{ color: '#ee4d2d', fontWeight: 'bold' }}>{product.averageRating || 0}</span>
            <span style={{ color: '#767676', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>{product.reviewCount || 0} Đánh giá</span>
          </div>
          
          <div className="product-stats">
            <span className="category-tag">{product.category}</span>
            <span className="stock-info">Kho: {product.stock} sản phẩm có sẵn</span>
          </div>

          <div className="price-box">
            <span className="currency">₫</span>
            <span className="amount">{product.price.toLocaleString()}</span>
          </div>

          <div className="shipping-info">
            <div className="info-row">
              <FaTruck className="icon" />
              <div className="text">
                <p>Vận chuyển tới: <strong>Toàn quốc</strong></p>
                <p className="sub">Phí vận chuyển: ₫0 - ₫30.000</p>
              </div>
            </div>
          </div>

          <div className="quantity-selector">
            <label>Số lượng</label>
            <div className="qty-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <input type="number" value={quantity} readOnly />
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
            </div>
          </div>

          <div className="purchase-buttons">
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FaShoppingCart /> Thêm vào giỏ hàng
            </button>
            <button className="buy-now-btn" onClick={() => { handleAddToCart(); navigate('/cart'); }}>
              Mua ngay
            </button>
          </div>

          <div className="guarantee-box">
            <span><FaShieldAlt /> AiNetsoft Đảm Bảo</span>
            <p>7 ngày miễn phí trả hàng / Hoàn tiền 100%</p>
          </div>
        </div>
      </div>

      {/* BOTTOM: Description, Shop & REVIEWS */}
      <div className="container detail-bottom">
        <div className="shop-card">
          <FaStore className="shop-icon" />
          <div className="shop-name-box">
            <h3>{product.shopName}</h3>
            <button className="view-shop-btn">Xem Shop</button>
          </div>
        </div>

        <div className="description-section">
          <h3 className="section-title">MÔ TẢ SẢN PHẨM</h3>
          <div className="description-content">
            {product.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>

        {/* NEW: Reviews Section */}
        <div className="reviews-section" style={{ marginTop: '30px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3 className="section-title" style={{ marginBottom: '20px' }}>ĐÁNH GIÁ SẢN PHẨM</h3>
          {reviews.length === 0 ? (
            <p style={{ color: '#767676', textAlign: 'center', padding: '20px 0' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                     <strong>{review.userName}</strong>
                     <div style={{ display: 'flex', color: '#ee4d2d', fontSize: '12px' }}>
                        {[...Array(5)].map((_, i) => <FaStar key={i} color={i < review.rating ? "#ee4d2d" : "#e4e5e9"} />)}
                     </div>
                  </div>
                  <p style={{ color: '#767676', fontSize: '12px', marginBottom: '10px' }}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                  <p style={{ color: '#333' }}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;