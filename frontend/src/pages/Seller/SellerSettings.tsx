import React, { useState, useEffect, useMemo } from 'react';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateShopSettings } from '../../services/authService';
import { 
    FaStore, FaMapMarkerAlt, FaShieldAlt, FaInfoCircle, 
    FaExternalLinkAlt, FaPhoneAlt, FaUserEdit, FaMap, FaHourglassHalf,
    FaBriefcase, FaImage 
} from 'react-icons/fa';
import './SellerSettings.css';

import ainetsoftLogo from '../../assets/images/logo.png';

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
        shopName: '', 
        shopDescription: '', 
        shopSlug: '', 
        lastShopNameChange: null, 
        lowStockThreshold: 5, 
        holidayMode: false, 
        taxCode: '', 
        businessLicenseUrl: '',
        shopLogoUrl: '',
        businessType: 'INDIVIDUAL', 
        hasPendingUpdate: false 
    });

    const [initialData, setInitialData] = useState<any>(null);
    const [initialAddresses, setInitialAddresses] = useState<string>("");

    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [newLicenseFile, setNewLicenseFile] = useState<File | null>(null);
    const [daysUntilChange, setDaysUntilChange] = useState(0);

    const API_BASE_URL = "http://localhost:8080";

    const isMSTInvalid = useMemo(() => {
        const digits = (shopData.taxCode || "").replace(/\D/g, '');
        return digits.length > 0 && digits.length !== 10 && digits.length !== 13;
    }, [shopData.taxCode]);

    const hasDuplicatePhones = addresses.length > 1 && 
                               addresses[0].phone && 
                               addresses[1].phone && 
                               addresses[0].phone.replace(/\s/g, '') === addresses[1].phone.replace(/\s/g, '');

    const hasInvalidPhones = addresses.some(addr => {
        const digits = (addr.phone || "").replace(/\s/g, '');
        return digits.length > 0 && digits.length !== 10;
    });

    const hasActualChanges = useMemo(() => {
        if (newLogoFile || newLicenseFile) return true;
        if (!initialData) return false;

        const currentAddrStr = JSON.stringify(addresses);
        if (currentAddrStr !== initialAddresses) return true;

        return (
            shopData.shopName !== initialData.shopName ||
            shopData.shopDescription !== initialData.shopDescription ||
            shopData.taxCode !== initialData.taxCode ||
            shopData.businessType !== initialData.businessType ||
            shopData.lowStockThreshold !== initialData.lowStockThreshold ||
            shopData.holidayMode !== initialData.holidayMode
        );
    }, [shopData, addresses, newLogoFile, newLicenseFile, initialData, initialAddresses]);

    useEffect(() => {
        const fetchShopInfo = async () => {
            try {
                setLoading(true);
                const data = await getUserProfile();
                if (data.shopProfile) {
                    const profile = { 
                        ...data.shopProfile, 
                        hasPendingUpdate: data.hasPendingUpdate,
                        businessType: data.shopProfile.businessType || 'INDIVIDUAL'
                    };
                    setShopData(profile);
                    setInitialData(profile); 
                    
                    if (data.shopProfile.shopLogoUrl) {
                        setLogoPreview(`${API_BASE_URL}${data.shopProfile.shopLogoUrl}`);
                    } else {
                        setLogoPreview(ainetsoftLogo);
                    }

                    const addrList = data.addresses || [];
                    setAddresses(addrList);
                    setInitialAddresses(JSON.stringify(addrList));

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
        if (isMSTInvalid || hasDuplicatePhones || hasInvalidPhones) {
            setToastMessage("Vui lòng kiểm tra lại các thông tin lỗi (Mã số thuế phải 10 hoặc 13 số).");
            setShowToast(true);
            return;
        }

        try {
            setIsSaving(true);
            const formData = new FormData();
            const payload = {
                shopName: shopData.shopName,
                shopBio: shopData.shopDescription,
                taxCode: shopData.taxCode,
                businessType: shopData.businessType,
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
            if (newLogoFile) formData.append('logo', newLogoFile); 

            await updateShopSettings(formData);
            
            setToastMessage("Cập nhật thành công!");
            setShowToast(true);

            const updatedProfile = await getUserProfile();
            const newProf = { 
                ...updatedProfile.shopProfile, 
                hasPendingUpdate: updatedProfile.hasPendingUpdate,
                businessType: updatedProfile.shopProfile.businessType || 'INDIVIDUAL' 
            };
            setShopData(newProf);
            setInitialData(newProf);
            setInitialAddresses(JSON.stringify(updatedProfile.addresses));
            setNewLogoFile(null);
            setNewLicenseFile(null);

            if (updatedProfile.shopProfile.shopLogoUrl) {
                setLogoPreview(`${API_BASE_URL}${updatedProfile.shopProfile.shopLogoUrl}`);
            }
        } catch (error: any) {
            setToastMessage(error.response?.data || "Cập nhật thất bại.");
            setShowToast(true);
        } finally { setIsSaving(false); }
    };

    return (
        <main className="seller-settings-supreme-layout">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

            <div className="header-with-icon">
                <FaStore className="header-icon" />
                <h1>Thiết lập Shop</h1>
                <p>Tùy chỉnh nhận diện và kho vận GPS</p>
            </div>
            
            <hr className="supreme-divider" />

            {shopData.hasPendingUpdate && (
                <div className="warning-text" style={{marginBottom: '25px'}}>
                    <FaHourglassHalf />
                    <span>Thông tin của bạn đang được kiểm duyệt. Các thay đổi về logo/mô tả sẽ hiển thị ngay.</span>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner-container">Đang tải cấu hình shop...</div>
            ) : (
                <div className="settings-scroll-view">
                    
                    <section className="settings-section">
                        <h3 className="section-subtitle"><FaImage /> Nhận diện thương hiệu</h3>
                        <div className="logo-upload-circle-row">
                            <div className="logo-preview-circle">
                                <img 
                                    src={logoPreview} 
                                    alt="Logo Preview" 
                                    onError={(e) => { e.currentTarget.src = ainetsoftLogo; }}
                                />
                            </div>
                            <div className="logo-input-group">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    disabled={shopData.hasPendingUpdate}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setNewLogoFile(file);
                                            setLogoPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                <p className="upload-hint">Khuyến nghị: Hình vuông, tối thiểu 512x512px.</p>
                            </div>
                        </div>
                    </section>

                    <section className="settings-section mt-30">
                        <h3 className="section-subtitle"><FaInfoCircle /> Nhận diện & URL</h3>
                        <div className="supreme-form-row vertical">
                            <label>Tên Shop <span className="req">*</span></label>
                            <input 
                                type="text" 
                                className="supreme-input"
                                disabled={daysUntilChange > 0 || shopData.hasPendingUpdate}
                                value={shopData.shopName} 
                                onChange={(e) => setShopData({...shopData, shopName: e.target.value})} 
                            />
                        </div>

                        <div className="supreme-form-row vertical" style={{marginTop: '20px'}}>
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

                        <div className="supreme-form-row vertical" style={{marginTop: '20px'}}>
                            <label>Mô tả Shop</label>
                            <textarea 
                                className="supreme-textarea"
                                disabled={shopData.hasPendingUpdate}
                                placeholder="Giới thiệu về shop của bạn..."
                                value={shopData.shopDescription || ''}
                                onChange={(e) => setShopData({...shopData, shopDescription: e.target.value})}
                            />
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
                                            <input value={addr.receiverName} disabled={shopData.hasPendingUpdate} onChange={(e) => handleAddressUpdate(idx, 'receiverName', e.target.value)} placeholder="Tên kho" />
                                        </div>
                                        <div className="input-group-mini">
                                            <FaPhoneAlt className="mini-icon" />
                                            <input value={formatPhoneDisplay(addr.phone)} disabled={shopData.hasPendingUpdate} onChange={(e) => handleAddressUpdate(idx, 'phone', e.target.value)} placeholder="Số điện thoại" />
                                        </div>
                                        <div className="input-group-mini textarea-group">
                                            <FaMap className="mini-icon" />
                                            <textarea value={addr.detail} disabled={shopData.hasPendingUpdate} onChange={(e) => handleAddressUpdate(idx, 'detail', e.target.value)} placeholder="Địa chỉ chi tiết" />
                                        </div>
                                    </div>
                                    <div className="card-side-qr">
                                        {addr.latitude && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent(`http://googleusercontent.com/maps.google.com/search/${addr.latitude},${addr.longitude}`)}`} alt="QR" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="settings-section mt-30 compliance-box">
                        <h3 className="section-subtitle"><FaShieldAlt /> Thông tin Pháp lý</h3>
                        <div className="legal-info-grid">
                            <div className="legal-item">
                                <label><FaBriefcase /> Loại hình kinh doanh</label>
                                <select 
                                    className="supreme-input"
                                    disabled={shopData.hasPendingUpdate}
                                    value={shopData.businessType}
                                    onChange={(e) => setShopData({...shopData, businessType: e.target.value})}
                                >
                                    <option value="INDIVIDUAL">Cá nhân</option>
                                    <option value="HOUSEHOLD">Hộ kinh doanh</option>
                                    <option value="ENTERPRISE">Công ty</option>
                                </select>
                            </div>

                            <div className="legal-item">
                                <label>Mã số thuế</label>
                                <input 
                                    type="text" 
                                    className={`mst-input-clean ${isMSTInvalid ? 'error-border' : ''}`}
                                    disabled={shopData.hasPendingUpdate}
                                    value={formatMSTDisplay(shopData.taxCode)} 
                                    onChange={(e) => setShopData({...shopData, taxCode: e.target.value.replace(/\D/g, '').slice(0, 13)})} 
                                />
                                {isMSTInvalid && <small className="error-text">MST phải gồm 10 hoặc 13 chữ số.</small>}
                            </div>

                            <div className="legal-item">
                                <label>Giấy phép kinh doanh</label>
                                <div className={`license-upload-clean ${shopData.businessType === 'INDIVIDUAL' ? 'disabled-view' : ''}`} style={{ position: 'relative' }}>
                                    <img 
                                        src={shopData.businessType === 'INDIVIDUAL' 
                                            ? ainetsoftLogo 
                                            : (shopData.businessLicenseUrl ? `${API_BASE_URL}${shopData.businessLicenseUrl}` : 'https://placehold.co/120x80?text=GPKD')} 
                                        alt="GPKD" 
                                    />
                                    <input 
                                        type="file" 
                                        disabled={shopData.hasPendingUpdate || shopData.businessType === 'INDIVIDUAL'}
                                        onChange={(e) => setNewLicenseFile(e.target.files ? e.target.files[0] : null)} 
                                    />
                                    {shopData.businessType === 'INDIVIDUAL' && (
                                        <div className="individual-hint">Cá nhân không cần giấy phép.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="form-actions-row">
                        <button 
                            className="save-btn-supreme" 
                            onClick={handleSave} 
                            disabled={isSaving || shopData.hasPendingUpdate || !hasActualChanges || (hasActualChanges && (isMSTInvalid || hasDuplicatePhones || hasInvalidPhones))}
                        >
                            {isSaving ? "Đang xử lý..." : shopData.hasPendingUpdate ? "ĐANG CHỜ DUYỆT" : "Lưu thiết lập"}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SellerSettings;