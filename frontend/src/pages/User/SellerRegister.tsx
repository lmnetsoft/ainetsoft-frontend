import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaExclamationTriangle, FaStore, FaHourglassHalf, 
  FaIdCard, FaMapMarkerAlt, FaUniversity, FaArrowRight, FaArrowLeft, 
  FaCloudUploadAlt, FaFileInvoice, FaEye, FaTimesCircle, FaRocket,
  FaPlus, FaEdit, FaTrash, FaCrosshairs, FaCheck
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile, upgradeToSeller } from '../../services/authService';
import { toast } from 'react-hot-toast';
import './Profile.css';
import './SellerRegister.css';

const PROVINCES_2026 = [
  "Hà Nội", "Huế", "Lai Châu", "Điện Biên", "Sơn La", "Lạng Sơn", "Quảng Ninh", "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Cao Bằng",
  "Tuyên Quang (sáp nhập Hà Giang + Tuyên Quang)", "Lào Cai (Yên Bái + Lào Cai)", "Thái Nguyên (Bắc Kạn + Thái Nguyên)",
  "Phú Thọ (Vĩnh Phúc + Hòa Bình + Phú Thọ)", "Bắc Ninh (Bắc Giang + Bắc Ninh)", "Hưng Yên (Thái Bình + Hưng Yên)",
  "Hải Phòng (Hải Dương + Hải Phòng)", "Ninh Bình (Hà Nam + Nam Định + Ninh Bình)", "Quảng Trị (Quảng Bình + Quảng Trị)",
  "Đà Nẵng (Quảng Nam + Đà Nẵng)", "Quảng Ngãi (Kon Tum + Quảng Ngãi)", "Gia Lai (Bình Định + Gia Lai)",
  "Khánh Hòa (Ninh Thuận + Khánh Hòa)", "Lâm Đồng (Đắk Nông + Bình Thuận + Lâm Đồng)", "Đắk Lắk (Phú Yên + Đắk Lắk)",
  "TP.HCM mở rộng (TP.HCM + Bình Dương + Bà Rịa–Vũng Tàu)", "Đồng Nai (Đồng Nai + Bình Phước)", "Tây Ninh (Tây Ninh + Long An)",
  "Cần Thơ (Cần Thơ + Sóc Trăng + Hậu Giang)", "Vĩnh Long (Bến Tre + Vĩnh Long + Trà Vinh)", "Đồng Tháp (Tiền Giang + Đồng Tháp)",
  "Cà Mau (Bạc Liêu + Cà Mau)", "An Giang (Kiên Giang + An Giang)"
];

const FAMOUS_BANKS = ["Vietcombank", "Agribank", "BIDV", "VietinBank", "MB Bank", "Techcombank", "ACB", "VPBank", "TPBank", "Sacombank"];

const SellerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isLocating, setIsLocating] = useState(false); // New GPS loading state
  const [userStatus, setUserStatus] = useState<string>('NONE');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phoneNumber: '', province: '', ward: '', hamlet: '',
    detailAddress: '', latitude: '', longitude: '', isDefault: false
  });

  const [formData, setFormData] = useState({
    phone: '', email: '', cccdNumber: '', frontImage: null as File | null,
    backImage: null as File | null, shopName: '', taxCode: '', 
    bankName: '', accountNumber: '', accountHolder: '',
    stockAddresses: [] as any[]
  });

  const [previews, setPreviews] = useState({ front: '', back: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setUserStatus(data.sellerVerification || 'NONE');
        setRejectionReason(data.rejectionReason || '');
        setFormData(prev => ({
          ...prev,
          phone: data.phone || '',
          email: data.email || '',
          shopName: data.shopProfile?.shopName || '',
          taxCode: data.shopProfile?.taxCode || '',
          bankName: data.bankAccounts?.[0]?.bankName || '',
          accountNumber: data.bankAccounts?.[0]?.accountNumber || '',
          accountHolder: data.bankAccounts?.[0]?.accountHolder || '',
          stockAddresses: data.addresses || []
        }));
      } catch (error) { toast.error("Lỗi tải thông tin"); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const validateField = (name: string, value: any) => {
    let msg = "";
    if (name === "phone" && !/^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/.test(value)) msg = "SĐT không hợp lệ.";
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = "Email sai định dạng.";
    if (name === "cccdNumber" && value.length !== 12) msg = "CCCD cần 12 số.";
    if (name === "bankName" && !value) msg = "Hãy chọn ngân hàng.";
    if (name === "accountNumber" && value.length < 8) msg = "Số tài khoản không hợp lệ.";
    if (name === "shopName" && !value.trim()) msg = "Tên shop không được trống.";

    setErrors(prev => ({ ...prev, [name]: msg }));
    return msg === "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const clean = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: clean }));
    validateField(name, clean);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, [side === 'front' ? 'frontImage' : 'backImage']: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => ({ ...prev, [side]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    const currentErrors = Object.values(errors).filter(e => e !== "");
    if (currentErrors.length > 0) return toast.error("Sửa các lỗi màu đỏ trước khi tiếp tục.");
    if (step === 3 && formData.stockAddresses.length === 0) return toast.error("Thêm ít nhất một địa chỉ kho.");
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const openAddressModal = (index: number | null = null) => {
    if (index !== null) {
      setAddressForm(formData.stockAddresses[index]);
      setEditingIndex(index);
    } else {
      setAddressForm({
        fullName: '', phoneNumber: '', province: '', ward: '', hamlet: '',
        detailAddress: '', latitude: '', longitude: '', isDefault: formData.stockAddresses.length === 0
      });
      setEditingIndex(null);
    }
    setShowAddressModal(true);
  };

  const saveAddress = () => {
    if (!addressForm.fullName || !addressForm.province || !addressForm.ward || !addressForm.hamlet) {
      return toast.error("Nhập đủ: Tên -> Tỉnh -> Phường -> Ấp");
    }
    const newList = [...formData.stockAddresses];
    if (editingIndex !== null) newList[editingIndex] = addressForm;
    else newList.push(addressForm);
    setFormData(prev => ({ ...prev, stockAddresses: newList }));
    setShowAddressModal(false);
  };

  // --- FIXED: GPS with UI Visuals ---
  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAddressForm(prev => ({ 
            ...prev, 
            latitude: pos.coords.latitude.toFixed(6), 
            longitude: pos.coords.longitude.toFixed(6) 
          }));
          setIsLocating(false);
          toast.success("Đã xác định vị trí!");
        },
        () => {
          setIsLocating(false);
          toast.error("Hãy bật GPS và cho phép truy cập vị trí.");
        }
      );
    } else {
      setIsLocating(false);
      toast.error("Trình duyệt không hỗ trợ GPS.");
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const message = await upgradeToSeller(formData); 
      toast.success(message);
      setUserStatus('PENDING');
    } catch (error: any) { toast.error(error.message); } finally { setIsUpgrading(false); }
  };

  if (loading) return <div className="loading-spinner">Đang tải...</div>;

  if (userStatus === 'PENDING') return (
    <div className="profile-wrapper"><div className="container profile-container"><AccountSidebar /><main className="profile-main-content">
      <div className="seller-status-box pending"><FaHourglassHalf className="status-icon" /><h1>Đang chờ phê duyệt</h1><p>Hồ sơ đang được Admin kiểm tra. Quá trình mất 24h.</p><button onClick={() => navigate('/')} className="btn-back-home">Trang chủ</button></div>
    </main></div></div>
  );

  return (
    <div className="profile-wrapper">
      <div className="container profile-container">
        <AccountSidebar />
        <main className="profile-main-content">
          <div className="seller-reg-card">
            <div className="seller-reg-header">
              <FaStore className="seller-icon" />
              <h1>Đăng ký Trở thành Người bán</h1>
            </div>

            <div className="registration-stepper">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`step-item ${step >= s ? 'active' : ''}`}>
                  <div className="step-number">{s}</div>
                  <div className="step-label">{s === 1 ? 'Liên hệ' : s === 2 ? 'Định danh' : s === 3 ? 'Cửa hàng' : s === 4 ? 'Ngân hàng' : 'Xác nhận'}</div>
                </div>
              ))}
            </div>

            <div className="step-content">
              {step === 1 && (
                <div className="form-step">
                  <div className="input-group">
                    <label>Số điện thoại <span className="required">*</span></label>
                    <input type="text" name="phone" value={formData.phone} className={errors.phone ? 'error-input' : ''} onChange={handleNumericInputChange} />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>
                  <div className="input-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" name="email" value={formData.email} className={errors.email ? 'error-input' : ''} onChange={handleInputChange} />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                  <button className="btn-next" onClick={handleNext}>Tiếp theo <FaArrowRight /></button>
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <div className="input-group">
                    <label>Số CCCD <span className="required">*</span></label>
                    <input type="text" name="cccdNumber" value={formData.cccdNumber} maxLength={12} className={errors.cccdNumber ? 'error-input' : ''} onChange={handleNumericInputChange} />
                    {errors.cccdNumber && <span className="error-text">{errors.cccdNumber}</span>}
                  </div>
                  <div className="upload-grid">
                    <div className="upload-box" onClick={() => document.getElementById('front')?.click()}>
                      <input type="file" id="front" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
                      {previews.front ? <img src={previews.front} alt="Front" /> : <><FaCloudUploadAlt /><span>Mặt trước CCCD</span></>}
                    </div>
                    <div className="upload-box" onClick={() => document.getElementById('back')?.click()}>
                      <input type="file" id="back" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
                      {previews.back ? <img src={previews.back} alt="Back" /> : <><FaCloudUploadAlt /><span>Mặt sau CCCD</span></>}
                    </div>
                  </div>
                  <div className="step-actions"><button className="btn-prev" onClick={() => setStep(1)}><FaArrowLeft /> Quay lại</button><button className="btn-next" onClick={handleNext}>Tiếp theo <FaArrowRight /></button></div>
                </div>
              )}

              {step === 3 && (
                <div className="form-step">
                  <div className="input-group">
                    <label>Tên Shop <span className="required">*</span></label>
                    <input type="text" name="shopName" value={formData.shopName} className={errors.shopName ? 'error-input' : ''} onChange={handleInputChange} />
                    {errors.shopName && <span className="error-text">{errors.shopName}</span>}
                  </div>
                  <div className="address-management-section">
                    <div className="section-header">
                      <label><FaMapMarkerAlt /> Danh sách kho</label>
                      <button className="btn-add-plus" onClick={() => openAddressModal()}><FaPlus /> Thêm kho</button>
                    </div>
                    {formData.stockAddresses.map((addr, idx) => (
                      <div key={idx} className="address-card-mini">
                        <div className="addr-details"><strong>{addr.fullName}</strong><p>{addr.hamlet}, {addr.ward}, {addr.province}</p></div>
                        <div className="addr-actions"><button className="btn-edit-inline" onClick={() => openAddressModal(idx)}><FaEdit /> Sửa</button><button className="btn-delete-inline" onClick={() => setFormData({...formData, stockAddresses: formData.stockAddresses.filter((_, i) => i !== idx)})}><FaTrash /></button></div>
                      </div>
                    ))}
                  </div>
                  <div className="step-actions"><button className="btn-prev" onClick={() => setStep(2)}><FaArrowLeft /> Quay lại</button><button className="btn-next" onClick={handleNext}>Tiếp theo <FaArrowRight /></button></div>
                </div>
              )}

              {step === 4 && (
                <div className="form-step">
                  <div className="input-group">
                    <label><FaUniversity /> Ngân hàng <span className="required">*</span></label>
                    <select name="bankName" value={formData.bankName} className={errors.bankName ? 'error-input' : ''} onChange={handleInputChange}>
                      <option value="">-- Chọn ngân hàng --</option>
                      {FAMOUS_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {errors.bankName && <span className="error-text">{errors.bankName}</span>}
                  </div>
                  <div className="input-group">
                    <label>Số tài khoản <span className="required">*</span></label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} className={errors.accountNumber ? 'error-input' : ''} onChange={handleNumericInputChange} />
                    {errors.accountNumber && <span className="error-text">{errors.accountNumber}</span>}
                  </div>
                  <div className="input-group">
                    <label>Chủ tài khoản (Viết hoa)</label>
                    <input type="text" name="accountHolder" value={formData.accountHolder} onChange={(e) => setFormData({...formData, accountHolder: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="step-actions"><button className="btn-prev" onClick={() => setStep(3)}><FaArrowLeft /> Quay lại</button><button className="btn-next" onClick={handleNext}>Review <FaEye /></button></div>
                </div>
              )}

              {step === 5 && (
                <div className="form-step review-step">
                  <div className="review-info-section">
                    <p><strong>Gian hàng:</strong> {formData.shopName}</p>
                    <p><strong>Ngân hàng:</strong> {formData.bankName} - {formData.accountNumber}</p>
                    <p><strong>Kho hàng:</strong> {formData.stockAddresses.length} địa chỉ</p>
                  </div>
                  <div className="review-image-container">
                    <div className="review-img-box"><img src={previews.front} alt="Front" /></div>
                    <div className="review-img-box"><img src={previews.back} alt="Back" /></div>
                  </div>
                  <div className="step-actions"><button className="btn-prev" onClick={() => setStep(4)}><FaArrowLeft /> Quay lại</button><button className="btn-submit" onClick={handleUpgrade} disabled={isUpgrading}>{isUpgrading ? "Đang gửi..." : "Xác nhận & Đăng ký"}</button></div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showAddressModal && (
        <div className="address-modal-overlay">
          <div className="address-modal-card">
            <div className="modal-header"><h2>{editingIndex !== null ? 'Chỉnh sửa kho' : 'Thêm kho hàng mới'}</h2><button className="close-btn" onClick={() => setShowAddressModal(false)}><FaTimesCircle /></button></div>
            <div className="modal-body">
              <input type="text" placeholder="Người phụ trách" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} />
              <input type="text" placeholder="SĐT kho" value={addressForm.phoneNumber} onChange={(e) => setAddressForm({...addressForm, phoneNumber: e.target.value})} />
              <select value={addressForm.province} onChange={(e) => setAddressForm({...addressForm, province: e.target.value})}><option value="">-- Chọn Tỉnh (2026) --</option>{PROVINCES_2026.map(p => <option key={p} value={p}>{p}</option>)}</select>
              <input type="text" placeholder="Phường / Xã" value={addressForm.ward} onChange={(e) => setAddressForm({...addressForm, ward: e.target.value})} />
              <input type="text" placeholder="Ấp / Thôn" value={addressForm.hamlet} onChange={(e) => setAddressForm({...addressForm, hamlet: e.target.value})} />
              <textarea placeholder="Số nhà, đường..." value={addressForm.detailAddress} onChange={(e) => setAddressForm({...addressForm, detailAddress: e.target.value})} />
              
              {/* --- REQUIREMENT: Visual GPS Data Display --- */}
              <div className="gps-section">
                <button className="btn-locate" onClick={getCurrentLocation} disabled={isLocating}>
                  {isLocating ? "Đang quét..." : <><FaCrosshairs /> Định vị GPS</>}
                </button>
                {addressForm.latitude && (
                  <div className="coords-display">
                    <FaCheck className="success-icon" /> 
                    <span>Vĩ độ: <strong>{addressForm.latitude}</strong> | Kinh độ: <strong>{addressForm.longitude}</strong></span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer"><button className="btn-save-address" onClick={saveAddress}>Lưu địa chỉ</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRegister;