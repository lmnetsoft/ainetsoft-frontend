import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStore, FaStar, FaBox, FaMapMarkerAlt, FaCommentDots, FaTicketAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
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

  const API_BASE_URL = "http://localhost:8080";

  const getFullImageUrl = (path: string | null | undefined) => {
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

        // 🚀 FETCH VOUCHERS CHO SHOP NÀY
        if (info.id) {
          api.get(`/vouchers/public/shop/${info.id}`)
             .then(vRes => setShopVouchers(vRes.data || []))
             .catch(err => console.log("Không thể tải mã giảm giá."));
        }

      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu cửa hàng:", err);
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

  // 🚀 LƯU VOUCHER VÀO VÍ TRỰC TIẾP TỪ TRANG SHOP
  const handleSaveVoucher = async (voucherId: string) => {
    if (!localStorage.getItem('isAuthenticated')) {
       toast.error("Vui lòng đăng nhập để lưu mã giảm giá!");
       setTimeout(() => navigate('/login'), 1500);
       return;
    }
    try {
       setSavingVoucherId(voucherId);
       await api.post(`/vouchers/save/${voucherId}`);
       toast.success("Đã lưu mã giảm giá vào Kho Voucher!");
       setShopVouchers(prev => prev.filter(v => v.id !== voucherId)); 
    } catch (e: any) {
       toast.error(e.response?.data?.message || "Lỗi khi lưu mã giảm giá.");
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

  return (
    <div className="public-shop-wrapper">
      <div className="shop-header-banner">
        <div className="container shop-header-container">
          <div className="shop-profile-card">
            <div className="shop-logo-wrapper">
              <img 
                src={getFullImageUrl(shopInfo?.shopLogoUrl)} 
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
        
        {/* 🚀 HIỂN THỊ DANH SÁCH MÃ GIẢM GIÁ CỦA SHOP */}
        {shopVouchers.length > 0 && (
          <div className="shop-vouchers-container" style={{ marginBottom: '30px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', color: '#ee4d2d', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTicketAlt /> Ưu Đãi Của Cửa Hàng
            </h3>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              {shopVouchers.map(v => (
                <div key={v.id} style={{ minWidth: '280px', border: '1px solid #f8d0d3', borderRadius: '4px', display: 'flex', background: '#fffafb' }}>
                  <div style={{ padding: '15px', flex: 1, borderRight: '1px dashed #f8d0d3' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ee4d2d' }}>
                      {v.discountType === 'PERCENTAGE' ? `Giảm ${v.discountValue}%` : `Giảm ${(v.discountValue / 1000)}k`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#757575', marginTop: '4px' }}>Đơn tối thiểu {(v.minOrderValue / 1000)}k</div>
                  </div>
                  <div 
                    onClick={() => handleSaveVoucher(v.id)}
                    style={{ padding: '0 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', background: '#ee4d2d', fontWeight: 'bold', fontSize: '14px' }}
                  >
                    {savingVoucherId === v.id ? '...' : 'Lưu Mã'}
                  </div>
                </div>
              ))}
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
                    src={getFullImageUrl(product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : null)} 
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