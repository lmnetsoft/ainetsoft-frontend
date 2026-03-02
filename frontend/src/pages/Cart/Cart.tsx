import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrashAlt, FaMinus, FaPlus, FaStore } from 'react-icons/fa';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([
    { 
      id: 'p1', 
      name: 'Sản phẩm mẫu 01 - Giải pháp công nghệ cao cấp AiNetsoft 2026', 
      price: 250000, 
      quantity: 1, 
      image: '/src/assets/images/logo_without_text.png', 
      shopName: 'AiNetsoft Official' 
    },
    { 
      id: 'p2', 
      name: 'Sản phẩm mẫu 02 - Phần mềm quản lý doanh nghiệp thông minh', 
      price: 1200000, 
      quantity: 1, 
      image: '/src/assets/images/logo_without_text.png', 
      shopName: 'Ainetsoft Store' 
    }
  ]);

  useEffect(() => {
    document.title = "Giỏ hàng | AiNetsoft";
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: string) => {
    if(window.confirm("Xóa sản phẩm khỏi giỏ hàng?")) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="cart-page-wrapper">
      <div className="cart-container">
        <div className="cart-title-section">
          <h2>Giỏ hàng</h2>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <img src="/src/assets/images/logo_without_text.png" alt="Empty" />
            <p>Giỏ hàng của bạn còn trống</p>
            <button onClick={() => navigate('/')} className="go-shopping-btn">Mua sắm ngay</button>
          </div>
        ) : (
          <div className="cart-main-content">
            {/* Header Labels mapped to your Grid Layout */}
            <div className="cart-header-grid">
              <div className="col-product">Sản phẩm</div>
              <div className="col-unit-price">Đơn giá</div>
              <div className="col-quantity">Số lượng</div>
              <div className="col-total-price">Số tiền</div>
              <div className="col-actions">Thao tác</div>
            </div>

            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item-row">
                  {/* Product Details Column */}
                  <div className="col-product product-details">
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                    <div className="product-info-text">
                      <p className="product-name">{item.name}</p>
                      <span className="shop-name-tag"><FaStore size={12} /> {item.shopName}</span>
                    </div>
                  </div>

                  {/* Unit Price Column */}
                  <div className="col-unit-price price-text">
                    ₫{item.price.toLocaleString('vi-VN')}
                  </div>

                  {/* Quantity Fix Column */}
                  <div className="col-quantity">
                    <div className="qty-selector">
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                        <FaMinus />
                      </button>
                      <input type="text" className="qty-input" value={item.quantity} readOnly />
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                        <FaPlus />
                      </button>
                    </div>
                  </div>

                  {/* Total Price Column */}
                  <div className="col-total-price total-text">
                    ₫{(item.price * item.quantity).toLocaleString('vi-VN')}
                  </div>

                  {/* Actions Column */}
                  <div className="col-actions">
                    <button className="delete-item-btn" onClick={() => removeItem(item.id)}>
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Footer Summary */}
            <div className="cart-checkout-footer">
              <div className="footer-left">
                <span>Tổng số sản phẩm: <strong>{cartItems.length}</strong></span>
              </div>
              <div className="footer-right">
                <div className="total-summary">
                  <span className="summary-label">Tổng thanh toán:</span>
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