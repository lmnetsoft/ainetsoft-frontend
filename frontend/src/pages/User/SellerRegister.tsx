import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStore, FaHourglassHalf, FaMapMarkerAlt, FaUniversity, FaArrowRight, 
  FaArrowLeft, FaCloudUploadAlt, FaEye, FaTimes, FaCrosshairs, 
  FaCheck, FaTruck, FaShippingFast, FaPlus, FaChevronRight, FaTrash,
  FaChevronDown, FaChevronUp, FaIdCard, FaFileInvoiceDollar, FaCheckCircle,
  FaInfoCircle, FaShieldAlt, FaUpload, FaCamera, FaRegLightbulb, FaEdit, FaPrint,
  FaSearchPlus, FaMapMarkedAlt, FaQrcode, FaCopy, FaClock, FaPassport
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile } from '../../services/authService';
import { toast } from 'react-hot-toast';

import api from '../../services/api'; 

import './Profile.css';
import './SellerRegister.css';

// IMPORT LOGO
import ainetsoftLogo from '../../assets/images/logo.png'; 

/** CONFIGURATION: Backend Port */
const BACKEND_BASE = "http://localhost:8080"; 

/** * NUMBER FORMATTING UTILITIES */
const formatPhone = (val: string) => {
  const s = val.replace(/\D/g, '');
  if (s.length <= 3) return s;
  if (s.length <= 6) return `${s.slice(0, 3)} ${s.slice(3)}`;
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 10)}`;
};

const formatCCCD = (val: string) => {
  const s = val.replace(/\D/g, '');
  const groups = s.match(/.{1,3}/g);
  return groups ? groups.join(' ') : s;
};

// Passport format: J-1234 5678
const formatPassport = (val: string) => {
  const s = val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (s.length === 0) return '';
  let res = s.charAt(0);
  if (s.length > 1) res += '-' + s.slice(1, 5);
  if (s.length > 5) res += ' ' + s.slice(5, 9);
  return res;
};

const formatMST = (val: string) => {
  const s = val.replace(/\D/g, '');
  if (s.length <= 10) {
    const groups = s.match(/.{1,3}/g);
    return groups ? groups.join(' ') : s;
  }
  const main = s.slice(0, 10);
  const branch = s.slice(10, 13);
  const mainGroups = main.match(/.{1,3}/g);
  return `${mainGroups ? mainGroups.join(' ') : main}-${branch}`;
};

const getFullImageUrl = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  const normalized = path.replace(/\\/g, '/');
  if (normalized.startsWith('/api/')) return `${BACKEND_BASE}${normalized}`;
  const fileName = normalized.split('/').pop() || '';
  if (normalized.includes('/uploads/cccd/')) return `${BACKEND_BASE}/api/uploads/cccd/${encodeURIComponent(fileName)}`;
  if (normalized.includes('/uploads/license/')) return `${BACKEND_BASE}/api/uploads/license/${encodeURIComponent(fileName)}`;
  return `${BACKEND_BASE}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

const inlineStyles = `
  .error-border { border: 1px solid #ff4d4f !important; }
  .error-border-dashed { border: 2px dashed #ff4d4f !important; }
  .red-msg-inline { color: #ff4d4f; font-size: 12px; margin-top: 4px; display: block; text-align: left; font-weight: 500; }
  
  .upload-placeholder { 
    display: flex; flex-direction: column; align-items: center; justify-content: center; 
    gap: 8px; color: #597393; pointer-events: none;
  }
  .upload-placeholder .cam-icon { font-size: 42px; color: #f28166; }
  .upload-placeholder span { font-size: 15px; font-weight: 500; text-align: center; line-height: 1.2; }

  .btn-clear-img { 
    position: absolute; top: -12px; right: -12px; background: #ee4d2d !important; color: white !important; 
    border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; 
    align-items: center; justify-content: center; cursor: pointer; z-index: 100; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  }
  .btn-clear-img svg { font-size: 12px; color: white !important; }

  .license-upload-box, .upload-box { position: relative; overflow: visible !important; cursor: pointer; }
  .zoom-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; cursor: zoom-out; }
  .zoom-content { position: relative; max-width: 85%; max-height: 85%; }
  .zoom-content img { width: auto; max-width: 100%; max-height: 80vh; border-radius: 4px; border: 3px solid white; }
  .zoom-close { position: absolute; top: -50px; right: 0; color: white; font-size: 2.5rem; cursor: pointer; }
  
  .success-registration-alert { background: #f6ffed; border: 1px solid #b7eb8f; padding: 24px; border-radius: 8px; margin-bottom: 30px; display: flex; align-items: flex-start; gap: 16px; }
  .success-alert-icon { color: #52c41a; font-size: 28px; margin-top: 2px; }
  .success-alert-content h2 { color: #1f1f1f; font-size: 20px; margin: 0 0 8px 0; font-weight: 600; }
  .success-alert-content p { color: #595959; margin: 0; font-size: 15px; line-height: 1.6; }
  .timeline-note { display: inline-flex; align-items: center; gap: 6px; background: #fff7e6; color: #d46b08; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; margin-top: 10px; border: 1px solid #ffd591; }

  .preview-mode-banner { background: #fff7e6; border: 1px solid #ffe7ba; padding: 20px; text-align: center; border-radius: 4px; margin-bottom: 30px; }
  .preview-mode-banner h2 { color: #d46b08; margin-bottom: 5px; display: flex; align-items: center; justify-content: center; gap: 10px; }
  
  .summary-photo-item { 
    cursor: zoom-in; position: relative; display: flex; flex-direction: column; align-items: center; 
    background: #f9f9f9; border: 1px solid #ddd; padding: 10px; border-radius: 4px; min-height: 180px; justify-content: space-between;
  }
  .summary-photo-item img { width: 100%; height: 140px; object-fit: contain; }
  .zoom-hint { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: flex; align-items: center; gap: 4px; }

  .preview-coords { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px; background: #f0f5ff; border-radius: 4px; border: 1px dashed #adc6ff; }
  .coord-text { font-family: monospace; font-size: 12px; color: #1d39c4; font-weight: bold; }
  .btn-maps-link { font-size: 11px; color: #2f54eb; text-decoration: underline; cursor: pointer; display: flex; align-items: center; gap: 4px; }
  .btn-copy-action { cursor: pointer; color: #8c8c8c; transition: color 0.2s; }
  .btn-copy-action:hover { color: #ee4d2d; }

  .qr-box-summary { display: flex; align-items: center; gap: 15px; margin-top: 10px; background: #fdf2f0; padding: 10px; border-radius: 4px; border: 1px solid #f9d7d0; }
  .qr-code-img { width: 60px; height: 60px; background: white; border: 1px solid #ddd; padding: 2px; }
  .qr-info-text { flex: 1; }
  .qr-info-text strong { font-size: 12px; color: #ee4d2d; display: block; }
  .qr-info-text p { font-size: 10.5px; color: #666; margin: 2px 0 0 0; line-height: 1.3; }

  .legal-confirmation-wrap { margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #eee; }
  .legal-checkbox-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 13.5px; color: #595959; line-height: 1.5; }
  .legal-checkbox-label input { width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #ee4d2d; }
  .legal-link { color: #2f54eb; text-decoration: underline; }

  /* IMPROVED DELETE BUTTON UI */
  .address-display-box { position: relative; padding-right: 45px !important; }
  .trash-action-area { 
    position: absolute; right: 0; top: 0; bottom: 0; width: 40px; 
    display: flex; align-items: center; justify-content: center; 
    border-left: 1px solid #f0f0f0; background: #fafafa;
    border-top-right-radius: 4px; border-bottom-right-radius: 4px;
    cursor: pointer; transition: background 0.2s;
  }
  .trash-action-area:hover { background: #fff1f0; }
  .trash-icon { color: #ff4d4f; font-size: 16px; }
  
  .btn-add-ainetsoft:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }
`;

const PROVINCES_2026 = [
  "Hà Nội", "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Phú Thọ", "Bắc Ninh", "Hưng Yên", 
  "Hải Phòng", "Ninh Bình", "Quảng Trị", "Đà Nẵng", "Quảng Ngãi", "Gia Lai", "Khánh Hòa", 
  "Lâm Đồng", "Đắk Lắk", "TP.HCM", "Đồng Nai", "Tây Ninh", "Cần Thơ", "Vĩnh Long", 
  "Đồng Tháp", "Cà Mau", "An Giang", "Huế", "Lai Châu", "Điện Biên", "Sơn La", 
  "Lạng Sơn", "Quảng Ninh", "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Cao Bằng"
];

const VN_PHONE_REGEX = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/;

const SellerRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); 

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [shippingMethodsList, setShippingMethodsList] = useState<any[]>([]);
  const [expandedMethods, setExpandedMethods] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    phone: '', email: '', shopName: '', stockAddresses: [] as any[],
    businessType: 'INDIVIDUAL', companyName: '', registeredAddress: '',
    invoiceEmails: [''], taxCode: '', licenseImage: null as File | null,
    licensePreview: '', cccdNumber: '', shippingMethods: {} as Record<string, boolean>,
    frontImage: null as File | null, backImage: null as File | null,
    frontPreview: '', backPreview: '',
    identityType: 'CCCD', 
    isConfirmed: false
  });

  const [addressForm, setAddressForm] = useState({
    fullName: '', phoneNumber: '', province: '', ward: '', hamlet: '',
    detailAddress: '', latitude: '', longitude: '', isDefault: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsPageLoading(true);
        setIsShippingLoading(true);
        const [rawProfile, shippingRes] = await Promise.all([
          getUserProfile(),
          api.get('/shipping-methods/active')
        ]);

        const profileData = rawProfile?.data || rawProfile;

        if (profileData.roles?.includes('SELLER')) {
            toast.success("Chào mừng trở lại, Người bán!");
            navigate('/user/profile');
            return;
        }

        if (profileData.sellerVerification === 'PENDING') {
            setIsSubmitted(true);
            setCurrentStep(5);
        }

        setShippingMethodsList(Array.isArray(shippingRes.data) ? shippingRes.data : []);

        const enabledMap: Record<string, boolean> = {};
        profileData.shopProfile?.enabledShippingMethodIds?.forEach((id: string) => {
          enabledMap[id] = true;
        });

        const normalizedAddresses = (profileData.addresses || []).map((addr: any) => ({
           fullName: addr.receiverName || '',
           phoneNumber: addr.phone || '',
           province: addr.province || '',
           ward: addr.ward || '',
           hamlet: addr.hamlet || '',
           detailAddress: addr.detail || '',
           latitude: addr.latitude || '',
           longitude: addr.longitude || '',
           isDefault: addr.isDefault || false
        }));

        const shouldClear = profileData.sellerVerification !== 'PENDING';

        setFormData(prev => ({
          ...prev,
          phone: normalizedAddresses[0]?.phoneNumber || profileData.shopProfile?.businessPhone || profileData.phone || '',
          email: profileData.shopProfile?.businessEmail || profileData.email || '',
          
          shopName: shouldClear ? '' : (profileData.shopProfile?.shopName || ''),
          stockAddresses: shouldClear ? [] : normalizedAddresses,
          businessType: shouldClear ? 'INDIVIDUAL' : (profileData.shopProfile?.businessType || 'INDIVIDUAL'),
          companyName: shouldClear ? '' : (profileData.shopProfile?.companyName || ''),
          registeredAddress: shouldClear ? '' : (profileData.shopProfile?.registeredAddress || ''),
          
          invoiceEmails: shouldClear ? [''] : (
            profileData.shopProfile?.invoiceEmails?.length > 0 
              ? profileData.shopProfile.invoiceEmails 
              : [profileData.shopProfile?.invoiceEmail || '']
          ),
          
          taxCode: shouldClear ? '' : (profileData.shopProfile?.taxCode || ''),
          shippingMethods: shouldClear ? {} : enabledMap,
          identityType: shouldClear ? 'CCCD' : (profileData.identityInfo?.identityType || 'CCCD'),
          cccdNumber: shouldClear ? '' : (profileData.identityInfo?.cccdNumber || ''),
          frontPreview: shouldClear ? '' : getFullImageUrl(profileData.identityInfo?.frontImageUrl || profileData.frontImageUrl),
          backPreview: shouldClear ? '' : getFullImageUrl(profileData.identityInfo?.backImageUrl || profileData.backImageUrl),
          licensePreview: shouldClear ? '' : getFullImageUrl(profileData.shopProfile?.businessLicenseUrl || profileData.businessLicenseUrl)
        }));
      } catch (error) {
        toast.error("Lỗi kết nối hệ thống.");
      } finally {
        setIsPageLoading(false);
        setIsShippingLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'license') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [`${type}Image`]: file, [`${type}Preview`]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = (type: 'front' | 'back' | 'license', e: React.MouseEvent) => {
    e.stopPropagation(); 
    setFormData(prev => ({ ...prev, [`${type}Image`]: null, [`${type}Preview`]: '' }));
    const input = document.getElementById(`input-${type}`) as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleInvoiceEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.invoiceEmails];
    newEmails[index] = value;
    setFormData({ ...formData, invoiceEmails: newEmails });
  };

  const addInvoiceEmail = () => {
    if (formData.invoiceEmails.length < 2) {
      setFormData({ ...formData, invoiceEmails: [...formData.invoiceEmails, ''] });
    }
  };

  const removeInvoiceEmail = (index: number) => {
    if (formData.invoiceEmails.length > 1) {
      const newEmails = formData.invoiceEmails.filter((_, i) => i !== index);
      setFormData({ ...formData, invoiceEmails: newEmails });
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.shopName.trim()) errors.shopName = "Tên Shop là bắt buộc";
    if (formData.stockAddresses.length === 0) errors.addresses = "Cần ít nhất 1 địa chỉ lấy hàng";
    
    const phones = formData.stockAddresses.map(a => a.phoneNumber.replace(/\D/g, ''));
    if (new Set(phones).size !== phones.length) {
      errors.addresses = "Số điện thoại giữa các kho phải khác nhau.";
    }

    if (!formData.email.trim()) errors.email = "Email là bắt buộc";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (formData.businessType !== 'INDIVIDUAL' && !formData.companyName.trim()) {
      errors.companyName = "Tên công ty là bắt buộc";
    }
    if (!formData.registeredAddress.trim()) {
      errors.registeredAddress = "Địa chỉ đăng ký là bắt buộc";
    }
    const emailEmpty = formData.invoiceEmails.some(email => !email.trim());
    if (emailEmpty) errors.invoiceEmail = "Vui lòng không để trống ô email";
    
    const rawMST = formData.taxCode.replace(/\s|-/g, '');
    if (!rawMST) {
      errors.taxCode = "Mã số thuế là bắt buộc";
    } else if (rawMST.length !== 10 && rawMST.length !== 13) {
      errors.taxCode = "Mã số thuế phải bao gồm 10 hoặc 13 chữ số";
    }

    if (formData.businessType !== 'INDIVIDUAL' && !formData.licensePreview) {
      errors.license = "Vui lòng tải lên ảnh Giấy phép kinh doanh (GPKD)";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = () => {
    const errors: Record<string, string> = {};
    const rawID = formData.cccdNumber.replace(/\s/g, '');
    const vnPassportRegex = /^[A-Z]\d{7,8}$/;

    if (formData.identityType === 'CCCD') {
      if (!rawID || rawID.length !== 12) {
        errors.cccdNumber = "Số CCCD phải bao gồm 12 chữ số";
      }
    } else {
      const cleanPassport = rawID.replace(/-/g, '').replace(/\s/g, '');
      if (!cleanPassport || !vnPassportRegex.test(cleanPassport)) {
        errors.cccdNumber = "Số Hộ chiếu VN không hợp lệ (Vd: G12345678)";
      }
    }

    if (!formData.frontPreview) errors.frontImage = `Thiếu mặt trước ${formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}`;
    if (!formData.backPreview) errors.backImage = `Thiếu mặt sau ${formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}`;
    
    if (!formData.isConfirmed) {
      errors.confirmation = "Vui lòng xác nhận thông tin trước khi tiếp tục";
      toast.error("Bạn cần xác nhận tính chính xác của dữ liệu.");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const performFullValidation = () => {
    const s1 = validateStep1();
    const s3 = validateStep3();
    const s4 = validateStep4();
    // FIXED LOGIC: Strict check (!s1 || !s3 || !s4)
    if (!s1 || !s3 || !s4) {
      const missing = [];
      if (!s1) missing.push("Thông tin Shop");
      if (!s3) missing.push("Thông tin Công ty/Thuế");
      if (!s4) missing.push("Thông tin Định danh");
      toast.error(`Thiếu thông tin: ${missing.join(', ')}. Vui lòng kiểm tra lại.`);
      return false;
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!performFullValidation()) return;
    try {
      setIsSaving(true);
      const submitData = new FormData();
      const payload = {
          shopName: formData.shopName,
          email: formData.email,
          businessType: formData.businessType,
          companyName: formData.companyName,
          registeredAddress: formData.registeredAddress,
          invoiceEmails: formData.invoiceEmails,
          taxCode: formData.taxCode.replace(/\s|-/g, ''),
          cccdNumber: formData.cccdNumber.replace(/\s|-/g, ''),
          identityType: formData.identityType, 
          shippingMethods: formData.shippingMethods,
          stockAddresses: formData.stockAddresses.map(a => ({...a, phoneNumber: a.phoneNumber.replace(/\D/g, '')}))
      };

      const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      submitData.append('data', jsonBlob);

      if (formData.frontImage) submitData.append('frontImage', formData.frontImage);
      if (formData.backImage) submitData.append('backImage', formData.backImage);
      if (formData.licenseImage) submitData.append('license', formData.licenseImage);
      
      const res = await api.post('/auth/upgrade-seller', submitData);
      if (res.status === 200 || res.status === 201) { 
        toast.success("Đăng ký thành công!"); 
        setIsSubmitted(true); 
        setCurrentStep(5); 
      }
    } catch (error: any) { 
      const errorMsg = error.response?.data?.message || error.message || "Gửi hồ sơ thất bại";
      toast.error(`Lỗi hệ thống: ${errorMsg}`);
    } finally { setIsSaving(false); }
  };

  const handleLocalAddressSave = () => {
    if (formData.stockAddresses.length >= 2) {
      toast.error("Tối đa 2 địa chỉ lấy hàng.");
      setShowAddressModal(false);
      return;
    }

    const errors: Record<string, string> = {};
    if (!addressForm.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    
    const phone = addressForm.phoneNumber.replace(/\D/g, '');
    if (!phone || !VN_PHONE_REGEX.test(phone)) errors.phoneNumber = "SĐT không đúng định dạng";
    
    const isDuplicate = formData.stockAddresses.some(a => a.phoneNumber.replace(/\D/g, '') === phone);
    if (isDuplicate) errors.phoneNumber = "SĐT này đã được sử dụng cho kho khác.";

    if (!addressForm.province) errors.province = "Vui lòng chọn tỉnh thành";
    if (!addressForm.ward.trim()) errors.ward = "Vui lòng nhập Phường/Xã";
    
    if (!addressForm.ward.toLowerCase().includes("phường") && !addressForm.hamlet.trim()) {
      errors.hamlet = "Bắt buộc nhập Ấp/Thôn cho khu vực xã";
    }

    if (!addressForm.detailAddress.trim()) errors.detailAddress = "Vui lòng nhập số nhà, tên đường";
    if (Object.keys(errors).length > 0) { setAddressErrors(errors); return; }
    
    setFormData(prev => ({ ...prev, stockAddresses: [...prev.stockAddresses, { ...addressForm, phoneNumber: phone }] }));
    setShowAddressModal(false); setAddressErrors({}); setAddressForm({ fullName: '', phoneNumber: '', province: '', ward: '', hamlet: '', detailAddress: '', latitude: '', longitude: '', isDefault: true });
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setAddressForm(prev => ({ ...prev, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })); setIsLocating(false); toast.success("Đã lấy tọa độ!"); },
        () => { setIsLocating(false); toast.error("Vui lòng bật GPS."); }
      );
    }
  };

  const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast.success("Đã sao chép!");
  };

  const toggleShipping = (id: string) => { setFormData(prev => ({ ...prev, shippingMethods: { ...prev.shippingMethods, [id]: !prev.shippingMethods[id] } })); };
  const getBusinessLabel = (type: string) => type === 'INDIVIDUAL' ? 'Cá nhân' : type === 'HOUSEHOLD' ? 'Hộ kinh doanh' : 'Công ty';
  const handlePrint = () => window.print();

  if (isPageLoading) return <div className="loading-spinner">Đang tải hồ sơ Người bán...</div>;

  return (
    <div className="onboarding-layout">
      <style>{inlineStyles}</style>
      <AccountSidebar />
      <main className="onboarding-view">
        <div className="onboarding-stepper no-print">
          {['Thông tin Shop', 'Cài đặt vận chuyển', 'Thông tin thuế', 'Thông tin định danh', 'Hoàn tất'].map((l, i) => (
            <div key={i} className={`step-node ${currentStep > i ? 'active' : ''}`}>
              <div className="node-dot">{currentStep > i + 1 ? <FaCheck /> : i + 1}</div>
              <span>{l}</span>
              {i < 4 && <div className={`node-line ${currentStep > i + 1 ? 'active' : ''}`}></div>}
            </div>
          ))}
        </div>

        <div className="onboarding-card">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="ainetsoft-row"><label><span className="req">*</span> Tên Shop</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.shopName ? "error-border" : ""} value={formData.shopName} maxLength={30} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="Nhập tên shop" />
                  <span className="char-counter">{formData.shopName.length}/30</span>
                </div>
              </div>
              <div className="ainetsoft-row"><label><span className="req">*</span> Địa chỉ lấy hàng</label>
                <div className="ainetsoft-input-group">
                  {formData.stockAddresses.map((addr, idx) => (
                    <div key={idx} className="address-display-box" style={{marginBottom: '10px'}}>
                      <div className="addr-text">
                        <strong>{[addr.fullName, formatPhone(addr.phoneNumber)].filter(Boolean).join(' | ')}</strong>
                        <p>{[addr.detailAddress, addr.ward, addr.province].filter(Boolean).join(', ')}</p>
                      </div>
                      <div className="trash-action-area" onClick={() => setFormData({...formData, stockAddresses: formData.stockAddresses.filter((_, i) => i !== idx)})}>
                         <FaTrash className="trash-icon" />
                      </div>
                    </div>
                  ))}
                  <button 
                    className="btn-add-ainetsoft" 
                    onClick={() => setShowAddressModal(true)}
                    disabled={formData.stockAddresses.length >= 2}
                  >
                    <FaPlus /> Thêm địa chỉ ({formData.stockAddresses.length}/2)
                  </button>
                  {formErrors.addresses && <p className="red-msg-inline">{formErrors.addresses}</p>}
                </div>
              </div>
              <div className="ainetsoft-row"><label><span className="req">*</span> Email liên hệ</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.email ? "error-border" : ""} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  {formErrors.email && <p className="red-msg-inline">{formErrors.email}</p>}
                </div>
              </div>
              <div className="onboarding-footer"><button className="btn-ainetsoft-primary" onClick={() => { if(validateStep1()) setCurrentStep(2); }}>Tiếp theo</button></div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="shipping-header-text"><h3>Phương thức vận chuyển</h3><p>Kích hoạt các đơn vị vận chuyển hỗ trợ.</p></div>
              <div className="shipping-methods-list">
                {shippingMethodsList.map((method) => {
                    const mId = method.id;
                    return (
                      <div key={mId} className="shipping-method-item">
                        <div className="method-main-row"><span>{method.name}</span>
                          <button className="btn-collapse" onClick={() => setExpandedMethods(prev => ({...prev, [mId]: !prev[mId]}))}>
                             {expandedMethods[mId] ? 'Mở rộng' : 'Thu gọn'} {expandedMethods[mId] ? <FaChevronDown /> : <FaChevronUp />}
                          </button>
                        </div>
                        {!expandedMethods[mId] && (
                          <div className="method-details-row">
                             <div className="method-sub-box">
                                <div className="sub-box-left"><span>{method.name}</span>{method.codEnabled && <span className="cod-tag"> [COD được kích hoạt]</span>}</div>
                                <div className="sub-box-right"><label className="ainetsoft-switch"><input type="checkbox" checked={!!formData.shippingMethods[mId]} onChange={() => toggleShipping(mId)} /><span className="slider round"></span></label></div>
                             </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="onboarding-footer"><button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(1)}>Quay lại</button><button className="btn-ainetsoft-primary" onClick={() => setCurrentStep(3)}>Tiếp theo</button></div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="ainetsoft-radio-group" style={{marginBottom: '25px'}}>
                {['INDIVIDUAL', 'HOUSEHOLD', 'ENTERPRISE'].map(t => (
                  <label key={t} className="radio-item"><input type="radio" checked={formData.businessType === t} onChange={() => setFormData({...formData, businessType: t})} /><span className="radio-mark"></span> {getBusinessLabel(t)}</label>
                ))}
              </div>
              {formData.businessType !== 'INDIVIDUAL' && (
                <div className="ainetsoft-row"><label><span className="req">*</span> Tên công ty</label><div className="ainetsoft-input-group"><input className={formErrors.companyName ? "error-border" : ""} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Tên chính thức" />{formErrors.companyName && <p className="red-msg-inline">{formErrors.companyName}</p>}</div></div>
              )}
              <div className="ainetsoft-row"><label><span className="req">*</span> Địa chỉ đăng ký</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.registeredAddress ? "error-border" : ""} value={formData.registeredAddress} onChange={e => setFormData({...formData, registeredAddress: e.target.value})} placeholder="Địa chỉ theo GPKD" />
                  {formErrors.registeredAddress && <p className="red-msg-inline">{formErrors.registeredAddress}</p>}
                </div>
              </div>
              <div className="ainetsoft-row"><label><span className="req">*</span> Email nhận hóa đơn</label>
                <div className="ainetsoft-input-group">
                  {formData.invoiceEmails.map((email, idx) => (
                    <div key={idx} className="email-input-item" style={{display: 'flex', gap: '10px', marginBottom: '8px'}}><input value={email} onChange={e => handleInvoiceEmailChange(idx, e.target.value)} placeholder="Email" />{formData.invoiceEmails.length > 1 && <button className="btn-remove-email" onClick={() => removeInvoiceEmail(idx)}><FaTimes /></button>}</div>
                  ))}
                  {formData.invoiceEmails.length < 2 && <button className="btn-add-email-ainetsoft" onClick={addInvoiceEmail}>+ Thêm Email</button>}
                  {formErrors.invoiceEmail && <p className="red-msg-inline">{formErrors.invoiceEmail}</p>}
                </div>
              </div>
              <div className="ainetsoft-row"><label><span className="req">*</span> MST</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.taxCode ? "error-border" : ""} value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: formatMST(e.target.value)})} maxLength={17} placeholder="111 111 111 1" />
                  {formErrors.taxCode && <p className="red-msg-inline">{formErrors.taxCode}</p>}
                </div>
              </div>
              {formData.businessType !== 'INDIVIDUAL' && (
                <div className="ainetsoft-row"><label><span className="req">*</span> GPKD</label>
                  <div className="ainetsoft-input-group">
                    <div 
                      className={`license-upload-box ${formData.licensePreview ? "has-img" : ""} ${formErrors.license ? "error-border-dashed" : ""}`} 
                      onClick={() => document.getElementById('input-license')?.click()}
                    >
                      {formData.licensePreview ? (
                        <>
                          <div className="btn-clear-img" onClick={(e) => clearImage('license', e)}><FaTimes /></div>
                          <img src={formData.licensePreview} alt="License" />
                        </>
                      ) : (
                        <div className="upload-placeholder"><FaCamera className="cam-icon" /><span>Tải lên GPKD</span></div>
                      )}
                    </div>
                    <input id="input-license" type="file" hidden onChange={e => handleFileChange(e, 'license')} />
                    {formErrors.license && <p className="red-msg-inline">{formErrors.license}</p>}
                  </div>
                </div>
              )}
              <div className="onboarding-footer"><button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(2)}>Quay lại</button><button className="btn-ainetsoft-primary" onClick={() => { if(validateStep3()) setCurrentStep(4); }}>Tiếp theo</button></div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="step-content">
              <div className="ainetsoft-radio-group" style={{marginBottom: '20px'}}>
                <label className="radio-item"><input type="radio" checked={formData.identityType === 'CCCD'} onChange={() => setFormData({...formData, identityType: 'CCCD'})} /><span className="radio-mark"></span> CCCD</label>
                <label className="radio-item"><input type="radio" checked={formData.identityType === 'PASSPORT'} onChange={() => setFormData({...formData, identityType: 'PASSPORT'})} /><span className="radio-mark"></span> Hộ chiếu</label>
              </div>

              <div className="ainetsoft-row">
                <label><span className="req">*</span> Số {formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}</label>
                <div className="ainetsoft-input-group">
                   <input 
                     className={formErrors.cccdNumber ? "error-border" : ""} 
                     value={formData.cccdNumber} 
                     onChange={e => setFormData({...formData, cccdNumber: formData.identityType === 'CCCD' ? formatCCCD(e.target.value) : formatPassport(e.target.value)})} 
                     maxLength={15} 
                     placeholder={formData.identityType === 'CCCD' ? "012 345 678 901" : "G-1234 5678"} 
                   />
                   {formErrors.cccdNumber && <p className="red-msg-inline">{formErrors.cccdNumber}</p>}
                </div>
              </div>
              <div className="id-upload-grid">
                <div style={{display: 'flex', flexDirection: 'column'}}><div className={`upload-box ${formErrors.frontImage ? "error-border-dashed" : ""}`} onClick={() => document.getElementById('input-front')?.click()}>{formData.frontPreview ? (<div style={{position: 'relative', height: '100%'}}><div className="btn-clear-img" onClick={(e) => clearImage('front', e)}><FaTimes /></div><img src={formData.frontPreview} alt="Front" className="preview-img" onError={() => setFormData(prev => ({...prev, frontPreview: ''}))} /></div>) : (<div className="upload-placeholder">{formData.identityType === 'CCCD' ? <FaIdCard className="cam-icon" /> : <FaPassport className="cam-icon" />}<span>Mặt trước {formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}</span></div>)}</div>{formErrors.frontImage && <p className="red-msg-inline">{formErrors.frontImage}</p>}</div>
                <div style={{display: 'flex', flexDirection: 'column'}}><div className={`upload-box ${formErrors.backImage ? "error-border-dashed" : ""}`} onClick={() => document.getElementById('input-back')?.click()}>{formData.backPreview ? (<div style={{position: 'relative', height: '100%'}}><div className="btn-clear-img" onClick={(e) => clearImage('back', e)}><FaTimes /></div><img src={formData.backPreview} alt="Back" className="preview-img" onError={() => setFormData(prev => ({...prev, backPreview: ''}))} /></div>) : (<div className="upload-placeholder">{formData.identityType === 'CCCD' ? <FaIdCard className="cam-icon" /> : <FaPassport className="cam-icon" />}<span>Mặt sau {formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}</span></div>)}</div>{formErrors.backImage && <p className="red-msg-inline">{formErrors.backImage}</p>}</div>
              </div>
              <input id="input-front" type="file" hidden onChange={e => handleFileChange(e, 'front')} /><input id="input-back" type="file" hidden onChange={e => handleFileChange(e, 'back')} />
              
              <div className="legal-confirmation-wrap">
                <label className="legal-checkbox-label">
                  <input type="checkbox" checked={formData.isConfirmed} onChange={e => setFormData({...formData, isConfirmed: e.target.checked})} />
                  <span>Tôi xác nhận tất cả dữ liệu đã cung cấp là chính xác và trung thực. Tôi đã đọc và đồng ý với <span className="legal-link"> Chính Sách Bảo Mật </span> và <span className="legal-link"> Điều Khoản Sử Dụng </span> của AiNetsoft.</span>
                </label>
                {formErrors.confirmation && <p className="red-msg-inline">{formErrors.confirmation}</p>}
              </div>

              <div className="onboarding-footer"><button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(3)}>Quay lại</button><button className="btn-ainetsoft-primary" onClick={() => { if(validateStep4()) setCurrentStep(5); }}>Xác nhận & Xem trước</button></div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="step-content success-summary-view">
              {!isSubmitted ? (
                <div className="preview-mode-banner no-print"><h2><FaInfoCircle /> Chế độ xem trước</h2><p>Vui lòng kiểm tra lại thông tin. Nhấn <strong>Xác nhận & Gửi hồ sơ</strong> để hoàn tất.</p></div>
              ) : (
                <div className="success-registration-alert no-print">
                   <div className="success-alert-icon"><FaCheckCircle /></div>
                   <div className="success-alert-content"><h2>Đăng ký thành công!</h2><p>Hồ sơ của bạn đã được gửi. Vui lòng chờ xác nhận bởi hệ thống AiNetsoft.</p><div className="timeline-note"><FaClock /> Phản hồi chậm nhất trong vòng 24h</div></div>
                </div>
              )}

              <div className="summary-section printable-area">
                <div className="summary-header"><h3>Phiếu Đăng Ký Người Bán Ainetsoft</h3><button className="btn-print no-print" onClick={handlePrint}><FaPrint /> In hồ sơ</button></div>
                <div className="summary-grid">
                  <div className="summary-item"><span className="sum-label">Tên Shop:</span><span className="sum-value">{formData.shopName}</span></div>
                  <div className="summary-item"><span className="sum-label">Loại hình:</span><span className="sum-value">{getBusinessLabel(formData.businessType)}</span></div>
                  <div className="summary-item"><span className="sum-label">SĐT liên hệ:</span><span className="sum-value">{formatPhone(formData.phone)}</span></div>
                  <div className="summary-item"><span className="sum-label">Email liên hệ:</span><span className="sum-value">{formData.email}</span></div>
                  <div className="summary-item"><span className="sum-label">Email nhận hóa đơn:</span><span className="sum-value">{formData.invoiceEmails.filter(Boolean).join(', ') || 'N/A'}</span></div>
                  <div className="summary-item"><span className="sum-label">Mã số thuế:</span><span className="sum-value">{formatMST(formData.taxCode)}</span></div>
                  <div className="summary-item"><span className="sum-label">Số {formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}:</span><span className="sum-value">{formData.identityType === 'CCCD' ? formatCCCD(formData.cccdNumber) : formData.cccdNumber}</span></div>
                  <div className="summary-item"><span className="sum-label">ĐV Vận chuyển:</span><span className="sum-value">{shippingMethodsList.filter(m => formData.shippingMethods[m.id]).map(m => m.name).join(', ') || 'N/A'}</span></div>
                  <div className="summary-item"><span className="sum-label">Ngày gửi:</span><span className="sum-value">{new Date().toLocaleDateString('vi-VN')}</span></div>
                </div>

                <div className="summary-photos-section" style={{border: '2px solid #ee4d2d', padding: '20px', marginTop: '30px', borderRadius: '4px'}}>
                   <div className="summary-photo-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px'}}>
                      <div className="summary-photo-item" onClick={() => setZoomedImage(formData.frontPreview)}>{formData.frontPreview ? <img src={formData.frontPreview} alt="Front" /> : <div className="upload-placeholder"><FaIdCard size={40} /></div>}<span>Mặt trước {formData.identityType}</span><div className="zoom-hint"><FaSearchPlus /> Phóng to</div></div>
                      <div className="summary-photo-item" onClick={() => setZoomedImage(formData.backPreview)}>{formData.backPreview ? <img src={formData.backPreview} alt="Back" /> : <div className="upload-placeholder"><FaIdCard size={40} /></div>}<span>Mặt sau {formData.identityType}</span><div className="zoom-hint"><FaSearchPlus /> Phóng to</div></div>
                      <div className="summary-photo-item" onClick={() => setZoomedImage(formData.businessType === 'INDIVIDUAL' ? ainetsoftLogo : (formData.licensePreview || ainetsoftLogo))}><img src={formData.businessType === 'INDIVIDUAL' ? ainetsoftLogo : (formData.licensePreview || ainetsoftLogo)} alt="Legal" /><span>{formData.businessType === 'INDIVIDUAL' ? 'Thành viên' : 'Giấy phép'}</span><div className="zoom-hint"><FaSearchPlus /> Phóng to</div></div>
                   </div>
                </div>

                <div className="summary-addresses">
                  <span className="sum-label">Địa chỉ lấy hàng & Tọa độ (Dành cho Shipper):</span>
                  <div className="sum-addr-list">
                    {formData.stockAddresses.map((addr, i) => (
                      <div key={i} className="sum-addr-item" style={{border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '4px'}}>
                         <strong>{[addr.fullName, formatPhone(addr.phoneNumber)].filter(Boolean).join(' | ')}</strong>
                         <p>{[addr.detailAddress, addr.ward, addr.province].filter(Boolean).join(', ')}</p>
                         
                         {addr.latitude && String(addr.latitude).trim() !== '' && addr.longitude && String(addr.longitude).trim() !== '' && (
                           <div className="preview-coords">
                              <FaMapMarkedAlt style={{color: '#2f54eb'}} />
                              <div style={{flex: 1}}>
                                 <span className="coord-text">{addr.latitude}, {addr.longitude}</span>
                                 <div className="qr-box-summary">
                                    {/* FIXED: Official Google Maps Search URL */}
                                    <img className="qr-code-img" 
                                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`)}`} 
                                         alt="QR Map" />
                                    <div className="qr-info-text">
                                       <strong>QR Map Dẫn Đường</strong>
                                       <p>Shipper dùng camera quét để mở Google Maps ngay lập tức.</p>
                                    </div>
                                 </div>
                              </div>
                              <div className="btn-copy-action" onClick={() => { copyToClipboard(`${addr.latitude}, ${addr.longitude}`); }}><FaCopy title="Sao chép tọa độ!" /></div>
                              <a href={`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`} target="_blank" rel="noreferrer" className="btn-maps-link">[Bản Đồ]</a>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="print-footer-legal"><p>© 2026 AiNetsoft E-commerce System. Tài liệu tự động từ hệ thống.</p></div>
              </div>
              {!isSubmitted && (
                <div className="onboarding-footer no-print">
                   <button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(4)}>Quay lại sửa</button>
                   <button className="btn-ainetsoft-primary" onClick={handleFinalSubmit} disabled={isSaving}>
                      {isSaving ? "Đang gửi..." : "Xác nhận & Gửi hồ sơ"}
                   </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {zoomedImage && (<div className="zoom-overlay" onClick={() => setZoomedImage(null)}><div className="zoom-content"><FaTimes className="zoom-close" onClick={() => setZoomedImage(null)} /><img src={zoomedImage} alt="Zoomed" /></div></div>)}

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <div className="ainetsoft-modal-overlay no-print">
          <div className="ainetsoft-modal-card">
            <div className="modal-header"><h3>Thêm Địa Chỉ Mới</h3><FaTimes className="close-icon" onClick={() => setShowAddressModal(false)} /></div>
            <div className="modal-body">
              <div className="row-split">
                <div className="input-with-label"><label><span className="req">*</span> Họ & Tên</label><input className={addressErrors.fullName ? "error-border" : ""} value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} />{addressErrors.fullName && <p className="red-msg-inline">{addressErrors.fullName}</p>}</div>
                <div className="input-with-label"><label><span className="req">*</span> SĐT</label><input className={addressErrors.phoneNumber ? "error-border" : ""} value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: formatPhone(e.target.value)})} maxLength={12} placeholder="098 776 7688" />{addressErrors.phoneNumber && <p className="red-msg-inline">{addressErrors.phoneNumber}</p>}</div>
              </div>
              <div className="modal-field-full"><label><span className="req">*</span> Tỉnh/Thành phố</label><select className={addressErrors.province ? "error-border" : ""} value={addressForm.province} onChange={e => setAddressForm({...addressForm, province: e.target.value})}><option value="">Chọn</option>{PROVINCES_2026.map(p => <option key={p} value={p}>{p}</option>)}</select>{addressErrors.province && <p className="red-msg-inline">{addressErrors.province}</p>}</div>
              <div className="modal-field-full"><label><span className="req">*</span> Phường/Xã</label><input className={addressErrors.ward ? "error-border" : ""} value={addressForm.ward} onChange={e => setAddressForm({...addressForm, ward: e.target.value})} />{addressErrors.ward && <p className="red-msg-inline">{addressErrors.ward}</p>}</div>
              <div className="modal-field-full"><label>{!addressForm.ward.toLowerCase().includes("phường") && <span className="req">*</span>}Ấp/Thôn/Tổ</label><input className={addressErrors.hamlet ? "error-border" : ""} value={addressForm.hamlet} onChange={e => setAddressForm({...addressForm, hamlet: e.target.value})} />{addressErrors.hamlet && <p className="red-msg-inline">{addressErrors.hamlet}</p>}</div>
              <div className="modal-field-full"><label><span className="req">*</span> Địa chỉ chi tiết</label><textarea className={addressErrors.detailAddress ? "error-border" : ""} value={addressForm.detailAddress} onChange={e => setAddressForm({...addressForm, detailAddress: e.target.value})} placeholder="Số nhà, tên đường..." />{addressErrors.detailAddress && <p className="red-msg-inline">{addressErrors.detailAddress}</p>}</div>
              <div className="gps-box-ainetsoft" onClick={getCurrentLocation}>
                <FaMapMarkerAlt className="gps-red" />
                <div className="gps-text">
                  <strong>Định vị GPS</strong>
                  <span>{addressForm.latitude ? `${addressForm.latitude}, ${addressForm.longitude}` : 'Lấy tọa độ tự động'}</span>
                  <p className="gps-hint-text">* Vui lòng nhấp chuột và chờ khoảng 5 giây để lấy tọa độ tự động.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer-ainetsoft"><button className="btn-cancel-ainetsoft" onClick={() => setShowAddressModal(false)}>Hủy</button><button className="btn-save-ainetsoft" onClick={handleLocalAddressSave}>Lưu</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRegister;