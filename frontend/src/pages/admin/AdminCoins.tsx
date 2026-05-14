import React, { useState, useEffect } from 'react';
import { FaCoins, FaUserEdit } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';
import './AdminCoins.css';

/**
 * 🚀 ĐÃ CẬP NHẬT: Trang Quản lý Xu nay chỉ tập trung vào Thống kê và Vận hành.
 * Phần cấu hình tỷ lệ hoàn tiền (Policy) đã được chuyển sang trang Cấu hình Tài chính để đảm bảo an toàn.
 */
const AdminCoins = () => {
    const [stats, setStats] = useState({ totalCoinsInCirculation: 0, totalWallets: 0 });
    const [loading, setLoading] = useState(false);
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

    const handleAdjustCoins = async () => {
        if (!adjustData.userId || !adjustData.amount) {
            toast.error("Vui lòng nhập đầy đủ ID người dùng và số Xu.");
            return;
        }
        
        try {
            setLoading(true);
            await adminService.adjustUserCoins({
                userId: adjustData.userId,
                amount: Number(adjustData.amount),
                reason: adjustData.reason || 'Điều chỉnh từ Ban Quản Trị'
            });
            toast.success("Điều chỉnh Xu thành công!");
            setAdjustData({ userId: '', amount: '', reason: '' });
            fetchData(); // Cập nhật lại số liệu thống kê
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Lỗi thao tác điều chỉnh Xu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-coins-container">
            {/* 🚀 HEADER CHUẨN: CĂN GIỮA, IN HOA, MÀU ĐỎ */}
            <div className="admin-coins-header">
                <h2><FaCoins style={{ color: '#f1c40f' }} /> Quản lý AiNetsoft Xu</h2>
                <p>Theo dõi dòng tiền ảo lưu hành và thực hiện các tác vụ điều chỉnh thủ công.</p>
            </div>

            {/* BOX THỐNG KÊ (Dữ liệu Vận hành) */}
            <div className="coins-stats-grid">
                <div className="coin-stat-card">
                    <span className="stat-label">TỔNG XU ĐANG LƯU HÀNH</span>
                    <h3 className="stat-value">
                        {stats.totalCoinsInCirculation.toLocaleString()} <small>Xu</small>
                    </h3>
                    <p className="stat-hint">≈ {(stats.totalCoinsInCirculation).toLocaleString()} VNĐ nợ hệ thống</p>
                </div>
                <div className="coin-stat-card">
                    <span className="stat-label">TỔNG SỐ VÍ CÓ XU</span>
                    <h3 className="stat-value">
                        {stats.totalWallets.toLocaleString()} <small>Ví</small>
                    </h3>
                    <p className="stat-hint">Dựa trên tổng số người dùng có ví trên hệ thống</p>
                </div>
            </div>

            {/* CÔNG CỤ TẶNG/TRỪ XU (Tác vụ Vận hành/CSKH) */}
            <div className="coin-management-card">
                <h4 className="card-title">
                    <FaUserEdit color="#e67e22" /> Thưởng/Trừ Xu Thủ Công
                </h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                    Sử dụng công cụ này để đền bù cho khách hàng khi có sự cố đơn hàng hoặc thu hồi Xu phát sinh sai lệch.
                </p>
                <div className="adjust-grid">
                    <input 
                        type="text" 
                        className="adjust-input"
                        placeholder="ID Người dùng (userId)" 
                        value={adjustData.userId} 
                        onChange={(e) => setAdjustData({...adjustData, userId: e.target.value})}
                    />
                    <input 
                        type="number" 
                        className="adjust-input"
                        placeholder="Số Xu (VD: 1000 hoặc -500)" 
                        value={adjustData.amount} 
                        onChange={(e) => setAdjustData({...adjustData, amount: e.target.value})}
                    />
                    <input 
                        type="text" 
                        className="adjust-input"
                        placeholder="Lý do (Báo cho khách hàng)" 
                        value={adjustData.reason} 
                        onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
                    />
                    <button 
                        className="btn-adjust-coin"
                        onClick={handleAdjustCoins}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Thực hiện'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminCoins;
