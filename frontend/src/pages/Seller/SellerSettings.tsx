import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateShopSettings } from '../../services/authService';
import { FaStore, FaMapMarkerAlt, FaShieldAlt, FaInfoCircle, FaFileInvoice, FaExternalLinkAlt, FaPhoneAlt, FaUserEdit, FaMap } from 'react-icons/fa';
import './SellerSettings.css';

// HELPER: Real-time Slug Preview
const slugify = (text: string) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

// HELPERS: Input Display Formatters
const formatPhoneDisplay = (val: string) => {
    const s = val.replace(/\D/g, '');
    if (s.length <= 3) return s;
    if (s.length <= 6) return `${s.slice(0, 3)} ${s.slice(3)}`;
    return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 10)}`;
};

const formatMSTDisplay = (val: string) => {
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
    }, []);

    const handleAddressUpdate = (index: number, field: string, value: string) => {
        const updated = [...addresses];
        // Strip spaces before saving to state
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

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="profile-wrapper">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            <div className="container profile-container">
                <AccountSidebar />
                <main className="profile-main-content">
                    <div className="content-header">
                        <div className="header-with-icon">
                            <FaStore className="header-icon" />
                            <div>
                                <h1>Thiết lập Shop</h1>
                                <p>Tùy chỉnh nhận diện và kho vận GPS</p>
                            </div>
                        </div>
                    </div>
                    <hr className="divider" />

                    {/* 1. IDENTITY & NICE URL */}
                    <section className="settings-section">
                        <h3 className="section-subtitle"><FaInfoCircle /> Nhận diện & URL</h3>
                        <div className="form-row">
                            <label>Tên Shop <span className="required-star">*</span></label>
                            <input 
                                type="text" 
                                className="shop-textarea" // Using shared styling
                                style={{ height: 'auto', minHeight: '40px' }}
                                disabled={daysUntilChange > 0}
                                value={shopData.shopName} 
                                onChange={(e) => setShopData({...shopData, shopName: e.target.value})} 
                            />
                        </div>

                        <div className="form-row">
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

                    {/* 2. EDITABLE WAREHOUSES */}
                    <section className="settings-section mt-30">
                        <h3 className="section-subtitle"><FaMapMarkerAlt /> Kho hàng ({addresses.length}/2)</h3>
                        <div className="warehouse-edit-grid">
                            {addresses.map((addr, idx) => (
                                <div key={idx} className="pro-warehouse-card">
                                    <div className="card-side-info">
                                        <div className="input-group-mini">
                                            <FaUserEdit />
                                            <input 
                                                value={addr.receiverName} 
                                                onChange={(e) => handleAddressUpdate(idx, 'receiverName', e.target.value)}
                                                placeholder="Tên kho"
                                            />
                                        </div>
                                        <div className="input-group-mini">
                                            <FaPhoneAlt />
                                            <input 
                                                /* FIX: Display formatted but save clean */
                                                value={formatPhoneDisplay(addr.phone)} 
                                                onChange={(e) => handleAddressUpdate(idx, 'phone', e.target.value)}
                                                placeholder="Số điện thoại"
                                            />
                                        </div>
                                        <div className="input-group-mini textarea-group">
                                            <FaMap />
                                            <textarea 
                                                value={addr.detail} 
                                                onChange={(e) => handleAddressUpdate(idx, 'detail', e.target.value)}
                                                placeholder="Địa chỉ chi tiết"
                                            />
                                        </div>
                                        {/* FIX: Handle missing GPS values gracefully */}
                                        <div className={`gps-pill ${(!addr.latitude || !addr.longitude) ? 'gps-missing' : ''}`}>
                                            {addr.latitude && addr.longitude 
                                                ? `GPS Verified: ${addr.latitude}, ${addr.longitude}` 
                                                : "Chưa xác định tọa độ"}
                                        </div>
                                    </div>
                                    <div className="card-side-qr">
                                        {/* FIX: Conditional QR rendering */}
                                        {addr.latitude && addr.longitude ? (
                                            <>
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent(`http://googleusercontent.com/maps.google.com/search/${addr.latitude},${addr.longitude}`)}`} alt="QR" />
                                                <span>SCAN GPS</span>
                                            </>
                                        ) : (
                                            <div className="qr-placeholder">
                                                <FaMapMarkerAlt />
                                                <span>NO GPS</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. LEGAL FIX */}
                    <section className="settings-section mt-30 compliance-box">
                        <h3 className="section-subtitle"><FaShieldAlt /> Thông tin Pháp lý</h3>
                        <div className="legal-info-grid">
                            <div className="legal-item">
                                <label>Mã số thuế</label>
                                <input 
                                    type="text" 
                                    className="mst-input-clean"
                                    /* FIX: Display formatted MST */
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
                        <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Đang xử lý..." : "Lưu thiết lập"}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SellerSettings;