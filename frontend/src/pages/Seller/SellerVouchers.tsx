import React, { useState, useEffect } from 'react';
import { FaTicketAlt, FaPlus, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import './SellerDashboard.css'; 

const SellerVouchers = () => {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        discountType: 'FIXED_AMOUNT',
        discountValue: 0,
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 100,
        validFrom: '',
        validUntil: ''
    });

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/vouchers/seller/my-vouchers');
            setVouchers(response.data || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách voucher", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Ensure dates are in standard ISO format for the backend
            const payload = {
                ...formData,
                validFrom: new Date(formData.validFrom).toISOString(),
                validUntil: new Date(formData.validUntil).toISOString()
            };

            await api.post('/vouchers/seller/create', payload);
            
            setToastMessage("Tạo Voucher thành công!");
            setShowToast(true);
            setShowCreateModal(false);
            
            // Reset form
            setFormData({
                code: '', title: '', discountType: 'FIXED_AMOUNT', discountValue: 0,
                minOrderValue: 0, maxDiscountAmount: 0, usageLimit: 100, validFrom: '', validUntil: ''
            });
            
            fetchVouchers();
        } catch (error: any) {
            setToastMessage(error.response?.data?.message || "Lỗi khi tạo voucher");
            setShowToast(true);
        }
    };

    const deactivateVoucher = async (id: string) => {
        if(!window.confirm("Bạn có chắc muốn kết thúc sớm voucher này?")) return;
        try {
            await api.put(`/vouchers/seller/deactivate/${id}`);
            setToastMessage("Đã kết thúc voucher.");
            setShowToast(true);
            fetchVouchers();
        } catch (error) {
            setToastMessage("Lỗi khi kết thúc voucher.");
            setShowToast(true);
        }
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="seller-dashboard-wrapper">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2>Kênh Marketing: Quản lý Voucher</h2>
                    <p style={{ color: '#64748b' }}>Tạo mã giảm giá để thu hút khách hàng và tăng doanh thu.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    style={{ background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                >
                    <FaPlus /> Tạo Voucher Mới
                </button>
            </div>

            <div className="table-container" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>MÃ VOUCHER</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>TÊN CHƯƠNG TRÌNH</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>MỨC GIẢM</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>ĐÃ DÙNG</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>THỜI GIAN</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>Đang tải dữ liệu...</td></tr>
                        ) : vouchers.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Bạn chưa có voucher nào. Hãy tạo mới ngay!</td></tr>
                        ) : (
                            vouchers.map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#ee4d2d' }}>{v.code}</td>
                                    <td style={{ padding: '15px' }}>{v.title}</td>
                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 600 }}>
                                        {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}đ`}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>{v.usedCount} / {v.usageLimit}</td>
                                    <td style={{ padding: '15px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                                        {formatDate(v.validFrom)} - {formatDate(v.validUntil)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {v.isActive ? 
                                            <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang chạy</span> : 
                                            <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã kết thúc</span>
                                        }
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {v.isActive && (
                                            <button 
                                                onClick={() => deactivateVoucher(v.id)}
                                                style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                Kết thúc sớm
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL TẠO VOUCHER */}
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '600px', borderRadius: '8px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Tạo Voucher Mới</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}><FaTimes /></button>
                        </div>

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Mã Voucher (Code) *</label>
                                <input type="text" required maxLength={10} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="VD: SUMMER20" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Tên chương trình *</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="VD: Giảm 20k cho đơn từ 100k" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Loại giảm giá</label>
                                    <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                        <option value="FIXED_AMOUNT">Theo số tiền (VNĐ)</option>
                                        <option value="PERCENTAGE">Theo phần trăm (%)</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Mức giảm *</label>
                                    <input type="number" required min={1} value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Đơn tối thiểu (VNĐ)</label>
                                    <input type="number" min={0} value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Giảm tối đa (VNĐ) - Nếu chọn %</label>
                                    <input type="number" min={0} value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: Number(e.target.value)})} disabled={formData.discountType === 'FIXED_AMOUNT'} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: formData.discountType === 'FIXED_AMOUNT' ? '#f1f5f9' : '#fff' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Thời gian bắt đầu *</label>
                                    <input type="datetime-local" required value={formData.validFrom} onChange={e => setFormData({...formData, validFrom: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Thời gian kết thúc *</label>
                                    <input type="datetime-local" required value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>Lượt sử dụng tối đa</label>
                                <input type="number" min={1} value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Xác nhận tạo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerVouchers;