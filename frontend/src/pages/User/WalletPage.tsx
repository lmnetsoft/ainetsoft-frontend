import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyWallet, requestUserWithdrawal, getUserWithdrawalHistory } from '../../services/walletService';
import ToastNotification from '../../components/Toast/ToastNotification';
import { FaWallet, FaCoins, FaUniversity, FaInfoCircle, FaShoppingCart } from 'react-icons/fa';
import './WalletPage.css';

const WalletPage = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [coinBalance, setCoinBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [displayAmount, setDisplayAmount] = useState('');
    const [rawAmount, setRawAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [missingBank, setMissingBank] = useState(false);

    useEffect(() => {
        document.title = "Ví của tôi | AiNetsoft";
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [walletRes, historyRes] = await Promise.all([
                getMyWallet(),
                getUserWithdrawalHistory()
            ]);
            setBalance(walletRes.balance || 0);
            setCoinBalance(walletRes.coinBalance || 0);
            setHistory(historyRes);
            setMissingBank(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value === '') {
            setRawAmount('');
            setDisplayAmount('');
            return;
        }
        setRawAmount(value);
        setDisplayAmount(value.replace(/\B(?=(\d{3})+(?!\d))/g, " "));
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(rawAmount);
        if (isNaN(numAmount) || numAmount < 50000) {
            setToastMessage("Số tiền tối thiểu là 50.000₫");
            setShowToast(true);
            return;
        }
        if (numAmount > balance) {
            setToastMessage("Số dư không đủ!");
            setShowToast(true);
            return;
        }

        try {
            setSubmitting(true);
            await requestUserWithdrawal(numAmount);
            setToastMessage("Đã gửi yêu cầu rút tiền thành công!");
            setShowToast(true);
            setRawAmount('');
            setDisplayAmount('');
            fetchData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || "Lỗi hệ thống.";
            setToastMessage(errorMsg);
            setShowToast(true);
            if (errorMsg.includes("chưa thêm tài khoản ngân hàng")) {
                setMissingBank(true);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Đang tải dữ liệu ví...</div>;

    return (
        <div className="user-wallet-wrapper">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            
            <div className="wallet-header">
                <FaWallet size={28} color="#ee4d2d" />
                <h2>Ví Của Tôi</h2>
            </div>

            <div className="wallet-cards-grid">
                <div className="wallet-balance-card">
                    <div className="wallet-card-title">Số dư khả dụng (VNĐ)</div>
                    <div className="wallet-amount">₫{balance.toLocaleString('vi-VN')}</div>
                    
                    {missingBank ? (
                        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', color: '#333', textAlign: 'left', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', color: '#0284c7', fontWeight: 'bold', marginBottom: '10px', fontSize: '16px', gap: '8px' }}>
                                <FaInfoCircle size={20} />
                                <span>Tiền của bạn được bảo lưu an toàn!</span>
                            </div>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '18px', color: '#475569' }}>
                                Hệ thống nhận thấy bạn chưa liên kết tài khoản ngân hàng. Đừng lo lắng!<br/>
                                Bạn hoàn toàn có thể sử dụng số dư <strong>₫{balance.toLocaleString('vi-VN')}</strong> này để <strong>thanh toán trực tiếp</strong> cho các đơn hàng tiếp theo tại bước Thanh toán mà không cần rút ra.
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => navigate('/')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#0ea5e9', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#0284c7'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#0ea5e9'}
                                >
                                    <FaShoppingCart /> Mua Sắm Ngay
                                </button>
                                <button 
                                    onClick={() => navigate('/user/bank')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
                                >
                                    <FaUniversity /> Thêm Ngân Hàng
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="wallet-action-form" onSubmit={handleWithdraw}>
                            <div style={{ fontSize: '12px', marginBottom: '8px' }}>Rút tiền về thẻ mặc định</div>
                            <div className="wallet-input-group">
                                <input 
                                    type="text" 
                                    placeholder="Tối thiểu 50.000₫" 
                                    value={displayAmount}
                                    onChange={handleAmountChange}
                                    disabled={submitting}
                                />
                                <button type="submit" className="wallet-btn" disabled={submitting || !rawAmount}>
                                    RÚT
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="wallet-coin-card">
                    <div className="wallet-card-title">Ainetsoft Xu</div>
                    <div className="wallet-amount" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaCoins color="#ffe600" /> {coinBalance.toLocaleString('vi-VN')}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Dùng để giảm giá trực tiếp khi thanh toán đơn hàng.</div>
                </div>
            </div>

            <div className="wallet-history-section">
                <div className="history-title">Lịch sử rút tiền</div>
                <div className="history-list">
                    {history.length > 0 ? history.map((item) => (
                        <div key={item.id} className="history-item">
                            <div className="history-item-left">
                                <div className="amount">-₫{item.amount.toLocaleString('vi-VN')}</div>
                                <div className="date">{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                            </div>
                            <div className={`history-status ${item.status.toLowerCase()}`}>
                                {item.status === 'COMPLETED' ? 'Thành công' : 
                                 item.status === 'PENDING' ? 'Chờ duyệt' : 
                                 item.status === 'PROCESSING' ? 'Đang xử lý' : 
                                 item.status === 'FAILED' ? 'Lỗi giao dịch' : 'Từ chối'}
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>Chưa có giao dịch nào.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
