import React, { useState, useEffect } from 'react';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateShopSettings } from '../../services/authService';
import { 
    FaStore, FaMapMarkerAlt, FaShieldAlt, FaInfoCircle, 
    FaExternalLinkAlt, FaPhoneAlt, FaUserEdit, FaMap 
} from 'react-icons/fa';
import './SellerSettings.css';

// HELPER: Real-time Slug Preview (ORIGINAL LOGIC PRESERVED)
const slugify = (text: string) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

// HELPERS: Input Display Formatters (ORIGINAL LOGIC PRESERVED)
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
        shopName: '', shopDescription: '', shopSlug: '', lastShopNameChange: null, lowStockThreshold: 5, holidayMode: false, taxCode: '', businessLicenseUrl: ''
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
                    setShopData({ ...data.shopProfile });
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
                shopBio: shopData.shopDescription,
                taxCode: shopData.taxCode,
                lowStockThreshold: shopData.lowStockThreshold,
                holidayMode: shopData.holidayMode,
                stockAddresses: addresses.map(addr => ({
                    fullName: addr.receiverName,
                    phoneNumber: addr.phone,
                    province: addr.province,
                    ward: addr.ward,
                    hamlet: addr.hamlet,
                    detailAddress: addr.detail,
                    latitude: addr.latitude,
                    longitude: addr.longitude,
                    isDefault: addr.isDefault
                }))
            };
            formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
            if (newLicenseFile) formData.append('license', newLicenseFile);

            await updateShopSettings(formData);
            setToastMessage("Cập nhật thành công!");
            setShowToast(true);
            const updatedProfile = await getUserProfile();
            setShopData(updatedProfile.shopProfile);
        } catch (error: any) {
            setToastMessage(error.response?.data || "Cập nhật thất bại.");
            setShowToast(true);
        } finally { setIsSaving(false); }
    };

    return (
        /* 🚀 STABILITY FIX: Layout wrapper stays mounted */
        <main className="seller-settings-supreme-layout">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

            {/* 🚀 TYPOGRAPHY FIX: Header unified with MyProducts */}
            <div className="supreme-content-header centered-header">
                <h1><FaStore className="title-icon-gap" /> Thiết lập Shop</h1>
                <p>Tùy chỉnh nhận diện và kho vận GPS</p>
            </div>
            
            <hr className="supreme-divider" />

            {loading ? (
                <div className="loading-placeholder-seller">Đang tải cấu hình shop...</div>
            ) : (
                <div className="settings-scroll-view">
                    <section className="settings-section">
                        <h3 className="section-subtitle"><FaInfoCircle /> Nhận diện & URL</h3>
                        <div className="supreme-form-row vertical">
                            <label>Tên Shop <span className="req">*</span></label>
                            <div className="input-group-container">
                                <input 
                                    type="text" 
                                    className="supreme-input"
                                    disabled={daysUntilChange > 0}
                                    value={shopData.shopName} 
                                    onChange={(e) => setShopData({...shopData, shopName: e.target.value})} 
                                />
                                {daysUntilChange > 0 && <small className="input-hint red">Bạn có thể đổi tên lại sau {daysUntilChange} ngày nữa.</small>}
                            </div>
                        </div>

                        <div className="supreme-form-row vertical">
                            <label>Nice URL (Slug)</label>
                            <div className="slug-input-group">
                                <div className="slug-display">
                                    <span>localhost:5173/</span>
                                    <strong>{daysUntilChange > 0 ? shopData.shopSlug : (slugify(shopData.shopName) || 'dang-cap-nhat')}</strong>
                                </div>
                                <button className="slug-visit-btn" onClick={() => window.open(`/${shopData.shopSlug}`, '_blank')}>
                                    <FaExternalLinkAlt />
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="settings-section mt-30">
                        <h3 className="section-subtitle"><FaMapMarkerAlt /> Kho hàng ({addresses.length}/2)</h3>
                        <div className="warehouse-edit-grid">
                            {addresses.map((addr, idx) => (
                                <div key={idx} className="pro-warehouse-card">
                                    <div className="card-side-info">
                                        <div className="input-group-mini">
                                            <FaUserEdit className="mini-icon" />
                                            <input value={addr.receiverName} onChange={(e) => handleAddressUpdate(idx, 'receiverName', e.target.value)} placeholder="Tên kho" />
                                        </div>
                                        <div className="input-group-mini">
                                            <FaPhoneAlt className="mini-icon red-icon" />
                                            <input value={formatPhoneDisplay(addr.phone)} onChange={(e) => handleAddressUpdate(idx, 'phone', e.target.value)} placeholder="Số điện thoại" />
                                        </div>
                                        <div className="input-group-mini textarea-group">
                                            <FaMap className="mini-icon" />
                                            <textarea value={addr.detail} onChange={(e) => handleAddressUpdate(idx, 'detail', e.target.value)} placeholder="Địa chỉ chi tiết" />
                                        </div>
                                        <div className={`gps-pill ${(!addr.latitude || !addr.longitude) ? 'gps-missing' : ''}`}>
                                            {addr.latitude && addr.longitude ? `GPS Verified: ${addr.latitude}, ${addr.longitude}` : "Chưa xác định tọa độ"}
                                        </div>
                                    </div>
                                    <div className="card-side-qr">
                                        {addr.latitude && addr.longitude ? (
                                            <>
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent(`http://googleusercontent.com/maps.google.com/search/${addr.latitude},${addr.longitude}`)}`} alt="QR" />
                                                <span className="qr-label">SCAN GPS</span>
                                            </>
                                        ) : (
                                            <div className="no-gps-box"><FaMapMarkerAlt size={30} /><p>NO GPS</p></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="settings-section mt-30 compliance-box">
                        <h3 className="section-subtitle"><FaShieldAlt /> Thông tin Pháp lý</h3>
                        <div className="legal-info-grid">
                            <div className="legal-item">
                                <label>Mã số thuế</label>
                                <input 
                                    type="text" 
                                    className="mst-input-clean"
                                    value={formatMSTDisplay(shopData.taxCode)} 
                                    onChange={(e) => setShopData({...shopData, taxCode: e.target.value.replace(/\s/g, '')})} 
                                />
                            </div>
                            <div className="legal-item">
                                <label>Giấy phép kinh doanh</label>
                                <div className="license-upload-clean">
                                    <img src={shopData.businessLicenseUrl ? `http://localhost:8080${shopData.businessLicenseUrl}` : 'https://placehold.co/120x80?text=GPKD'} alt="GPKD" />
                                    <input type="file" onChange={(e) => setNewLicenseFile(e.target.files ? e.target.files[0] : null)} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="form-actions-row">
                        <button className="save-btn-supreme" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Đang xử lý..." : "Lưu thiết lập"}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SellerSettings;