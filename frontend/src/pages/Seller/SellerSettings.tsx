import React, { useState, useEffect, useMemo } from 'react';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateShopSettings } from '../../services/authService';
import { getProvinces, getDistricts, getWards } from '../../services/shippingService';
import { 
    FaStore, FaMapMarkerAlt, FaShieldAlt, FaInfoCircle, 
    FaExternalLinkAlt, FaPhoneAlt, FaUserEdit, FaMap, FaHourglassHalf,
    FaBriefcase, FaImage, FaHistory, FaCloudUploadAlt, FaTimes
} from 'react-icons/fa';
import './SellerSettings.css';

import ainetsoftLogo from '../../assets/images/logo.png';

// HELPER: Real-time Slug Preview (100% PRESERVED)
const slugify = (text: string) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

// HELPERS: Input Display Formatters (100% PRESERVED)
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

const VN_PHONE_REGEX = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/;

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

    // 🚀 LOGISTICS DROPDOWN STATES
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
    const [ghnProvinces, setGhnProvinces] = useState<any[]>([]);
    const [ghnDistricts, setGhnDistricts] = useState<any[]>([]);
    const [ghnWards, setGhnWards] = useState<any[]>([]);
    const [selectedProvId, setSelectedProvId] = useState<number>(0);
    const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
    
    const [addressForm, setAddressForm] = useState({
        receiverName: '', phone: '', province: '', district: '', ward: '', hamlet: '',
        detail: '', latitude: '', longitude: '', isDefault: true,
        districtId: 0, wardCode: ''
    });

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
                const [data, provs] = await Promise.all([
                    getUserProfile(),
                    getProvinces()
                ]);
                
                setGhnProvinces(provs || []);

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

    // Fetch Districts
    useEffect(() => {
        if (selectedProvId > 0) {
            getDistricts(selectedProvId).then(res => setGhnDistricts(res || []));
        } else {
            setGhnDistricts([]);
            setGhnWards([]);
        }
    }, [selectedProvId]);

    // Fetch Wards
    useEffect(() => {
        if (addressForm.districtId > 0) {
            getWards(addressForm.districtId).then(res => setGhnWards(res || []));
        } else {
            setGhnWards([]);
        }
    }, [addressForm.districtId]);

    const handleAddressUpdate = (index: number, field: string, value: string) => {
        const updated = [...addresses];
        const cleanValue = (field === 'phone') ? value.replace(/\s/g, '') : value;
        updated[index] = { ...updated[index], [field]: cleanValue };
        setAddresses(updated);
    };

    const openAddressModal = async (index: number) => {
        setEditingAddressIndex(index);
        const addr = addresses[index];
        setAddressForm({
            receiverName: addr.receiverName || '', phone: addr.phone || '',
            province: addr.province || '', district: addr.district || '',
            ward: addr.ward || '', hamlet: addr.hamlet || '',
            detail: addr.detail || '', latitude: addr.latitude || '',
            longitude: addr.longitude || '', isDefault: addr.isDefault || false,
            districtId: addr.districtId || 0, wardCode: addr.wardCode || ''
        });
        
        // Match Province ID by Name to set initial dropdown
        if (addr.province && ghnProvinces.length > 0) {
            const prov = ghnProvinces.find((p: any) => p.ProvinceName === addr.province);
            if (prov) setSelectedProvId(prov.ProvinceID);
        } else {
            setSelectedProvId(0);
        }
        
        setShowAddressModal(true);
    };

    const saveAddressModal = () => {
        const errors: Record<string, string> = {};
        if (!addressForm.receiverName.trim()) errors.receiverName = "Vui lòng nhập họ và tên";
        const phone = addressForm.phone.replace(/\D/g, '');
        if (!phone || !VN_PHONE_REGEX.test(phone)) errors.phone = "SĐT không đúng định dạng";
        if (!addressForm.province || !addressForm.districtId || !addressForm.wardCode) errors.province = "Vui lòng chọn đầy đủ Tỉnh/Quận/Phường";
        if (!addressForm.detail.trim()) errors.detail = "Vui lòng nhập số nhà, tên đường";
        
        if (Object.keys(errors).length > 0) { setAddressErrors(errors); return; }

        if (editingAddressIndex !== null) {
            const updated = [...addresses];
            updated[editingAddressIndex] = { ...addressForm, phone: phone };
            setAddresses(updated);
        }
        
        setShowAddressModal(false);
        setAddressErrors({});
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
                // 🚀 BẮT ĐÚNG FORMAT MASTER DATA CHO BACKEND
                stockAddresses: addresses.map(addr => ({
                    fullName: addr.receiverName,
                    phoneNumber: addr.phone,
                    province: addr.province,
                    district: addr.district,
                    ward: addr.ward,
                    hamlet: addr.hamlet,
                    detailAddress: addr.detail,
                    latitude: addr.latitude,
                    longitude: addr.longitude,
                    isDefault: addr.isDefault,
                    districtId: addr.districtId, 
                    wardCode: addr.wardCode      
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
                <div className="vibrant-pending-banner">
                    <FaHourglassHalf className="spin-icon" />
                    <span>Hồ sơ của bạn <strong>đang chờ Admin phê duyệt</strong>. Các thay đổi về Logo/Mô tả sẽ hiển thị ngay khi bạn lưu.</span>
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
                                <img src={logoPreview} alt="Logo" onError={(e) => { e.currentTarget.src = ainetsoftLogo; }} />
                            </div>
                            <div className="logo-input-group">
                                <input type="file" id="shop-logo-upload" accept="image/*" disabled={shopData.hasPendingUpdate} hidden onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) { setNewLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
                                }} />
                                <label htmlFor="shop-logo-upload" className={`vibrant-upload-btn ${shopData.hasPendingUpdate ? 'disabled' : ''}`}>
                                    <FaCloudUploadAlt /> Tải ảnh Logo
                                </label>
                                <p className="upload-hint">Khuyến nghị: Hình vuông, tối thiểu 512x512px.</p>
                            </div>
                        </div>
                    </section>

                    <section className="settings-section mt-30">
                        <h3 className="section-subtitle"><FaInfoCircle /> Nhận diện & URL</h3>
                        
                        <div className="supreme-form-row-left">
                            <label className="field-label-left">Tên Shop <span className="req">*</span></label>
                            <div className="input-with-cooldown-group">
                                <input 
                                    type="text" 
                                    className="supreme-input shop-name-input-restricted"
                                    disabled={daysUntilChange > 0 || shopData.hasPendingUpdate}
                                    value={shopData.shopName} 
                                    onChange={(e) => setShopData({...shopData, shopName: e.target.value})} 
                                />
                                {daysUntilChange > 0 && (
                                    <div className="vibrant-horizontal-cooldown">
                                        <FaHistory />
                                        <span>Theo quy định, bạn chỉ có thể đổi tên Shop 30 ngày một lần. Hiện tại, bạn còn <strong>{daysUntilChange} ngày</strong> để thực hiện lượt đổi tiếp theo.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="supreme-form-row-left mt-25">
                            <label className="field-label-left">Nice URL (Slug)</label>
                            <div className="slug-input-group-fixed">
                                <div className="slug-display-fixed">
                                    <span>localhost:5173/</span>
                                    <strong className="slug-vibrant-red">{daysUntilChange > 0 ? shopData.shopSlug : (slugify(shopData.shopName) || 'dang-cap-nhat')}</strong>
                                </div>
                                <button className="slug-visit-btn-fixed" onClick={() => window.open(`/${shopData.shopSlug}`, '_blank')}>
                                    <FaExternalLinkAlt />
                                </button>
                            </div>
                        </div>

                        <div className="supreme-form-row-left mt-25">
                            <label className="field-label-left">Mô tả Shop</label>
                            <textarea 
                                className="supreme-textarea-full"
                                disabled={shopData.hasPendingUpdate}
                                placeholder="Giới thiệu về shop của bạn..."
                                value={shopData.shopDescription || ''}
                                onChange={(e) => setShopData({...shopData, shopDescription: e.target.value})}
                            />
                        </div>
                    </section>

                    <section className="settings-section mt-30">
                        <h3 className="section-subtitle"><FaMapMarkerAlt /> Kho hàng ({addresses.length}/2)</h3>
                        <div className="warehouse-grid-layout">
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
                                        <div 
                                            className="input-group-mini area-group" 
                                            style={{ cursor: shopData.hasPendingUpdate ? 'not-allowed' : 'pointer' }}
                                            onClick={() => !shopData.hasPendingUpdate && openAddressModal(idx)}
                                        >
                                            <FaMap className="mini-icon" />
                                            <div style={{ padding: '8px', fontSize: '13px', color: '#555', background: '#f9f9f9', border: '1px dashed #ddd', borderRadius: '4px', flex: 1, minHeight: '40px' }}>
                                                {addr.detail ? `${addr.detail}, ${addr.ward}, ${addr.district}, ${addr.province}` : 'Nhấn để thiết lập Tỉnh/Quận/Phường...'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-side-qr">
                                        {/* 🚀 FIXED: Đúng định dạng URL Google Maps để quét QR không bị 404 */}
                                        {addr.latitude && (
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${encodeURIComponent(`http://googleusercontent.com/maps.google.com/${addr.latitude},${addr.longitude}`)}`} alt="QR" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="settings-section mt-30 compliance-box">
                        <h3 className="section-subtitle"><FaShieldAlt /> Thông tin Pháp lý</h3>
                        <div className="legal-horizontal-layout">
                            <div className="legal-field-item">
                                <label className="field-label-left"><FaBriefcase /> Loại hình kinh doanh</label>
                                <select 
                                    className="supreme-input-full"
                                    disabled={shopData.hasPendingUpdate}
                                    value={shopData.businessType}
                                    onChange={(e) => setShopData({...shopData, businessType: e.target.value})}
                                >
                                    <option value="INDIVIDUAL">Cá nhân</option>
                                    <option value="HOUSEHOLD">Hộ kinh doanh</option>
                                    <option value="ENTERPRISE">Công ty</option>
                                </select>
                            </div>

                            <div className="legal-field-item">
                                <label className="field-label-left">Mã số thuế</label>
                                <input 
                                    type="text" 
                                    className={`mst-input-fixed ${isMSTInvalid ? 'error-border' : ''}`}
                                    disabled={shopData.hasPendingUpdate}
                                    value={formatMSTDisplay(shopData.taxCode)} 
                                    onChange={(e) => setShopData({...shopData, taxCode: e.target.value.replace(/\D/g, '').slice(0, 13)})} 
                                />
                                {isMSTInvalid && <small className="error-text-vibrant">Phải gồm 10 hoặc 13 số.</small>}
                            </div>
                        </div>

                        <div className="legal-row-full mt-25">
                            <label className="field-label-left">Giấy phép kinh doanh</label>
                            <div className="license-upload-container-fixed">
                                {shopData.businessType !== 'INDIVIDUAL' && (
                                    <div className="license-preview-fixed">
                                        <img 
                                            src={shopData.businessLicenseUrl ? `${API_BASE_URL}${shopData.businessLicenseUrl}` : 'https://placehold.co/120x80?text=GPKD'} 
                                            alt="GPKD" 
                                        />
                                        {shopData.hasPendingUpdate && <div className="pending-lock-overlay"><FaHourglassHalf /> Chờ duyệt</div>}
                                    </div>
                                )}
                                
                                <div className="license-actions-fixed">
                                    {shopData.businessType !== 'INDIVIDUAL' ? (
                                        <>
                                            <input type="file" id="license-upload-btn" disabled={shopData.hasPendingUpdate} hidden onChange={(e) => setNewLicenseFile(e.target.files ? e.target.files[0] : null)} />
                                            <label htmlFor="license-upload-btn" className={`vibrant-upload-btn ${shopData.hasPendingUpdate ? 'disabled' : ''}`}>
                                                <FaCloudUploadAlt /> Tải lên Giấy phép
                                            </label>
                                        </>
                                    ) : (
                                        <div className="horizontal-vibrant-info">
                                            <FaInfoCircle className="info-icon" />
                                            <span>Đối với mô hình <strong>Kinh doanh cá nhân</strong>, bạn không cần phải tải lên Giấy phép kinh doanh.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="supreme-form-actions-right">
                        <button 
                            className="save-btn-supreme-right" 
                            onClick={handleSave} 
                            disabled={isSaving || shopData.hasPendingUpdate || !hasActualChanges || (hasActualChanges && (isMSTInvalid || hasDuplicatePhones || hasInvalidPhones))}
                        >
                            {isSaving ? "Đang xử lý..." : shopData.hasPendingUpdate ? "HỒ SƠ ĐANG CHỜ DUYỆT" : "Lưu thiết lập"}
                        </button>
                    </div>
                </div>
            )}

            {/* 🚀 ADDRESS MODAL FOR EDITING LOCATION EXACTLY LIKE REGISTER */}
            {showAddressModal && (
                <div className="ainetsoft-modal-overlay">
                <div className="ainetsoft-modal-card">
                    <div className="modal-header">
                        <h3>Cập nhật vị trí Kho</h3>
                        <FaTimes className="close-icon" onClick={() => setShowAddressModal(false)} />
                    </div>
                    <div className="modal-body">
                    <div className="modal-field-full">
                        <label><span className="req">*</span> Tỉnh/Thành phố</label>
                        <select className={addressErrors.province ? "error-border supreme-input-full" : "supreme-input-full"} value={selectedProvId || ""} onChange={(e) => {
                            const id = parseInt(e.target.value);
                            const name = e.target.options[e.target.selectedIndex].text;
                            setSelectedProvId(id);
                            setAddressForm({...addressForm, province: id > 0 ? name : '', districtId: 0, district: '', wardCode: '', ward: ''});
                        }}>
                            <option value="">-- Chọn Tỉnh/Thành phố --</option>
                            {ghnProvinces.map((p: any) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                        </select>
                        {addressErrors.province && <p className="red-msg-inline">{addressErrors.province}</p>}
                    </div>

                    <div className="modal-field-full">
                        <label><span className="req">*</span> Quận/Huyện</label>
                        <select className={addressErrors.province ? "error-border supreme-input-full" : "supreme-input-full"} value={addressForm.districtId || ""} disabled={!selectedProvId} onChange={(e) => {
                            const id = parseInt(e.target.value);
                            const name = e.target.options[e.target.selectedIndex].text;
                            setAddressForm({...addressForm, districtId: id, district: id > 0 ? name : '', wardCode: '', ward: ''});
                        }}>
                            <option value="">-- Chọn Quận/Huyện --</option>
                            {ghnDistricts.map((d: any) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                        </select>
                    </div>

                    <div className="modal-field-full">
                        <label><span className="req">*</span> Phường/Xã</label>
                        <select className={addressErrors.province ? "error-border supreme-input-full" : "supreme-input-full"} value={addressForm.wardCode || ""} disabled={!addressForm.districtId} onChange={(e) => {
                            const code = e.target.value;
                            const name = e.target.options[e.target.selectedIndex].text;
                            setAddressForm({...addressForm, wardCode: code, ward: code ? name : ''});
                        }}>
                            <option value="">-- Chọn Phường/Xã --</option>
                            {ghnWards.map((w: any) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                        </select>
                    </div>

                    <div className="modal-field-full">
                        <label><span className="req">*</span> Địa chỉ chi tiết</label>
                        <textarea className={addressErrors.detail ? "error-border" : ""} value={addressForm.detail} onChange={e => setAddressForm({...addressForm, detail: e.target.value})} placeholder="Số nhà, tên đường..." />
                        {addressErrors.detail && <p className="red-msg-inline">{addressErrors.detail}</p>}
                    </div>
                    </div>
                    <div className="modal-footer-ainetsoft">
                        <button className="btn-cancel-ainetsoft" onClick={() => setShowAddressModal(false)}>Hủy</button>
                        <button className="btn-save-ainetsoft" onClick={saveAddressModal}>Xác nhận</button>
                    </div>
                </div>
                </div>
            )}
        </main>
    );
};

export default SellerSettings;
