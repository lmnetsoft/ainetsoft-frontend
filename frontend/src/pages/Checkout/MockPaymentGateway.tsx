import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaShieldAlt, FaLock, FaCreditCard, FaCcMastercard, FaCcVisa } from 'react-icons/fa'; // 🚀 Thêm Import icon Thẻ
import './MockPaymentGateway.css';

const MockPaymentGateway = () => {
    const [searchParams] = useSearchParams();
    const amount = searchParams.get('amount') || '0';
    const orderId = searchParams.get('orderId') || 'UNKNOWN';
    const returnUrl = searchParams.get('returnUrl') || '/';

    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); // 15 phút

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Hàm tự động thêm khoảng trắng mỗi 4 số cho đẹp
    const formatCardDisplay = (num: string) => {
        if (!num) return '**** **** **** ****';
        const cleanNum = num.replace(/\D/g, '');
        const match = cleanNum.match(/.{1,4}/g);
        return match ? match.join(' ') : cleanNum;
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        setTimeout(() => {
            const mockVnPayResponse = `vnp_Amount=${amount}00&vnp_BankCode=NCB&vnp_OrderInfo=ThanhToanDonHang&vnp_PayDate=${new Date().getTime()}&vnp_ResponseCode=00&vnp_TmnCode=MOCK_TMN&vnp_TransactionNo=MOCK${new Date().getTime()}&vnp_TxnRef=${orderId}`;
            const separator = returnUrl.includes('?') ? '&' : '?';
            const finalCallbackUrl = `${returnUrl}${separator}${mockVnPayResponse}`;
            
            window.location.href = finalCallbackUrl;
        }, 2500);
    };

    return (
        <div className="mock-pg-container">
            <div className="mock-pg-header">
                <div className="pg-logo">
                    <FaCreditCard style={{ marginRight: '10px' }} /> AiNetsoft <span>PaySandbox</span>
                </div>
                <div className="pg-lang">Tiếng Việt 🇻🇳</div>
            </div>

            <div className="mock-pg-main">
                <div className="mock-pg-content">
                    <div className="pg-left-panel">
                        <div className="pg-method-selector">
                            <div className="pg-method-item active">
                                <div className="pg-radio-checked"></div>
                                <div className="pg-method-text">
                                    <strong>Thanh toán bằng thẻ quốc tế / ATM</strong>
                                    <span>Thẻ Tín dụng/Thẻ ghi nợ (Sandbox)</span>
                                </div>
                                <div className="pg-method-icons" style={{ display: 'flex', gap: '6px', fontSize: '28px' }}>
                                    {/* 🚀 Đã thay thế ảnh lỗi bằng Vector Icon chuẩn */}
                                    <FaCcMastercard color="#eb001b" />
                                    <FaCcVisa color="#1a1f71" />
                                </div>
                            </div>
                        </div>

                        <div className="pg-order-summary">
                            <div className="pg-vendor-info">
                                <div className="pg-vendor-logo">A</div>
                                <div>
                                    <span>Nhà cung cấp</span>
                                    <h4>Ainetsoft E-Commerce</h4>
                                </div>
                            </div>
                            
                            <div className="pg-order-details">
                                <div className="detail-row">
                                    <span>Mã đơn hàng</span>
                                    <strong>{orderId}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Mô tả</span>
                                    <strong>Thanh toán đơn hàng {orderId}</strong>
                                </div>
                                <div className="detail-row highlight-amount">
                                    <span>Số tiền thanh toán</span>
                                    <strong>{Number(amount).toLocaleString('vi-VN')} VND</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pg-right-panel">
                        <h3>Nhập thông tin thẻ</h3>
                        
                        <div className="virtual-credit-card">
                            <div className="chip"></div>
                            <div className="card-number-display">
                                {formatCardDisplay(cardNumber)}
                            </div>
                            <div className="card-holder-display">
                                {cardHolder.toUpperCase() || 'TÊN CHỦ THẺ'}
                            </div>
                            <div className="card-expiry-display">
                                {expiry || 'MM/YY'}
                            </div>
                        </div>

                        <form className="pg-form" onSubmit={handlePayment}>
                            <div className="pg-form-group">
                                <input 
                                    type="text" 
                                    placeholder="Số thẻ (VD: 4242 4242...)" 
                                    value={cardNumber} 
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    maxLength={19}
                                    required 
                                />
                            </div>
                            <div className="pg-form-group">
                                <input 
                                    type="text" 
                                    placeholder="Tên in trên thẻ (VD: NGUYEN VAN THANH)" 
                                    value={cardHolder} 
                                    onChange={(e) => setCardHolder(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="pg-form-row">
                                <div className="pg-form-group half">
                                    <input 
                                        type="text" 
                                        placeholder="MM/YY" 
                                        value={expiry} 
                                        onChange={(e) => setExpiry(e.target.value)}
                                        maxLength={5}
                                        required 
                                    />
                                </div>
                                <div className="pg-form-group half">
                                    <input 
                                        type="password" 
                                        placeholder="Số CVV" 
                                        value={cvv} 
                                        onChange={(e) => setCvv(e.target.value)}
                                        maxLength={3}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="pg-timer">
                                Bạn còn lại {formatTime(timeLeft)}. <span style={{color: '#0284c7', cursor: 'pointer'}}>Hủy</span>
                            </div>

                            <button type="submit" className={`pg-submit-btn ${isProcessing ? 'processing' : ''}`} disabled={isProcessing}>
                                {isProcessing ? 'ĐANG XỬ LÝ GIAO DỊCH...' : 'THANH TOÁN'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="mock-pg-footer">
                <div className="security-badge">
                    <FaShieldAlt className="icon-shield" />
                    <div>
                        <strong>Tiêu chuẩn bảo mật quốc tế PCI-DSS</strong>
                        <p>Thông tin thẻ của bạn được bảo mật tuyệt đối.</p>
                    </div>
                </div>
                <div className="security-badge">
                    <FaLock className="icon-lock" />
                    <div>
                        <strong>An toàn thông tin</strong>
                        <p>Mọi thông tin thanh toán được mã hóa an toàn.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockPaymentGateway;
