import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStore, FaHourglassHalf, FaMapMarkerAlt, FaUniversity, FaArrowRight, 
  FaArrowLeft, FaCloudUploadAlt, FaEye, FaTimes, FaCrosshairs, 
  FaCheck, FaTruck, FaShippingFast, FaPlus, FaChevronRight, FaTrash,
  FaChevronDown, FaChevronUp, FaIdCard, FaFileInvoiceDollar, FaCheckCircle,
  FaInfoCircle, FaShieldAlt, FaUpload, FaCamera, FaRegLightbulb
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile } from '../../services/authService';
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
    companyName: '',
    registeredAddress: '',
    invoiceEmails: [''], 
    taxCode: '',
    licenseImage: null as File | null,
    licensePreview: '',
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
          email: profileData.shopProfile?.businessEmail || profileData.email || '',
          shopName: profileData.shopProfile?.shopName || '',
          stockAddresses: profileData.addresses || [],
          businessType: profileData.shopProfile?.businessType || 'INDIVIDUAL',
          companyName: profileData.shopProfile?.companyName || '',
          registeredAddress: profileData.shopProfile?.registeredAddress || '',
          invoiceEmails: profileData.shopProfile?.invoiceEmails?.length > 0 
            ? profileData.shopProfile.invoiceEmails 
            : [profileData.shopProfile?.invoiceEmail || ''],
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'license') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [`${type}Image`]: file,
          [`${type}Preview`]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInvoiceEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.invoiceEmails];
    newEmails[index] = value;
    setFormData({ ...formData, invoiceEmails: newEmails });
  };

  const addInvoiceEmail = () => {
    if (formData.invoiceEmails.length < 5) {
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
    if (!formData.email.trim()) errors.email = "Email là bắt buộc";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (formData.businessType !== 'INDIVIDUAL' && !formData.companyName.trim()) {
        errors.companyName = "Tên công ty là bắt buộc";
    }
    if (!formData.registeredAddress.trim()) errors.registeredAddress = "Địa chỉ đăng ký là bắt buộc";
    const emailErrors = formData.invoiceEmails.some(email => !email.trim() || !email.includes('@'));
    if (emailErrors) errors.invoiceEmail = "Vui lòng nhập đúng định dạng email";
    if (!formData.taxCode.trim()) {
      errors.taxCode = "Mã số thuế là bắt buộc";
    } else if (!VN_TAX_REGEX.test(formData.taxCode.trim())) {
      errors.taxCode = "MST không hợp lệ (10 hoặc 13 chữ số)";
    }
    if (formData.businessType !== 'INDIVIDUAL' && !formData.licenseImage && !formData.licensePreview) {
        errors.license = "Vui lòng tải lên Giấy phép kinh doanh";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = () => {
    const errors: Record<string, string> = {};
    if (!formData.cccdNumber.trim() || formData.cccdNumber.length !== 12) {
      errors.cccdNumber = "Số CCCD phải bao gồm 12 chữ số";
    }
    if (!formData.frontImage && !formData.frontPreview) errors.frontImage = "Thiếu mặt trước CCCD";
    if (!formData.backImage && !formData.backPreview) errors.backImage = "Thiếu mặt sau CCCD";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProgress = async () => {
    try {
      setIsSaving(true);
      const payload = { ...formData, shippingMethodIds: Object.keys(formData.shippingMethods).filter(id => formData.shippingMethods[id]) };
      const submitData = new FormData();
      submitData.append('data', JSON.stringify(payload));
      await api.post('/auth/upgrade-seller', submitData);
      toast.success("Đã lưu tiến trình!");
    } catch (error) {
      toast.error("Lỗi khi lưu tiến trình");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateStep4()) return;
    try {
      setIsSaving(true);
      const submitData = new FormData();
      const payload = {
          shopName: formData.shopName, email: formData.email, businessType: formData.businessType,
          companyName: formData.companyName, registeredAddress: formData.registeredAddress,
          invoiceEmails: formData.invoiceEmails, taxCode: formData.taxCode,
          cccdNumber: formData.cccdNumber, shippingMethods: formData.shippingMethods,
          stockAddresses: formData.stockAddresses
      };
      submitData.append('data', JSON.stringify(payload));
      if (formData.frontImage) submitData.append('frontImage', formData.frontImage);
      if (formData.backImage) submitData.append('backImage', formData.backImage);
      if (formData.licenseImage) submitData.append('license', formData.licenseImage);

      await api.post('/auth/upgrade-seller', submitData);
      toast.success("Hồ sơ đã được gửi thành công!");
      setCurrentStep(5);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gửi hồ sơ thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocalAddressSave = () => {
    const errors: Record<string, string> = {};
    if (!addressForm.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    const phone = addressForm.phoneNumber.trim();
    if (!phone) {
        errors.phoneNumber = "Vui lòng nhập số điện thoại";
    } else if (!VN_PHONE_REGEX.test(phone)) {
        errors.phoneNumber = "SĐT không đúng định dạng Việt Nam";
    }
    if (!addressForm.province) errors.province = "Vui lòng chọn tỉnh thành";
    if (!addressForm.ward.trim()) errors.ward = "Vui lòng nhập Phường/Xã";
    if (!addressForm.ward.toLowerCase().includes("phường") && !addressForm.hamlet.trim()) {
        errors.hamlet = "Bắt buộc nhập Ấp/Thôn cho khu vực xã";
    }
    if (!addressForm.detailAddress.trim()) errors.detailAddress = "Vui lòng nhập số nhà, tên đường";

    if (Object.keys(errors).length > 0) { setAddressErrors(errors); return; }

    setFormData(prev => ({ 
        ...prev, 
        stockAddresses: [...prev.stockAddresses, { ...addressForm, province: addressForm.province.split(' (')[0] }] 
    }));
    setShowAddressModal(false);
    setAddressErrors({});
    setAddressForm({ fullName: '', phoneNumber: '', province: '', ward: '', hamlet: '', detailAddress: '', latitude: '', longitude: '', isDefault: true });
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
    setFormData(prev => ({ ...prev, shippingMethods: { ...prev.shippingMethods, [id]: !prev.shippingMethods[id] } }));
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
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="ainetsoft-row">
                <label><span className="req">*</span> Tên Shop</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.shopName ? "error-border" : ""} value={formData.shopName} maxLength={30} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="Nhập tên shop" />
                  <span className="char-counter">{formData.shopName.length}/30</span>
                  {formErrors.shopName && <p className="red-msg-inline">{formErrors.shopName}</p>}
                </div>
              </div>
              <div className="ainetsoft-row">
                <label><span className="req">*</span> Địa chỉ lấy hàng</label>
                <div className="ainetsoft-input-group">
                  {formData.stockAddresses.map((addr, idx) => (
                    <div key={idx} className="address-display-box" style={{marginBottom: '10px'}}>
                      <div className="addr-text">
                        <strong>{addr.fullName} | {addr.phoneNumber}</strong>
                        <p>{addr.detailAddress}, {addr.ward}, {addr.province}</p>
                      </div>
                      <FaTrash className="trash-icon" onClick={() => setFormData({...formData, stockAddresses: formData.stockAddresses.filter((_, i) => i !== idx)})} />
                    </div>
                  ))}
                  <button className="btn-add-ainetsoft" onClick={() => { setAddressErrors({}); setShowAddressModal(true); }}>
                    <FaPlus /> Thêm địa chỉ ({formData.stockAddresses.length}/2)
                  </button>
                  {formErrors.addresses && <p className="red-msg-inline">{formErrors.addresses}</p>}
                </div>
              </div>
              <div className="ainetsoft-row">
                <label><span className="req">*</span> Email liên hệ</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.email ? "error-border" : ""} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  {formErrors.email && <p className="red-msg-inline">{formErrors.email}</p>}
                </div>
              </div>
              <div className="onboarding-footer">
                <button className="btn-ainetsoft-lite" onClick={handleSaveProgress} disabled={isSaving}>Lưu</button>
                <button className="btn-ainetsoft-primary" onClick={() => { if(validateStep1()) setCurrentStep(2); }}>Tiếp theo</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="shipping-header-text">
                <h3>Phương thức vận chuyển</h3>
                <p>Kích hoạt các đơn vị vận chuyển hỗ trợ cho cửa hàng Ainetsoft của bạn.</p>
              </div>
              <div className="shipping-methods-list">
                {isShippingLoading ? (
                   <div className="red-msg-inline" style={{textAlign: 'center', padding: '20px'}}>Đang kết nối API...</div>
                ) : shippingMethodsList.map((method) => {
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
                                {method.codEnabled && <span className="cod-tag">[Hỗ trợ thu hộ COD]</span>}
                              </div>
                              <div className="sub-box-right">
                                <label className="ainetsoft-switch">
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
                  })}
              </div>
              <div className="onboarding-footer">
                <button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(1)}>Quay lại</button>
                <button className="btn-ainetsoft-primary" onClick={() => setCurrentStep(3)}>Tiếp theo</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="ainetsoft-alert-info">
                <FaShieldAlt className="alert-icon security-icon" />
                <p>
                  <strong>Thông báo pháp lý:</strong> Nhằm tuân thủ nghiêm ngặt các quy định về quản lý thuế và Luật An ninh mạng hiện hành, 
                  hệ thống yêu cầu Người bán cung cấp thông tin định danh chính xác. Dữ liệu sẽ được bảo mật tuyệt đối trên hệ thống Ainetsoft.
                </p>
              </div>

              <div className="ainetsoft-row">
                <label><span className="req">*</span> Loại hình kinh doanh</label>
                <div className="ainetsoft-radio-group">
                  <label className="radio-item">
                    <input type="radio" name="bizType" checked={formData.businessType === 'INDIVIDUAL'} onChange={() => setFormData({...formData, businessType: 'INDIVIDUAL'})} />
                    <span className="radio-mark"></span> Cá nhân
                  </label>
                  <label className="radio-item">
                    <input type="radio" name="bizType" checked={formData.businessType === 'HOUSEHOLD'} onChange={() => setFormData({...formData, businessType: 'HOUSEHOLD'})} />
                    <span className="radio-mark"></span> Hộ kinh doanh
                  </label>
                  <label className="radio-item">
                    <input type="radio" name="bizType" checked={formData.businessType === 'ENTERPRISE'} onChange={() => setFormData({...formData, businessType: 'ENTERPRISE'})} />
                    <span className="radio-mark"></span> Công ty
                  </label>
                </div>
              </div>

              {formData.businessType !== 'INDIVIDUAL' && (
                <div className="ainetsoft-row">
                  <label><span className="req">*</span> Tên công ty</label>
                  <div className="ainetsoft-input-group">
                    <input className={formErrors.companyName ? "error-border" : ""} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Nhập tên theo GPKD" />
                    {formErrors.companyName && <p className="red-msg-inline">{formErrors.companyName}</p>}
                  </div>
                </div>
              )}

              <div className="ainetsoft-row">
                <label><span className="req">*</span> Địa chỉ đăng ký kinh doanh</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.registeredAddress ? "error-border" : ""} value={formData.registeredAddress} onChange={e => setFormData({...formData, registeredAddress: e.target.value})} placeholder="Địa chỉ trên GPKD / hộ khẩu" />
                  {formErrors.registeredAddress && <p className="red-msg-inline">{formErrors.registeredAddress}</p>}
                </div>
              </div>

              <div className="ainetsoft-row">
                <label><span className="req">*</span> Email nhận hóa đơn điện tử</label>
                <div className="ainetsoft-input-group">
                  {formData.invoiceEmails.map((email, idx) => (
                    <div key={idx} className="email-input-item">
                      <input 
                        className={formErrors.invoiceEmail ? "error-border" : ""} 
                        value={email} 
                        onChange={e => handleInvoiceEmailChange(idx, e.target.value)} 
                        placeholder="Nhập email" 
                      />
                      {formData.invoiceEmails.length > 1 && (
                        <button className="btn-remove-email" onClick={() => removeInvoiceEmail(idx)}><FaTimes /></button>
                      )}
                    </div>
                  ))}
                  {formData.invoiceEmails.length < 5 && (
                    <button className="btn-add-email-ainetsoft" onClick={addInvoiceEmail}>
                      <FaPlus /> Thêm Email ({formData.invoiceEmails.length}/5)
                    </button>
                  )}
                  <p className="input-hint">Hóa đơn điện tử của bạn sẽ được gửi đến các địa chỉ email này</p>
                </div>
              </div>

              <div className="ainetsoft-row">
                <label><span className="req">*</span> Mã số thuế</label>
                <div className="ainetsoft-input-group">
                  <input className={formErrors.taxCode ? "error-border" : ""} value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: e.target.value.replace(/\D/g, '')})} placeholder="Nhập mã số thuế" maxLength={14} />
                  {formErrors.taxCode && <p className="red-msg-inline">{formErrors.taxCode}</p>}
                </div>
              </div>

              {formData.businessType !== 'INDIVIDUAL' && (
                <div className="ainetsoft-row">
                  <label><span className="req">*</span> Giấy phép kinh doanh</label>
                  <div className="ainetsoft-input-group">
                    <div className="license-upload-box" onClick={() => document.getElementById('license')?.click()}>
                        {formData.licensePreview ? <img src={formData.licensePreview} alt="License" /> : <><FaUpload /> Tải lên Giấy phép</>}
                    </div>
                    <input id="license" type="file" hidden onChange={e => handleFileChange(e, 'license')} />
                    {formErrors.license && <p className="red-msg-inline">{formErrors.license}</p>}
                  </div>
                </div>
              )}

              <div className="onboarding-footer">
                <button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(2)}>Quay lại</button>
                <button className="btn-ainetsoft-primary" onClick={() => { if(validateStep3()) setCurrentStep(4); }}>Tiếp theo</button>
              </div>
            </div>
          )}

          {/* STEP 4: IDENTITY (WITH GUIDELINES) */}
          {currentStep === 4 && (
            <div className="step-content">
              <div className="identity-header">
                <h3>Định danh người bán</h3>
                <div className="guidelines-card">
                  <div className="guidelines-title">
                    <FaRegLightbulb className="bulb-icon" />
                    <span>Yêu cầu hình ảnh CCCD hợp lệ</span>
                  </div>
                  <ul className="guidelines-list">
                    <li><FaCheck className="check-green" /> Ảnh chụp rõ nét, không bị mờ nhòe.</li>
                    <li><FaCheck className="check-green" /> Không bị chói sáng hoặc mất góc.</li>
                    <li><FaCheck className="check-green" /> Thông tin trên thẻ phải trùng khớp với dữ liệu đăng ký.</li>
                  </ul>
                </div>
              </div>

              <div className="ainetsoft-row">
                <label><span className="req">*</span> Số CCCD</label>
                <div className="ainetsoft-input-group">
                  <input 
                    className={formErrors.cccdNumber ? "error-border" : ""}
                    value={formData.cccdNumber} 
                    onChange={e => setFormData({...formData, cccdNumber: e.target.value.replace(/\D/g, '')})} 
                    maxLength={12} 
                    placeholder="Nhập 12 số CCCD" 
                  />
                  {formErrors.cccdNumber && <p className="red-msg-inline">{formErrors.cccdNumber}</p>}
                </div>
              </div>

              <div className="id-upload-grid">
                <div className={`upload-box ${formErrors.frontImage ? "error-border-dashed" : ""}`} onClick={() => document.getElementById('front')?.click()}>
                  {formData.frontPreview ? (
                    <img src={formData.frontPreview} alt="Front" className="preview-img" />
                  ) : (
                    <div className="upload-placeholder">
                      <FaCamera className="cam-icon" />
                      <span>Mặt trước CCCD</span>
                    </div>
                  )}
                </div>
                <input id="front" type="file" hidden onChange={e => handleFileChange(e, 'front')} />
                
                <div className={`upload-box ${formErrors.backImage ? "error-border-dashed" : ""}`} onClick={() => document.getElementById('back')?.click()}>
                  {formData.backPreview ? (
                    <img src={formData.backPreview} alt="Back" className="preview-img" />
                  ) : (
                    <div className="upload-placeholder">
                      <FaCamera className="cam-icon" />
                      <span>Mặt sau CCCD</span>
                    </div>
                  )}
                </div>
                <input id="back" type="file" hidden onChange={e => handleFileChange(e, 'back')} />
              </div>

              <div className="onboarding-footer">
                <button className="btn-ainetsoft-lite" onClick={() => setCurrentStep(3)}>Quay lại</button>
                <button className="btn-ainetsoft-primary" onClick={handleFinalSubmit} disabled={isSaving}>
                  {isSaving ? "Đang xử lý..." : "Hoàn tất đăng ký"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="step-content success-view">
              <FaCheckCircle className="success-icon-big" />
              <h2>Đăng ký thành công!</h2>
              <button className="btn-ainetsoft-primary" onClick={() => navigate('/user/profile')}>Quay lại trang cá nhân</button>
            </div>
          )}
        </div>
      </main>

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <div className="ainetsoft-modal-overlay">
          <div className="ainetsoft-modal-card">
            <div className="modal-header">
              <h3>Thêm Địa Chỉ Mới</h3>
              <FaTimes className="close-icon" onClick={() => setShowAddressModal(false)} />
            </div>
            <div className="modal-body">
              <div className="row-split">
                <div className="input-with-label">
                  <label><span className="req">*</span> Họ & Tên</label>
                  <input className={addressErrors.fullName ? "error-border" : ""} value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} />
                  {addressErrors.fullName && <p className="red-msg-inline">{addressErrors.fullName}</p>}
                </div>
                <div className="input-with-label">
                  <label><span className="req">*</span> SĐT</label>
                  <input className={addressErrors.phoneNumber ? "error-border" : ""} value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value.replace(/\D/g, '')})} placeholder="0xxxxxxxxx" />
                  {addressErrors.phoneNumber && <p className="red-msg-inline">{addressErrors.phoneNumber}</p>}
                </div>
              </div>
              <div className="modal-field-full">
                <label><span className="req">*</span> Tỉnh/Thành phố</label>
                <select className={addressErrors.province ? "error-border" : ""} value={addressForm.province} onChange={e => setAddressForm({...addressForm, province: e.target.value})}>
                  <option value="">Chọn</option>
                  {PROVINCES_2026.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {addressErrors.province && <p className="red-msg-inline">{addressErrors.province}</p>}
              </div>
              <div className="modal-field-full">
                <label><span className="req">*</span> Phường/Xã</label>
                <input className={addressErrors.ward ? "error-border" : ""} value={addressForm.ward} onChange={e => setAddressForm({...addressForm, ward: e.target.value})} />
                {addressErrors.ward && <p className="red-msg-inline">{addressErrors.ward}</p>}
              </div>
              <div className="modal-field-full">
                <label>{!addressForm.ward.toLowerCase().includes("phường") && <span className="req">*</span>}Ấp/Thôn/Tổ</label>
                <input className={addressErrors.hamlet ? "error-border" : ""} value={addressForm.hamlet} onChange={e => setAddressForm({...addressForm, hamlet: e.target.value})} />
                {addressErrors.hamlet && <p className="red-msg-inline">{addressErrors.hamlet}</p>}
              </div>
              <div className="modal-field-full">
                <label><span className="req">*</span> Địa chỉ chi tiết</label>
                <textarea className={addressErrors.detailAddress ? "error-border" : ""} value={addressForm.detailAddress} onChange={e => setAddressForm({...addressForm, detailAddress: e.target.value})} placeholder="Số nhà, tên đường..." />
                {addressErrors.detailAddress && <p className="red-msg-inline">{addressErrors.detailAddress}</p>}
              </div>
              <div className="gps-box-ainetsoft" onClick={getCurrentLocation}>
                <FaMapMarkerAlt className="gps-red" />
                <div className="gps-text"><strong>Định vị GPS</strong><span>{addressForm.latitude ? `${addressForm.latitude}, ${addressForm.longitude}` : 'Lấy tọa độ tự động'}</span></div>
              </div>
            </div>
            <div className="modal-footer-ainetsoft">
              <button className="btn-cancel-ainetsoft" onClick={() => setShowAddressModal(false)}>Hủy</button>
              <button className="btn-save-ainetsoft" onClick={handleLocalAddressSave}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRegister;