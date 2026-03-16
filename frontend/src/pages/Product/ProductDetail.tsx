import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaShoppingCart, FaStore, FaShieldAlt, FaTruck, FaStar, 
  FaCommentDots, FaClipboardList, FaExclamationTriangle 
} from 'react-icons/fa';
import api from '../../services/api'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import './ProductDetail.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

interface Product {
  id: string;
  sellerId?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryName: string;
  specifications?: Record<string, string>;
  imageUrls: string[]; 
  videoUrl?: string; 
  shopName: string;
  averageRating?: number;
  reviewCount?: number;
  status?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  imageUrls?: string[];
  createdAt: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Initialize from passed state (Preview) or null
  const [product, setProduct] = useState<Product | null>(location.state?.productPreview || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!location.state?.productPreview);
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0); 
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  /**
   * DYNAMIC PATH RESOLVER
   * Standardized to handle the uploads/ads/{sellerId}/ structure.
   * Ensures exactly one slash between BASE_URL and the path.
   */
  const formatMediaUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null' || url === '') return "/placeholder.png";
    if (url.startsWith('http')) return url;
    
    // Ensure path starts with a slash
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}${cleanPath}`;
  };

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      // PREVIEW PATH: If data is passed from MyProducts.tsx
      if (location.state?.productPreview) {
          const previewData = location.state.productPreview;
          setProduct(previewData);
          document.title = `${previewData.name} | AiNetsoft (Xem trước)`;
          
          try {
            const revRes = await api.get(`/reviews/product/${id}`);
            setReviews(Array.isArray(revRes.data) ? revRes.data : []);
          } catch (e) { setReviews([]); }
          
          setLoading(false);
          return;
      }

      // PUBLIC PATH: Full fetch and security checks
      try {
        setLoading(true);
        const prodRes = await api.get(`/products/${id}`);
        const productData = prodRes.data;

        const rawUser = localStorage.getItem('user');
        const userObj = rawUser ? JSON.parse(rawUser) : {};
        const currentUserId = userObj.id || userObj.userId;
        const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const isAdmin = storedRoles.includes('ADMIN');

        const isOwner = productData.sellerId === currentUserId;
        const isApproved = productData.status === 'APPROVED';

        if (!isApproved && !isOwner && !isAdmin) {
          setToastMessage("Sản phẩm này hiện đang chờ kiểm duyệt và chưa thể xem công khai.");
          setShowToast(true);
          setTimeout(() => navigate('/'), 2500);
          return;
        }

        setProduct(productData);
        document.title = `${productData.name} | AiNetsoft`;

        try {
          const revRes = await api.get(`/reviews/product/${id}`);
          setReviews(Array.isArray(revRes.data) ? revRes.data : []);
        } catch (e) {
          setReviews([]);
        }
      } catch (error) {
        setToastMessage("Không tìm thấy sản phẩm.");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductAndReviews();
  }, [id, navigate, location.state]);

  const handleChatWithSeller = () => {
    if (!localStorage.getItem('isAuthenticated')) {
      navigate('/login');
      return;
    }
    const recipientId = product?.sellerId || product?.id;
    if (recipientId) navigate(`/chat/${recipientId}`);
  };

  const handleAddToCart = async () => {
    if (!localStorage.getItem('isAuthenticated')) {
      navigate('/login');
      return;
    }
    if (!product) return;
    if (product.status !== 'APPROVED') {
        setToastMessage("Không thể mua sản phẩm đang trong chế độ xem trước.");
        setShowToast(true);
        return;
    }

    try {
      const cartItem = {
        productId: product.id,
        productName: product.name,
        // Support both imageUrls and images keys for cart thumbnail
        productImage: (product.imageUrls?.[0] || (product as any).images?.[0]) || "/placeholder.png",
        price: product.price,
        quantity: quantity,
        shopName: product.shopName
      };
      await api.post('/auth/sync-cart', { items: [cartItem] });
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

  // --- MAPPER FIX: Supports both API data (imageUrls) and Preview data (images) ---
  const rawImages = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls 
    : (product as any).images;
    
  const images = Array.isArray(rawImages) ? rawImages : [];
    
  const hasVideo = !!product.videoUrl;
  const descriptionLines = (product.description || "").split('\n');

  return (
    <div className="product-detail-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {product.status !== 'APPROVED' && (
        <div className="preview-mode-banner" style={{ 
            backgroundColor: '#fff3cd', color: '#856404', padding: '15px', textAlign: 'center', 
            fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            gap: '10px', borderBottom: '1px solid #ffeeba'
        }}>
          <FaExclamationTriangle /> 
          <span>BẢN XEM TRƯỚC: Sản phẩm chưa phê duyệt. Chỉ bạn (người bán) mới có thể xem.</span>
        </div>
      )}

      <div className="container detail-container">
        {/* LEFT: Media Gallery */}
        <div className="detail-media-section">
          <div className="main-display">
            {hasVideo && activeMedia === images.length ? (
               <video controls className="main-video" key={product.videoUrl}>
                 <source src={formatMediaUrl(product.videoUrl!)} type="video/mp4" />
               </video>
            ) : (
               <img 
                 src={formatMediaUrl(images[activeMedia])} 
                 alt={product.name} 
                 onError={(e) => { e.currentTarget.src = "/placeholder.png"; }} 
               />
            )}
          </div>
          
          <div className="thumbnail-list">
            {images.map((img, idx) => (
              <div key={idx} className={`thumb-item ${activeMedia === idx ? 'active' : ''}`} onMouseEnter={() => setActiveMedia(idx)}>
                <img src={formatMediaUrl(img)} alt="thumb" onError={(e) => { e.currentTarget.src = "/placeholder.png"; }} />
              </div>
            ))}
            {hasVideo && (
              <div className={`thumb-item video-thumb ${activeMedia === images.length ? 'active' : ''}`} onMouseEnter={() => setActiveMedia(images.length)}>
                <div className="play-icon-overlay">▶</div>
                <p style={{fontSize: '10px', marginTop: '20px'}}>Video</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="detail-info-section">
          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-rating-overview">
            <div style={{ display: 'flex', color: '#ee4d2d' }}>
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} />
              ))}
            </div>
            <span className="rating-value">{product.averageRating || 0}</span>
            <span className="review-count">{product.reviewCount || 0} Đánh giá</span>
          </div>
          
          <div className="product-stats">
            <span className="category-tag">{product.categoryName || "Chưa phân loại"}</span>
            <span className="stock-info">Kho: {product.stock} sản phẩm có sẵn</span>
          </div>

          <div className="price-box">
            <span className="currency">₫</span>
            <span className="amount">{(product.price || 0).toLocaleString()}</span>
          </div>

          <div className="shipping-info">
            <div className="info-row">
              <FaTruck className="icon" /><div className="text"><p>Vận chuyển tới: <strong>Toàn quốc</strong></p></div>
            </div>
          </div>

          <div className="purchase-buttons">
            <div className="quantity-selector">
              <label>Số lượng</label>
              <div className="qty-controls">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <input type="number" value={quantity} readOnly />
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
              </div>
            </div>

            <div className="button-group">
                <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={product.status !== 'APPROVED'}>
                  <FaShoppingCart /> Thêm vào giỏ hàng
                </button>
                <button className="buy-now-btn" onClick={() => { if(product.status === 'APPROVED'){ handleAddToCart(); navigate('/cart'); } }} disabled={product.status !== 'APPROVED'}>
                  Mua ngay
                </button>
            </div>
          </div>

          <div className="guarantee-box">
            <span><FaShieldAlt /> AiNetsoft Đảm Bảo</span>
            <p>7 ngày miễn phí trả hàng / Hoàn tiền 100%</p>
          </div>
        </div>
      </div>

      <div className="container detail-bottom">
        <div className="shop-card">
          <FaStore className="shop-icon" />
          <div className="shop-name-box">
            <h3>{product.shopName}</h3>
            <div className="shop-actions">
              <button className="chat-now-btn" onClick={handleChatWithSeller}><FaCommentDots /> Chat ngay</button>
              <button className="view-shop-btn" onClick={() => navigate(`/shop/${product.sellerId || product.id}`)}>Xem Shop</button>
            </div>
          </div>
        </div>

        {/* SPECIFICATIONS */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="specs-section">
            <h3 className="section-title"><FaClipboardList /> CHI TIẾT SẢN PHẨM</h3>
            <div className="specs-table">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="specs-row">
                  <div className="specs-label">{key}</div>
                  <div className="specs-value">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DESCRIPTION */}
        <div className="description-section">
          <h3 className="section-title">MÔ TẢ SẢN PHẨM</h3>
          <div className="description-content">
            {descriptionLines.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>

        {/* REVIEWS */}
        <div className="reviews-section">
          <h3 className="section-title">ĐÁNH GIÁ SẢN PHẨM</h3>
          {reviews.length === 0 ? (
            <p className="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="rev-header">
                    <strong>{review.userName}</strong>
                    <div className="user-stars">
                      {[...Array(5)].map((_, i) => <FaStar key={i} color={i < review.rating ? "#ee4d2d" : "#e4e5e9"} />)}
                    </div>
                  </div>
                  <p className="rev-comment">{review.comment}</p>
                  {review.imageUrls && review.imageUrls.length > 0 && (
                    <div className="review-images">
                      {review.imageUrls.map((url, i) => (
                        <img key={i} src={formatMediaUrl(url)} alt="Review" />
                      ))}
                    </div>
                  )}
                  <p className="rev-date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
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