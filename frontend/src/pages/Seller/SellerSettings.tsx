import React, { useState, useEffect } from 'react';
import { 
    FaStore, FaMapMarkerAlt, FaShieldAlt, FaInfoCircle, 
    FaExternalLinkAlt, FaPhoneAlt, FaUserEdit, FaMap, FaCloudUploadAlt, FaFileInvoice, FaHourglassHalf 
} from 'react-icons/fa';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateShopSettings } from '../../services/authService';
import './SellerSettings.css';

const slugify = (text: string) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

const formatPhoneDisplay = (val: string) => {
    if (!val) return ""; 
    const s = val.replace(/\D/g, '');
    if (s.length <= 3) return s;
    if (s.length <= 6) return `${s.slice(0, 3)} ${s.slice(3)}`;
    return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 10)}`;
};

const formatMSTDisplay = (val: string) => {
    if (!val) return ""; 
    const s = val.replace(/\D/g, '');
    return s.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
};

const SellerSettings = () => {
    const [shopData, setShopData] = useState<any>({
        shopName: '', shopDescription: '', shopSlug: '', taxCode: '', businessLicenseUrl: '',
        hasPendingUpdate: false 
    });
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [newLicenseFile, setNewLicenseFile] = useState<File | null>(null);
    const [daysUntilChange, setDaysUntilChange] = useState(0);

    useEffect(() => {
        const fetchShopInfo = async () => {
            try {
                setLoading(true);
                const data = await getUserProfile();
                if (data.shopProfile) {
                    setShopData({ ...data.shopProfile, hasPendingUpdate: data.hasPendingUpdate });
                    setAddresses(data.addresses || []);
                    if (data.shopProfile.lastShopNameChange) {
                        const lastDate = new Date(data.shopProfile.lastShopNameChange);
                        const nextDate = new Date(lastDate);
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        const diffDays = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        setDaysUntilChange(diffDays > 0 ? diffDays : 0);
                    }
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchShopInfo();
        document.title = "Thiết lập Shop | AiNetsoft";
    }, []);

    const handleAddressUpdate = (index: number, field: string, value: string) => {
        const updated = [...addresses];
        const cleanValue = (field === 'phone') ? value.replace(/\s/g, '') : value;
        updated[index] = { ...updated[index], [field]: cleanValue };
        setAddresses(updated);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const formData = new FormData();
            const payload = {
                shopName: shopData.shopName,
                taxCode: shopData.taxCode,
                shopBio: shopData.shopDescription,
                lowStockThreshold: shopData.lowStockThreshold || 5,
                holidayMode: shopData.holidayMode || false,
                stockAddresses: addresses.map(addr => ({
                    fullName: addr.receiverName,
                    phoneNumber: addr.phone,
                    detailAddress: addr.detail,
                    latitude: addr.latitude,
                    longitude: addr.longitude,
                    isDefault: addr.isDefault
                }))
            };
            formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
            if (newLicenseFile) formData.append('license', newLicenseFile);
            
            await updateShopSettings(formData);
            
            setToastMessage(shopData.hasPendingUpdate ? "Yêu cầu đã được gửi cho Admin!" : "Cập nhật thành công!");
            setShowToast(true);
            
            // Re-fetch to show banner if diverted to pending
            const updated = await getUserProfile();
            setShopData({ ...updated.shopProfile, hasPendingUpdate: updated.hasPendingUpdate });
        } catch (error: any) { 
            setToastMessage(error.response?.data || "Lỗi lưu thiết lập.");
            setShowToast(true);
        } finally { setIsSaving(false); }
    };

    return (
        <main className="seller-settings-supreme-layout">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

            <div className="supreme-content-header">
                <h1><FaStore /> THIẾT LẬP CỬA HÀNG</h1>
                <p>Quản lý nhận diện và cấu hình kho vận</p>
            </div>
            
            <hr className="supreme-divider" />

            {shopData.hasPendingUpdate && (
                <div style={{
                    background: '#fffbe6', border: '1px solid #ffe58f', padding: '12px 20px', 
                    borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px',
                    color: '#856404', fontSize: '13px', fontWeight: '700'
                }}>
                    <FaHourglassHalf color="#faad14" />
                    <span>Hồ sơ đang chờ duyệt. Thay đổi mới nhất sẽ hiển thị sau khi Admin chấp nhận.</span>
                </div>
            )}

            {loading ? <p style={{textAlign:'center', padding:'40px'}}>Đang tải cấu hình...</p> : (
                <div className="settings-scroll-view">
                    
                    <section className="settings-section">
                        <h3 className="section-subtitle"><FaInfoCircle /> NHẬN DIỆN & URL</h3>
                        <div className="supreme-form-row">
                            <label>TÊN HIỂN THỊ CỬA HÀNG</label>
                            <input 
                                className="supreme-input"
                                value={shopData.shopName} 
                                disabled={daysUntilChange > 0 || shopData.hasPendingUpdate}
                                onChange={(e) => setShopData({...shopData, shopName: e.target.value})} 
                            />
                        </div>
                        <div className="supreme-form-row">
                            <label>URL SHOP (SLUG)</label>
                            <div className="slug-input-group">
                                <div className="slug-display">
                                    <span>localhost:5173/</span>
                                    <strong>{daysUntilChange > 0 ? shopData.shopSlug : slugify(shopData.shopName)}</strong>
                                </div>
                                <button className="slug-visit-btn" title="Xem cửa hàng"><FaExternalLinkAlt size={12}/></button>
                            </div>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h3 className="section-subtitle"><FaMapMarkerAlt /> QUẢN LÝ KHO HÀNG ({addresses.length}/2)</h3>
                        <div className="warehouse-edit-grid">
                            {addresses.map((addr, idx) => (
                                <div key={idx} className="pro-warehouse-card">
                                    <div style={{flex: 1}}>
                                        <div className="input-group-mini">
                                            <FaUserEdit className="icon-user" />
                                            <input value={addr.receiverName} disabled={shopData.hasPendingUpdate} onChange={(e) => handleAddressUpdate(idx, 'receiverName', e.target.value)} />
                                        </div>
                                        <div className="input-group-mini">
                                            <FaPhoneAlt className="icon-phone" />
                                            <input value={formatPhoneDisplay(addr.phone)} disabled={shopData.hasPendingUpdate} onChange={(e) => handleAddressUpdate(idx, 'phone', e.target.value)} />
                                        </div>
                                        <div className="input-group-mini">
                                            <FaMap className="icon-map" />
                                            <textarea value={addr.detail} rows={1} disabled={shopData.hasPendingUpdate} onChange={(e) => handleAddressUpdate(idx, 'detail', e.target.value)} />
                                        </div>
                                        <div className="gps-pill">
                                            📍 GPS: {Number(addr.latitude || 0).toFixed(4)}, {Number(addr.longitude || 0).toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="settings-section compliance-box">
                        <h3 className="section-subtitle"><FaShieldAlt /> THÔNG TIN PHÁP LÝ</h3>
                        <div className="legal-info-grid">
                            <div className="legal-item">
                                <label><FaFileInvoice className="icon-tax" /> MÃ SỐ THUẾ</label>
                                <input 
                                    className="mst-input-clean"
                                    value={formatMSTDisplay(shopData.taxCode)} 
                                    disabled={shopData.hasPendingUpdate}
                                    onChange={(e) => setShopData({...shopData, taxCode: e.target.value.replace(/\s/g, '')})} 
                                />
                            </div>
                            <div className="legal-item">
                                <label><FaShieldAlt className="icon-license" /> GIẤY PHÉP KINH DOANH</label>
                                <div className="license-upload-clean">
                                    <div className="license-preview-box">
                                        <img src={shopData.businessLicenseUrl ? `http://localhost:8080${shopData.businessLicenseUrl}` : 'https://placehold.co/100x70?text=GPKD'} alt="GPKD" />
                                    </div>
                                    <label className="license-upload-btn" style={{opacity: shopData.hasPendingUpdate ? 0.5 : 1}}>
                                        <FaCloudUploadAlt /> THAY ĐỔI
                                        <input type="file" hidden disabled={shopData.hasPendingUpdate} onChange={(e) => setNewLicenseFile(e.target.files ? e.target.files[0] : null)} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="form-actions-row">
                        <button className="save-btn-supreme" onClick={handleSave} disabled={isSaving || shopData.hasPendingUpdate}>
                            {isSaving ? "ĐANG GỬI..." : shopData.hasPendingUpdate ? "ĐANG CHỜ DUYỆT" : "LƯU TẤT CẢ THIẾT LẬP"}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SellerSettings;