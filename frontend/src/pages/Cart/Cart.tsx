import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrashAlt, FaMinus, FaPlus, FaStore } from 'react-icons/fa';
import api from '../../services/api';
import { getUserProfile } from '../../services/authService';
import ToastNotification from '../../components/Toast/ToastNotification';
import './Cart.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  productImage: string;
  shopName: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  /**
   * BITNAMILEGACY IMAGE FIX: Ensures relative paths from the backend
   * are correctly resolved to the full server URL.
   */
  const formatMediaUrl = (url?: string) => {
    if (!url || url === "/placeholder.png") return "/placeholder.png";
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  };

  useEffect(() => {
    const fetchCart = async () => {
      // 1. Avoid fetching if no token is present (Guest Mode)
      if (!localStorage.getItem('jwt_token')) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserProfile();
        setCartItems(data.cart || []);
      } catch (error) {
        console.error("Cart fetch error:", error);
        // Only show toast if the user is supposed to be logged in
        if (localStorage.getItem('isAuthenticated') === 'true') {
           setToastMessage("Không thể tải giỏ hàng. Vui lòng đăng nhập lại.");
           setShowToast(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
    document.title = "Giỏ hàng | AiNetsoft";
  }, []);

  const syncWithBackend = async (items: CartItem[]) => {
    if (!localStorage.getItem('jwt_token')) return;
    try {
      await api.post('/auth/sync-cart', { items });
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (err) {
      console.error("Sync failed", err);
    }
  };

  useEffect(() => {
    if (!loading && localStorage.getItem('jwt_token')) {
      const timer = setTimeout(() => {
        syncWithBackend(cartItems);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [cartItems, loading]);

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
        : item
    ));
  };

  const removeItem = (productId: string) => {
    if(window.confirm("Xóa sản phẩm khỏi giỏ hàng?")) {
      const newItems = cartItems.filter(item => item.productId !== productId);
      setCartItems(newItems);
      syncWithBackend(newItems);
    }
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) return (
    <div className="cart-loading">
      <div className="loading-spinner"></div>
      <p>Đang tải giỏ hàng...</p>
    </div>
  );

  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return (
    <div className="cart-page-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      
      <div className="container cart-container">
        <div className="cart-title-section">
          <h2>Giỏ hàng</h2>
        </div>
        
        {(!isAuthenticated || cartItems.length === 0) ? (
          <div className="cart-empty-state">
            <img src="/logo.svg" alt="Empty" /> 
            <p>{!isAuthenticated ? "Vui lòng đăng nhập để xem giỏ hàng của bạn." : "Giỏ hàng của bạn còn trống."}</p>
            <button onClick={() => navigate(!isAuthenticated ? '/login' : '/')} className="go-shopping-btn">
              {!isAuthenticated ? "Đăng nhập ngay" : "Mua sắm ngay"}
            </button>
          </div>
        ) : (
          <div className="cart-main-content">
            <div className="cart-header-grid">
              <div className="col-product">Sản phẩm</div>
              <div className="col-unit-price">Đơn giá</div>
              <div className="col-quantity">Số lượng</div>
              <div className="col-total-price">Số tiền</div>
              <div className="col-actions">Thao tác</div>
            </div>

            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item.productId} className="cart-item-row">
                  <div className="col-product product-details">
                    <img 
                      src={formatMediaUrl(item.productImage)} 
                      alt={item.productName} 
                      className="cart-item-img" 
                      onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                    />
                    <div className="product-info-text">
                      <p className="product-name">{item.productName}</p>
                      <span className="shop-name-tag"><FaStore size={12} /> {item.shopName}</span>
                    </div>
                  </div>

                  <div className="col-unit-price price-text">
                    ₫{item.price.toLocaleString('vi-VN')}
                  </div>

                  <div className="col-quantity">
                    <div className="qty-selector">
                      <button className="qty-btn" onClick={() => updateQuantity(item.productId, -1)}>
                        <FaMinus />
                      </button>
                      <input type="text" className="qty-input" value={item.quantity} readOnly />
                      <button className="qty-btn" onClick={() => updateQuantity(item.productId, 1)}>
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  <div className="col-total-price total-text">
                    ₫{(item.price * item.quantity).toLocaleString('vi-VN')}
                  </div>

                  <div className="col-actions">
                    <button className="delete-item-btn" onClick={() => removeItem(item.productId)}>
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-checkout-footer">
              <div className="footer-left">
                <span>Tổng số sản phẩm: <strong>{cartItems.length}</strong></span>
              </div>
              <div className="footer-right">
                <div className="total-summary">
                  <span className="summary-label">Tổng thanh toán ({cartItems.length} sản phẩm):</span>
                  <span className="summary-value">₫{totalAmount.toLocaleString('vi-VN')}</span>
                </div>
                <button className="main-checkout-btn" onClick={() => navigate('/checkout')}>
                  Mua hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;