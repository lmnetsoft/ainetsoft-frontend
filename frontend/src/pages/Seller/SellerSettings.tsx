import React, { useState, useEffect, useMemo, useRef } from 'react';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateShopSettings } from '../../services/authService';
import { getProvinces, getDistricts, getWards } from '../../services/shippingService';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css'; 
import { 
    FaStore, FaMapMarkerAlt, FaShieldAlt, FaInfoCircle, 
    FaExternalLinkAlt, FaPhoneAlt, FaUserEdit, FaMap, FaHourglassHalf,
    FaBriefcase, FaImage, FaHistory, FaCloudUploadAlt, FaTimes, FaSearch
} from 'react-icons/fa';
import './SellerSettings.css';

import ainetsoftLogo from '../../assets/images/logo.png';

const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY; 
const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;

// 🚀 BỔ SUNG: CSS CỨU CÁNH CHO BẢN ĐỒ GOONG BỊ ẨN
const inlineStyles = `
  .map-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 20000 !important; }
  .map-modal-card { background: white; width: 90%; max-width: 800px; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; height: 85vh; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
  .map-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee; }
  .map-search-container { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #eee; position: relative; }
  .map-search-input-group { display: flex; gap: 10px; }
  .map-search-input-group input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
  .map-canvas-area { flex: 1; background: #eee; position: relative; min-height: 300px; }
  #goong-map-canvas { width: 100%; height: 100%; }
  .map-modal-footer { padding: 15px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 15px; }
  .btn-confirm-map { background: #ee4d2d; color: white; border: none; padding: 10px 30px; border-radius: 4px; font-weight: 600; cursor: pointer; }
  .btn-cancel-map { background: #f0f0f0; color: #555; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
  .map-suggestions { position: absolute; top: 100%; left: 15px; right: 15px; background: white; border: 1px solid #ddd; z-index: 21000; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); list-style: none; padding: 0; margin: 0; }
  .map-suggestions li { padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
  .map-suggestions li:hover { background: #fdf2f0; color: #ee4d2d; }
`;

// HELPER: Real-time Slug Preview
const slugify = (text: string) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

// HELPERS: Input Display Formatters
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

    // LOGISTICS DROPDOWN STATES
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

    // MAP STATES
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapSearch, setMapSearch] = useState("");
    const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);

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

    useEffect(() => {
        if (selectedProvId > 0) {
            getDistricts(selectedProvId).then(res => setGhnDistricts(res || []));
        } else {
            setGhnDistricts([]);
            setGhnWards([]);
        }
    }, [selectedProvId]);

    useEffect(() => {
        if (addressForm.districtId > 0) {
            getWards(addressForm.districtId).then(res => setGhnWards(res || []));
        } else {
            setGhnWards([]);
        }
    }, [addressForm.districtId]);

    // BẢN ĐỒ GOONG
    useEffect(() => {
        if (showMapModal && !mapInstance.current) {
            goongjs.accessToken = GOONG_MAPTILES_KEY;
            const map = new goongjs.Map({
                container: 'goong-map-canvas',
                style: 'https://tiles.goong.io/assets/navigation_day.json',
                center: [106.660172, 10.762622], 
                zoom: 14
            });
            map.addControl(new goongjs.NavigationControl(), 'top-right');
            
            const initialLat = addressForm.latitude ? parseFloat(addressForm.latitude) : 10.762622;
            const initialLng = addressForm.longitude ? parseFloat(addressForm.longitude) : 106.660172;
            
            const marker = new goongjs.Marker({ color: '#ee4d2d' }).setLngLat([initialLng, initialLat]).addTo(map);
            map.flyTo({ center: [initialLng, initialLat], zoom: 16 });
            
            mapInstance.current = map;
            markerInstance.current = marker;

            map.on('click', (e: any) => {
                const { lng, lat } = e.lngLat;
                marker.setLngLat([lng, lat]);
                setAddressForm(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
            });
        }
        return () => { 
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerInstance.current = null;
            }
        };
    }, [showMapModal]);

    const handleMapSearch = async (val: string) => {
        setMapSearch(val);
        if (val.length < 3) { setMapSuggestions([]); return; }
        try {
            const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(val)}`);
            const data = await res.json();
            if (data.predictions) setMapSuggestions(data.predictions);
        } catch (e) {}
    };

    const handleDirectSearch = async () => {
        if (mapSearch.length < 3) return;
        try {
            const res = await fetch(`https://rsapi.goong.io/geocode?address=${encodeURIComponent(mapSearch)}&api_key=${GOONG_API_KEY}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry.location;
                mapInstance.current?.flyTo({ center: [lng, lat], zoom: 16 });
                markerInstance.current?.setLngLat([lng, lat]);
                setAddressForm(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6), detail: mapSearch }));
            }
        } catch (e) {
            setToastMessage("Không tìm thấy địa chỉ này.");
            setShowToast(true);
        }
    };

    const selectMapSuggestion = async (p: any) => {
        setMapSearch(p.description);
        setMapSuggestions([]);
        try {
            const res = await fetch(`https://rsapi.goong.io/Place/Detail?api_key=${GOONG_API_KEY}&place_id=${p.place_id}`);
            const data = await res.json();
            if (data.result && mapInstance.current) {
                const { lat, lng } = data.result.geometry.location;
                mapInstance.current.flyTo({ center: [lng, lat], zoom: 16 });
                markerInstance.current.setLngLat([lng, lat]);
                setAddressForm(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6), detail: p.description }));
            }
        } catch (e) {}
    };

    const handleAddressUpdate = (index: number, field: string, value: string) => {
        const updated = [...addresses];
        const cleanValue = (field === 'phone') ? value.replace(/\s/g, '') : value;
        updated[index] = { ...updated[index], [field]: cleanValue };
        setAddresses(updated);
    };

    const addNewAddressModal = () => {
        setEditingAddressIndex(addresses.length);
        setAddressForm({
            receiverName: '', phone: '', province: '', district: '', ward: '', hamlet: '',
            detail: '', latitude: '', longitude: '', isDefault: addresses.length === 0,
            districtId: 0, wardCode: ''
        });
        setSelectedProvId(0);
        setShowAddressModal(true);
    };

    const handleDeleteAddress = (index: number) => {
        if(window.confirm('Bạn có chắc muốn xóa kho hàng này? Hệ thống sẽ mất dữ liệu định tuyến cho khu vực này.')) {
            const updated = addresses.filter((_, i) => i !== index);
            if (updated.length > 0 && !updated.some(a => a.isDefault)) updated[0].isDefault = true;
            setAddresses(updated);
        }
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
        if (!addressForm.ward.toLowerCase().includes("phường") && !addressForm.hamlet.trim()) errors.hamlet = "Bắt buộc nhập Ấp/Thôn cho khu vực xã";
        if (!addressForm.detail.trim()) errors.detail = "Vui lòng nhập số nhà, tên đường";
        
        if (Object.keys(errors).length > 0) { setAddressErrors(errors); return; }

        const updated = [...addresses];
        if (editingAddressIndex !== null && editingAddressIndex < addresses.length) {
            updated[editingAddressIndex] = { ...addressForm, phone: phone };
        } else {
            updated.push({ ...addressForm, phone: phone, isDefault: updated.length === 0 });
        }
        
        setAddresses(updated);
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
            <style>{inlineStyles}</style>
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
                        <h3 className="section-subtitle" style={{ display: 'flex', alignItems: 'center' }}>
                            <FaMapMarkerAlt style={{ marginRight: '8px' }}/> Kho hàng ({addresses.length}/2)
                            {!shopData.hasPendingUpdate && addresses.length < 2 && (
                                <button 
                                    onClick={addNewAddressModal} 
                                    style={{ marginLeft: '15px', padding: '4px 12px', fontSize: '13px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + Thêm kho
                                </button>
                            )}
                        </h3>
                        <div className="warehouse-grid-layout">
                            {addresses.map((addr, idx) => (
                                <div key={idx} className="pro-warehouse-card" style={{ position: 'relative' }}>
                                    {!shopData.hasPendingUpdate && addresses.length > 1 && (
                                        <button 
                                            onClick={() => handleDeleteAddress(idx)} 
                                            style={{ position: 'absolute', top: '10px', right: '10px', background: '#ffe4e6', color: '#e11d48', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Xóa kho hàng này"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
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

            {/* 🚀 MODAL XỊN TÍCH HỢP BẢN ĐỒ GOONG NHƯ TRANG ĐĂNG KÝ */}
            {showAddressModal && (
                <div className="ainetsoft-modal-overlay no-print">
                  <div className="ainetsoft-modal-card">
                    <div className="modal-header">
                        <h3>{editingAddressIndex !== null && editingAddressIndex < addresses.length ? "Cập Nhật Kho Hàng" : "Thêm Kho Mới"}</h3>
                        <FaTimes className="close-icon" onClick={() => setShowAddressModal(false)} />
                    </div>
                    <div className="modal-body">
                      <div className="row-split">
                        <div className="input-with-label">
                            <label><span className="req">*</span> Tên người nhận (Kho)</label>
                            <input className={addressErrors.receiverName ? "error-border" : ""} value={addressForm.receiverName} onChange={e => setAddressForm({...addressForm, receiverName: e.target.value})} />
                            {addressErrors.receiverName && <p className="red-msg-inline">{addressErrors.receiverName}</p>}
                        </div>
                        <div className="input-with-label">
                            <label><span className="req">*</span> SĐT liên hệ</label>
                            <input className={addressErrors.phone ? "error-border" : ""} value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: formatPhoneDisplay(e.target.value)})} maxLength={12} placeholder="098 776 7688" />
                            {addressErrors.phone && <p className="red-msg-inline">{addressErrors.phone}</p>}
                        </div>
                      </div>
                      
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
                          <label>{!addressForm.ward.toLowerCase().includes("phường") && <span className="req">*</span>}Ấp/Thôn/Tổ</label>
                          <input className={addressErrors.hamlet ? "error-border" : ""} value={addressForm.hamlet} onChange={e => setAddressForm({...addressForm, hamlet: e.target.value})} />
                          {addressErrors.hamlet && <p className="red-msg-inline">{addressErrors.hamlet}</p>}
                      </div>
                      
                      <div className="modal-field-full">
                          <label><span className="req">*</span> Địa chỉ chi tiết</label>
                          <textarea className={addressErrors.detail ? "error-border" : ""} value={addressForm.detail} onChange={e => setAddressForm({...addressForm, detail: e.target.value})} placeholder="Số nhà, tên đường..." />
                          {addressErrors.detail && <p className="red-msg-inline">{addressErrors.detail}</p>}
                      </div>
                      
                      <div className="gps-box-ainetsoft clickable" onClick={() => setShowMapModal(true)}>
                        <FaMapMarkerAlt className="gps-red" />
                        <div className="gps-text">
                          <strong>Tọa độ GPS (Tự động)</strong>
                          <span>{addressForm.latitude ? `${addressForm.latitude}, ${addressForm.longitude}` : 'Nhấn vào đây để chọn trên bản đồ'}</span>
                          <p className="gps-hint-text">* Sử dụng thanh tìm kiếm trong bản đồ để lấy vị trí chính xác cho Shipper.</p>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer-ainetsoft">
                        <button className="btn-cancel-ainetsoft" onClick={() => setShowAddressModal(false)}>Hủy</button>
                        <button className="btn-save-ainetsoft" onClick={saveAddressModal}>Lưu Kho</button>
                    </div>
                  </div>
                </div>
            )}

            {/* 🚀 MODAL BẢN ĐỒ GOONG */}
            {showMapModal && (
                <div className="map-modal-overlay">
                  <div className="map-modal-card">
                    <div className="map-modal-header">
                        <h3>Chọn địa điểm lấy hàng</h3>
                        <FaTimes onClick={() => setShowMapModal(false)} style={{cursor: 'pointer'}} />
                    </div>
                    <div className="map-search-container">
                      <div className="map-search-input-group">
                        <input type="text" placeholder="Nhập tên đường, tòa nhà hoặc khu vực..." value={mapSearch} onChange={e => handleMapSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDirectSearch()} />
                        <button className="btn-confirm-map" type="button" onClick={handleDirectSearch}><FaSearch /></button>
                      </div>
                      {mapSuggestions.length > 0 && (
                          <ul className="map-suggestions">
                              {mapSuggestions.map(p => (<li key={p.place_id} onMouseDown={() => selectMapSuggestion(p)}>{p.description}</li>))}
                          </ul>
                      )}
                    </div>
                    <div className="map-canvas-area"><div id="goong-map-canvas"></div></div>
                    <div className="map-modal-footer">
                        <button className="btn-cancel-map" onClick={() => setShowMapModal(false)}>Hủy bỏ</button>
                        <button className="btn-confirm-map" onClick={() => { setShowMapModal(false); setMapSearch(""); }}>Xác nhận vị trí</button>
                    </div>
                  </div>
                </div>
            )}
        </main>
    );
};

export default SellerSettings;
