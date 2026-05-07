import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaRegCreditCard, FaMoneyBillWave, FaUniversity, FaTicketAlt, FaCoins, FaTimes, FaCheckSquare, FaSquare, FaQuestionCircle } from 'react-icons/fa';
import { getUserProfile } from '../../services/authService';
import { placeOrder } from '../../services/orderService'; 
import api from '../../services/api'; 
import { getMyWallet, getMySavedVouchers } from '../../services/walletService'; 
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

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [savedVouchers, setSavedVouchers] = useState<any[]>([]);
  
  const [selectedVouchers, setSelectedVouchers] = useState<any[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [useCoins, setUseCoins] = useState(false);

  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  
  const [showVoucherHelp, setShowVoucherHelp] = useState(false);

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

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = 30000; 

  let voucherDiscount = 0;
  selectedVouchers.forEach(v => {
      if (subtotal >= v.minOrderValue) {
          let currentDiscount = 0;
          if (v.discountType === 'PERCENTAGE') {
              currentDiscount = subtotal * (v.discountValue / 100);
              if (v.maxDiscountAmount > 0 && currentDiscount > v.maxDiscountAmount) {
                  currentDiscount = v.maxDiscountAmount;
              }
          } else {
              currentDiscount = v.discountValue;
          }
          voucherDiscount += currentDiscount;
      }
  });

  if (voucherDiscount > subtotal) voucherDiscount = subtotal;

  let totalAfterVoucher = subtotal + shippingFee - voucherDiscount;

  let coinDiscount = 0;
  if (useCoins && walletBalance > 0) {
      const maxCoinUsage = totalAfterVoucher * 0.5; 
      coinDiscount = Math.min(walletBalance, maxCoinUsage);
  }

  const finalTotal = totalAfterVoucher - coinDiscount;

  const handleToggleVoucher = (voucher: any) => {
      const isSelected = selectedVouchers.some(v => v.id === voucher.id);
      if (isSelected) {
          setSelectedVouchers(selectedVouchers.filter(v => v.id !== voucher.id));
      } else {
          if (selectedVouchers.length >= 3) {
              setToastMessage("Chỉ được áp dụng tối đa 3 Voucher cùng lúc!");
              setShowToast(true);
              return;
          }
          setSelectedVouchers([...selectedVouchers, voucher]);
      }
  };

  const handleApplyVoucherCode = async () => {
    if (!voucherCodeInput.trim()) return;
    try {
        setIsApplyingCode(true);
        const res = await api.get(`/vouchers/code/${voucherCodeInput.trim().toUpperCase()}`);
        const fetchedVoucher = res.data;

        const alreadySaved = savedVouchers.some(v => v.id === fetchedVoucher.id);
        
        if (alreadySaved) {
            setToastMessage("Mã voucher này đã có sẵn trong danh sách của bạn!");
            setShowToast(true);
        } else {
            await api.post(`/wallets/me/vouchers/${fetchedVoucher.id}`);
            setSavedVouchers(prev => [fetchedVoucher, ...prev]);
            setToastMessage("Áp dụng mã Voucher thành công!");
            setShowToast(true);
            setVoucherCodeInput(''); 
        }
    } catch (err: any) {
        setToastMessage(err.response?.data?.message || "Mã Voucher không hợp lệ hoặc đã hết hạn!");
        setShowToast(true);
    } finally {
        setIsApplyingCode(false);
    }
  };

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
        totalAmount: subtotal, 
        appliedVoucherIds: selectedVouchers.map(v => v.id), 
        usedCoins: Math.floor(coinDiscount)
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

        <div className="checkout-section marketing-section">
            <div className="marketing-row">
                <div className="marketing-left">
                    <FaTicketAlt size={20} color="#ee4d2d" />
                    <span>AiNetsoft Voucher</span>
                </div>
                <div className="marketing-right">
                    <div className="applied-vouchers-container">
                        {selectedVouchers.map(v => (
                            <span key={v.id} className="applied-voucher-tag">
                                -₫{v.discountType === 'FIXED_AMOUNT' ? v.discountValue.toLocaleString() : (v.discountValue + '%')}
                                <FaTimes style={{marginLeft: '8px', cursor: 'pointer'}} onClick={() => handleToggleVoucher(v)}/>
                            </span>
                        ))}
                    </div>
                    
                    <button className="btn-select-voucher" onClick={() => setShowVoucherModal(true)}>
                        {selectedVouchers.length > 0 ? `Đã chọn (${selectedVouchers.length}/3)` : "Chọn Voucher"}
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
                                {useCoins ? `- ₫${Math.floor(coinDiscount).toLocaleString()}` : "Không sử dụng"}
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
            {voucherDiscount > 0 && (
                <div className="summary-row discount-row">
                  <span>Voucher giảm giá:</span>
                  <span>- ₫{voucherDiscount.toLocaleString()}</span>
                </div>
            )}
            {coinDiscount > 0 && (
                <div className="summary-row discount-row">
                  <span>Dùng Xu:</span>
                  <span>- ₫{Math.floor(coinDiscount).toLocaleString()}</span>
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

      {showVoucherModal && (
          <div className="voucher-modal-overlay">
              <div className="voucher-modal">
                  
                  <div className="modal-header">
                      <h3>Chọn AiNetsoft Voucher</h3>
                      <div className="modal-header-actions">
                          <div 
                              className="help-tooltip-container"
                              onMouseEnter={() => setShowVoucherHelp(true)}
                              onMouseLeave={() => setShowVoucherHelp(false)}
                              onClick={() => setShowVoucherHelp(!showVoucherHelp)}
                          >
                              <span className="help-text">Hỗ Trợ <FaQuestionCircle size={14}/></span>
                              
                              {showVoucherHelp && (
                                  <div className="help-tooltip-content">
                                      <h4>1. Cách "Sưu Tầm" Mã Giảm Giá</h4>
                                      <p>Để các thẻ tự động xuất hiện tại đây, bạn hãy nhớ bấm nút <strong>"Lưu"</strong> khi nhìn thấy chúng trên trang Chủ hoặc trang Chi tiết sản phẩm nhé.</p>
                                      
                                      <h4>2. Cách "Săn" Mã Khuyến Mãi Mới</h4>
                                      <p>Nếu bạn có một mã bí mật, hãy nhập ngay vào ô <strong>"Mã Voucher"</strong> và bấm <strong>"ÁP DỤNG"</strong>. Hệ thống sẽ lưu thẳng thẻ Voucher đó vào danh sách bên dưới cho bạn.</p>
                                      
                                      <h4>3. Cách "Chốt Mã" Cho Đơn Hàng Này</h4>
                                      <p>Hãy đánh dấu tick (✅) vào các thẻ Voucher bạn muốn sử dụng (tối đa 3 mã). Sau đó bấm nút <strong>XÁC NHẬN</strong> màu cam ở dưới cùng để chốt mã và trừ thẳng vào tổng tiền thanh toán!</p>
                                      
                                      <h4>Mẹo Tối Ưu Chi Phí</h4>
                                      <p>Bạn hoàn toàn có thể kết hợp nhiều loại mã cùng lúc (Ví dụ: Mã Miễn phí vận chuyển + Mã Giảm giá của Shop) để mua được hàng với giá rẻ nhất nhé.</p>
                                  </div>
                              )}
                          </div>
                          <button className="close-modal-btn" onClick={() => setShowVoucherModal(false)}><FaTimes /></button>
                      </div>
                  </div>
                  
                  <div className="voucher-search-box">
                      <span className="vs-label">Mã Voucher</span>
                      <input 
                          type="text" 
                          placeholder="Mã AiNetsoft Voucher" 
                          value={voucherCodeInput}
                          onChange={e => setVoucherCodeInput(e.target.value)}
                      />
                      <button 
                          className={`vs-apply-btn ${voucherCodeInput.trim() ? 'active' : ''}`}
                          onClick={handleApplyVoucherCode}
                          disabled={!voucherCodeInput.trim() || isApplyingCode}
                      >
                          {isApplyingCode ? 'ĐANG XỬ LÝ...' : 'ÁP DỤNG'}
                      </button>
                  </div>

                  <div className="modal-body">
                      {savedVouchers.length === 0 ? (
                          <div className="empty-vouchers" style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Bạn chưa có voucher nào.</div>
                      ) : (
                          savedVouchers.map(v => {
                              const isExhausted = v.usedCount >= v.usageLimit;
                              const isExpired = new Date() > new Date(v.validUntil);
                              const isSubtotalValid = subtotal >= v.minOrderValue;
                              const isDisabled = !isSubtotalValid || isExhausted || isExpired;
                              
                              const isSelected = selectedVouchers.some(sv => sv.id === v.id);

                              return (
                                  <div key={v.id} 
                                       className={`checkout-voucher-card ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`} 
                                       onClick={() => { if(!isDisabled) handleToggleVoucher(v); }}>
                                      
                                      <div className="cv-left">
                                          <FaTicketAlt size={24} />
                                          <span style={{fontSize: '11px', marginTop: '5px', textAlign: 'center', fontWeight: 500}}>{v.shopName || 'AiNetsoft'}</span>
                                      </div>
                                      
                                      <div className="cv-right">
                                          <div className="cv-info">
                                              {/* 🚀 ĐÃ BỔ SUNG: Hiển thị Code ngay cạnh Title một cách chuyên nghiệp */}
                                              <h4 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                  {v.title}
                                                  {v.code && (
                                                      <span style={{ 
                                                          fontSize: '11px', 
                                                          color: '#ee4d2d', 
                                                          background: '#fff0ed', 
                                                          border: '1px solid #ffc9c0', 
                                                          padding: '2px 6px', 
                                                          borderRadius: '2px', 
                                                          fontWeight: 500,
                                                          letterSpacing: '0.5px'
                                                      }}>
                                                          {v.code}
                                                      </span>
                                                  )}
                                              </h4>
                                              <p>Đơn tối thiểu ₫{v.minOrderValue.toLocaleString()}</p>
                                          </div>
                                          <div className="cv-action">
                                              {isSelected ? <FaCheckSquare color="#ee4d2d" size={22}/> : <FaSquare color={isDisabled ? "#e2e8f0" : "#cbd5e1"} size={22}/>}
                                          </div>
                                      </div>
                                      
                                      {isDisabled && (
                                          <div className="cv-reason">
                                              {isExhausted ? 'Đã hết lượt sử dụng' 
                                                  : isExpired ? 'Voucher đã hết hạn' 
                                                  : 'Chưa đạt giá trị đơn tối thiểu'}
                                          </div>
                                      )}
                                  </div>
                              );
                          })
                      )}
                  </div>
                  <div className="modal-footer">
                      <span style={{marginRight: 'auto', alignSelf: 'center', fontSize: '13px', color: 'rgba(0,0,0,0.54)'}}>Đã chọn {selectedVouchers.length}/3</span>
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