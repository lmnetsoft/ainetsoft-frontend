import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom'; 
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css'; 
import { 
  FaStore, FaHourglassHalf, FaMapMarkerAlt, FaUniversity, FaArrowRight, 
  FaArrowLeft, FaCloudUploadAlt, FaEye, FaTimes, FaCrosshairs, 
  FaCheck, FaTruck, FaShippingFast, FaPlus, FaChevronRight, FaTrash,
  FaChevronDown, FaChevronUp, FaIdCard, FaFileInvoiceDollar, FaCheckCircle,
  FaInfoCircle, FaShieldAlt, FaUpload, FaCamera, FaRegLightbulb, FaEdit, FaPrint,
  FaSearchPlus, FaMapMarkedAlt, FaQrcode, FaCopy, FaClock, FaPassport, FaTimesCircle,
  FaExclamationTriangle, FaSearch, FaComments 
} from 'react-icons/fa';
import LegalModal from '../../components/LegalModal/LegalModal'; 
import { getUserProfile } from '../../services/authService';
import { getProvinces, getDistricts, getWards } from '../../services/shippingService';
import { useChat } from '../../context/ChatContext';
import { toast } from 'react-hot-toast';
import api from '../../services/api'; 
import './Profile.css';
import './SellerRegister.css';
import ainetsoftLogo from '../../assets/images/logo.png'; 

const BACKEND_BASE = "http://localhost:8080"; 
const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY; 
const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;

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
  
  .ocr-error-banner {
    background: #fff1f0; border: 1px solid #ffa39e; padding: 16px; border-radius: 6px;
    margin-bottom: 25px; display: flex; align-items: center; gap: 14px; color: #cf1322;
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1); animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
  .ocr-error-banner svg { font-size: 22px; flex-shrink: 0; }
  .ocr-error-banner p { margin: 0; font-weight: 700; font-size: 14px; line-height: 1.5; }

  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }

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
  
  .legal-link-trigger { color: #2f54eb; text-decoration: underline; font-weight: 600; cursor: pointer; }
  .legal-link-trigger:hover { color: #1d39c4; }

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

  .ocr-processing-hint {
    display: flex; align-items: center; gap: 8px; font-size: 12px;
    color: #1890ff; margin-top: 5px; font-weight: 600;
  }

  .revoked-view-card {
    background: #fff; border-radius: 16px; padding: 40px; text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.06); max-width: 750px; margin: 20px auto;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .revoked-icon { font-size: 70px; color: #ee4d2d; margin-bottom: 25px; }
  .revoked-view-card h2 { font-size: 30px; font-weight: 800; color: #1f1f1f; margin-bottom: 8px; letter-spacing: -0.5px; }
  .revoked-view-card p.revoked-subtext { color: #595959; font-size: 16px; margin-bottom: 25px; }
  .revoked-reason-box { background: #fff1f0; border: 1.5px solid #ffa39e; padding: 24px; border-radius: 12px; margin: 30px 0; text-align: center; }
  .revoked-reason-box label { color: #cf1322; font-weight: 900; font-size: 13px; text-transform: uppercase; display: block; margin-bottom: 12px; letter-spacing: 0.5px; }
  .revoked-reason-text { color: #2d3436; font-style: italic; font-size: 17px; line-height: 1.6; font-weight: 600; }
  .revoked-instructions { list-style: none; padding: 0; margin: 30px 0; text-align: left; }
  .revoked-instructions li { display: flex; align-items: center; gap: 15px; padding: 14px 0; border-bottom: 1px solid #f1f2f6; font-size: 15.5px; color: #595959; font-weight: 500; }
  .revoked-actions { display: flex; gap: 15px; justify-content: center; margin-top: 30px; }
  .btn-chat-admin { background: #ee4d2d; color: #fff; padding: 14px 35px; border-radius: 8px; font-weight: 700; border: none; display: flex; align-items: center; gap: 10px; transition: 0.2s; font-size: 15px; cursor: pointer; }
  .btn-chat-admin:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(238, 77, 45, 0.3); }

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

const VN_PHONE_REGEX = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/;

const SellerRegister = () => {
  const navigate = useNavigate();
  const { setIsChatOpen } = useChat(); 

  const [currentStep, setCurrentStep] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); 

  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [detectedIdNumber, setDetectedIdNumber] = useState<string | null>(null);
  const [legalSlug, setLegalSlug] = useState<string | null>(null);

  const [isRejected, setIsRejected] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false); 
  const [rejectionReason, setRejectionReason] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [shippingMethodsList, setShippingMethodsList] = useState<any[]>([]);
  const [expandedMethods, setExpandedMethods] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSearch, setMapSearch] = useState("");
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // 🚀 LOGISTICS DROPDOWN STATES
  const [ghnProvinces, setGhnProvinces] = useState<any[]>([]);
  const [ghnDistricts, setGhnDistricts] = useState<any[]>([]);
  const [ghnWards, setGhnWards] = useState<any[]>([]);
  const [selectedProvId, setSelectedProvId] = useState<number>(0);

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
    fullName: '', phoneNumber: '', province: '', district: '', ward: '', hamlet: '',
    detailAddress: '', latitude: '', longitude: '', isDefault: true,
    districtId: 0, wardCode: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsPageLoading(true);
        setIsShippingLoading(true);
        
        const [rawProfile, shippingRes, bankRes, provs] = await Promise.all([
          getUserProfile(),
          api.get('/shipping-methods/active'),
          api.get('/bank-accounts/my'),
          getProvinces()
        ]);

        const profileData = rawProfile?.data || rawProfile;
        const bankAccounts = bankRes.data || [];
        setGhnProvinces(provs || []);

        if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) {
            toast.error("Vui lòng thiết lập tài khoản ngân hàng trước khi đăng ký Người bán!", { duration: 5000 });
            navigate('/user/bank?redirect=seller-register');
            return;
        }

        if (profileData.roles?.includes('SELLER')) {
            toast.success("Chào mừng trở lại, Người bán!");
            navigate('/user/profile');
            return;
        }

        if (profileData.sellerVerification === 'PENDING') {
            setIsSubmitted(true);
            setCurrentStep(5);
        } else if (profileData.sellerVerification === 'REJECTED') {
            setIsRejected(true);
            setRejectionReason(profileData.rejectionReason || "Thông tin hồ sơ chưa hợp lệ.");
        } else if (profileData.sellerVerification === 'REVOKED') { 
            setIsRevoked(true);
            setRejectionReason(profileData.rejectionReason || "Quyền Người bán của bạn đã bị thu hồi do vi phạm chính sách.");
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
           district: addr.district || '',
           ward: addr.ward || '',
           hamlet: addr.hamlet || '',
           detailAddress: addr.detail || '',
           latitude: addr.latitude || '',
           longitude: addr.longitude || '',
           isDefault: addr.isDefault || false,
           districtId: addr.districtId || 0,
           wardCode: addr.wardCode || ''
        }));

        const shouldClear = profileData.sellerVerification !== 'PENDING' && profileData.sellerVerification !== 'REVOKED';

        setFormData(prev => ({
          ...prev,
          phone: normalizedAddresses[0]?.phoneNumber || profileData.shopProfile?.businessPhone || profileData.phone || '',
          email: profileData.shopProfile?.businessEmail || profileData.email || '',
          shopName: shouldClear ? '' : (profileData.shopProfile?.shopName || ''),
          stockAddresses: shouldClear ? [] : normalizedAddresses,
          businessType: shouldClear ? 'INDIVIDUAL' : (profileData.shopProfile?.businessType || 'INDIVIDUAL'),
          companyName: shouldClear ? '' : (profileData.shopProfile?.companyName || ''),
          registeredAddress: shouldClear ? '' : (profileData.shopProfile?.registeredAddress || ''),
          invoiceEmails: shouldClear ? [''] : (profileData.shopProfile?.invoiceEmails?.length > 0 ? profileData.shopProfile.invoiceEmails : [profileData.shopProfile?.invoiceEmail || '']),
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
        const marker = new goongjs.Marker({ color: '#ee4d2d' }).setLngLat([106.660172, 10.762622]).addTo(map);
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
        setAddressForm(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6), detailAddress: mapSearch }));
      }
    } catch (e) {
      toast.error("Không tìm thấy địa chỉ này.");
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
        setAddressForm(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6), detailAddress: p.description }));
      }
    } catch (e) {}
  };

  const handleStartFromScratch = () => {
    setIsRejected(false);
    setRejectionReason('');
    setCurrentStep(1);
    toast("Vui lòng cập nhật thông tin chính xác và gửi lại yêu cầu mới.", { icon: 'ℹ️' }); 
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'license') => {
    const file = e.target.files?.[0];
    if (file) {
      setServerError(null); 
      const reader = new FileReader();
      reader.onloadend = async () => {
        setFormData(prev => ({ ...prev, [`${type}Image`]: file, [`${type}Preview`]: reader.result as string }));
        if (type === 'front') {
            try {
                setIsOcrLoading(true);
                const checkForm = new FormData();
                checkForm.append('image', file);
                const res = await api.post('/auth/verify-ocr', checkForm);
                if (res.data?.idNumber) {
                    setDetectedIdNumber(res.data.idNumber.replace(/\s/g, ''));
                }
            } catch (err) {
                console.error("AI Check Failed");
            } finally {
                setIsOcrLoading(false);
            }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = (type: 'front' | 'back' | 'license', e: React.MouseEvent) => {
    e.stopPropagation(); 
    setFormData(prev => ({ ...prev, [`${type}Image`]: null, [`${type}Preview`]: '' }));
    if (type === 'front') setDetectedIdNumber(null); 
    const input = document.getElementById(`input-${type}`) as HTMLInputElement;
    if (input) input.value = '';
    setServerError(null);
  };

  const handleInvoiceEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.invoiceEmails];
    newEmails[index] = value;
    setFormData({ ...formData, invoiceEmails: newEmails });
    if (formErrors.invoiceEmail) {
        setFormErrors(prev => {
            const newErrs = { ...prev };
            delete newErrs.invoiceEmail;
            return newErrs;
        });
    }
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
    if (!formData.shopName.trim()) {
        errors.shopName = "Tên Shop là bắt buộc. Vui lòng nhập tên cửa hàng.";
    }
    if (formData.stockAddresses.length === 0) errors.addresses = "Cần ít nhất 1 địa chỉ lấy hàng";
    const phones = formData.stockAddresses.map(a => a.phoneNumber.replace(/\D/g, ''));
    if (new Set(phones).size !== phones.length) {
      errors.addresses = "Số điện thoại giữa các kho phải khác nhau.";
    }
    if (!formData.email.trim()) errors.email = "Email là bắt buộc";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    const hasAtLeastOne = Object.values(formData.shippingMethods).some(v => v === true);
    if (!hasAtLeastOne) {
      errors.shippingMethods = "Vui lòng kích hoạt ít nhất 1 phương thức vận chuyển để tiếp tục.";
      setFormErrors(errors);
      return false;
    }
    setFormErrors({}); 
    return true;
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
    if (emailEmpty) {
        errors.invoiceEmail = "Vui lòng không để trống ô email";
    } else {
        const emails = formData.invoiceEmails.map(e => e.trim().toLowerCase());
        if (new Set(emails).size !== emails.length) {
            errors.invoiceEmail = "Email nhận hóa đơn không được trùng nhau.";
        }
    }
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
    const rawIDInput = formData.cccdNumber.replace(/\s|-/g, '');
    const vnPassportRegex = /^[A-Z]\d{7,8}$/;

    if (formData.identityType === 'CCCD') {
      if (!rawIDInput || rawIDInput.length !== 12) {
        errors.cccdNumber = "Số CCCD phải bao gồm 12 chữ số";
      }
    } else {
      const cleanPassport = rawIDInput.replace(/-/g, '').replace(/\s/g, '');
      if (!cleanPassport || !vnPassportRegex.test(cleanPassport)) {
        errors.cccdNumber = "Số Hộ chiếu VN không hợp lệ (Vd: G12345678)";
      }
    }

    if (!formData.frontPreview) errors.frontImage = `Thiếu mặt trước ${formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}`;
    if (!formData.backPreview) errors.backImage = `Thiếu mặt sau ${formData.identityType === 'CCCD' ? 'CCCD' : 'Hộ chiếu'}`;
    
    if (detectedIdNumber && rawIDInput !== detectedIdNumber) {
        errors.cccdNumber = "Số định danh không khớp với ảnh.";
        setServerError("Số định danh trên ảnh không khớp với thông tin bạn nhập. Vui lòng kiểm tra lại.");
    } else if (detectedIdNumber && rawIDInput === detectedIdNumber) {
        setServerError(null); 
    }
    if (!formData.isConfirmed) {
      errors.confirmation = "Vui lòng xác nhận thông tin trước khi tiếp tục";
      toast.error("Bạn cần xác nhận tính chính xác của dữ liệu.");
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0 && (detectedIdNumber ? rawIDInput === detectedIdNumber : true);
  };

  const performFullValidation = () => {
    const s1 = validateStep1();
    const s2 = validateStep2(); 
    const s3 = validateStep3();
    const s4 = validateStep4();
    if (!s1 || !s2 || !s3 || !s4) {
      const missing = [];
      if (!s1) missing.push("Thông tin Shop");
      if (!s2) missing.push("Cài đặt vận chuyển");
      if (!s3) missing.push("Thông tin Công ty/Thuế");
      if (!s4) missing.push("Thông tin Định danh");
      toast.error(`Thiếu thông tin: ${missing.join(', ')}. Vui lòng kiểm tra lại.`);
      return false;
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!performFullValidation()) return;
    setServerError(null); 

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
        toast.success("Xác thực hồ sơ thành công!"); 
        setIsSubmitted(true); 
      }
    } catch (error: any) { 
      const errorMsg = error.response?.data?.message || error.message || "Gửi hồ sơ thất bại";
      setServerError(errorMsg); 
      toast.error(errorMsg, {
        duration: 8000, position: 'top-center',
        style: { background: '#cf1322', color: '#fff', fontWeight: 'bold' }
      });
      setCurrentStep(4);
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
    if (formData.stockAddresses.some(a => a.phoneNumber.replace(/\D/g, '') === phone)) errors.phoneNumber = "SĐT này đã được sử dụng cho kho khác.";
    
    if (!addressForm.province || !addressForm.districtId || !addressForm.wardCode) errors.province = "Vui lòng chọn đầy đủ Tỉnh/Quận/Phường từ danh sách";
    if (!addressForm.ward.toLowerCase().includes("phường") && !addressForm.hamlet.trim()) errors.hamlet = "Bắt buộc nhập Ấp/Thôn cho khu vực xã";
    if (!addressForm.detailAddress.trim()) errors.detailAddress = "Vui lòng nhập số nhà, tên đường";
    
    if (Object.keys(errors).length > 0) { setAddressErrors(errors); return; }
    
    // 🚀 ĐÃ SỬA: Tự động set isDefault=false cho kho thứ 2
    setFormData(prev => ({ ...prev, stockAddresses: [...prev.stockAddresses, { ...addressForm, phoneNumber: phone, isDefault: prev.stockAddresses.length === 0 }] }));
    
    setShowAddressModal(false); setAddressErrors({}); 
    setAddressForm({ fullName: '', phoneNumber: '', province: '', district: '', ward: '', hamlet: '', detailAddress: '', latitude: '', longitude: '', isDefault: true, districtId: 0, wardCode: '' });
    setSelectedProvId(0);
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

  /** 📋 PDF SUMMARY GENERATOR (100% PRESERVED) */
  const printApprovalSummary = (seller: any, note: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleString('vi-VN');
    const isPassport = seller.identityInfo?.identityType === 'PASSPORT';
    const idLabel = isPassport ? "Hộ chiếu" : "CCCD";
    
    const idValue = isPassport 
      ? formatPassport(seller.identityInfo?.cccdNumber) 
      : formatCCCD(seller.identityInfo?.cccdNumber);

    const addressesHtml = (seller.addresses || []).map((addr: any, i: number) => {
      const hasGPS = addr.latitude && String(addr.latitude).trim() !== '' && 
                     addr.longitude && String(addr.longitude).trim() !== '';
      
      const mapsUrl = `http://googleusercontent.com/maps.google.com/${addr.latitude},${addr.longitude}`;

      const gpsContent = hasGPS ? `
        <span style="color: #1d39c4;">GPS: ${addr.latitude}, ${addr.longitude}</span><br/>
        <div style="margin-top: 10px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(mapsUrl)}" 
               style="width: 70px; height: 70px; border: 1px solid #ddd; padding: 2px;" />
        </div>
      ` : '';

      return `
        <div style="border: 1px solid #eee; padding: 10px; margin-top: 10px;">
          <strong>Kho ${i + 1}:</strong> ${addr.receiverName} | ${formatPhone(addr.phone)}<br/>
          ${addr.detail}, ${addr.ward}, ${addr.province}<br/>
          ${gpsContent}
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Biên Bản Phê Duyệt - ${seller.fullName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ee4d2d; padding-bottom: 20px; }
            .status-stamp { color: #52c41a; border: 3px solid #52c41a; padding: 10px 20px; font-weight: bold; text-transform: uppercase; border-radius: 8px; transform: rotate(-5deg); }
            section { margin-top: 30px; }
            h2 { color: #ee4d2d; font-size: 18px; border-left: 4px solid #ee4d2d; padding-left: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .footer { margin-top: 50px; text-align: right; font-style: italic; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1 style="margin:0; color:#ee4d2d;">AiNetsoft</h1><p style="margin:0;">Hệ thống Thương mại Điện tử</p></div>
            <div class="status-stamp">Đã Phê Duyệt</div>
          </div>
          <section>
            <p><strong>Ngày thực hiện:</strong> ${dateStr}</p>
            <p><strong>Mã định danh hệ thống:</strong> ${seller.id}</p>
          </section>
          <div class="grid">
            <section>
              <h2>Thông tin Người bán</h2>
              <p><strong>Họ tên:</strong> ${seller.fullName}</p>
              <p><strong>Email đăng ký:</strong> ${seller.email}</p>
              <p><strong>SĐT:</strong> ${formatPhone(seller.phone)}</p>
              <p><strong>Số ${idLabel}:</strong> ${idValue}</p>
            </section>
            <section>
              <h2>Thông tin Kinh doanh</h2>
              <p><strong>Tên Shop:</strong> ${seller.shopProfile?.shopName}</p>
              <p><strong>Email nhận hóa đơn:</strong> ${seller.shopProfile?.invoiceEmails?.join(', ') || 'Chưa cung cấp'}</p>
              <p><strong>Mã số thuế:</strong> ${formatMST(seller.shopProfile?.taxCode)}</p>
              <p><strong>Loại hình:</strong> ${getBusinessLabel(seller.shopProfile?.businessType)}</p>
            </section>
          </div>
          <section>
            <h2>Vị trí Kho hàng & GPS</h2>
            ${addressesHtml}
          </section>
          <section style="background: #f9f9f9; padding: 20px; border-radius: 4px; border-left: 4px solid #8c8c8c;">
            <h2>Ghi chú của Admin</h2>
            <p>${note}</p>
          </section>
          <div class="footer">Tài liệu được tạo tự động bởi Hệ thống AiNetsoft.<br/>Người phê duyệt: Quản trị viên Toàn cầu</div>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (isPageLoading) return <div className="loading-spinner">Đang tải hồ sơ Người bán...</div>;

  return (
    <div className="user-page-supreme-layout">
      <style>{inlineStyles}</style>
      
      <main className="onboarding-view">
        <div className="profile-content-header">
           <h1>Đăng ký Người bán</h1>
           <p>Hoàn tất 5 bước để bắt đầu kinh doanh trên AiNetsoft</p>
        </div>
        <hr className="supreme-divider" />

        {isRevoked && (
          <div className="revoked-view-card animate-fade-in">
             <div className="revoked-header">
                <FaExclamationTriangle className="revoked-icon" />
                <h2>Quyền Người Bán Bị Thu Hồi</h2>
                <p className="revoked-subtext">Bạn tạm thời bị giới hạn các tính năng bán hàng trên hệ thống.</p>
             </div>

             <div className="revoked-reason-box">
                <label>Lý do từ Ban Quản Trị:</label>
                <div className="revoked-reason-text">"{rejectionReason}"</div>
             </div>

             <div className="revoked-instructions-wrap">
                <h3 style={{fontSize: '18px', color: '#1f1f1f', textAlign: 'left', fontWeight: '700', marginBottom: '15px'}}>Cần làm gì để khôi phục?</h3>
                <ul className="revoked-instructions">
                   <li><FaShieldAlt style={{color: '#ee4d2d'}} /> <span>Kiểm tra và sửa đổi các thông tin hoặc sản phẩm vi phạm chính sách.</span></li>
                   <li><FaComments style={{color: '#5b67f1'}} /> <span>Nhắn tin cho Admin để trao đổi và nhận hướng dẫn khắc phục cụ thể.</span></li>
                   <li><FaCheckCircle style={{color: '#16a34a'}} /> <span>Chờ Admin kiểm tra lại và nhấn <strong>Cấp lại quyền</strong> từ Hệ thống Quản trị.</span></li>
                </ul>
             </div>

             <div className="revoked-actions">
                <button type="button" onClick={() => setIsChatOpen(true)} className="btn-chat-admin"><FaComments /> Nhắn tin cho Admin</button>
                <button onClick={() => navigate('/user/profile')} style={{background: '#f1f2f6', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#2d3436'}}>Về trang hồ sơ</button>
             </div>
          </div>
        )}

        {isRejected && !isRevoked && (
          <div className="preview-mode-banner no-print" style={{background: '#fff1f0', border: '1px solid #ffccc7', padding: '25px'}}>
            <h2 style={{color: '#cf1322', margin: '0 0 10px 0'}}><FaTimesCircle /> Hồ sơ bị từ chối</h2>
            <div style={{color: '#595959', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px'}}>
               <p><strong>Lý do:</strong> <span style={{color: '#cf1322', fontWeight: 'bold'}}>{rejectionReason}</span></p>
               {rejectionReason.includes("[Lỗi Email]") || rejectionReason.toLowerCase().includes("email không hợp lệ") ? (
                  <p style={{marginTop: '10px'}}>Hệ thống nhận thấy <strong>Email của bạn không hợp lệ</strong>. Vui lòng cập nhật <strong>Email thật</strong> và gửi lại yêu cầu mới.</p>
               ) : (
                  <p>Hệ thống không thể xác thực một số thông tin của bạn. Vui lòng kiểm tra lại lý do trên và cập nhật hồ sơ chính xác trước khi gửi lại.</p>
               )}
            </div>
            <button className="btn-ainetsoft-primary" onClick={handleStartFromScratch} style={{background: '#cf1322', borderColor: '#cf1322'}}>Gửi lại yêu cầu mới từ đầu</button>
          </div>
        )}

        {!isRejected && !isRevoked && (
          <div className="onboarding-stepper no-print">
            {['Thông tin Shop', 'Cài đặt vận chuyển', 'Thông tin thuế', 'Thông tin định danh', 'Hoàn tất'].map((l, i) => (
              <div key={i} className={`step-node ${currentStep > i ? 'active' : ''}`}>
                <div className="node-dot">{currentStep > i + 1 ? <FaCheck /> : i + 1}</div>
                <span>{l}</span>
                {i < 4 && <div className={`node-line ${currentStep > i + 1 ? 'active' : ''}`}></div>}
              </div>
            ))}
          </div>
        )}

        {!isRejected && !isRevoked && (
          <div className="onboarding-card">
            {currentStep === 1 && (
              <div className="step-content">
                <div className="supreme-form-row">
                  <label><span className="req">*</span> Tên Shop</label>
                  <div style={{ flex: 1, maxWidth: '600px' }}>
                    <input className={formErrors.shopName ? "error-border" : ""} value={formData.shopName} maxLength={30} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="Nhập tên shop" />
                    <span className="char-counter">{formData.shopName.length}/30</span>
                    {formErrors.shopName && <p className="red-msg-inline">{formErrors.shopName}</p>}
                  </div>
                </div>
                
                <div className="supreme-form-row">
                  <label><span className="req">*</span> Địa chỉ lấy hàng</label>
                  <div style={{ flex: 1, maxWidth: '600px' }}>
                    {formData.stockAddresses.map((addr, idx) => (
                      <div key={idx} className="address-display-box" style={{marginBottom: '10px'}}>
                        <div className="addr-text">
                           <strong>{[addr.fullName, formatPhone(addr.phoneNumber)].filter(Boolean).join(' | ')}</strong>
                           <p>{[addr.detailAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}</p>
                        </div>
                        <div className="trash-action-area" onClick={() => setFormData({...formData, stockAddresses: formData.stockAddresses.filter((_, i) => i !== idx)})}>
                          <FaTrash className="trash-icon" />
                        </div>
                      </div>
                    ))}
                    <button className="btn-add-ainetsoft" onClick={() => setShowAddressModal(true)} disabled={formData.stockAddresses.length >= 2} ><FaPlus /> Thêm địa chỉ ({formData.stockAddresses.length}/2)</button>
                    {formErrors.addresses && <p className="red-msg-inline">{formErrors.addresses}</p>}
                  </div>
                </div>
                
                <div className="supreme-form-row">
                  <label><span className="req">*</span> Email liên hệ</label>
                  <div style={{ flex: 1, maxWidth: '600px' }}>
                    <input className="input-locked" value={formData.email} disabled style={{ backgroundColor: '#f5f5f5', color: '#8c8c8c' }} readOnly />
                  </div>
                </div>
                <div className="onboarding-footer"><button className="btn-ainetsoft-primary" onClick={() => { if(validateStep1()) setCurrentStep(2); }}>Tiếp theo</button></div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="step-content">
                <div className="shipping-header-text"><h3>Phương thức vận chuyển</h3><p>Kích hoạt các đơn vị vận chuyển hỗ trợ.</p></div>
                <div className="shipping-methods-list">
                  {shippingMethodsList.map((method) => {
                      const mId = method.id;
                      return (
                        <div key={mId} className="shipping-method-item">
                          <div className="method-main-row"><span>{method.name}</span><button className="btn-collapse" onClick={() => setExpandedMethods(prev => ({...prev, [mId]: !prev[mId]}))}>{expandedMethods[mId] ? 'Mở rộng' : 'Thu gọn'} {expandedMethods[mId] ? <FaChevronDown /> : <FaChevronUp />}</button></div>
                          {!expandedMethods[mId] && (<div className="method-details-row"><div className="method-sub-box"><div className="sub-box-left"><span>{method.name}</span>{method.codEnabled && <span className="cod-tag"> [COD được kích hoạt]</span>}</div><div className="sub-box-right"><label className="ainetsoft-switch"><input type="checkbox" checked={!!formData.shippingMethods[mId]} onChange={() => toggleShipping(mId)} /><span className="slider round"></span></label></div></div></div>)}
                        </div>
                      );
                    })}
                </div>
                {formErrors.shippingMethods && <p className="red-msg-inline" style={{padding: '0 20px'}}>{formErrors.shippingMethods}</p>}
                <div className="onboarding-footer"><button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(1)}>Quay lại</button><button className="btn-ainetsoft-primary" onClick={() => { if(validateStep2()) setCurrentStep(3); }}>Tiếp theo</button></div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="step-content">
                <div className="ainetsoft-radio-group" style={{marginBottom: '25px'}}>{['INDIVIDUAL', 'HOUSEHOLD', 'ENTERPRISE'].map(t => (<label key={t} className="radio-item"><input type="radio" checked={formData.businessType === t} onChange={() => setFormData({...formData, businessType: t})} /><span className="radio-mark"></span> {getBusinessLabel(t)}</label>))}</div>
                
                {formData.businessType !== 'INDIVIDUAL' && (
                  <div className="supreme-form-row">
                    <label><span className="req">*</span> Tên công ty</label>
                    <div style={{ flex: 1, maxWidth: '600px' }}>
                      <input className={formErrors.companyName ? "error-border" : ""} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Tên chính thức" />
                      {formErrors.companyName && <p className="red-msg-inline">{formErrors.companyName}</p>}
                    </div>
                  </div>
                )}
                
                <div className="supreme-form-row">
                  <label><span className="req">*</span> Địa chỉ đăng ký</label>
                  <div style={{ flex: 1, maxWidth: '600px' }}>
                    <input className={formErrors.registeredAddress ? "error-border" : ""} value={formData.registeredAddress} onChange={e => setFormData({...formData, registeredAddress: e.target.value})} placeholder="Địa chỉ theo GPKD" />
                    {formErrors.registeredAddress && <p className="red-msg-inline">{formErrors.registeredAddress}</p>}
                  </div>
                </div>
                
                <div className="supreme-form-row">
                  <label><span className="req">*</span> Email nhận hóa đơn</label>
                  <div style={{ flex: 1, maxWidth: '600px' }}>
                    {formData.invoiceEmails.map((email, idx) => (
                      <div key={idx} className="email-input-item" style={{display: 'flex', gap: '10px', marginBottom: '8px'}}>
                        <input className={formErrors.invoiceEmail ? "error-border" : ""} value={email} onChange={e => handleInvoiceEmailChange(idx, e.target.value)} placeholder="Email" />
                        {formData.invoiceEmails.length > 1 && <button className="btn-remove-email" onClick={() => removeInvoiceEmail(idx)}><FaTimes /></button>}
                      </div>
                    ))}
                    {formData.invoiceEmails.length < 2 && <button className="btn-add-email-ainetsoft" onClick={addInvoiceEmail}>+ Thêm Email</button>}
                    {formErrors.invoiceEmail && <p className="red-msg-inline">{formErrors.invoiceEmail}</p>}
                  </div>
                </div>
                
                <div className="supreme-form-row">
                  <label><span className="req">*</span> MST</label>
                  <div style={{ flex: 1, maxWidth: '600px' }}>
                    <input className={formErrors.taxCode ? "error-border" : ""} value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: formatMST(e.target.value)})} maxLength={17} placeholder="111 111 111 1" />
                    {formErrors.taxCode && <p className="red-msg-inline">{formErrors.taxCode}</p>}
                  </div>
                </div>
                
                {formData.businessType !== 'INDIVIDUAL' && (
                  <div className="supreme-form-row">
                    <label><span className="req">*</span> GPKD</label>
                    <div style={{ flex: 1, maxWidth: '600px' }}>
                      <div className={`license-upload-box ${formData.licensePreview ? "has-img" : ""} ${formErrors.license ? "error-border-dashed" : ""}`} onClick={() => document.getElementById('input-license')?.click()} >{formData.licensePreview ? (<><div className="btn-clear-img" onClick={(e) => clearImage('license', e)}><FaTimes /></div><img src={formData.licensePreview} alt="License" /></>) : (<div className="upload-placeholder"><FaCamera className="cam-icon" /><span>Tải lên GPKD</span></div>)}</div>
                      <input id="input-license" type="file" hidden onChange={e => handleFileChange(e, 'license')} />
                      {formErrors.license && <p className="red-msg-inline">{formErrors.license}</p>}
                    </div>
                  </div>
                )}
                <div className="onboarding-footer"><button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(2)}>Quay lại</button><button className="btn-ainetsoft-primary" onClick={() => { if(validateStep3()) setCurrentStep(4); }}>Tiếp theo</button></div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="step-content">
                {serverError && (<div className="ocr-error-banner"><FaExclamationTriangle /><p>{serverError}</p></div>)}
                <div className="ainetsoft-radio-group" style={{marginBottom: '20px'}}>
                  <label className="radio-item"><input type="radio" checked={formData.identityType === 'CCCD'} onChange={() => {setFormData({...formData, identityType: 'CCCD'}); setServerError(null);}} /><span className="radio-mark"></span> CCCD</label>
                  <label className="radio-item"><input type="radio" checked={formData.identityType === 'PASSPORT'} onChange={() => {setFormData({...formData, identityType: 'PASSPORT'}); setServerError(null);}} /><span className="radio-mark"></span> Hộ chiếu</label>
                </div>
                <div className="supreme-form-row">
                  <label><span className="req">*</span> Số {formData.identityType}</label>
                  <div style={{ flex: 1, maxWidth: '600px' }}>
                    <input className={(formErrors.cccdNumber || (serverError && serverError.includes("Số định danh"))) ? "error-border" : ""} value={formData.cccdNumber} onChange={e => {setFormData({...formData, cccdNumber: formData.identityType === 'CCCD' ? formatCCCD(e.target.value) : formatPassport(e.target.value)}); setServerError(null);}} maxLength={15} placeholder={formData.identityType === 'CCCD' ? "012 345 678 901" : "G-1234 5678"} />
                    {(formErrors.cccdNumber || (serverError && serverError.includes("Số định danh"))) && (<p className="red-msg-inline">{formErrors.cccdNumber || "Số định danh không khớp với ảnh."}</p>)}
                  </div>
                </div>
                <div className="id-upload-grid">
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <div className={`upload-box ${(formErrors.frontImage || (serverError && serverError.includes("Mặt trước"))) ? "error-border-dashed" : ""}`} onClick={() => document.getElementById('input-front')?.click()}>
                      {formData.frontPreview ? (<div style={{position: 'relative', height: '100%'}}><div className="btn-clear-img" onClick={(e) => clearImage('front', e)}><FaTimes /></div><img src={formData.frontPreview} alt="Front" className="preview-img" /></div>) : (<div className="upload-placeholder">{formData.identityType === 'CCCD' ? <FaIdCard className="cam-icon" /> : <FaPassport className="cam-icon" />}<span>Mặt trước {formData.identityType}</span></div>)}
                    </div>
                    {isOcrLoading && <div className="ocr-processing-hint"><i className="fa fa-spinner fa-spin"></i> AI đang xác thực thông tin...</div>}
                    {(formErrors.frontImage || (serverError && serverError.includes("Mặt trước"))) && <p className="red-msg-inline">{formErrors.frontImage || "Vui lòng kiểm tra lại ảnh mặt trước."}</p>}
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <div className={`upload-box ${(formErrors.backImage || (serverError && (serverError.includes("Mặt sau") || serverError.includes("cùng một mặt")))) ? "error-border-dashed" : ""}`} onClick={() => document.getElementById('input-back')?.click()}>
                      {formData.backPreview ? (<div style={{position: 'relative', height: '100%'}}><div className="btn-clear-img" onClick={(e) => clearImage('back', e)}><FaTimes /></div><img src={formData.backPreview} alt="Back" className="preview-img" /></div>) : (<div className="upload-placeholder">{formData.identityType === 'CCCD' ? <FaIdCard className="cam-icon" /> : <FaPassport className="cam-icon" />}<span>Mặt sau {formData.identityType}</span></div>)}
                    </div>
                    {(formErrors.backImage || (serverError && (serverError.includes("Mặt sau") || serverError.includes("cùng một mặt")))) && <p className="red-msg-inline">{formErrors.backImage || "Ảnh mặt trước và sau không được giống nhau."}</p>}
                  </div>
                </div>
                <input id="input-front" type="file" hidden onChange={e => handleFileChange(e, 'front')} /><input id="input-back" type="file" hidden onChange={e => handleFileChange(e, 'back')} />
                <div className="legal-confirmation-wrap">
                  <label className="legal-checkbox-label">
                    <input type="checkbox" checked={formData.isConfirmed} onChange={e => setFormData({...formData, isConfirmed: e.target.checked})} />
                    <span>Tôi <strong>cam kết</strong> các dữ liệu đã cung cấp là chính xác. Tôi đã đọc và đồng ý với <span className="legal-link-trigger" onClick={() => setLegalSlug('privacy')}> Chính Sách Bảo Mật </span> và <span className="legal-link-trigger" onClick={() => setLegalSlug('terms')}> Điều Khoản Sử Dụng </span> của AiNetsoft.</span>
                  </label>
                  {formErrors.confirmation && <p className="red-msg-inline">{formErrors.confirmation}</p>}
                </div>
                <div className="onboarding-footer">
                  <button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(3)} disabled={isSaving}>Quay lại</button>
                  <button className="btn-ainetsoft-primary" onClick={() => { if(validateStep4()) setCurrentStep(5); }} disabled={isSaving || isOcrLoading}>Xác nhận & Xem trước</button>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="step-content success-summary-view">
                {!isSubmitted ? (
                  <div className="preview-mode-banner no-print"><h2><FaInfoCircle /> Chế độ xem trước</h2><p>Vui lòng kiểm tra lại thông tin. Nhấn <strong>Xác nhận & Gửi hồ sơ</strong> để hoàn tất và nhận email thông báo.</p></div>
                ) : (
                  <div className="success-registration-alert no-print"><div className="success-alert-icon"><FaCheckCircle /></div><div className="success-alert-content"><h2>Đăng ký thành công!</h2><p>Hồ sơ của bạn đã được gửi. Chúng tôi đã gửi email xác nhận đến <strong>{formData.email}</strong>.</p><div className="timeline-note"><FaClock /> Phản hồi chậm nhất trong vòng 24h</div></div></div>
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
                      {formData.stockAddresses.map((addr, i) => {
                           const mapsUrl = `http://googleusercontent.com/maps.google.com/${addr.latitude},${addr.longitude}`;
                           return (
                             <div key={i} className="sum-addr-item" style={{border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '4px'}}>
                                <strong>{[addr.fullName, formatPhone(addr.phone || addr.phoneNumber)].filter(Boolean).join(' | ')}</strong>
                                <p>{[addr.detailAddress || addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}</p>
                                {addr.latitude && (
                                  <div className="preview-coords">
                                     <FaMapMarkedAlt style={{color: '#2f54eb'}} />
                                     <div style={{flex: 1}}>
                                        <span className="coord-text">{addr.latitude}, {addr.longitude}</span>
                                        <div className="qr-box-summary">
                                           <img className="qr-code-img" src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mapsUrl)}`} alt="QR Map" />
                                           <div className="qr-info-text"><strong>QR Map Dẫn Đường</strong><p>Shipper quét để mở Google Maps ngay lập tức.</p></div>
                                        </div>
                                     </div>
                                     <div className="btn-copy-action" onClick={() => { copyToClipboard(`${addr.latitude}, ${addr.longitude}`); }}><FaCopy title="Sao chép tọa độ!" /></div>
                                     <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-maps-link">[Bản Đồ]</a>
                                  </div>
                                )}
                             </div>
                           );
                      })}
                    </div>
                  </div>
                </div>
                {!isSubmitted && (
                  <div className="onboarding-footer no-print">
                     <button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(4)}>Quay lại sửa</button>
                     <button className="btn-ainetsoft-primary" onClick={handleFinalSubmit} disabled={isSaving}>{isSaving ? (<><i className="fa fa-spinner fa-spin" style={{marginRight: '8px'}}></i>Đang gửi hồ sơ...</>) : ("Xác nhận & Gửi hồ sơ")}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <LegalModal isOpen={!!legalSlug} onClose={() => setLegalSlug(null)} slug={legalSlug || ''} />
      {zoomedImage && (<div className="zoom-overlay" onClick={() => setZoomedImage(null)}><div className="zoom-content"><FaTimes className="zoom-close" onClick={() => setZoomedImage(null)} /><img src={zoomedImage} alt="Zoomed" /></div></div>)}

      {showMapModal && (
        <div className="map-modal-overlay">
          <div className="map-modal-card">
            <div className="map-modal-header"><h3>Chọn địa điểm lấy hàng</h3><FaTimes onClick={() => setShowMapModal(false)} style={{cursor: 'pointer'}} /></div>
            <div className="map-search-container">
              <div className="map-search-input-group">
                <input type="text" placeholder="Nhập tên đường, tòa nhà hoặc khu vực..." value={mapSearch} onChange={e => handleMapSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDirectSearch()} />
                <button className="btn-confirm-map" type="button" onClick={handleDirectSearch}><FaSearch /></button>
              </div>
              {mapSuggestions.length > 0 && (<ul className="map-suggestions">{mapSuggestions.map(p => (<li key={p.place_id} onMouseDown={() => selectMapSuggestion(p)}>{p.description}</li>))}</ul>)}
            </div>
            <div className="map-canvas-area"><div id="goong-map-canvas"></div></div>
            <div className="map-modal-footer"><button className="btn-cancel-map" onClick={() => setShowMapModal(false)}>Hủy bỏ</button><button className="btn-confirm-map" onClick={() => { setShowMapModal(false); setMapSearch(""); }}>Xác nhận vị trí</button></div>
          </div>
        </div>
      )}

      {showAddressModal && (
        <div className="ainetsoft-modal-overlay no-print">
          <div className="ainetsoft-modal-card">
            <div className="modal-header"><h3>Thêm Địa Chỉ Mới</h3><FaTimes className="close-icon" onClick={() => setShowAddressModal(false)} /></div>
            <div className="modal-body">
              <div className="row-split">
                <div className="input-with-label"><label><span className="req">*</span> Họ & Tên</label><input className={addressErrors.fullName ? "error-border" : ""} value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} />{addressErrors.fullName && <p className="red-msg-inline">{addressErrors.fullName}</p>}</div>
                <div className="input-with-label"><label><span className="req">*</span> SĐT</label><input className={addressErrors.phoneNumber ? "error-border" : ""} value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: formatPhone(e.target.value)})} maxLength={12} placeholder="098 776 7688" />{addressErrors.phoneNumber && <p className="red-msg-inline">{addressErrors.phoneNumber}</p>}</div>
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

              <div className="modal-field-full"><label>{!addressForm.ward.toLowerCase().includes("phường") && <span className="req">*</span>}Ấp/Thôn/Tổ</label><input className={addressErrors.hamlet ? "error-border" : ""} value={addressForm.hamlet} onChange={e => setAddressForm({...addressForm, hamlet: e.target.value})} />{addressErrors.hamlet && <p className="red-msg-inline">{addressErrors.hamlet}</p>}</div>
              <div className="modal-field-full"><label><span className="req">*</span> Địa chỉ chi tiết</label><textarea className={addressErrors.detailAddress ? "error-border" : ""} value={addressForm.detailAddress} onChange={e => setAddressForm({...addressForm, detailAddress: e.target.value})} placeholder="Số nhà, tên đường..." />{addressErrors.detailAddress && <p className="red-msg-inline">{addressErrors.detailAddress}</p>}</div>
              
              <div className="gps-box-ainetsoft clickable" onClick={() => setShowMapModal(true)}>
                <FaMapMarkerAlt className="gps-red" />
                <div className="gps-text">
                  <strong>Tọa độ GPS (Tự động)</strong>
                  <span>{addressForm.latitude ? `${addressForm.latitude}, ${addressForm.longitude}` : 'Nhấn vào đây để chọn trên bản đồ'}</span>
                  <p className="gps-hint-text">* Sử dụng thanh tìm kiếm trong bản đồ để lấy vị trí chính xác cho Shipper.</p>
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
