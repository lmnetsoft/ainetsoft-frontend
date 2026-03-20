import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaRegCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { getUserProfile } from '../../services/authService';
import { placeOrder } from '../../services/orderService'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import './Checkout.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const formatMediaUrl = (url?: string) => {
    if (!url || url === "/placeholder.png") return "/placeholder.png";
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setCartItems(data.cart || []);
        
        const defaultAddr = data.addresses?.find((addr: any) => addr.isDefault);
        setSelectedAddress(defaultAddr || data.addresses?.[0]);

        if (!data.cart || data.cart.length === 0) {
          navigate('/cart');
        }
      } catch (err: any) {
        setToastMessage("Vui lòng đăng nhập để thanh toán.");
        setShowToast(true);
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    document.title = "Thanh toán | AiNetsoft";
  }, [navigate]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 30000; 
  const total = subtotal + shippingFee;

  // 🛠️ FIXED: Bundling the correct data for the Backend
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setToastMessage("Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng!");
      setShowToast(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create the payload that matches your Backend 'Order' model
      const checkoutData = {
        paymentMethod: paymentMethod,
        shippingAddress: selectedAddress,
        totalAmount: total
      };

      // 2. Send the bundle to the server
      await placeOrder(checkoutData);
      
      setToastMessage("Đặt hàng thành công!");
      setShowToast(true);
      
      setTimeout(() => navigate('/user/purchase'), 2000);
    } catch (err: any) {
      setToastMessage(err.message || "Có lỗi xảy ra khi đặt hàng.");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="checkout-loading-wrapper">
      <div className="loading-spinner"></div>
      <p>Đang chuẩn bị đơn hàng...</p>
    </div>
  );

  return (
    <div className="checkout-page-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container checkout-container">
        
        {/* ADDRESS SECTION */}
        <div className="checkout-section address-section">
          <div className="section-header">
            <FaMapMarkerAlt className="icon-orange" />
            <h3>Địa Chỉ Nhận Hàng <span className="required-star">*</span></h3>
          </div>
          {selectedAddress ? (
            <div className="address-display">
              <div className="address-info">
                <strong>{selectedAddress.receiverName} ({selectedAddress.phone})</strong>
                <p>
                  {selectedAddress.detail}, {selectedAddress.ward}, {selectedAddress.province}
                </p>
              </div>
              <button className="change-btn" onClick={() => navigate('/user/address')}>Thay đổi</button>
            </div>
          ) : (
            <button className="add-address-btn" onClick={() => navigate('/user/address')}>+ Thêm địa chỉ mới</button>
          )}
        </div>

        {/* PRODUCT LIST */}
        <div className="checkout-section product-list-section">
          <div className="product-header-grid">
            <div className="col-prod">Sản phẩm</div>
            <div className="col-price">Đơn giá</div>
            <div className="col-qty">Số lượng</div>
            <div className="col-total">Thành tiền</div>
          </div>
          {cartItems.map((item, idx) => (
            <div key={idx} className="checkout-item-row">
              <div className="col-prod item-meta">
                <img 
                  src={formatMediaUrl(item.productImage)} 
                  alt={item.productName} 
                  onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                />
                <span>{item.productName}</span>
              </div>
              <div className="col-price">₫{item.price.toLocaleString()}</div>
              <div className="col-qty">{item.quantity}</div>
              <div className="col-total">₫{(item.price * item.quantity).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* PAYMENT & SUMMARY */}
        <div className="checkout-bottom-grid">
          <div className="checkout-section payment-method">
            <h3>Phương thức thanh toán</h3>
            <div className="method-options">
              <label className={`method-card ${paymentMethod === 'COD' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <FaMoneyBillWave /> Thanh toán khi nhận hàng (COD)
              </label>
              <label className={`method-card ${paymentMethod === 'BANK' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="BANK" checked={paymentMethod === 'BANK'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <FaRegCreditCard /> Chuyển khoản ngân hàng
              </label>
            </div>
          </div>

          <div className="checkout-section summary-card">
            <div className="summary-row">
              <span>Tổng tiền hàng:</span>
              <span>₫{subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>₫{shippingFee.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Tổng thanh toán:</span>
              <span className="grand-total">₫{total.toLocaleString()}</span>
            </div>
            <button className="place-order-btn" onClick={handlePlaceOrder} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;