import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './PublicShop.css';

const PublicShop = () => {
  const { id } = useParams(); // Get seller ID from URL
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        // We use the ID from URL, or if missing, the backend identifies 'me'
        const sellerId = id || 'my-store'; 
        const [infoRes, prodRes] = await Promise.all([
          api.get(`/auth/shop-info/${sellerId}`),
          api.get(`/products/public/seller/${sellerId}`)
        ]);
        setShopInfo(infoRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error("Could not load shop data");
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();
  }, [id]);

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="public-shop-wrapper">
      <div className="shop-banner-section">
        <div className="container shop-header-flex">
          <img src={shopInfo?.shopLogoUrl || "/logo_without_text.png"} alt="Logo" className="shop-logo-large" />
          <div className="shop-meta-info">
            <h1>{shopInfo?.shopName || "Tên Cửa Hàng"}</h1>
            <p>{shopInfo?.shopDescription || "Chào mừng bạn đến với gian hàng của chúng tôi!"}</p>
            <div className="shop-stats-row">
              <span>Sản phẩm: <strong>{products.length}</strong></span>
              <span>Đánh giá: <strong>{shopInfo?.rating || 5.0}/5</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="container shop-products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card-simple">
             <img src={product.images[0]} alt={product.name} />
             <h4>{product.name}</h4>
             <p className="price">₫{product.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicShop;