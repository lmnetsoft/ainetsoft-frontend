import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStore, FaStar, FaBox, FaMapMarkerAlt, FaCommentDots } from 'react-icons/fa';
import api from '../../services/api';
import { getUserProfileBySlug, getUserProfile } from '../../services/authService'; // NEW: Import Slug lookup
import './PublicShop.css';

const PublicShop = () => {
  // identifier comes from /shop/:identifier, shopSlug comes from /:shopSlug
  const { identifier, shopSlug } = useParams(); 
  const navigate = useNavigate();
  
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);

        let profileData: any = null;
        const target = identifier || shopSlug;

        // 1. Determine Fetch Strategy
        if (!target) {
            // Case: /my-shop (Self-view)
            profileData = await getUserProfile();
        } else if (target.length === 24 && /^[0-9a-fA-F]+$/.test(target)) {
            // Case: Old ID-based URL (24-char hex)
            const res = await api.get(`/auth/shop-info/${target}`);
            profileData = res.data;
        } else {
            // Case: Professional Nice URL (Slug)
            profileData = await getUserProfileBySlug(target);
        }

        if (!profileData) throw new Error("Không tìm thấy thông tin cửa hàng.");

        // 2. Map and Set Shop Info
        // Note: Backend profile might return nested shopProfile or flattened response
        const info = profileData.shopProfile ? { 
            ...profileData.shopProfile, 
            id: profileData.id, 
            fullName: profileData.fullName 
        } : profileData;

        setShopInfo(info);

        // 3. Fetch Products using the actual User ID found in the profile
        const prodRes = await api.get(`/products/public/seller/${profileData.id}`);
        setProducts(prodRes.data);

        // Update Page Title
        document.title = `${info.shopName || 'Cửa hàng'} | AiNetsoft`;

      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu cửa hàng:", err);
        setError(err.message || "Cửa hàng này không tồn tại.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
    window.scrollTo(0, 0);
  }, [identifier, shopSlug]);

  if (loading) return <div className="loading-shop">Đang tải gian hàng...</div>;

  if (error) return (
    <div className="container" style={{padding: '100px 0', textAlign: 'center'}}>
        <h2>{error}</h2>
        <button onClick={() => navigate('/')} className="save-btn" style={{marginTop: '20px'}}>Về trang chủ</button>
    </div>
  );

  return (
    <div className="public-shop-wrapper">
      {/* 1. SHOP BRANDING BANNER */}
      <div className="shop-header-banner">
        <div className="container shop-header-container">
          <div className="shop-profile-card">
            <div className="shop-logo-wrapper">
              <img 
                src={shopInfo?.shopLogoUrl || "/logo_without_text.png"} 
                alt="Shop Logo" 
                className="shop-logo-img"
                onError={(e) => { e.currentTarget.src = "/logo_without_text.png"; }}
              />
            </div>
            <div className="shop-details-main">
              <div className="shop-title-row">
                <h1>{shopInfo?.shopName || shopInfo?.fullName || "Tên Cửa Hàng"}</h1>
                {/* Chat with Shop Button (Uses verified User ID) */}
                <button 
                  className="btn-chat-shop" 
                  onClick={() => navigate(`/chat/${shopInfo?.id}`)}
                >
                  <FaCommentDots /> Chat với Shop
                </button>
              </div>
              <p className="shop-bio">{shopInfo?.shopDescription || shopInfo?.shopBio || "Chào mừng bạn đến với gian hàng chính hãng của chúng tôi."}</p>
              
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

      {/* 2. PRODUCT GRID SECTION */}
      <div className="container shop-content-section">
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
                  <img src={product.images && product.images[0] ? product.images[0] : "/logo_without_text.png"} alt={product.name} />
                </div>
                <div className="prod-info-box">
                  <h4 className="prod-name">{product.name}</h4>
                  <div className="prod-price-row">
                    <span className="currency">₫</span>
                    <span className="amount">{product.price.toLocaleString('vi-VN')}</span>
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