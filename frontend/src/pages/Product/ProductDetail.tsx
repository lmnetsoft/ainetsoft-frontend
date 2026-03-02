import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaStore, FaShieldAlt, FaTruck } from 'react-icons/fa';
import axios from 'axios';
import ToastNotification from '../../components/Toast/ToastNotification';
import './ProductDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  videoUrl?: string; // Supporting your new video feature
  shopName: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0); // Index for gallery
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products/${id}`);
        setProduct(response.data);
        document.title = `${response.data.name} | AiNetsoft`;
      } catch (error) {
        setToastMessage("Không tìm thấy sản phẩm.");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!localStorage.getItem('isAuthenticated')) {
      navigate('/login');
      return;
    }

    try {
      // Reusing our Cart Sync logic
      const cartItem = {
        productId: product?.id,
        productName: product?.name,
        productImage: product?.images[0],
        price: product?.price,
        quantity: quantity,
        shopName: product?.shopName
      };

      // In a real app, we'd fetch current cart, add this, then sync
      // For now, let's assume the backend handles the addition logic or we send this item
      await axios.post(`${API_URL}/auth/sync-cart`, { items: [cartItem] }, { withCredentials: true });
      
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

  return (
    <div className="product-detail-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container detail-container">
        {/* LEFT: Media Gallery */}
        <div className="detail-media-section">
          <div className="main-display">
            {/* Logic: If video exists and is selected, show video player */}
            {product.videoUrl && activeMedia === product.images.length ? (
               <video controls className="main-video">
                 <source src={product.videoUrl} type="video/mp4" />
                 Trình duyệt của bạn không hỗ trợ video.
               </video>
            ) : (
               <img src={product.images[activeMedia] || "/placeholder.png"} alt={product.name} />
            )}
          </div>
          
          <div className="thumbnail-list">
            {product.images.map((img, idx) => (
              <div 
                key={idx} 
                className={`thumb-item ${activeMedia === idx ? 'active' : ''}`}
                onMouseEnter={() => setActiveMedia(idx)}
              >
                <img src={img} alt="thumb" />
              </div>
            ))}
            {/* Show video thumbnail if exists (limited to 1:30) */}
            {product.videoUrl && (
              <div 
                className={`thumb-item video-thumb ${activeMedia === product.images.length ? 'active' : ''}`}
                onMouseEnter={() => setActiveMedia(product.images.length)}
              >
                <div className="play-icon-overlay">▶</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="detail-info-section">
          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-stats">
            <span className="category-tag">{product.category}</span>
            <span className="stock-info">Kho: {product.stock} sản phẩm có sẵn</span>
          </div>

          <div className="price-box">
            <span className="currency">₫</span>
            <span className="amount">{product.price.toLocaleString()}</span>
          </div>

          <div className="shipping-info">
            <div className="info-row">
              <FaTruck className="icon" />
              <div className="text">
                <p>Vận chuyển tới: <strong>Toàn quốc</strong></p>
                <p className="sub">Phí vận chuyển: ₫0 - ₫30.000</p>
              </div>
            </div>
          </div>

          <div className="quantity-selector">
            <label>Số lượng</label>
            <div className="qty-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <input type="number" value={quantity} readOnly />
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
            </div>
          </div>

          <div className="purchase-buttons">
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FaShoppingCart /> Thêm vào giỏ hàng
            </button>
            <button className="buy-now-btn" onClick={() => { handleAddToCart(); navigate('/cart'); }}>
              Mua ngay
            </button>
          </div>

          <div className="guarantee-box">
            <span><FaShieldAlt /> AiNetsoft Đảm Bảo</span>
            <p>7 ngày miễn phí trả hàng / Hoàn tiền 100%</p>
          </div>
        </div>
      </div>

      {/* BOTTOM: Description & Shop */}
      <div className="container detail-bottom">
        <div className="shop-card">
          <FaStore className="shop-icon" />
          <div className="shop-name-box">
            <h3>{product.shopName}</h3>
            <button className="view-shop-btn">Xem Shop</button>
          </div>
        </div>

        <div className="description-section">
          <h3 className="section-title">MÔ TẢ SẢN PHẨM</h3>
          <div className="description-content">
            {product.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;