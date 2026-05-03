import React, { useEffect, useState } from 'react';
// 🚀 ĐÃ XÓA: import AccountSidebar (Tránh lỗi double menu)
import { getMyWallet } from '../../services/walletService';
import { FaCoins, FaInfoCircle } from 'react-icons/fa';
import './VoucherWallet.css'; 

const CoinWallet = () => {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const data = await getMyWallet();
                setBalance(data?.coinBalance || 0);
            } catch (error) {
                console.error("Không thể tải số dư Xu", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWallet();
    }, []);

    return (
        <div className="profile-wrapper">
            <div className="container profile-container">
                {/* 🚀 ĐÃ XÓA: <AccountSidebar /> ở đây */}
                <main className="profile-main" style={{ width: '100%' }}>
                    <div className="profile-header">
                        <h2>AiNetsoft Xu</h2>
                        <p>Số dư điểm thưởng của bạn</p>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '30px', borderRadius: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '50%' }}>
                            <FaCoins size={40} color="#fef3c7" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Số dư hiện tại</p>
                            {loading ? (
                                <h1 style={{ margin: '5px 0 0 0', fontSize: '36px' }}>...</h1>
                            ) : (
                                <h1 style={{ margin: '5px 0 0 0', fontSize: '36px' }}>{balance.toLocaleString()} Xu</h1>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '16px', marginTop: 0 }}>
                            <FaInfoCircle color="#3b82f6" /> Hướng dẫn nhận Xu
                        </h3>
                        <ul style={{ color: '#475569', lineHeight: '1.8', fontSize: '14px', paddingLeft: '20px' }}>
                            <li>Mua sắm thành công trên AiNetsoft để nhận Xu tích lũy.</li>
                            <li>Đánh giá sản phẩm kèm hình ảnh/video để nhận thêm Xu thưởng.</li>
                            <li>Sử dụng Xu để giảm trực tiếp vào số tiền thanh toán cho các đơn hàng tiếp theo (100 Xu = 100đ).</li>
                        </ul>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CoinWallet;