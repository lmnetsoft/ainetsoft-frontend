import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaShoppingCart, FaStore, FaStar, FaCommentDots, FaClipboardList, 
  FaExclamationTriangle, FaPlay, FaTimes, FaChevronLeft, FaChevronRight,
  FaStoreAlt, FaTruck, FaShieldAlt, FaHeart, FaRegHeart, FaFacebook,
  FaFacebookMessenger, FaPinterest, FaTwitter, FaInfoCircle, FaLink,
  FaFlag, FaCheckCircle, FaEdit
} from 'react-icons/fa';
import api, { 
  shareProduct, 
  reportProduct, 
  getProductReviews, 
  getReviewStats,
  submitReview // 🛠️ FIX: Added the specific helper from api.ts
} from '../../services/api'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext'; 
import './ProductDetail.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

// --- INTERFACES (Kept exactly as original) ---
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
  soldCount?: number; 
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
  userAvatar?: string; 
  imageUrls?: string[];
  videoUrl?: string; 
  variantInfo?: string; 
  sellerReply?: string; 
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
  const [reviewStats, setReviewStats] = useState<any>(null); 
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  
  const [loading, setLoading] = useState(!location.state?.productPreview);
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0); 
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  const [showShippingDrawer, setShowShippingDrawer] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [localFavoriteCount, setLocalFavoriteCount] = useState(0);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReasons, setReportReasons] = useState<string[]>([]);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // --- REVIEW SUBMISSION STATES ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // 🛠️ NEW: State to store a real order ID from user history
  const [validOrderId, setValidOrderId] = useState<string | null>(null);

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

  // --- 🛠️ STEP 1: CHECK PURCHASE HISTORY (FIXES 400 ERROR) ---
  useEffect(() => {
    const checkPurchase = async () => {
      if (localStorage.getItem('isAuthenticated') && id) {
        try {
          const res = await api.get(`/orders/eligible-to-review/${id}`);
          if (res.data && res.data.orderId) {
            setValidOrderId(res.data.orderId);
          }
        } catch (e) {
          setValidOrderId(null);
        }
      }
    };
    checkPurchase();
  }, [id]);

  useEffect(() => {
    const loadReportReasons = async () => {
      try {
        const res = await api.get('/report-reasons');
        const names = res.data.map((r: any) => r.name);
        setReportReasons(names);
        if (names.length > 0) setReportReason(names[0]); 
      } catch (err) {
        console.error("Failed to load report categories");
        setReportReasons(["Lý do khác..."]); 
      }
    };
    loadReportReasons();
  }, []);

  const handleToggleFavorite = async () => {
    if (!localStorage.getItem('isAuthenticated')) {
      setToastMessage("Vui lòng đăng nhập để lưu sản phẩm!");
      setShowToast(true);
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLocalFavoriteCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
      await api.post(`/products/${id}/favorite`);
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const userObj = JSON.parse(rawUser);
        let favorites = new Set(userObj.favoriteProductIds || []);
        if (newLikedState) { if (id) favorites.add(id); } else { if (id) favorites.delete(id); }
        userObj.favoriteProductIds = Array.from(favorites);
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      setToastMessage(newLikedState ? "Đã thêm vào yêu thích!" : "Đã xóa khỏi yêu thích");
      setShowToast(true);
    } catch (err) {
      setIsLiked(isLiked);
      setLocalFavoriteCount(localFavoriteCount);
      setToastMessage("Thao tác thất bại.");
      setShowToast(true);
    }
  };

  // --- 🛠️ REVIEW MODAL HANDLERS (RESTORING SECURITY) ---
  const handleOpenReviewModal = () => {
    if (!localStorage.getItem('isAuthenticated')) {
      setToastMessage("Vui lòng đăng nhập để gửi đánh giá!");
      setShowToast(true);
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    // Only open if they actually bought it
    if (!validOrderId) {
      setToastMessage("Bạn cần mua và hoàn thành đơn hàng để đánh giá sản phẩm này.");
      setShowToast(true);
      return;
    }
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewComment.trim() || !validOrderId) return;
    try {
      setIsSubmittingReview(true);
      // Use the clean submitReview helper and the REAL orderId
      await submitReview({
        productId: id,
        rating: userRating,
        comment: reviewComment,
        orderId: validOrderId 
      });
      setToastMessage("Đánh giá của bạn đã được ghi nhận!");
      setShowToast(true);
      setShowReviewModal(false);
      setReviewComment("");
      
      const [statsRes, revRes] = await Promise.all([
        getReviewStats(id),
        getProductReviews(id)
      ]);
      setReviewStats(statsRes.data);
      setReviews(revRes.data);
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || "Gửi đánh giá thất bại.");
      setShowToast(true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // --- SOCIAL, REPORT, MEDIA HANDLERS (Exactly as original) ---
  const handleShare = async (platform: 'facebook' | 'messenger' | 'link' | 'twitter') => {
    if (!product) return;
    const currentUrl = window.location.href;
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
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) { window.location.href = `fb-messenger://share/?link=${encodeURIComponent(currentUrl)}`; } 
      else { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank'); }
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
      setToastMessage("Báo cáo vi phạm đã được gửi.");
      setShowToast(true);
      setShowReportModal(false);
      setReportDetails('');
    } catch (error) {
      setToastMessage("Gửi báo cáo thất bại.");
      setShowToast(true);
    } finally { setIsReporting(false); }
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - 200 : scrollLeft + 200,
        behavior: 'smooth'
      });
    }
  };

  const handleNextMedia = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveMedia((prev) => (prev + 1) % totalMediaCount); };
  const handlePrevMedia = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveMedia((prev) => (prev - 1 + totalMediaCount) % totalMediaCount); };

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
    const fetchData = async () => {
      if (location.state?.productPreview) {
          const preview = location.state.productPreview;
          setProduct(preview);
          setLocalFavoriteCount(preview.favoriteCount || 0);
          setLoading(false);
          return;
      }
      try {
        setLoading(true);
        const prodRes = await api.get(`/products/${id}`);
        const productData = prodRes.data;
        setProduct(productData);
        setLocalFavoriteCount(productData.favoriteCount || 0);
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const userObj = JSON.parse(rawUser);
          setIsLiked((userObj.favoriteProductIds || []).includes(id));
        }
        const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const isAdmin = storedRoles.includes('ADMIN');
        if (productData.status !== 'APPROVED' && !isAdmin) {
          const rawUserLocal = localStorage.getItem('user');
          const userObjLocal = rawUserLocal ? JSON.parse(rawUserLocal) : {};
          if (productData.sellerId !== (userObjLocal.id || userObjLocal.userId)) {
              setToastMessage("Sản phẩm này hiện đang chờ kiểm duyệt.");
              setShowToast(true);
              setTimeout(() => navigate('/'), 2500);
              return;
          }
        }
        document.title = `${productData.name} | AiNetsoft`;
        try {
          const [statsRes, revRes] = await Promise.all([
            getReviewStats(id!),
            getProductReviews(id!)
          ]);
          setReviewStats(statsRes.data);
          setReviews(revRes.data);
        } catch (revErr) { console.warn("Review data not found yet."); }
      } catch (error) {
        setToastMessage("Không tìm thấy sản phẩm.");
        setShowToast(true);
      } finally { setLoading(false); }
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
      const cartItem = { productId: product.id, productName: product.name, productImage: (product.imageUrls?.[0] || "/placeholder.png"), price: product.price, quantity: quantity, shopName: product.shopName };
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

  // --- JSX RENDER (RESTORED ALL COMPONENTS) ---
  return (
    <div className="product-detail-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* --- REVIEW MODAL --- */}
      {showReviewModal && (
        <div className="report-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="report-modal-card" onClick={e => e.stopPropagation()}>
            <div className="report-header">
              <h3><FaEdit /> Đánh giá sản phẩm</h3>
              <button className="close-x" onClick={() => setShowReviewModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleReviewSubmit}>
              <div className="report-body">
                <label>Chất lượng sản phẩm</label>
                <div className="star-rating-selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar 
                      key={star} size={32} className="star-clickable"
                      color={(hoverRating || userRating) >= star ? "#ee4d2d" : "#e4e5e9"}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                    />
                  ))}
                  <span className="rating-text-hint">
                    {userRating === 5 ? "Tuyệt vời" : userRating === 4 ? "Tốt" : userRating === 3 ? "Bình thường" : userRating === 2 ? "Không hài lòng" : "Rất tệ"}
                  </span>
                </div>
                <label>Bình luận</label>
                <textarea 
                  placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..." 
                  value={reviewComment} onChange={e => setReviewComment(e.target.value)} 
                  rows={4} required 
                />
              </div>
              <div className="report-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowReviewModal(false)}>Hủy</button>
                <button type="submit" className="btn-confirm-report" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Đang gửi..." : "Hoàn thành"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  {reportReasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <label>Chi tiết thêm</label>
                <textarea placeholder="..." value={reportDetails} onChange={e => setReportDetails(e.target.value)} rows={4} required />
              </div>
              <div className="report-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowReportModal(false)}>Hủy</button>
                <button type="submit" className="btn-confirm-report" disabled={isReporting}>{isReporting ? "Đang gửi..." : "Gửi báo cáo"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SHIPPING DRAWER --- */}
      {showShippingDrawer && (
        <div className="shipping-drawer-overlay" onClick={() => setShowShippingDrawer(false)}>
          <div className="shipping-drawer-card" onClick={e => e.stopPropagation()}>
            <div className="drawer-header"><h3>Thông tin phí vận chuyển</h3><button className="close-btn" onClick={() => setShowShippingDrawer(false)}><FaTimes /></button></div>
            <div className="drawer-body">
              <p className="ship-to-loc-text">Vận chuyển tới: <strong>Quận 12</strong> <FaChevronRight size={10}/></p>
              <div className="drawer-ship-list">
                {product.shippingOptions?.map((opt, idx) => (
                  <div key={idx} className="drawer-ship-item">
                    <div className="drawer-ship-row-main">
                      <div className="drawer-ship-meta">
                        <span className="drawer-arrival-badge">Nhận trong <strong className="green-text">{opt.estimatedTime}</strong></span>
                        <span className="drawer-method-name">{opt.methodName}</span>
                      </div>
                      <span className="drawer-ship-price">{(opt.cost || 0).toLocaleString()}₫</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer"><button className="btn-understand" onClick={() => setShowShippingDrawer(false)}>Đã Hiểu</button></div>
          </div>
        </div>
      )}

      {/* --- MEDIA ZOOM --- */}
      {isZoomed && (
        <div className="zoom-modal-overlay" onClick={() => setIsZoomed(false)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-nav-arrow prev" onClick={handlePrevMedia}><FaChevronLeft size={24} /></button>
            <button className="zoom-close-btn" onClick={() => setIsZoomed(false)}><FaTimes /></button>
            {hasVideo && activeMedia === images.length ? (
                <video ref={zoomVideoRef} autoPlay controls className="zoom-media-main"><source src={formatMediaUrl(product.videoUrl!)} type="video/mp4" /></video>
            ) : (
                <img src={formatMediaUrl(images[activeMedia])} alt="Zoom" className="zoom-media-main" />
            )}
            <button className="zoom-nav-arrow next" onClick={handleNextMedia}><FaChevronRight size={24} /></button>
          </div>
        </div>
      )}

      {/* BOX 1: BANNER */}
      {product.status !== 'APPROVED' && (
        <div className="container sync-container">
          <div className="preview-mode-banner"><FaExclamationTriangle size={20} /> <div className="banner-text"><strong>BẢN XEM TRƯỚC:</strong> Sản phẩm chưa phê duyệt.</div></div>
        </div>
      )}

      {/* BOX 2: PRODUCT INFO */}
      <div className="container sync-container">
        <div className="detail-container">
          <div className="detail-media-section">
            <div className="main-display" onClick={() => setIsZoomed(true)}>
              {hasVideo && activeMedia === images.length ? (
                  <video ref={videoRef} muted loop playsInline controls className="main-video"><source src={formatMediaUrl(product.videoUrl!)} type="video/mp4" /></video>
              ) : (
                  <img src={formatMediaUrl(images[activeMedia])} alt={product.name} />
              )}
              <div className="zoom-badge-hint">🔍 Click để xem lớn</div>
            </div>
            
            <div className="thumbnail-navigation-container">
              <button className="thumb-scroll-btn left" onClick={() => scrollThumbnails('left')}><FaChevronLeft /></button>
              <div className="thumbnail-list" ref={scrollRef}>
                {images.map((img, idx) => (
                  <div key={idx} className={`thumb-item ${activeMedia === idx ? 'active' : ''}`} onClick={() => setActiveMedia(idx)}><img src={formatMediaUrl(img)} alt="thumb" /></div>
                ))}
                {hasVideo && (
                  <div className={`thumb-item video-thumb ${activeMedia === images.length ? 'active' : ''}`} onClick={() => setActiveMedia(images.length)}>
                    <video className="v-thumb-video-preview" muted><source src={`${formatMediaUrl(product.videoUrl!)}#t=0.5`} type="video/mp4" /></video>
                    <div className="play-badge"><FaPlay /></div>
                  </div>
                )}
              </div>
              <button className="thumb-scroll-btn right" onClick={() => scrollThumbnails('right')}><FaChevronRight /></button>
            </div>

            {product.allowSharing && (
              <div className="social-interaction-block">
                <div className="share-section">
                  <span>Chia sẻ:</span>
                  <button className="share-icon-btn messenger" onClick={() => handleShare('messenger')}><FaFacebookMessenger /></button>
                  <button className="share-icon-btn facebook" onClick={() => handleShare('facebook')}><FaFacebook /></button>
                  <button className="share-icon-btn twitter" onClick={() => handleShare('twitter')}><FaTwitter /></button>
                  <button className="share-icon-btn link" onClick={() => handleShare('link')}><FaLink /></button>
                </div>
                <div className="interaction-divider"></div>
                <div className="like-section" onClick={handleToggleFavorite}>
                  {isLiked ? <FaHeart className="heart-icon active" /> : <FaRegHeart className="heart-icon" />}
                  <span className="like-text">Đã thích ({localFavoriteCount})</span>
                </div>
              </div>
            )}
          </div>

          <div className="detail-info-section">
            <div className="report-link-row"><button className="btn-report-action" onClick={() => setShowReportModal(true)}><FaFlag /> Báo Vi Phạm</button></div>
            <h1 className="product-title">{product.name}</h1>
            <div className="product-rating-overview">
              <div className="star-row">{[...Array(5)].map((_, i) => <FaStar key={i} color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} />)}</div>
              <span className="rating-value">{product.averageRating || 0}</span>
              <span className="divider">|</span>
              <span className="review-count">{product.reviewCount || 0} Đánh giá</span>
              <span className="divider">|</span>
              <span className="sold-count">Đã bán {product.soldCount || 0}</span>
            </div>
            <div className="price-display-box"><span className="currency">₫</span><span className="amount">{(product.price || 0).toLocaleString()}</span></div>

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

      <div className="container sync-container">
        <div className="shop-card">
          <FaStore className="shop-icon" />
          <div className="shop-name-box">
            <h3>{product.shopName}</h3>
            <div className="shop-actions">
              <button className="chat-now-btn" onClick={handleChatWithSeller}><FaCommentDots /> Chat ngay</button>
              <button className="view-shop-btn" onClick={() => navigate(`/shop/${product.sellerId || product.id}`)}><FaStoreAlt /> Xem Shop</button>
            </div>
          </div>
        </div>

        <div className="description-section">
          <h3 className="section-title">MÔ TẢ SẢN PHẨM</h3>
          <div className="description-content">{descriptionLines.map((line, i) => <p key={i}>{line}</p>)}</div>
        </div>

        <div className="reviews-section">
          <div className="reviews-header-row">
            <h3 className="section-title">ĐÁNH GIÁ SẢN PHẨM</h3>
            <button className="btn-write-review" onClick={handleOpenReviewModal}>
              <FaEdit /> Viết đánh giá
            </button>
          </div>
          
          <div className="review-filter-box">
            <div className="rating-overview-score">
              <div className="score-big"><span className="val">{product.averageRating || 0}</span> trên 5</div>
              <div className="stars-row-big">{[...Array(5)].map((_, i) => (<FaStar key={i} color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} />))}</div>
            </div>
            
            <div className="filter-buttons-grid">
              <button className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('all')}>Tất Cả</button>
              {[5, 4, 3, 2, 1].map(s => <button key={s} className={`filter-btn ${selectedFilter === String(s) ? 'active' : ''}`} onClick={() => fetchFilteredReviews(String(s))}>{s} Sao ({reviewStats?.[`star${s}`] || 0})</button>)}
              <button className={`filter-btn ${selectedFilter === 'images' ? 'active' : ''}`} onClick={() => fetchFilteredReviews('images')}>Có Hình Ảnh / Video ({reviewStats?.withImages || 0})</button>
            </div>
          </div>

          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.id} className="review-card-item">
                <div className="rev-user-avatar"><img src={review.userAvatar || "/default-avatar.png"} alt="avatar" /></div>
                <div className="rev-content-side">
                  <div className="rev-username">{review.userName}</div>
                  <div className="rev-stars">{[...Array(5)].map((_, i) => <FaStar key={i} size={12} color={i < review.rating ? "#ee4d2d" : "#e4e5e9"} />)}</div>
                  <div className="rev-meta-line">{new Date(review.createdAt).toLocaleString('vi-VN')}</div>
                  <div className="rev-comment-text">{review.comment}</div>
                  {review.sellerReply && <div className="seller-reply-container"><div className="reply-text">{review.sellerReply}</div></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;