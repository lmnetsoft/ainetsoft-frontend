import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { FaWallet, FaHistory, FaCheckCircle, FaClock, FaTimesCircle, FaExclamationCircle, FaSync } from 'react-icons/fa';
import './Withdrawal.css';

const Withdrawal = () => {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [displayAmount, setDisplayAmount] = useState(''); 
    const [rawAmount, setRawAmount] = useState('');       
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); 
    const [submitting, setSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchWithdrawalData();
        document.title = "Quản lý số dư | AiNetsoft Seller";
    }, []);

    const fetchWithdrawalData = async () => {
        try {
            if (!loading) setRefreshing(true);
            const [balanceRes, historyRes] = await Promise.all([
                api.get('/withdrawals/balance'),
                api.get('/withdrawals/history')
            ]);
            setBalance(balanceRes.data.balance);
            
            // 🚀 NEWEST ON TOP: Sort history descending by date
            const sortedHistory = historyRes.data.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setHistory(sortedHistory);
        } catch (err) {
            setToastMessage("Không thể tải dữ liệu ví.");
            setShowToast(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
        const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        setDisplayAmount(formatted);
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(rawAmount);
        if (isNaN(numAmount) || numAmount < 50000) {
            setToastMessage("Số tiền tối thiểu là 50 000₫");
            setShowToast(true);
            return;
        }
        try {
            setSubmitting(true);
            await api.post('/withdrawals/request', { amount: numAmount });
            setToastMessage("Yêu cầu rút tiền thành công!");
            setShowToast(true);
            setRawAmount('');
            setDisplayAmount('');
            fetchWithdrawalData();
        } catch (err: any) {
            setToastMessage(err.response?.data?.message || "Lỗi hệ thống.");
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !refreshing) return <div className="seller-loading">Đang tải...</div>;

    return (
        <div className="seller-withdrawal-wrapper">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            
            <div className="withdrawal-page-header">
                <h2><FaWallet className="header-icon" /> QUẢN LÝ SỐ DƯ & RÚT TIỀN</h2>
                <p>Theo dõi doanh thu và thực hiện rút tiền về ngân hàng của bạn.</p>
            </div>

            <div className="withdrawal-layout-grid">
                <div className="card-ui balance-request-card">
                    <div className="balance-summary">
                        <span className="balance-label">Số dư khả dụng</span>
                        <h3 className="balance-amount">₫{balance.toLocaleString('vi-VN')}</h3>
                    </div>

                    <form onSubmit={handleRequest} className="request-form-ui">
                        <div className="input-group-ui">
                            <label>Số tiền muốn rút (VND)</label>
                            <div className="custom-input-box">
                                <input 
                                    type="text" 
                                    value={displayAmount} 
                                    onChange={handleAmountChange} 
                                    placeholder="Tối thiểu 50 000"
                                />
                                <span className="unit">₫</span>
                            </div>
                        </div>
                        <button type="submit" className="btn-main-shopee" disabled={submitting || !rawAmount}>
                            {submitting ? "ĐANG XỬ LÝ..." : "GỬI YÊU CẦU RÚT TIỀN"}
                        </button>
                    </form>
                    
                    {/* 🚀 FIXED: Better spacing and background for hint text */}
                    <div className="info-box-ui">
                        <FaExclamationCircle className="info-icon" />
                        <span>Tiền sẽ được chuyển vào tài khoản ngân hàng mặc định đã thiết lập.</span>
                    </div>
                </div>

                <div className="card-ui history-log-card">
                    <div className="card-header-ui">
                        <h3><FaHistory /> Lịch sử yêu cầu</h3>
                        <button className={`refresh-trigger ${refreshing ? 'is-syncing' : ''}`} onClick={fetchWithdrawalData}>
                            <FaSync />
                        </button>
                    </div>
                    <div className="history-scroller">
                        {history.length > 0 ? (
                            history.map((item) => (
                                <div key={item.id} className="log-item">
                                    <div className="log-main">
                                        <div className="log-amount">-₫{item.amount.toLocaleString('vi-VN')}</div>
                                        <div className="log-date">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                    <div className={`log-status-badge ${item.status.toLowerCase()}`}>
                                        {item.status === 'COMPLETED' ? <FaCheckCircle /> : item.status === 'PENDING' ? <FaClock /> : <FaTimesCircle />}
                                        <span>{item.status === 'COMPLETED' ? 'Thành công' : item.status === 'PENDING' ? 'Chờ duyệt' : 'Bị từ chối'}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">Chưa có lịch sử giao dịch.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Withdrawal;