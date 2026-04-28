import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { FaWallet, FaHistory, FaCheckCircle, FaClock, FaTimesCircle, FaExclamationCircle, FaSync, FaUniversity } from 'react-icons/fa';
import './Withdrawal.css';

const Withdrawal = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [displayAmount, setDisplayAmount] = useState(''); 
    const [rawAmount, setRawAmount] = useState('');       
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); 
    const [submitting, setSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [missingBank, setMissingBank] = useState(false); // 🚀 Thêm state báo thiếu ngân hàng

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
            
            const sortedHistory = historyRes.data.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setHistory(sortedHistory);
            setMissingBank(false);
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
            setToastMessage("Số tiền tối thiểu là 50.000₫");
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
            const errorMsg = err.response?.data?.message || "Lỗi hệ thống.";
            setToastMessage(errorMsg);
            setShowToast(true);
            // 🚀 Bắt chính xác lỗi từ Backend để hướng dẫn User
            if (errorMsg.includes("chưa thêm tài khoản ngân hàng")) {
                setMissingBank(true);
            }
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

                    {missingBank ? (
                        <div className="missing-bank-alert" style={{ background: '#fff1f0', border: '1px solid #ffa39e', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
                            <FaUniversity style={{ fontSize: '30px', color: '#f5222d', marginBottom: '10px' }} />
                            <p style={{ color: '#cf1322', fontWeight: 600, marginBottom: '15px' }}>Bạn chưa thiết lập Tài khoản ngân hàng!</p>
                            <button onClick={() => navigate('/user/bank')} style={{ background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Thêm Tài khoản Ngân hàng ngay
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRequest} className="request-form-ui">
                            <div className="input-group-ui">
                                <label>Số tiền muốn rút (VND)</label>
                                <div className="custom-input-box">
                                    <input 
                                        type="text" 
                                        value={displayAmount} 
                                        onChange={handleAmountChange} 
                                        placeholder="Tối thiểu 50.000"
                                    />
                                    <span className="unit">₫</span>
                                </div>
                            </div>
                            <button type="submit" className="btn-main-shopee" disabled={submitting || !rawAmount}>
                                {submitting ? "ĐANG XỬ LÝ..." : "GỬI YÊU CẦU RÚT TIỀN"}
                            </button>
                        </form>
                    )}
                    
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
                                        <span>{item.status === 'COMPLETED' ? 'Thành công' : item.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}</span>
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