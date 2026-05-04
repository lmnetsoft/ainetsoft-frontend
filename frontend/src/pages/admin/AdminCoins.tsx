import React, { useState, useEffect } from 'react';
import { FaCoins, FaPercent, FaUserEdit } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';

const AdminCoins = () => {
    const [stats, setStats] = useState({ totalCoinsInCirculation: 0, totalWallets: 0 });
    const [cashbackRate, setCashbackRate] = useState(1); 
    const [loading, setLoading] = useState(false);

    // Form tặng Xu
    const [adjustData, setAdjustData] = useState({ userId: '', amount: '', reason: '' });

    useEffect(() => {
        fetchData();
        document.title = "Quản lý Xu Hệ thống | AiNetsoft Admin";
    }, []);

    const fetchData = async () => {
        try {
            const data = await adminService.getCoinStats();
            setStats(data);
        } catch (error) {
            toast.error("Lỗi tải thống kê Xu hệ thống");
        }
    };

    const handleSaveConfig = async () => {
        try {
            setLoading(true);
            await adminService.updatePlatformConfig({ cashbackRate: cashbackRate / 100 });
            toast.success("Đã cập nhật tỷ lệ hoàn Xu toàn sàn!");
        } catch (e) {
            toast.error("Lỗi cập nhật cấu hình");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustCoins = async () => {
        if (!adjustData.userId || !adjustData.amount) return;
        try {
            await adminService.adjustUserCoins({
                userId: adjustData.userId,
                amount: Number(adjustData.amount),
                reason: adjustData.reason || 'Điều chỉnh từ Ban Quản Trị'
            });
            toast.success("Điều chỉnh Xu thành công!");
            setAdjustData({ userId: '', amount: '', reason: '' });
            fetchData(); // Cập nhật lại số liệu
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Lỗi thao tác");
        }
    };

    return (
        <div className="admin-main-view" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2><FaCoins color="#f1c40f" /> Quản lý AiNetsoft Xu</h2>
                <p style={{ color: '#64748b' }}>Theo dõi dòng tiền ảo và cấu hình chính sách hoàn tiền toàn hệ thống.</p>
            </div>

            {/* BOX THỐNG KÊ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>TỔNG XU ĐANG LƯU HÀNH</span>
                    <h3 style={{ fontSize: '28px', margin: '10px 0', color: '#1e293b' }}>
                        {stats.totalCoinsInCirculation.toLocaleString()} <small style={{ fontSize: '14px' }}>Xu</small>
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>≈ {(stats.totalCoinsInCirculation).toLocaleString()} VNĐ nợ hệ thống</p>
                </div>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>TỔNG SỐ VÍ CÓ XU</span>
                    <h3 style={{ fontSize: '28px', margin: '10px 0', color: '#1e293b' }}>
                        {stats.totalWallets.toLocaleString()} <small style={{ fontSize: '14px' }}>Ví</small>
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>Dựa trên tổng số người dùng thực tế</p>
                </div>
            </div>

            {/* CẤU HÌNH TỶ LỆ HOÀN TIỀN */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaPercent color="#3498db" /> Chính sách Hoàn Xu (Cashback)
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Tỷ lệ hoàn tiền (%)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="number" 
                                value={cashbackRate} 
                                onChange={(e) => setCashbackRate(Number(e.target.value))}
                                style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '120px', fontSize: '16px' }}
                            />
                            <span style={{ fontWeight: 'bold' }}>% giá trị đơn hàng</span>
                        </div>
                        <p style={{ marginTop: '10px', color: '#64748b', fontSize: '13px' }}>
                            * Khi đơn hàng COMPLETED, hệ thống sẽ tự động cộng số Xu này vào ví người mua.
                        </p>
                    </div>
                    <button 
                        onClick={handleSaveConfig}
                        disabled={loading}
                        style={{ padding: '12px 30px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {loading ? 'Đang lưu...' : 'Cập nhật chính sách'}
                    </button>
                </div>
            </div>

            {/* CÔNG CỤ TẶNG XU (CUSTOMER SERVICE) */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '30px' }}>
                <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaUserEdit color="#e67e22" /> Thưởng/Trừ Xu Thủ Công
                </h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Dùng để đền bù cho khách hàng khi có sự cố đơn hàng hoặc thu hồi Xu sai lệch.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.5fr', gap: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="ID Người dùng (userId)" 
                        value={adjustData.userId} 
                        onChange={(e) => setAdjustData({...adjustData, userId: e.target.value})}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                    />
                    <input 
                        type="number" 
                        placeholder="Số Xu (VD: 1000 hoặc -500)" 
                        value={adjustData.amount} 
                        onChange={(e) => setAdjustData({...adjustData, amount: e.target.value})}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                    />
                    <input 
                        type="text" 
                        placeholder="Lý do báo cho khách" 
                        value={adjustData.reason} 
                        onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
                        style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                    />
                    <button 
                        onClick={handleAdjustCoins}
                        style={{ background: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Thực hiện
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminCoins;