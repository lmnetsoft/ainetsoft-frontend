import React, { useState, useEffect } from 'react';
import { FaTicketAlt, FaPlus, FaTimes, FaBan, FaCheckCircle } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import ToastNotification from '../../components/Toast/ToastNotification';
import { toast } from 'react-hot-toast';

const AdminVouchers = () => {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        discountType: 'FIXED',
        discountValue: '',
        maxDiscountAmount: '',
        minOrderValue: '',
        usageLimit: '',
        validFrom: '',
        validUntil: ''
    });

    useEffect(() => {
        fetchVouchers();
        document.title = "Quản lý Voucher Toàn Sàn | AiNetsoft Admin";
    }, []);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllPlatformVouchers();
            setVouchers(data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách Voucher");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                discountValue: Number(formData.discountValue),
                maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : 0,
                minOrderValue: Number(formData.minOrderValue),
                usageLimit: Number(formData.usageLimit)
            };
            
            await adminService.createPlatformVoucher(payload);
            toast.success("Tạo mã Voucher toàn sàn thành công!");
            setShowModal(false);
            fetchVouchers(); // Refresh list
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi tạo Voucher");
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn kết thúc sớm mã Voucher này?')) return;
        try {
            await adminService.deactivatePlatformVoucher(id);
            toast.success("Đã khóa mã Voucher thành công");
            fetchVouchers();
        } catch (error) {
            toast.error("Không thể khóa mã Voucher");
        }
    };

    return (
        <div className="admin-main-view" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FaTicketAlt color="#ee4d2d" /> Voucher Toàn Sàn</h2>
                    <p style={{ color: '#64748b' }}>Quản lý các chiến dịch khuyến mãi áp dụng trên toàn hệ thống AiNetsoft.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{ background: '#ee4d2d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                >
                    <FaPlus /> Tạo Voucher Mới
                </button>
            </div>

            <div className="admin-table-container" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '15px' }}>Mã Voucher</th>
                                <th style={{ padding: '15px' }}>Tên chiến dịch</th>
                                <th style={{ padding: '15px' }}>Mức Giảm</th>
                                <th style={{ padding: '15px' }}>Đơn tối thiểu</th>
                                <th style={{ padding: '15px' }}>Đã dùng / Tổng</th>
                                <th style={{ padding: '15px' }}>Trạng thái</th>
                                <th style={{ padding: '15px', textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>{v.code}</td>
                                    <td style={{ padding: '15px', color: '#334155' }}>{v.title}</td>
                                    <td style={{ padding: '15px', color: '#ee4d2d', fontWeight: 'bold' }}>
                                        {v.discountType === 'PERCENTAGE' ? `${v.discountValue}% (Tối đa ${v.maxDiscountAmount}đ)` : `${v.discountValue.toLocaleString()}đ`}
                                    </td>
                                    <td style={{ padding: '15px' }}>{v.minOrderValue.toLocaleString()}đ</td>
                                    <td style={{ padding: '15px' }}>{v.usedCount} / {v.usageLimit}</td>
                                    <td style={{ padding: '15px' }}>
                                        {v.active ? <span style={{ color: '#10b981', fontWeight: 'bold' }}><FaCheckCircle/> Đang chạy</span> : <span style={{ color: '#ef4444' }}>Đã kết thúc</span>}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'right' }}>
                                        {v.active && (
                                            <button onClick={() => handleDeactivate(v.id)} style={{ background: '#fff', border: '1px solid #ef4444', color: '#ef4444', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                <FaBan /> Khóa
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {vouchers.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Chưa có mã Voucher toàn sàn nào được tạo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Tạo Voucher */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Phát hành Voucher Toàn Sàn</h3>
                            <FaTimes style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowModal(false)} />
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Mã Code (VD: FREESHIP, SALET12)</label>
                                    <input type="text" name="code" value={formData.code} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Tên Chiến Dịch</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Loại Giảm Giá</label>
                                    <select name="discountType" value={formData.discountType} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                        <option value="FIXED">Giảm số tiền cố định</option>
                                        <option value="PERCENTAGE">Giảm theo %</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Mức Giảm (Số Tiền hoặc %)</label>
                                    <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Giảm Tối Đa (VNĐ)</label>
                                    <input type="number" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleInputChange} placeholder="Dành cho giảm %" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Đơn Tối Thiểu</label>
                                    <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Số Lượt Dùng</label>
                                    <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Thời gian Bắt đầu</label>
                                    <input type="datetime-local" name="validFrom" value={formData.validFrom} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Thời gian Kết thúc</label>
                                    <input type="datetime-local" name="validUntil" value={formData.validUntil} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Phát Hành Ngay</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVouchers;