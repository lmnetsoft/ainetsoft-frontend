import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaShoppingCart, FaStore, FaStar, FaCommentDots, FaClipboardList, 
  FaExclamationTriangle, FaPlay, FaTimes, FaChevronLeft, FaChevronRight,
  FaStoreAlt 
} from 'react-icons/fa';
import api from '../../services/api'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext'; 
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
  videoThumbnailUrl?: string; 
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
  const { setIsChatOpen } = useChat(); 

  const videoRef = useRef<HTMLVideoElement>(null); 
  const zoomVideoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<Product | null>(location.state?.productPreview || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!location.state?.productPreview);
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0); 
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  const formatMediaUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null' || url === '') return "/placeholder.png";
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const rawImages = (product?.imageUrls && product.imageUrls.length > 0) ? product.imageUrls : (product as any)?.images;
  const images = Array.isArray(rawImages) ? rawImages : [];
  const hasVideo = !!product?.videoUrl;
  const totalMediaCount = hasVideo ? images.length + 1 : images.length;

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollAmount = 250;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleNextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMedia((prev) => (prev + 1) % totalMediaCount);
  };

  const handlePrevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMedia((prev) => (prev - 1 + totalMediaCount) % totalMediaCount);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomed) return;
      if (e.key === 'ArrowRight') handleNextMedia();
      if (e.key === 'ArrowLeft') handlePrevMedia();
      if (e.key === 'Escape') setIsZoomed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, totalMediaCount]);

  useEffect(() => {
    if (activeMedia === images.length && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [activeMedia, images.length]);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
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
          setToastMessage("Sản phẩm này hiện đang chờ kiểm duyệt.");
          setShowToast(true);
          setTimeout(() => navigate('/'), 2500);
          return;
        }

        setProduct(productData);
        document.title = `${productData.name} | AiNetsoft`;

        try {
          const revRes = await api.get(`/reviews/product/${id}`);
          setReviews(Array.isArray(revRes.data) ? revRes.data : []);
        } catch (e) { setReviews([]); }
      } catch (error) {
        setToastMessage("Không tìm thấy sản phẩm.");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductAndReviews();
    window.scrollTo(0, 0); 
  }, [id, navigate, location.state]);

  const handleChatWithSeller = () => {
    if (!localStorage.getItem('isAuthenticated')) { navigate('/login'); return; }
    setIsChatOpen(true); 
  };

  const handleAddToCart = async () => {
    if (!localStorage.getItem('isAuthenticated')) { navigate('/login'); return; }
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

  const descriptionLines = (product.description || "").split('\n');

  return (
    <div className="product-detail-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* --- ZOOM MODAL (GLASS ARROWS) --- */}
      {isZoomed && (
        <div className="zoom-modal-overlay" onClick={() => setIsZoomed(false)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-nav-arrow prev" onClick={handlePrevMedia} title="Ảnh trước">
              <FaChevronLeft size={24} />
            </button>
            <button className="zoom-close-btn" onClick={() => setIsZoomed(false)} title="Đóng"><FaTimes /></button>
            {hasVideo && activeMedia === images.length ? (
                <video ref={zoomVideoRef} autoPlay controls className="zoom-media-main" key={product.videoUrl}>
                  <source src={formatMediaUrl(product.videoUrl!)} type="video/mp4" />
                </video>
            ) : (
                <img 
                  src={formatMediaUrl(images[activeMedia])} 
                  alt="Zoomed" 
                  className="zoom-media-main"
                  onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                  key={images[activeMedia]}
                />
            )}
            <button className="zoom-nav-arrow next" onClick={handleNextMedia} title="Ảnh sau">
              <FaChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* AMBER PREVIEW BANNER */}
      {product.status !== 'APPROVED' && (
        <div className="container">
          <div className="preview-mode-banner">
            <FaExclamationTriangle size={20} /> 
            <div className="banner-text">
                <strong>BẢN XEM TRƯỚC:</strong> Sản phẩm chưa phê duyệt. Chỉ bạn mới có thể xem.
            </div>
          </div>
        </div>
      )}

      <div className="container detail-container">
        {/* LEFT BLOCK: GALLERY (FIXED WIDTH WRAPPER) */}
        <div className="detail-media-section">
          <div className="main-display" onClick={() => setIsZoomed(true)}>
            {hasVideo && activeMedia === images.length ? (
                <video ref={videoRef} muted loop playsInline controls className="main-video" key={product.videoUrl}>
                  <source src={formatMediaUrl(product.videoUrl!)} type="video/mp4" />
                </video>
            ) : (
                <img src={formatMediaUrl(images[activeMedia])} alt={product.name} />
            )}
            <div className="zoom-badge-hint">🔍 Click để xem lớn</div>
          </div>
          
          <div className="thumbnail-navigation-container">
            <button className="thumb-scroll-btn left" onClick={() => scrollThumbnails('left')}><FaChevronLeft /></button>
            <div className="thumbnail-list" ref={scrollRef}>
              {images.map((img, idx) => (
                <div key={idx} className={`thumb-item ${activeMedia === idx ? 'active' : ''}`} onClick={() => setActiveMedia(idx)}>
                  <img src={formatMediaUrl(img)} alt="thumb" />
                </div>
              ))}
              {/* VIDEO THUMB (CONTENT PREVIEW) */}
              {hasVideo && (
                <div className={`thumb-item video-thumb ${activeMedia === images.length ? 'active' : ''}`} onClick={() => setActiveMedia(images.length)}>
                  <div className="video-thumb-container">
                    {product.videoThumbnailUrl ? (
                      <img src={formatMediaUrl(product.videoThumbnailUrl)} alt="v-thumb" className="v-thumb-img" />
                    ) : (
                      <video className="v-thumb-video-preview" preload="metadata" muted>
                        <source src={`${formatMediaUrl(product.videoUrl!)}#t=0.5`} type="video/mp4" />
                      </video>
                    )}
                    <div className="play-badge"><FaPlay /></div>
                  </div>
                </div>
              )}
            </div>
            <button className="thumb-scroll-btn right" onClick={() => scrollThumbnails('right')}><FaChevronRight /></button>
          </div>
        </div>

        {/* RIGHT BLOCK: INFO & HORIZONTAL ACTIONS */}
        <div className="detail-info-section">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-rating-overview">
            <div className="star-row">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} />
              ))}
            </div>
            <span className="rating-value">{product.averageRating || 0}</span>
            <span className="divider">|</span>
            <span className="review-count">{product.reviewCount || 0} Đánh giá</span>
          </div>

          <div className="price-display-box">
            <span className="currency">₫</span>
            <span className="amount">{(product.price || 0).toLocaleString()}</span>
          </div>

          <div className="purchase-grid-system">
            <div className="p-grid-row combined-action-row">
              <span className="p-grid-label">Số lượng</span>
              <div className="p-grid-content horizontal-actions">
                <div className="qty-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <input type="number" value={quantity} readOnly />
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
                
                <div className="action-button-group">
                  <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={product.status !== 'APPROVED'}>
                    <FaShoppingCart /> Thêm vào giỏ hàng
                  </button>
                  <button className="buy-now-btn" onClick={() => { if(product.status === 'APPROVED'){ handleAddToCart(); navigate('/cart'); } }} disabled={product.status !== 'APPROVED'}>
                    Mua ngay
                  </button>
                </div>
              </div>
            </div>
            <div className="p-grid-row">
               <span className="p-grid-label"></span>
               <span className="stock-hint">{product.stock} sản phẩm có sẵn</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container detail-bottom">
        {/* COLORFUL SHOP CARD */}
        <div className="shop-card">
          <FaStore className="shop-icon" />
          <div className="shop-name-box">
            <h3>{product.shopName}</h3>
            <div className="shop-actions">
              <button className="chat-now-btn" onClick={handleChatWithSeller}>
                <FaCommentDots /> Chat ngay
              </button>
              <button className="view-shop-btn" onClick={() => navigate(`/shop/${product.sellerId || product.id}`)}>
                <FaStoreAlt /> Xem Shop
              </button>
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
          <div className="description-content">{descriptionLines.map((line, i) => <p key={i}>{line}</p>)}</div>
        </div>

        {/* REVIEWS */}
        <div className="reviews-section">
          <h3 className="section-title">ĐÁNH GIÁ SẢN PHẨM</h3>
          {reviews.length === 0 ? <p className="no-reviews">Chưa có đánh giá nào.</p> : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="rev-header">
                    <strong>{review.userName}</strong>
                    <div className="user-stars">{[...Array(5)].map((_, i) => <FaStar key={i} color={i < review.rating ? "#ee4d2d" : "#e4e5e9"} />)}</div>
                  </div>
                  <p className="rev-comment">{review.comment}</p>
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