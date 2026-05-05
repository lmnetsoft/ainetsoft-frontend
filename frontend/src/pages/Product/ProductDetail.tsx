import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaShoppingCart, FaStore, FaStar, FaCommentDots, FaExclamationTriangle, 
  FaPlay, FaTimes, FaChevronLeft, FaChevronRight, FaStoreAlt, 
  FaHeart, FaRegHeart, FaFacebook, FaFacebookMessenger, FaTwitter, FaLink,
  FaFlag, FaEdit, FaCamera, FaVideo
} from 'react-icons/fa';
import api, { 
  shareProduct, 
  reportProduct, 
  getProductReviews, 
  getReviewStats,
  submitReview 
} from '../../services/api'; 
import { getUserProfile } from '../../services/authService';
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext'; 
import './ProductDetail.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

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
  sellerSlug?: string; 
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
  const [reviewStats, setReviewStats] = useState<any>({
    total: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0, withImages: 0
  }); 
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(!location.state?.productPreview);
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0); 
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [zoomedReviewMedia, setZoomedReviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [showShippingDrawer, setShowShippingDrawer] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [localFavoriteCount, setLocalFavoriteCount] = useState(0);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReasons, setReportReasons] = useState<string[]>([]);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewVideo, setReviewVideo] = useState<File | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [validOrderId, setValidOrderId] = useState<string | null>(null);
  const [shopVouchers, setShopVouchers] = useState<any[]>([]);

  const bitnamilegacy = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null' || url === '') return "/placeholder.png";
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url; 
    let cleanPath = url.startsWith('/') ? url : `/${url}`;
    if (!cleanPath.startsWith('/api/')) cleanPath = `/api${cleanPath}`;
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
    } catch (err) {}
  };

  useEffect(() => {
    const checkPurchase = async () => {
      if (localStorage.getItem('isAuthenticated') && id) {
        try {
          const res = await api.get(`/orders/eligible-to-review/${id}`);
          if (res.data && res.data.orderId) setValidOrderId(res.data.orderId);
        } catch (e) {
          setValidOrderId(null);
        }
      }
    };
    checkPurchase();
  }, [id]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('review') === 'true' && validOrderId) setShowReviewModal(true);
  }, [validOrderId]);

  useEffect(() => {
    const loadReportReasons = async () => {
      try {
        const res = await api.get('/report-reasons');
        const names = res.data.map((r: any) => r.name);
        setReportReasons(names);
        if (names.length > 0) setReportReason(names[0]); 
      } catch (err) {
        setReportReasons(["Lý do khác..."]); 
      }
    };
    loadReportReasons();
  }, []);

  useEffect(() => {
    if (product?.sellerId) {
      api.get(`/vouchers/public/shop/${product.sellerId}`)
         .then(res => setShopVouchers(res.data || []))
         .catch(() => {});
    }
  }, [product?.sellerId]);

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

  const handleSaveVoucher = async (voucherId: string) => {
    if (!localStorage.getItem('isAuthenticated')) {
       setToastMessage("Vui lòng đăng nhập để lấy mã giảm giá!");
       setShowToast(true);
       setTimeout(() => navigate('/login'), 1500);
       return;
    }
    try {
       await api.post(`/wallets/me/vouchers/${voucherId}`);
       setToastMessage("Đã lưu mã giảm giá vào Kho Voucher!");
       setShowToast(true);
       setShopVouchers(prev => prev.filter(v => v.id !== voucherId)); 
    } catch (e: any) {
       setToastMessage(e.response?.data?.message || "Lỗi khi lưu mã giảm giá.");
       setShowToast(true);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (reviewImages.length + files.length > 5) {
          setToastMessage("Chỉ được tải lên tối đa 5 hình ảnh!");
          setShowToast(true);
          return;
      }
      setReviewImages(prev => [...prev, ...files]);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 20 * 1024 * 1024) {
           setToastMessage("Video không được vượt quá 20MB!");
           setShowToast(true);
           return;
      }
      setReviewVideo(e.target.files[0]);
    }
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenReviewModal = () => {
    if (!localStorage.getItem('isAuthenticated')) {
      setToastMessage("Vui lòng đăng nhập để gửi đánh giá!");
      setShowToast(true);
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
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
      const formData = new FormData();
      formData.append('productId', id);
      formData.append('rating', userRating.toString());
      formData.append('comment', reviewComment);
      formData.append('orderId', validOrderId);
      
      reviewImages.forEach(file => formData.append('images', file));
      if (reviewVideo) formData.append('video', reviewVideo);

      await submitReview(formData);
      
      setToastMessage("Đánh giá của bạn đã được ghi nhận!");
      setShowToast(true);
      setShowReviewModal(false);
      setReviewComment("");
      setReviewImages([]);
      setReviewVideo(null);
      
      window.history.replaceState({}, '', window.location.pathname);
      const [statsRes, revRes] = await Promise.all([getReviewStats(id), getProductReviews(id)]);
      setReviewStats(statsRes.data);
      setReviews(revRes.data);
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || "Gửi đánh giá thất bại.");
      setShowToast(true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = async (platform: 'facebook' | 'messenger' | 'link' | 'twitter') => {
    if (!product) return;
    const currentUrl = window.location.href;
    try { await shareProduct(product.id); } catch (e) {}
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
    if (activeMedia === images.length && videoRef.current) videoRef.current.play().catch(() => {});
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
          const relRes = await api.get('/products');
          const allProds = Array.isArray(relRes.data) ? relRes.data : (relRes.data.content || []);
          setRelatedProducts(allProds.filter((p: any) => p.id !== id).slice(0, 6));
        } catch (err) {}

        try {
          const [statsRes, revRes] = await Promise.all([getReviewStats(id!), getProductReviews(id!)]);
          setReviewStats(statsRes.data || { total: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0, withImages: 0 });
          setReviews(revRes.data);
        } catch (revErr) {}
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
    if (!localStorage.getItem('isAuthenticated')) { navigate('/login'); return false; }
    if (!product) return false;
    
    try {
      setIsAddingToCart(true); 

      const profile = await getUserProfile();
      let currentCart = profile.cart || [];

      const existingItemIndex = currentCart.findIndex((item: any) => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        currentCart[existingItemIndex].quantity += quantity;
      } else {
        currentCart.push({
          productId: product.id, 
          productName: product.name, 
          productImage: (product.imageUrls?.[0] || "/placeholder.png"), 
          price: product.price, 
          quantity: quantity, 
          shopName: product.shopName 
        });
      }
      
      await api.post('/auth/sync-cart', { items: currentCart }); 
      
      setToastMessage("Đã thêm vào giỏ hàng thành công!"); 
      setShowToast(true);
      
      window.dispatchEvent(new Event('cartUpdate')); 
      
      return true; 
      
    } catch (error) {
      setToastMessage("Lỗi khi thêm vào giỏ hàng.");
      setShowToast(true);
      return false;
    } finally {
      setIsAddingToCart(false); 
    }
  };

  if (loading) {
      return (
        <div className="page-loading-container">
          <div className="custom-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }
    if (!product) return <div className="detail-error">Sản phẩm không tồn tại.</div>;

  const descriptionLines = (product.description || "").split('\n');

  return (
    <div className="product-detail-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {zoomedReviewMedia && (
        <div className="zoom-modal-overlay" onClick={() => setZoomedReviewMedia(null)} style={{ zIndex: 9999 }}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={() => setZoomedReviewMedia(null)}><FaTimes /></button>
            {zoomedReviewMedia.type === 'video' ? (
              <video autoPlay controls className="zoom-media-main" style={{ maxHeight: '85vh', maxWidth: '90vw' }}>
                <source src={zoomedReviewMedia.url} type="video/mp4" />
              </video>
            ) : (
              <img src={zoomedReviewMedia.url} alt="Zoomed" className="zoom-media-main" style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="report-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="report-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
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
                  placeholder="Hãy chia sẻ cảm nhận của bạn..." 
                  value={reviewComment} onChange={e => setReviewComment(e.target.value)} 
                  rows={4} required 
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '15px' }}
                />

                <label>Thêm hình ảnh / Video</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>
                    <FaCamera size={18} /> Thêm Hình Ảnh
                    <input type="file" multiple accept="image/*" hidden onChange={handleImageSelect} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>
                    <FaVideo size={18} /> Thêm Video
                    <input type="file" accept="video/*" hidden onChange={handleVideoSelect} />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {reviewImages.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #eee' }}>
                      <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', padding: '4px', cursor: 'pointer' }}><FaTimes size={10} /></button>
                    </div>
                  ))}
                  {reviewVideo && (
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #eee', background: '#000' }}>
                      <video src={URL.createObjectURL(reviewVideo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff' }}><FaPlay /></div>
                      <button type="button" onClick={() => setReviewVideo(null)} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', padding: '4px', cursor: 'pointer' }}><FaTimes size={10} /></button>
                    </div>
                  )}
                </div>

              </div>
              <div className="report-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowReviewModal(false)}>Hủy</button>
                <button type="submit" className="btn-confirm-report" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Đang xử lý tải lên..." : "Hoàn thành Đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {isZoomed && (
        <div className="zoom-modal-overlay" onClick={() => setIsZoomed(false)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-nav-arrow prev" onClick={handlePrevMedia}><FaChevronLeft size={24} /></button>
            <button className="zoom-close-btn" onClick={() => setIsZoomed(false)}><FaTimes /></button>
            {hasVideo && activeMedia === images.length ? (
                <video ref={zoomVideoRef} autoPlay controls className="zoom-media-main"><source src={bitnamilegacy(product.videoUrl!)} type="video/mp4" /></video>
            ) : (
                <img src={bitnamilegacy(images[activeMedia])} alt="Zoom" className="zoom-media-main" />
            )}
            <button className="zoom-nav-arrow next" onClick={handleNextMedia}><FaChevronRight size={24} /></button>
          </div>
        </div>
      )}

      {product.status !== 'APPROVED' && (
        <div className="container sync-container">
          <div className="preview-mode-banner"><FaExclamationTriangle size={20} /> <div className="banner-text"><strong>BẢN XEM TRƯỚC:</strong> Sản phẩm chưa phê duyệt.</div></div>
        </div>
      )}

      <div className="container sync-container">
        <div className="detail-container">
          <div className="detail-media-section">
            <div className="main-display" onClick={() => setIsZoomed(true)}>
              {hasVideo && activeMedia === images.length ? (
                  <video ref={videoRef} muted loop playsInline controls className="main-video"><source src={bitnamilegacy(product.videoUrl!)} type="video/mp4" /></video>
              ) : (
                  <img src={bitnamilegacy(images[activeMedia])} alt={product.name} />
              )}
              <div className="zoom-badge-hint">🔍 Click để xem lớn</div>
            </div>
            
            <div className="thumbnail-navigation-container">
              <button className="thumb-scroll-btn left" onClick={() => scrollThumbnails('left')}><FaChevronLeft /></button>
              <div className="thumbnail-list" ref={scrollRef}>
                {images.map((img, idx) => (
                  <div key={idx} className={`thumb-item ${activeMedia === idx ? 'active' : ''}`} onClick={() => setActiveMedia(idx)}><img src={bitnamilegacy(img)} alt="thumb" /></div>
                ))}
                {hasVideo && (
                  <div className={`thumb-item video-thumb ${activeMedia === images.length ? 'active' : ''}`} onClick={() => setActiveMedia(images.length)}>
                    <video className="v-thumb-video-preview" muted><source src={`${bitnamilegacy(product.videoUrl!)}#t=0.5`} type="video/mp4" /></video>
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
              <div className="star-row">
                  <span className="rating-value">{product.averageRating || 0}</span>
                  {[...Array(5)].map((_, i) => <FaStar key={i} color={i < Math.floor(product.averageRating || 0) ? "#ee4d2d" : "#e4e5e9"} size={16} />)}
              </div>
              <span className="divider">|</span>
              <span className="review-count">{product.reviewCount || 0} <span className="text-hint">Đánh giá</span></span>
              <span className="divider">|</span>
              <span className="sold-count">{product.soldCount || 0} <span className="text-hint">Đã bán</span></span>
            </div>
            
            <div className="price-display-box"><span className="currency">₫</span><span className="amount">{(product.price || 0).toLocaleString()}</span></div>

            {shopVouchers.length > 0 && (
                <div className="product-vouchers-section">
                    <span className="vouchers-label">Mã Giảm Giá Của Shop</span>
                    <div className="vouchers-list-horizontal">
                        {shopVouchers.map(v => (
                            <div key={v.id} className="mini-voucher-ticket">
                                <div className="mvt-left">
                                    <span className="mvt-value">
                                        {v.discountType === 'PERCENTAGE' ? `Giảm ${v.discountValue}%` : `Giảm ${(v.discountValue / 1000)}k`}
                                    </span>
                                    <span className="mvt-min">Đơn tối thiểu {(v.minOrderValue / 1000)}k</span>
                                </div>
                                <div className="mvt-right" onClick={() => handleSaveVoucher(v.id)}>Lưu</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="purchase-grid-system">
              
              <div className="p-grid-row">
                <span className="p-grid-label">Số lượng</span>
                <div className="p-grid-content horizontal-actions">
                  <div className="qty-controls">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <input type="number" value={quantity} readOnly />
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                  </div>
                  <span className="stock-hint">{product.stock} sản phẩm có sẵn</span>
                </div>
              </div>

              <div className="p-grid-row action-row">
                <span className="p-grid-label"></span>
                <div className="action-button-group">
                  <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={product.status !== 'APPROVED' || isAddingToCart}>
                    <FaShoppingCart /> {isAddingToCart ? "Đang xử lý..." : "Thêm vào giỏ hàng"}
                  </button>
                  <button className="buy-now-btn" 
                    onClick={async () => { 
                      if(product.status === 'APPROVED'){ 
                        const success = await handleAddToCart(); 
                        if(success) navigate('/cart'); 
                      } 
                    }} 
                    disabled={product.status !== 'APPROVED' || isAddingToCart}>
                    Mua ngay
                  </button>
                </div>
              </div>

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
              <button className="view-shop-btn" onClick={() => navigate(`/shop/${product.sellerSlug || product.sellerId}`)}><FaStoreAlt /> Xem Shop</button>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h3 className="section-title">SẢN PHẨM TƯƠNG TỰ</h3>
            <div className="related-products-grid">
              {relatedProducts.map(p => (
                <div key={p.id} className="related-product-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={bitnamilegacy(p.imageUrls?.[0])} alt={p.name} />
                  <div className="rp-info">
                    <p className="rp-name">{p.name}</p>
                    <p className="rp-price">₫{(p.price || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <div className="rev-user-avatar">
                  <img 
                    src={review.userAvatar ? bitnamilegacy(review.userAvatar) : "https://ui-avatars.com/api/?name=" + encodeURIComponent(review.userName || "U") + "&background=random"} 
                    alt="avatar" 
                    onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(review.userName || "U") + "&background=random"; }}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div className="rev-content-side">
                  <div className="rev-username">{review.userName}</div>
                  <div className="rev-stars">{[...Array(5)].map((_, i) => <FaStar key={i} size={12} color={i < review.rating ? "#ee4d2d" : "#e4e5e9"} />)}</div>
                  <div className="rev-meta-line">{new Date(review.createdAt).toLocaleString('vi-VN')}</div>
                  <div className="rev-comment-text">{review.comment}</div>
                  
                  {(review.imageUrls?.length || review.videoUrl) && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {review.imageUrls?.map((img, idx) => (
                        <div key={idx} onClick={() => setZoomedReviewMedia({ url: bitnamilegacy(img), type: 'image' })} style={{ width: '70px', height: '70px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                          <img src={bitnamilegacy(img)} alt="review media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      {review.videoUrl && (
                        <div onClick={() => setZoomedReviewMedia({ url: bitnamilegacy(review.videoUrl), type: 'video' })} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#000', cursor: 'pointer' }}>
                          <video src={bitnamilegacy(review.videoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontSize: '20px' }}><FaPlay /></div>
                        </div>
                      )}
                    </div>
                  )}
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