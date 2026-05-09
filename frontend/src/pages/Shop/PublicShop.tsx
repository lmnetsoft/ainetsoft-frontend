import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStore, FaStar, FaBox, FaMapMarkerAlt, FaCommentDots, FaTicketAlt } from 'react-icons/fa';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import './PublicShop.css';

import logoWithoutText from '../../assets/images/logo_without_text.png';

const PublicShop = () => {
  const { identifier, shopSlug } = useParams(); 
  const navigate = useNavigate();
  
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [shopVouchers, setShopVouchers] = useState<any[]>([]);
  const [savingVoucherId, setSavingVoucherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

  const bitnamilegacy = (path: string | null | undefined) => {
    if (!path || path === "DEFAULT_LOGO" || path.trim() === "") return logoWithoutText; 
    if (path.startsWith('data:image') || path.startsWith('http') || path.startsWith('blob:')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);

        const target = identifier || shopSlug;
        if (!target) throw new Error("Không xác định được cửa hàng.");

        const res = await api.get(`/products/public/shop/${target}`);
        const { seller, products } = res.data;

        const info = seller.shopProfile ? { 
            ...seller.shopProfile, 
            id: seller.id, 
            fullName: seller.fullName 
        } : { 
            ...seller, 
            id: seller.id 
        };

        setShopInfo(info);
        setProducts(products || []);
        document.title = `${info.shopName || info.fullName || 'Cửa hàng'} | AiNetsoft`;

        if (info.id) {
          api.get(`/vouchers/public/shop/${info.id}`)
             .then(vRes => setShopVouchers(vRes.data || []))
             .catch(err => console.log("Không thể tải mã giảm giá."));
        }

      } catch (err: any) {
        if (err.response?.status === 404) {
            setError("Cửa hàng không tồn tại hoặc đã đổi địa chỉ truy cập.");
        } else {
            setError(err.message || "Không thể tải thông tin cửa hàng lúc này.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
    window.scrollTo(0, 0);
  }, [identifier, shopSlug]);

  const handleSaveVoucher = async (voucherId: string) => {
    if (!localStorage.getItem('isAuthenticated')) {
       setToastMessage("Vui lòng đăng nhập để lưu mã giảm giá!");
       setShowToast(true);
       setTimeout(() => navigate('/login'), 1500);
       return;
    }
    try {
       setSavingVoucherId(voucherId);
       await api.post(`/vouchers/save/${voucherId}`);
       setToastMessage("🎉 Đã lưu mã giảm giá vào Kho Voucher!");
       setShowToast(true);
       
       setShopVouchers(prev => prev.filter(v => v.id !== voucherId)); 
    } catch (e: any) {
       setToastMessage(e.response?.data?.message || "Lỗi khi lưu mã giảm giá.");
       setShowToast(true);
    } finally {
       setSavingVoucherId(null);
    }
  };

  if (loading) return (
    <div className="container" style={{padding: '100px 0', textAlign: 'center'}}>
        <div className="tab-loading-spinner">Đang tải gian hàng...</div>
    </div>
  );

  if (error) return (
    <div className="container" style={{padding: '100px 0', textAlign: 'center'}}>
        <h2>Rất tiếc!</h2>
        <p style={{color: 'var(--text-muted)', margin: '15px 0'}}>{error}</p>
        <button onClick={() => navigate('/')} className="save-btn" style={{marginTop: '20px'}}>Quay lại trang chủ</button>
    </div>
  );

  // 🚀 LOGIC QUAN TRỌNG: Chỉ kích hoạt cuộn ngang (Marquee) khi có TỪ 4 VOUCHER trở lên
  const isMarquee = shopVouchers.length >= 4;
  // Để tạo hiệu ứng cuộn mượt mà vô tận, ta phải nhân đôi mảng dữ liệu
  const displayVouchers = isMarquee ? [...shopVouchers, ...shopVouchers] : shopVouchers;

  return (
    <div className="public-shop-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="shop-header-banner">
        <div className="container shop-header-container">
          <div className="shop-profile-card">
            <div className="shop-logo-wrapper">
              <img 
                src={bitnamilegacy(shopInfo?.shopLogoUrl)} 
                alt="Shop Logo" 
                className="shop-logo-img"
                onError={(e) => { e.currentTarget.src = logoWithoutText; }}
              />
            </div>
            <div className="shop-details-main">
              <div className="shop-title-row">
                <h1>{shopInfo?.shopName || shopInfo?.fullName || "Tên Cửa Hàng"}</h1>
                <button 
                  className="btn-chat-shop" 
                  onClick={() => navigate(`/chat/${shopInfo?.id}`)}
                >
                  <FaCommentDots /> Chat với Shop
                </button>
              </div>
              <p className="shop-bio">
                {shopInfo?.shopDescription || shopInfo?.shopBio || "Chào mừng bạn đến với gian hàng chính hãng của chúng tôi."}
              </p>
              
              <div className="shop-stats-badges">
                <span className="stat-badge"><FaStar className="star-icon" /> {shopInfo?.rating || '5.0'} / 5</span>
                <span className="stat-badge"><FaBox /> {products.length} Sản phẩm</span>
                {shopInfo?.shopAddress && (
                  <span className="stat-badge"><FaMapMarkerAlt /> {shopInfo.shopAddress}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container shop-content-section">
        
        {shopVouchers.length > 0 && (
          <div className="shop-vouchers-container">
            <h3 className="shop-vouchers-header">
              <FaTicketAlt /> Ưu Đãi Của Cửa Hàng
            </h3>
            {/* Vùng Viewport cắt những phần thừa */}
            <div className="shop-vouchers-marquee-viewport">
                {/* Thanh Track chứa nội dung, áp dụng class marquee-active nếu có nhiều voucher */}
                <div className={`shop-vouchers-track ${isMarquee ? 'marquee-active' : ''}`}>
                  {displayVouchers.map((v, index) => (
                    // Cần cộng thêm index vào key vì mảng bị nhân đôi
                    <div key={`${v.id}-${index}`} className="shopee-ticket-wrapper">
                      <div className="ticket-left-section">
                        <div className="ticket-title">
                          {v.discountType === 'PERCENTAGE' ? `Giảm ${v.discountValue}%` : `Giảm ${(v.discountValue / 1000)}k`}
                        </div>
                        <div className="ticket-desc">Đơn tối thiểu {(v.minOrderValue / 1000)}k</div>
                      </div>
                      <div className="ticket-right-section">
                         <button 
                            className="ticket-save-btn"
                            onClick={() => handleSaveVoucher(v.id)}
                            disabled={savingVoucherId === v.id}
                         >
                            {savingVoucherId === v.id ? 'Đang lưu' : 'Lưu Mã'}
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        )}

        <div className="section-title-row">
          <h3><FaStore /> TẤT CẢ SẢN PHẨM</h3>
          <hr />
        </div>

        {products.length === 0 ? (
          <div className="empty-shop-state">
            <FaBox className="empty-icon" />
            <p>Hiện tại cửa hàng chưa có sản phẩm nào đang bán.</p>
          </div>
        ) : (
          <div className="shop-products-grid">
            {products.map(product => (
              <div key={product.id} className="shop-product-card" onClick={() => navigate(`/product/${product.id}`)}>
                <div className="prod-img-box">
                  <img 
                    src={bitnamilegacy(product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : null)} 
                    alt={product.name} 
                    onError={(e) => { e.currentTarget.src = logoWithoutText; }}
                  />
                </div>
                <div className="prod-info-box">
                  <h4 className="prod-name">{product.name}</h4>
                  <div className="prod-price-row">
                    <span className="currency">₫</span>
                    <span className="amount">{product.price?.toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="prod-footer">
                    <span className="sold-count">Đã bán {product.soldCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicShop;
