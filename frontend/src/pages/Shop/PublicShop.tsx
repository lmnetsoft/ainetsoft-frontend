import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaStore, FaStar, FaBox, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../../services/api';
import './PublicShop.css';

const PublicShop = () => {
  const { id } = useParams(); // Extract seller ID from URL for /shop/:id
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        // If 'id' is missing, it's the current user's shop (/my-shop)
        const targetId = id || 'me'; 
        
        // Fetch both shop profile details and their public products
        const [infoRes, prodRes] = await Promise.all([
          api.get(`/auth/shop-info/${targetId}`),
          api.get(`/products/public/seller/${targetId}`)
        ]);

        setShopInfo(infoRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu cửa hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div className="loading-shop">Đang tải gian hàng...</div>;

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
              />
            </div>
            <div className="shop-details-main">
              <h1>{shopInfo?.shopName || "Tên Cửa Hàng"}</h1>
              <p className="shop-bio">{shopInfo?.shopDescription || "Chào mừng bạn đến với gian hàng chính hãng của chúng tôi."}</p>
              
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
              <div key={product.id} className="shop-product-card" onClick={() => window.location.href = `/product/${product.id}`}>
                <div className="prod-img-box">
                  <img src={product.images[0]} alt={product.name} />
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