import React, { useEffect, useState } from 'react';
// 🚀 ĐÃ XÓA: import AccountSidebar (Tránh lỗi double menu)
import { getMySavedVouchers, removeVoucher } from '../../services/walletService';
import { FaTicketAlt, FaTrash, FaShoppingBag } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './VoucherWallet.css';

const VoucherWallet = () => {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            const data = await getMySavedVouchers();
            setVouchers(data || []);
        } catch (error) {
            toast.error("Không thể tải Kho Voucher");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (voucherId: string) => {
        try {
            await removeVoucher(voucherId);
            setVouchers(vouchers.filter(v => v.id !== voucherId));
            toast.success("Đã xóa voucher khỏi kho");
        } catch (error) {
            toast.error("Lỗi khi xóa voucher");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="profile-wrapper">
            <div className="container profile-container">
                {/* 🚀 ĐÃ XÓA: <AccountSidebar /> ở đây */}
                <main className="profile-main" style={{ width: '100%' }}>
                    <div className="profile-header">
                        <h2>Kho Voucher</h2>
                        <p>Quản lý các mã giảm giá và ưu đãi của bạn</p>
                    </div>

                    {loading ? (
                        <div className="loading-state">Đang tải voucher...</div>
                    ) : vouchers.length === 0 ? (
                        <div className="empty-wallet">
                            <FaTicketAlt size={50} color="#cbd5e1" />
                            <p>Bạn chưa lưu mã giảm giá nào.</p>
                            <button className="btn-explore" onClick={() => navigate('/')}>Khám phá ngay</button>
                        </div>
                    ) : (
                        <div className="voucher-grid">
                            {vouchers.map(v => (
                                <div key={v.id} className="voucher-card">
                                    <div className="voucher-left">
                                        <FaShoppingBag size={24} color="#fff" />
                                        <span>{v.shopName || 'AiNetsoft'}</span>
                                    </div>
                                    <div className="voucher-right">
                                        <h4>{v.title}</h4>
                                        <p className="min-order">Đơn tối thiểu {v.minOrderValue.toLocaleString()}đ</p>
                                        <p className="expiry">HSD: {formatDate(v.validUntil)}</p>
                                        <div className="voucher-actions">
                                            <span className="voucher-code">{v.code}</span>
                                            <button className="btn-remove" onClick={() => handleRemove(v.id)} title="Bỏ lưu">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default VoucherWallet;