import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStore, FaHourglassHalf, FaMapMarkerAlt, FaUniversity, FaArrowRight, 
  FaArrowLeft, FaCloudUploadAlt, FaEye, FaTimes, FaCrosshairs, 
  FaCheck, FaTruck, FaShippingFast, FaPlus, FaChevronRight, FaTrash,
  FaChevronDown, FaChevronUp, FaIdCard, FaFileInvoiceDollar, FaCheckCircle
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile, upgradeToSeller } from '../../services/authService';
import { toast } from 'react-hot-toast';

import api from '../../services/api'; 

import './Profile.css';
import './SellerRegister.css';

const PROVINCES_2026 = [
  "Hà Nội", "Huế", "Lai Châu", "Điện Biên", "Sơn La", "Lạng Sơn", "Quảng Ninh", "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Cao Bằng",
  "Tuyên Quang (sáp nhập Hà Giang + Tuyên Quang)", "Lào Cai (Yên Bái + Lào Cai)", "Thái Nguyên (Bắc Kạn + Thái Nguyên)",
  "Phú Thọ (Vĩnh Phúc + Hòa Bình + Phú Thọ)", "Bắc Ninh (Bắc Giang + Bắc Ninh)", "Hưng Yên (Thái Bình + Hưng Yên)",
  "Hải Phòng (Hải Dương + Hải Phòng)", "Ninh Bình (Hà Nam + Nam Định + Ninh Bình)", "Quảng Trị (Quảng Bình + Quảng Trị)",
  "Đà Nẵng (Quảng Nam + Đà Nẵng)", "Quảng Ngãi (Kon Tum + Quảng Ngãi)", "Gia Lai (Bình Định + Gia Lai)",
  "Khánh Hòa (Ninh Thuận + Khánh Hòa)", "Lâm Đồng (Đắk Nông + Bình Thuận + Lâm Đồng)", "Đắk Lắk (Phú Yên + Đắk Lắk)",
  "TP.HCM (TP.HCM + Bình Dương + Bà Rịa–Vũng Tàu)", "Đồng Nai (Đồng Nai + Bình Phước)", "Tây Ninh (Tây Ninh + Long An)",
  "Cần Thơ (Cần Thơ + Sóc Trăng + Hậu Giang)", "Vĩnh Long (Bến Tre + Vĩnh Long + Trà Vinh)", "Đồng Tháp (Tiền Giang + Đồng Tháp)",
  "Cà Mau (Bạc Liêu + Cà Mau)", "An Giang (Kiên Giang + An Giang)"
];

// Strict Vietnamese Mobile Phone Regex (2026 Standard)
const VN_PHONE_REGEX = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/;
const VN_TAX_REGEX = /^\d{10}(\d{3})?$/;

const SellerRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  const [shippingMethodsList, setShippingMethodsList] = useState<any[]>([]);
  const [expandedMethods, setExpandedMethods] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    shopName: '',
    stockAddresses: [] as any[],
    businessType: 'INDIVIDUAL',
    taxCode: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    cccdNumber: '',
    shippingMethods: {} as Record<string, boolean>,
    frontImage: null as File | null,
    backImage: null as File | null,
    frontPreview: '',
    backPreview: ''
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
        const [profileData, shippingRes] = await Promise.all([
          getUserProfile(),
          api.get('/shipping-methods/active')
        ]);

        setShippingMethodsList(Array.isArray(shippingRes.data) ? shippingRes.data : []);

        const enabledMap: Record<string, boolean> = {};
        profileData.shopProfile?.enabledShippingMethodIds?.forEach((id: string) => {
          enabledMap[id] = true;
        });

        setFormData(prev => ({
          ...prev,
          phone: profileData.phone || '',
          email: profileData.email || '',
          shopName: profileData.shopProfile?.shopName || '',
          stockAddresses: profileData.addresses || [],
          businessType: profileData.shopProfile?.businessType || 'INDIVIDUAL',
          taxCode: profileData.shopProfile?.taxCode || '',
          shippingMethods: enabledMap
        }));
      } catch (error) {
        toast.error("Lỗi kết nối hệ thống");
      } finally {
        setIsPageLoading(false);
        setIsShippingLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [`${side}Image`]: file,
          [`${side}Preview`]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.shopName.trim()) errors.shopName = "Tên Shop là bắt buộc";
    if (formData.stockAddresses.length === 0) errors.addresses = "Cần ít nhất 1 địa chỉ lấy hàng";
    if (!formData.email.trim()) errors.email = "Email là bắt buộc";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (!formData.taxCode.trim()) {
      errors.taxCode = "Mã số thuế là bắt buộc";
    } else if (!VN_TAX_REGEX.test(formData.taxCode.trim())) {
      errors.taxCode = "MST không hợp lệ (10 hoặc 13 chữ số)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSaving(true);
      const submitData = new FormData();
      submitData.append('shopName', formData.shopName);
      submitData.append('email', formData.email);
      submitData.append('taxCode', formData.taxCode);
      submitData.append('cccdNumber', formData.cccdNumber);
      
      const enabledIds = Object.keys(formData.shippingMethods).filter(id => formData.shippingMethods[id]);
      submitData.append('shippingMethodIds', JSON.stringify(enabledIds));

      if (formData.frontImage) submitData.append('frontImage', formData.frontImage);
      if (formData.backImage) submitData.append('backImage', formData.backImage);

      await api.post('/users/upgrade-seller-final', submitData);
      toast.success("Đăng ký thành công!");
      setCurrentStep(5);
    } catch (error) {
      toast.error("Gửi hồ sơ thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocalAddressSave = () => {
    const errors: Record<string, string> = {};
    
    // 1. Full Name check
    if (!addressForm.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    
    // 2. Phone Number check with VN Regex
    const phone = addressForm.phoneNumber.trim();
    if (!phone) {
        errors.phoneNumber = "Vui lòng nhập số điện thoại";
    } else if (!VN_PHONE_REGEX.test(phone)) {
        errors.phoneNumber = "SĐT không đúng định dạng Việt Nam";
    }
    
    // 3. Location check
    if (!addressForm.province) errors.province = "Vui lòng chọn tỉnh thành";
    if (!addressForm.ward.trim()) errors.ward = "Vui lòng nhập Phường/Xã";
    
    // 4. Hamlet check (Conditional)
    if (!addressForm.ward.toLowerCase().includes("phường") && !addressForm.hamlet.trim()) {
        errors.hamlet = "Bắt buộc nhập Ấp/Thôn cho khu vực xã";
    }

    // 5. Detailed Address check
    if (!addressForm.detailAddress.trim()) errors.detailAddress = "Vui lòng nhập số nhà, tên đường";

    if (Object.keys(errors).length > 0) { 
        setAddressErrors(errors); 
        return; 
    }

    setFormData(prev => ({ 
        ...prev, 
        stockAddresses: [...prev.stockAddresses, { ...addressForm, province: addressForm.province.split(' (')[0] }] 
    }));
    setShowAddressModal(false);
    setAddressErrors({});
    // Reset modal form
    setAddressForm({
        fullName: '', phoneNumber: '', province: '', ward: '', hamlet: '',
        detailAddress: '', latitude: '', longitude: '', isDefault: true
    });
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAddressForm(prev => ({ ...prev, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
          setIsLocating(false); toast.success("Đã lấy tọa độ!");
        },
        () => { setIsLocating(false); toast.error("Vui lòng bật GPS."); }
      );
    }
  };

  const toggleShipping = (id: string) => {
    setFormData(prev => ({
      ...prev,
      shippingMethods: { ...prev.shippingMethods, [id]: !prev.shippingMethods[id] }
    }));
  };

  if (isPageLoading) return <div className="loading-spinner">Đang tải hồ sơ...</div>;

  return (
    <div className="onboarding-layout">
      <AccountSidebar />
      <main className="onboarding-view">
        <div className="onboarding-stepper">
          {['Thông tin Shop', 'Cài đặt vận chuyển', 'Thông tin thuế', 'Thông tin định danh', 'Hoàn tất'].map((l, i) => (
            <div key={i} className={`step-node ${currentStep > i ? 'active' : ''}`}>
              <div className="node-dot">{currentStep > i + 1 ? <FaCheck /> : i + 1}</div>
              <span>{l}</span>
              {i < 4 && <div className={`node-line ${currentStep > i + 1 ? 'active' : ''}`}></div>}
            </div>
          ))}
        </div>

        <div className="onboarding-card">
          {currentStep === 1 && (
            <div className="step-content">
              <div className="shopee-row">
                <label><span className="req">*</span> Tên Shop</label>
                <div className="shopee-input-group">
                  <input className={formErrors.shopName ? "error-border" : ""} value={formData.shopName} maxLength={30} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="Nhập vào" />
                  <span className="char-counter">{formData.shopName.length}/30</span>
                  {formErrors.shopName && <p className="red-msg-inline">{formErrors.shopName}</p>}
                </div>
              </div>

              <div className="shopee-row">
                <label><span className="req">*</span> Địa chỉ lấy hàng</label>
                <div className="shopee-input-group">
                  {formData.stockAddresses.map((addr, idx) => (
                    <div key={idx} className="address-display-box" style={{marginBottom: '10px'}}>
                      <div className="addr-text">
                        <strong>{addr.fullName} | {addr.phoneNumber}</strong>
                        <p>{addr.detailAddress}, {addr.ward}, {addr.province}</p>
                      </div>
                      <FaTrash className="trash-icon" onClick={() => setFormData({...formData, stockAddresses: formData.stockAddresses.filter((_, i) => i !== idx)})} />
                    </div>
                  ))}
                  <button className="btn-add-shopee" onClick={() => { setAddressErrors({}); setShowAddressModal(true); }}>
                    <FaPlus /> Thêm ({formData.stockAddresses.length}/2)
                  </button>
                  {formErrors.addresses && <p className="red-msg-inline">{formErrors.addresses}</p>}
                </div>
              </div>

              <div className="shopee-row">
                <label><span className="req">*</span> Email</label>
                <div className="shopee-input-group">
                  <input className={formErrors.email ? "error-border" : ""} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  {formErrors.email && <p className="red-msg-inline">{formErrors.email}</p>}
                </div>
              </div>

              <div className="onboarding-footer">
                <button className="btn-shopee-orange" onClick={() => { if(validateStep1()) setCurrentStep(2); }}>Tiếp theo</button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <div className="shipping-header-text">
                <h3>Phương thức vận chuyển</h3>
                <p>Kích hoạt phương thức vận chuyển phù hợp cho shop của bạn.</p>
              </div>

              <div className="shipping-methods-list">
                {isShippingLoading ? (
                   <div className="red-msg-inline" style={{textAlign: 'center', padding: '20px'}}>Đang kết nối API vận chuyển...</div>
                ) : shippingMethodsList.length > 0 ? (
                  shippingMethodsList.map((method) => {
                    const mId = method.id;
                    return (
                      <div key={mId} className="shipping-method-item">
                        <div className="method-main-row">
                          <span className="method-name">{method.name}</span>
                          <button className="btn-collapse" onClick={() => setExpandedMethods(prev => ({...prev, [mId]: !prev[mId]}))}>
                            {expandedMethods[mId] ? 'Mở rộng' : 'Thu gọn'} 
                            {expandedMethods[mId] ? <FaChevronDown /> : <FaChevronUp />}
                          </button>
                        </div>
                        {!expandedMethods[mId] && (
                          <div className="method-details-row">
                            <div className="method-sub-box">
                              <div className="sub-box-left">
                                <span className="sub-name">{method.name}</span>
                                {method.codEnabled && <span className="cod-tag">[COD đã được kích hoạt]</span>}
                              </div>
                              <div className="sub-box-right">
                                <label className="shopee-switch">
                                  <input type="checkbox" checked={!!formData.shippingMethods[mId]} onChange={() => toggleShipping(mId)} />
                                  <span className="slider round"></span>
                                </label>
                                <FaChevronRight className="arrow-mute" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-shipping-msg">Không có đơn vị vận chuyển khả dụng. Vui lòng kiểm tra Admin.</div>
                )}
              </div>

              <div className="onboarding-footer">
                <button className="btn-shopee-lite" onClick={() => setCurrentStep(1)}>Quay lại</button>
                <button className="btn-shopee-orange" onClick={() => setCurrentStep(3)}>Tiếp theo</button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <div className="shopee-row">
                <label><span className="req">*</span> Mã số thuế</label>
                <div className="shopee-input-group">
                  <input 
                    className={formErrors.taxCode ? "error-border" : ""}
                    value={formData.taxCode} 
                    onChange={e => setFormData({...formData, taxCode: e.target.value})} 
                    placeholder="Nhập mã số thuế"
                    maxLength={13}
                  />
                  {formErrors.taxCode && <p className="red-msg-inline">{formErrors.taxCode}</p>}
                </div>
              </div>
              <div className="onboarding-footer">
                <button className="btn-shopee-lite" onClick={() => setCurrentStep(2)}>Quay lại</button>
                <button className="btn-shopee-orange" onClick={() => { if(validateStep3()) setCurrentStep(4); }}>Tiếp theo</button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-content">
              <h3>Định danh người bán</h3>
              <div className="shopee-row">
                <label><span className="req">*</span> Số CCCD</label>
                <input value={formData.cccdNumber} onChange={e => setFormData({...formData, cccdNumber: e.target.value})} maxLength={12} placeholder="Nhập 12 số CCCD" />
              </div>
              <div className="id-upload-grid">
                <div className="upload-box" onClick={() => document.getElementById('front')?.click()}>
                  {formData.frontPreview ? <img src={formData.frontPreview} alt="Front" /> : "Mặt trước"}
                </div>
                <input id="front" type="file" hidden onChange={e => handleFileChange(e, 'front')} />
                
                <div className="upload-box" onClick={() => document.getElementById('back')?.click()}>
                  {formData.backPreview ? <img src={formData.backPreview} alt="Back" /> : "Mặt sau"}
                </div>
                <input id="back" type="file" hidden onChange={e => handleFileChange(e, 'back')} />
              </div>
              <div className="onboarding-footer">
                <button className="btn-shopee-lite" onClick={() => setCurrentStep(3)}>Quay lại</button>
                <button className="btn-shopee-orange" onClick={handleFinalSubmit} disabled={isSaving}>
                  {isSaving ? "Đang xử lý..." : "Gửi hồ sơ"}
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="step-content success-view">
              <FaCheckCircle className="success-icon-big" />
              <h2>Đăng ký hoàn tất!</h2>
              <p>Hồ sơ của bạn đang được xét duyệt. Vui lòng kiểm tra email trong vòng 24h.</p>
              <button className="btn-shopee-orange" onClick={() => navigate('/user/profile')}>Về trang cá nhân</button>
            </div>
          )}
        </div>
      </main>

      {/* Address Modal with Validation Messages */}
      {showAddressModal && (
        <div className="shopee-modal-overlay">
          <div className="shopee-modal-card">
            <div className="modal-header">
              <h3>Thêm Địa Chỉ Mới</h3>
              <FaTimes className="close-icon" onClick={() => setShowAddressModal(false)} />
            </div>
            <div className="modal-body">
              <div className="row-split">
                <div className="input-with-label">
                  <label><span className="req">*</span> Họ & Tên</label>
                  <input 
                    className={addressErrors.fullName ? "error-border" : ""}
                    value={addressForm.fullName} 
                    onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} 
                  />
                  {addressErrors.fullName && <p className="red-msg-inline">{addressErrors.fullName}</p>}
                </div>
                <div className="input-with-label">
                  <label><span className="req">*</span> SĐT</label>
                  <input 
                    className={addressErrors.phoneNumber ? "error-border" : ""}
                    value={addressForm.phoneNumber} 
                    onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value.replace(/\D/g, '')})} 
                    placeholder="0xxxxxxxxx"
                  />
                  {addressErrors.phoneNumber && <p className="red-msg-inline">{addressErrors.phoneNumber}</p>}
                </div>
              </div>
              <div className="modal-field-full">
                <label><span className="req">*</span> Tỉnh/Thành phố</label>
                <select 
                  className={addressErrors.province ? "error-border" : ""}
                  value={addressForm.province} 
                  onChange={e => setAddressForm({...addressForm, province: e.target.value})}
                >
                  <option value="">Chọn</option>
                  {PROVINCES_2026.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {addressErrors.province && <p className="red-msg-inline">{addressErrors.province}</p>}
              </div>
              <div className="modal-field-full">
                <label><span className="req">*</span> Phường/Xã</label>
                <input 
                  className={addressErrors.ward ? "error-border" : ""}
                  value={addressForm.ward} 
                  onChange={e => setAddressForm({...addressForm, ward: e.target.value})} 
                />
                {addressErrors.ward && <p className="red-msg-inline">{addressErrors.ward}</p>}
              </div>
              <div className="modal-field-full">
                <label>{!addressForm.ward.toLowerCase().includes("phường") && <span className="req">*</span>}Ấp/Thôn/Tổ</label>
                <input 
                  className={addressErrors.hamlet ? "error-border" : ""}
                  value={addressForm.hamlet} 
                  onChange={e => setAddressForm({...addressForm, hamlet: e.target.value})} 
                />
                {addressErrors.hamlet && <p className="red-msg-inline">{addressErrors.hamlet}</p>}
              </div>
              <div className="modal-field-full">
                <label><span className="req">*</span> Địa chỉ chi tiết</label>
                <textarea 
                  className={addressErrors.detailAddress ? "error-border" : ""}
                  value={addressForm.detailAddress} 
                  onChange={e => setAddressForm({...addressForm, detailAddress: e.target.value})} 
                  placeholder="Số nhà, tên đường, tòa nhà..."
                />
                {addressErrors.detailAddress && <p className="red-msg-inline">{addressErrors.detailAddress}</p>}
              </div>
              <div className="gps-box-shopee" onClick={getCurrentLocation}>
                <FaMapMarkerAlt className="gps-red" />
                <div className="gps-text">
                  <strong>Định vị GPS</strong>
                  <span>{addressForm.latitude ? `${addressForm.latitude}, ${addressForm.longitude}` : 'Bấm để lấy tọa độ'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer-shopee">
              <button className="btn-cancel-shopee" onClick={() => setShowAddressModal(false)}>Hủy</button>
              <button className="btn-save-shopee" onClick={handleLocalAddressSave}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRegister;