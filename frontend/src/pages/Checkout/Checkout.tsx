import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaRegCreditCard, FaMoneyBillWave, FaUniversity, FaTicketAlt, FaCoins, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { getUserProfile } from '../../services/authService';
import { placeOrder } from '../../services/orderService'; 
import api from '../../services/api'; 
import { getMyWallet, getMySavedVouchers } from '../../services/walletService'; // 🚀 MARKETING ENGINE
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
  const [userBank, setUserBank] = useState<any>(null);

  // 🚀 MARKETING ENGINE STATES
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [savedVouchers, setSavedVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [useCoins, setUseCoins] = useState(false);

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
        const user = await getUserProfile();
        setCartItems(user.cart || []);
        
        const defaultAddr = user.addresses?.find((addr: any) => addr.isDefault);
        setSelectedAddress(defaultAddr || user.addresses?.[0]);

        if (!user.cart || user.cart.length === 0) {
          navigate('/cart');
          return;
        }

        if (user.id) {
          const bankRes = await api.get(`/bank-accounts/user/${user.id}`);
          if (bankRes.data && bankRes.data.length > 0) {
            const defaultBank = bankRes.data.find((b: any) => b.isDefault) || bankRes.data[0];
            setUserBank(defaultBank);
          }
        }

        // 🚀 FETCH WALLET & VOUCHERS
        try {
            const walletData = await getMyWallet();
            setWalletBalance(walletData?.coinBalance || 0);
            const vouchersData = await getMySavedVouchers();
            setSavedVouchers(vouchersData || []);
        } catch (e) {
            console.log("Chưa có dữ liệu ví/voucher");
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

  // 🚀 TÍNH TOÁN TOÁN HỌC (MARKETING ENGINE)
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 30000; 

  let voucherDiscount = 0;
  if (selectedVoucher && subtotal >= selectedVoucher.minOrderValue) {
      if (selectedVoucher.discountType === 'PERCENTAGE') {
          voucherDiscount = subtotal * (selectedVoucher.discountValue / 100);
          if (selectedVoucher.maxDiscountAmount > 0 && voucherDiscount > selectedVoucher.maxDiscountAmount) {
              voucherDiscount = selectedVoucher.maxDiscountAmount;
          }
      } else {
          voucherDiscount = selectedVoucher.discountValue;
      }
  }

  // Đảm bảo voucher không giảm lố tiền hàng
  if (voucherDiscount > subtotal) voucherDiscount = subtotal;

  let totalAfterVoucher = subtotal + shippingFee - voucherDiscount;

  let coinDiscount = 0;
  if (useCoins && walletBalance > 0) {
      // Dùng xu tối đa bằng tổng tiền còn lại
      coinDiscount = Math.min(walletBalance, totalAfterVoucher);
  }

  const finalTotal = totalAfterVoucher - coinDiscount;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setToastMessage("Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng!");
      setShowToast(true);
      return;
    }

    if (paymentMethod === 'BANK' && !userBank) {
        setToastMessage("Vui lòng cập nhật thông tin Ngân hàng trong hồ sơ trước khi chọn phương thức này!");
        setShowToast(true);
        return;
    }

    try {
      setIsSubmitting(true);

      const checkoutData = {
        paymentMethod: paymentMethod,
        shippingAddress: selectedAddress,
        totalAmount: subtotal, // Gửi base amount
        appliedVoucherId: selectedVoucher ? selectedVoucher.id : null, // 🚀 Gửi ID Voucher
        usedCoins: coinDiscount // 🚀 Gửi số Xu đã dùng
      };

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

        {/* 🚀 MARKETING ENGINE: VOUCHER & COINS */}
        <div className="checkout-section marketing-section">
            <div className="marketing-row">
                <div className="marketing-left">
                    <FaTicketAlt size={20} color="#ee4d2d" />
                    <span>AiNetsoft Voucher</span>
                </div>
                <div className="marketing-right">
                    {selectedVoucher && (
                        <span className="applied-voucher-tag">
                            - ₫{voucherDiscount.toLocaleString()} ({selectedVoucher.code})
                            <FaTimes style={{marginLeft: '8px', cursor: 'pointer'}} onClick={() => setSelectedVoucher(null)}/>
                        </span>
                    )}
                    <button className="btn-select-voucher" onClick={() => setShowVoucherModal(true)}>
                        {selectedVoucher ? "Đổi Voucher" : "Chọn Voucher"}
                    </button>
                </div>
            </div>

            <hr style={{borderTop: '1px dashed #e2e8f0', margin: '15px 0'}} />

            <div className="marketing-row">
                <div className="marketing-left">
                    <FaCoins size={20} color="#f59e0b" />
                    <span>AiNetsoft Xu</span>
                    <span className="coin-balance-text">Bạn đang có {walletBalance.toLocaleString()} Xu</span>
                </div>
                <div className="marketing-right">
                    {walletBalance > 0 ? (
                        <span className="coin-toggle-wrapper">
                            <span style={{marginRight: '10px', color: useCoins ? '#16a34a' : '#64748b'}}>
                                {useCoins ? `- ₫${coinDiscount.toLocaleString()}` : "Không sử dụng"}
                            </span>
                            <label className="switch">
                                <input type="checkbox" checked={useCoins} onChange={() => setUseCoins(!useCoins)} />
                                <span className="slider round"></span>
                            </label>
                        </span>
                    ) : (
                        <span style={{color: '#94a3b8', fontSize: '14px'}}>Không đủ Xu</span>
                    )}
                </div>
            </div>
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

            {paymentMethod === 'BANK' && (
                <div className="bank-preview-box">
                    {userBank ? (
                        <div className="bank-info-mini">
                            <FaUniversity className="bank-icon" />
                            <div>
                                <p><strong>{userBank.bankName}</strong></p>
                                <p>{userBank.accountNumber} - {userBank.accountHolder}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="bank-warning">⚠️ Bạn chưa lưu tài khoản ngân hàng nào. <span onClick={() => navigate('/user/bank')} style={{color: '#ee4d2d', cursor: 'pointer', textDecoration: 'underline'}}>Thêm ngay</span></p>
                    )}
                </div>
            )}
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
            {/* 🚀 HIỂN THỊ VOUCHER & XU TRONG TỔNG KẾT */}
            {voucherDiscount > 0 && (
                <div className="summary-row discount-row">
                  <span>Voucher giảm giá:</span>
                  <span>- ₫{voucherDiscount.toLocaleString()}</span>
                </div>
            )}
            {coinDiscount > 0 && (
                <div className="summary-row discount-row">
                  <span>Dùng Xu:</span>
                  <span>- ₫{coinDiscount.toLocaleString()}</span>
                </div>
            )}
            <div className="summary-row total">
              <span>Tổng thanh toán:</span>
              <span className="grand-total">₫{finalTotal.toLocaleString()}</span>
            </div>
            <button className="place-order-btn" onClick={handlePlaceOrder} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 MODAL CHỌN VOUCHER */}
      {showVoucherModal && (
          <div className="voucher-modal-overlay">
              <div className="voucher-modal">
                  <div className="modal-header">
                      <h3>Chọn AiNetsoft Voucher</h3>
                      <button onClick={() => setShowVoucherModal(false)}><FaTimes /></button>
                  </div>
                  <div className="modal-body">
                      {savedVouchers.length === 0 ? (
                          <div className="empty-vouchers">Bạn chưa có voucher nào.</div>
                      ) : (
                          savedVouchers.map(v => {
                              const isValid = subtotal >= v.minOrderValue;
                              const isSelected = selectedVoucher?.id === v.id;
                              return (
                                  <div key={v.id} className={`checkout-voucher-card ${!isValid ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`} 
                                       onClick={() => { if(isValid) setSelectedVoucher(v); }}>
                                      <div className="cv-left">
                                          <FaTicketAlt size={24} />
                                          <span style={{fontSize: '11px', marginTop: '5px', textAlign: 'center'}}>{v.shopName}</span>
                                      </div>
                                      <div className="cv-right">
                                          <div className="cv-info">
                                              <h4>{v.title}</h4>
                                              <p>Đơn tối thiểu ₫{v.minOrderValue.toLocaleString()}</p>
                                          </div>
                                          <div className="cv-action">
                                              {isSelected ? <FaCheckCircle color="#ee4d2d" size={20}/> : <div className="circle-radio"></div>}
                                          </div>
                                      </div>
                                      {!isValid && <div className="cv-reason">Chưa đạt giá trị đơn tối thiểu</div>}
                                  </div>
                              );
                          })
                      )}
                  </div>
                  <div className="modal-footer">
                      <button className="btn-cancel" onClick={() => setShowVoucherModal(false)}>TRỞ LẠI</button>
                      <button className="btn-confirm" onClick={() => setShowVoucherModal(false)}>XÁC NHẬN</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Checkout;