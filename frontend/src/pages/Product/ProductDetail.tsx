import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaShoppingCart, FaStore, FaStar, FaCommentDots, FaClipboardList, 
  FaExclamationTriangle, FaPlay, FaTimes, FaChevronLeft, FaChevronRight,
  FaStoreAlt, FaTruck, FaShieldAlt, FaHeart, FaRegHeart, FaFacebook,
  FaFacebookMessenger, FaPinterest, FaTwitter, FaInfoCircle, FaLink,
  FaFlag, FaCheckCircle
} from 'react-icons/fa';
import api, { 
  shareProduct, 
  reportProduct, 
  getProductReviews, 
  getReviewStats 
} from '../../services/api'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext'; 
import './ProductDetail.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

// Professional Report Categories
const REPORT_REASONS = [
  "Sản phẩm giả mạo, hàng nhái",
  "Nội dung phản cảm, khiêu dâm",
  "Sản phẩm bị cấm kinh doanh",
  "Dấu hiệu lừa đảo",
  "Hình ảnh không rõ ràng/sai lệch",
  "Lý do khác..."
];

interface ShippingConfig {
  methodId: string;
  methodName: string;
  cost: number;
  estimatedTime: string;
  voucherNote: string;
}

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
  soldCount?: number; // Added for social proof
  status?: string;
  shippingOptions?: ShippingConfig[];
  protectionEnabled?: boolean;
  allowSharing?: boolean;
  favoriteCount?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string; // Enhanced
  imageUrls?: string[];
  videoUrl?: string;   // Enhanced
  variantInfo?: string; // Enhanced (e.g. Size M)
  sellerReply?: string; // Enhanced
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
  const [reviewStats, setReviewStats] = useState<any>(null); // NEW: Stat counts
  const [selectedFilter, setSelectedFilter] = useState('all'); // NEW: Active filter
  
  const [loading, setLoading] = useState(!location.state?.productPreview);
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0); 
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  // Interaction States
  const [showShippingDrawer, setShowShippingDrawer] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // --- REPORT MODAL STATES ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

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

  // --- NEW: REVIEW FILTER HANDLER ---
  const fetchFilteredReviews = async (filterType: string) => {
    if (!id) return;
    try {
      let rating: number | undefined = undefined;
      let hasImages: boolean | undefined = undefined;

      if (filterType >= '1' && filterType <= '5') rating = parseInt(filterType);
      if (filterType === 'images') hasImages = true;

      const res = await getProductReviews(id, rating, hasImages);
      setReviews(res.data);
      setSelectedFilter(filterType);
    } catch (err) {
      console.error("Filtering failed", err);
    }
  };

  // --- INTERACTION HANDLERS ---

  const handleShare = async (platform: 'facebook' | 'messenger' | 'link' | 'twitter') => {
    if (!product) return;
    const currentUrl = window.location.href;
    
    // Increment Count in Backend (Frictionless)
    try { await shareProduct(product.id); } catch (e) { console.error("Share count fail"); }

    if (platform === 'link') {
      navigator.clipboard.writeText(currentUrl);
      setToastMessage("Đã sao chép liên kết vào bộ nhớ tạm!");
      setShowToast(true);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(product.name)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
    } else if (platform === 'messenger') {
      // PRO FIX: Prevent blank screen on PC
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `fb-messenger://share/?link=${encodeURIComponent(currentUrl)}`;
      } else {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
      }
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localStorage.getItem('isAuthenticated')) { 
      setToastMessage("Vui lòng đăng nhập để gửi báo cáo.");
      setShowToast(true);
      setTimeout(() => navigate('/login'), 1500);
      return; 
    }
    if (!id || !reportDetails.trim()) return;

    try {
      setIsReporting(true);
      await reportProduct(id, { reason: reportReason, details: reportDetails });
      setToastMessage("Báo cáo vi phạm của bạn đã được gửi tới Admin.");
      setShowToast(true);
      setShowReportModal(false);
      setReportDetails('');
    } catch (error) {
      setToastMessage("Gửi báo cáo thất bại. Vui lòng thử lại sau.");
      setShowToast(true);
    } finally {
      setIsReporting(false);
    }
  };

  // --- PRESERVED GALLERY & SCROLL LOGIC ---

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollAmount = 200;
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

  // --- PRESERVED DATA FETCHING (Enhanced with Review Stats) ---

  useEffect(() => {
    const fetchData = async () => {
      if (location.state?.productPreview) {
          setProduct(location.state.productPreview);
          setLoading(false);
          return;
      }
      try {
        setLoading(true);
        // Step 1: Load Core Product
        const prodRes = await api.get(`/products/${id}`);
        const productData = prodRes.data;
        const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const isAdmin = storedRoles.includes('ADMIN');

        if (productData.status !== 'APPROVED' && !isAdmin) {
          const rawUser = localStorage.getItem('user');
          const userObj = rawUser ? JSON.parse(rawUser) : {};
          if (productData.sellerId !== (userObj.id || userObj.userId)) {
              setToastMessage("Sản phẩm này hiện đang chờ kiểm duyệt.");
              setShowToast(true);
              setTimeout(() => navigate('/'), 2500);
              return;
          }
        }

        setProduct(productData);
        document.title = `${productData.name} | AiNetsoft`;

        // Step 2: Non-blocking fetch for Audit Data (Prevents failure if no reviews exist)
        try {
          const [statsRes, revRes] = await Promise.all([
            getReviewStats(id!),
            getProductReviews(id!)
          ]);
          setReviewStats(statsRes.data);
          setReviews(revRes.data);
        } catch (revErr) {
          console.warn("Review data not found for this product yet.");
        }

      } catch (error) {
        setToastMessage("Không tìm thấy sản phẩm.");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
    window.scrollTo(0, 0); 
  }, [id, navigate, location.state]);

  const handleChatWithSeller = () => {
    if (!localStorage.getItem('isAuthenticated')) { navigate('/login'); return; }
    setIsChatOpen(true); 
  };

  const handleAddToCart = async () => {
    if (!localStorage.getItem('isAuthenticated')) { navigate('/login'); return; }
    if (!product) return;
    try {
      const cartItem = {
        productId: product.id,
        productName: product.name,
        productImage: (product.imageUrls?.[0] || "/placeholder.png"),
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

  if (loading) return <div className="detail-loading">Đang tải...</div>;
  if (!product) return <div className="detail-error">Sản phẩm không tồn tại.</div>;

  const descriptionLines = (product.description || "").split('\n');

  return (
    <div className="product-detail-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* --- REPORT MODAL --- */}
      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal-card" onClick={e => e.stopPropagation()}>
            <div className="report-header">
              <h3><FaFlag /> Báo Vi Phạm</h3>
              <button className="close-x" onClick={() => setShowReportModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleReportSubmit}>
              <div className="report-body">
                <label>Lý do vi phạm</label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)}>
                  {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <label>Chi tiết thêm</label>
                <textarea 
                  placeholder="Vui lòng cung cấp thêm thông tin vi phạm..."
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="report-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowReportModal(false)}>Hủy</button>
                <button type="submit" className="btn-confirm-report" disabled={isReporting}>
                  {isReporting ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SHIPPING DRAWER MODAL --- */}
      {showShippingDrawer && (
        <div className="shipping-drawer-overlay" onClick={() => setShowShippingDrawer(false)}>
          <div className="shipping-drawer-card" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Thông tin về phí vận chuyển</h3>
              <button className="close-btn" onClick={() => setShowShippingDrawer(false)}><FaTimes /></button>
            </div>
            <div className="drawer-body">
              <p className="ship-to-loc-text">Vận chuyển tới: <strong>Phường Tân Chánh Hiệp, Quận 12</strong> <FaChevronRight size={10}/></p>
              <div className="drawer-ship-list">
                {product.shippingOptions?.map((opt, idx) => (
                  <div key={idx} className="drawer-ship-item">
                    <div className="drawer-ship-row-main">
                      <div className="drawer-ship-meta">
                        <span className="drawer-arrival-badge">Nhận trong <strong className="green-text">{opt.estimatedTime}</strong> <FaInfoCircle size={11} color="#ccc" /></span>
                        <span className="drawer-method-name">{opt.methodName}</span>
                        {opt.voucherNote && <p className="drawer-voucher-note">{opt.voucherNote}</p>}
                      </div>
                      <span className="drawer-ship-price">{(opt.cost || 0).toLocaleString()}₫</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
               <button className="btn-understand" onClick={() => setShowShippingDrawer(false)}>Đã Hiểu</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SECTION: MEDIA ZOOM */}
      {isZoomed && (
        <div className="zoom-modal-overlay" onClick={() => setIsZoomed(false)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-nav-arrow prev" onClick={handlePrevMedia}><FaChevronLeft size={24} /></button>
            <button className="zoom-close-btn" onClick={() => setIsZoomed(false)}><FaTimes /></button>
            {hasVideo && activeMedia === images.length ? (
                <video ref={zoomVideoRef} autoPlay controls className="zoom-media-main">
                  <source src={formatMediaUrl(product.videoUrl!)} type="video/mp4" />
                </video>
            ) : (
                <img src={formatMediaUrl(images[activeMedia])} alt="Zoom" className="zoom-media-main" key={images[activeMedia]} />
            )}
            <button className="zoom-nav-arrow next" onClick={handleNextMedia}><FaChevronRight size={24} /></button>
          </div>
        </div>
      )}

      {/* BOX 1: BANNER */}
      {product.status !== 'APPROVED' && (
        <div className="container sync-container">
          <div className="preview-mode-banner">
            <FaExclamationTriangle size={20} /> 
            <div className="banner-text"><strong>BẢN XEM TRƯỚC:</strong> Sản phẩm chưa phê duyệt. Chỉ bạn mới có thể xem.</div>
          </div>
        </div>
      )}

      {/* BOX 2: PRODUCT INFO */}
      <div className="container sync-container">
        <div className="detail-container">
          <div className="detail-media-section">
            <div className="main-display" onClick={() => setIsZoomed(true)}>
              {hasVideo && activeMedia === images.length ? (
                  <video ref={videoRef} muted loop playsInline controls className="main-video">
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
                {hasVideo && (
                  <div className={`thumb-item video-thumb ${activeMedia === images.length ? 'active' : ''}`} onClick={() => setActiveMedia(images.length)}>
                    <div className="video-thumb-container">
                      <video className="v-thumb-video-preview" preload="metadata" muted>
                        <source src={`${formatMediaUrl(product.videoUrl!)}#t=0.5`} type="video/mp4" />
                      </video>
                      <div className="play-badge"><FaPlay /></div>
                    </div>
                  </div>
                )}
              </div>
              <button className="thumb-scroll-btn right" onClick={() => scrollThumbnails('right')}><FaChevronRight /></button>
            </div>

            {/* --- 2. SOCIAL & LIKE ROW --- */}
            {product.allowSharing && (
              <div className="social-interaction-block">
                <div className="share-section">
                  <span>Chia sẻ:</span>
                  <button className="share-icon-btn messenger" title="Gửi Messenger" onClick={() => handleShare('messenger')}><FaFacebookMessenger /></button>
                  <button className="share-icon-btn facebook" title="Chia sẻ Facebook" onClick={() => handleShare('facebook')}><FaFacebook /></button>
                  <button className="share-icon-btn twitter" title="Chia sẻ X (Twitter)" onClick={() => handleShare('twitter')}><FaTwitter /></button>
                  <button className="share-icon-btn link" title="Sao chép liên kết" onClick={() => handleShare('link')}><FaLink /></button>
                </div>
                <div className="interaction-divider"></div>
                <div className="like-section" onClick={() => setIsLiked(!isLiked)}>
                  {isLiked ? <FaHeart className="heart-icon active" /> : <FaRegHeart className="heart-icon" />}
                  <span className="like-text">Đã thích ({product.favoriteCount || 0})</span>
                </div>
              </div>
            )}
          </div>

          <div className="detail-info-section">
            {/* SURGICAL INSERTION: TOP-RIGHT FLAG BUTTON */}
            <div className="report-link-row">
               <button className="btn-report-action" onClick={() => setShowReportModal(true)}>
                 <FaFlag /> Báo Vi Phạm
               </button>
            </div>

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
              <span className="divider">|</span>
              <span className="sold-count">Đã bán {product.soldCount || 0}</span>
            </div>

            <div className="price-display-box">
              <span className="currency">₫</span>
              <span className="amount">{(product.price || 0).toLocaleString()}</span>
            </div>

            {/* --- 3. SHIPPING GRID ROW --- */}
            <div className="info-grid-row selectable" onClick={() => setShowShippingDrawer(true)}>
              <span className="grid-label">Vận Chuyển</span>
              <div className="grid-content">
                <div className="ship-summary-main">
                  <FaTruck className="truck-icon-green" />
                  <span>Nhận trong <strong className="green-text">{product.shippingOptions?.[0]?.estimatedTime || 'Dự kiến 2-3 ngày'}</strong></span>
                  <FaChevronRight className="arrow-right-sm" />
                </div>
                {product.shippingOptions?.[0]?.voucherNote && <p className="voucher-hint-text">{product.shippingOptions[0].voucherNote}</p>}
              </div>
            </div>

            {/* --- 4. PROTECTION GRID ROW --- */}
            {product.protectionEnabled && (
              <div className="info-grid-row no-border">
                <span className="grid-label">An Tâm Mua Sắm</span>
                <div className="grid-content">
                  <div className="protection-summary-line">
                    <FaShieldAlt className="shield-icon-red" />
                    <span>AiNetsoft Bảo Đảm: Nhận hàng, hoặc được hoàn tiền.</span>
                    <FaChevronRight className="arrow-right-sm" />
                  </div>
                </div>
              </div>
            )}

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
                    <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={product.status !== 'APPROVED'}><FaShoppingCart /> Thêm vào giỏ hàng</button>
                    <button className="buy-now-btn" onClick={() => { if(product.status === 'APPROVED'){ handleAddToCart(); navigate('/cart'); } }} disabled={product.status !== 'APPROVED'}>Mua ngay</button>
                  </div>
                </div>
              </div>
              <div className="p-grid-row"><span className="p-grid-label"></span><span className="stock-hint">{product.stock} sản phẩm có sẵn</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* BOX 3: SHOP & DETAILS */}
      <div className="container sync-container">
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

        <div className="description-section">
          <h3 className="section-title">MÔ TẢ SẢN PHẨM</h3>
          <div className="description-content">{descriptionLines.map((line, i) => <p key={i}>{line}</p>)}</div>
        </div>

        {/* --- REVIEWS SECTION [Enhanced based on image_971725.png] --- */}
        <div className="reviews-section">
          <h3 className="section-title">ĐÁNH GIÁ SẢN PHẨM</h3>
          
          <div className="review-filter-box">
            <div className="rating-overview-score">
              <div className="score-big"><span className="val">{product.averageRating || 0}</span> trên 5</div>
              <div className="stars-row-big">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} />
                ))}
              </div>
            </div>
            
            <div className="filter-buttons-grid">
              <button className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('all')}>Tất Cả</button>
              <button className={`filter-btn ${selectedFilter === '5' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('5')}>5 Sao ({reviewStats?.star5 || 0})</button>
              <button className={`filter-btn ${selectedFilter === '4' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('4')}>4 Sao ({reviewStats?.star4 || 0})</button>
              <button className={`filter-btn ${selectedFilter === '3' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('3')}>3 Sao ({reviewStats?.star3 || 0})</button>
              <button className={`filter-btn ${selectedFilter === '2' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('2')}>2 Sao ({reviewStats?.star2 || 0})</button>
              <button className={`filter-btn ${selectedFilter === '1' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('1')}>1 Sao ({reviewStats?.star1 || 0})</button>
              <button className={`filter-btn ${selectedFilter === 'images' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('images')}>Có Hình Ảnh / Video ({reviewStats?.withImages || 0})</button>
            </div>
          </div>

          <div className="reviews-list">
            {reviews.length === 0 ? (
              <div className="no-reviews-placeholder">Chưa có đánh giá nào cho bộ lọc này.</div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-card-item">
                  <div className="rev-user-avatar">
                    <img src={review.userAvatar || "/default-avatar.png"} alt="avatar" />
                  </div>
                  <div className="rev-content-side">
                    <div className="rev-username">{review.userName}</div>
                    <div className="rev-stars">
                      {[...Array(5)].map((_, i) => <FaStar key={i} size={12} color={i < review.rating ? "#ee4d2d" : "#e4e5e9"} />)}
                    </div>
                    <div className="rev-meta-line">
                      {new Date(review.createdAt).toLocaleString('vi-VN')} | Phân loại hàng: {review.variantInfo || 'Mặc định'}
                    </div>
                    
                    <div className="rev-comment-text">{review.comment}</div>
                    
                    {review.imageUrls && review.imageUrls.length > 0 && (
                      <div className="rev-media-grid">
                        {review.imageUrls.map((img, idx) => (
                          <div key={idx} className="rev-img-thumb"><img src={formatMediaUrl(img)} alt="proof" /></div>
                        ))}
                      </div>
                    )}

                    {review.sellerReply && (
                      <div className="seller-reply-container">
                        <div className="reply-label">Phản Hồi Của Người Bán</div>
                        <div className="reply-text">{review.sellerReply}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;