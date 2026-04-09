import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { FaWallet, FaHistory, FaMoneyCheckAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './Withdrawal.css';

const Withdrawal = () => {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchWithdrawalData();
        document.title = "Rút tiền | AiNetsoft Seller";
    }, []);

    const fetchWithdrawalData = async () => {
        try {
            setLoading(true);
            const [balanceRes, historyRes] = await Promise.all([
                api.get('/withdrawals/balance'),
                api.get('/withdrawals/history')
            ]);
            setBalance(balanceRes.data.balance);
            setHistory(historyRes.data);
        } catch (err) {
            setToastMessage("Không thể tải dữ liệu ví.");
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);

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
            await api.post('/withdrawals/request', { amount: numAmount });
            setToastMessage("Yêu cầu rút tiền đã được gửi!");
            setShowToast(true);
            setAmount('');
            fetchWithdrawalData(); // Refresh balance and list
        } catch (err: any) {
            setToastMessage(err.response?.data?.message || "Lỗi khi gửi yêu cầu.");
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <FaClock className="status-icon pending" />;
            case 'COMPLETED': return <FaCheckCircle className="status-icon completed" />;
            case 'REJECTED': return <FaTimesCircle className="status-icon rejected" />;
            default: return null;
        }
    };

    if (loading) return <div className="seller-loading">Đang tải thông tin ví...</div>;

    return (
        <div className="withdrawal-page-container">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            
            <div className="withdrawal-header">
                <h2><FaWallet /> Quản lý số dư & Rút tiền</h2>
                <p>Theo dõi doanh thu và thực hiện yêu cầu rút tiền về ngân hàng của bạn.</p>
            </div>

            <div className="withdrawal-grid">
                {/* LEFT: Balance & Request Form */}
                <div className="withdrawal-card main-balance-card">
                    <div className="balance-info">
                        <span>Số dư khả dụng</span>
                        <h3>₫{balance.toLocaleString()}</h3>
                    </div>

                    <form className="request-form" onSubmit={handleRequest}>
                        <div className="form-group">
                            <label>Số tiền muốn rút (VND)</label>
                            <div className="input-with-symbol">
                                <input 
                                    type="number" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                    placeholder="Tối thiểu 50,000"
                                />
                                <span className="currency-symbol">₫</span>
                            </div>
                        </div>
                        <button type="submit" className="withdraw-btn" disabled={submitting}>
                            {submitting ? "Đang xử lý..." : "Gửi yêu cầu rút tiền"}
                        </button>
                    </form>
                    <p className="hint-text">Lưu ý: Tiền sẽ được chuyển vào tài khoản ngân hàng mặc định đã thiết lập.</p>
                </div>

                {/* RIGHT: History List */}
                <div className="withdrawal-card history-card">
                    <div className="card-header">
                        <h3><FaHistory /> Lịch sử yêu cầu</h3>
                    </div>
                    <div className="history-list">
                        {history.length > 0 ? (
                            history.map((item) => (
                                <div key={item.id} className="history-item">
                                    <div className="item-main">
                                        <div className="item-icon-box">
                                            <FaMoneyCheckAlt />
                                        </div>
                                        <div className="item-details">
                                            <p className="item-amount">-₫{item.amount.toLocaleString()}</p>
                                            <p className="item-date">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>
                                    <div className="item-status-box">
                                        {getStatusIcon(item.status)}
                                        <span className={`status-text ${item.status.toLowerCase()}`}>{item.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-history">Chưa có yêu cầu rút tiền nào.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Withdrawal;