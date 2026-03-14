import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaExclamationTriangle, FaStore, FaHourglassHalf, 
  FaIdCard, FaMapMarkerAlt, FaUniversity, FaArrowRight, FaArrowLeft, 
  FaCloudUploadAlt, FaFileInvoice, FaEye, FaTimesCircle, FaRocket
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile, upgradeToSeller } from '../../services/authService';
import { toast } from 'react-hot-toast';
import './Profile.css';
import './SellerRegister.css';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('NONE');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // --- FULL FORM STATE ---
  const [formData, setFormData] = useState({
    phone: '',
    cccdNumber: '',
    frontImage: null as File | null,
    backImage: null as File | null,
    shopName: '',
    shopAddress: '',
    taxCode: '', 
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

  const [previews, setPreviews] = useState({ front: '', back: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        
        // SYNC WITH BACKEND: Use sellerVerification as the source of truth
        const status = data.sellerVerification || 'NONE';
        setUserStatus(status);
        setRejectionReason(data.rejectionReason || '');
        
        setFormData(prev => ({
          ...prev,
          phone: data.phone || '',
          shopName: data.shopProfile?.shopName || '',
          shopAddress: data.shopProfile?.shopAddress || '',
          taxCode: data.shopProfile?.taxCode || '',
          bankName: data.bankAccounts?.[0]?.bankName || '',
          accountNumber: data.bankAccounts?.[0]?.accountNumber || '',
          accountHolder: data.bankAccounts?.[0]?.accountHolder || ''
        }));
      } catch (error) {
        toast.error("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- INPUT HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, [side === 'front' ? 'frontImage' : 'backImage']: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [side]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- VALIDATION LOGIC ---
  const isStepValid = () => {
    switch (step) {
      case 1: return formData.phone.length >= 10;
      case 2: return formData.cccdNumber.length === 12 && formData.frontImage !== null && formData.backImage !== null;
      case 3: return formData.shopName.trim() !== '' && formData.shopAddress.trim() !== '';
      case 4: return formData.bankName.trim() !== '' && formData.accountNumber.trim() !== '' && formData.accountHolder.trim() !== '';
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      toast.error("Vui lòng hoàn thành đầy đủ thông tin yêu cầu.");
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const message = await upgradeToSeller(formData); 
      toast.success(message || "Yêu cầu đã được gửi!");
      setUserStatus('PENDING');
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const renderStepper = () => (
    <div className="registration-stepper">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className={`step-item ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
          <div className="step-number">{step > s ? <FaCheckCircle /> : s}</div>
          <div className="step-label">
            {s === 1 ? 'Liên hệ' : s === 2 ? 'Định danh' : s === 3 ? 'Cửa hàng' : s === 4 ? 'Ngân hàng' : 'Xác nhận'}
          </div>
          {s < 5 && <div className="step-line"></div>}
        </div>
      ))}
    </div>
  );

  if (loading) return <div className="loading-spinner">Đang tải...</div>;

  // --- VIEW 1: PENDING ---
  if (userStatus === 'PENDING') {
    return (
      <div className="profile-wrapper">
        <div className="container profile-container">
          <AccountSidebar />
          <main className="profile-main-content">
            <div className="seller-status-box pending">
              <FaHourglassHalf className="status-icon" />
              <h1>Đang chờ phê duyệt</h1>
              <p>Hồ sơ của bạn đang được Admin kiểm tra. Quá trình này thường mất 24h.</p>
              <button onClick={() => navigate('/')} className="btn-back-home">Quay lại trang chủ</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- VIEW 2: VERIFIED (The Success screen after Admin clicks Approve) ---
  if (userStatus === 'VERIFIED') {
    return (
      <div className="profile-wrapper">
        <div className="container profile-container">
          <AccountSidebar />
          <main className="profile-main-content">
            <div className="seller-status-box verified">
              <FaCheckCircle className="status-icon success-color" />
              <h1>Đăng ký thành công!</h1>
              <p>Chào mừng bạn gia nhập đội ngũ Người bán của AiNetsoft.</p>
              <button onClick={() => navigate('/seller/dashboard')} className="btn-go-seller">
                 Truy cập Kênh Người Bán <FaRocket />
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- VIEW 3: REJECTED ---
  if (userStatus === 'REJECTED') {
    return (
      <div className="profile-wrapper">
        <div className="container profile-container">
          <AccountSidebar />
          <main className="profile-main-content">
            <div className="seller-status-box rejected">
              <FaTimesCircle className="status-icon error-color" />
              <h1>Yêu cầu bị từ chối</h1>
              <p className="rejection-note">Lý do: {rejectionReason}</p>
              <button onClick={() => setUserStatus('NONE')} className="btn-retry">Đăng ký lại</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- VIEW 4: THE FULL 5-STEP FORM (NONE / RE-REGISTER) ---
  return (
    <div className="profile-wrapper">
      <div className="container profile-container">
        <AccountSidebar />
        <main className="profile-main-content">
          <div className="seller-reg-card">
            <div className="seller-reg-header">
              <FaStore className="seller-icon" />
              <h1>Đăng ký Trở thành Người bán</h1>
              <p>Thực hiện các bước xác thực để mở gian hàng của bạn</p>
            </div>

            {renderStepper()}

            <div className="step-content">
              {/* STEP 1: CONTACT */}
              {step === 1 && (
                <div className="form-step">
                  <h3><span className="step-indicator">|</span> Xác thực Liên hệ</h3>
                  <div className="input-group">
                    <label>Số điện thoại <span className="required">*</span></label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleNumericInputChange} placeholder="Nhập số điện thoại" />
                  </div>
                  <div className="step-actions">
                    <button className={`btn-next ${!isStepValid() ? 'disabled' : ''}`} onClick={handleNext}>
                      Tiếp theo <FaArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: IDENTITY */}
              {step === 2 && (
                <div className="form-step">
                  <h3><span className="step-indicator">|</span> Thông tin Định danh (CCCD)</h3>
                  <div className="input-group">
                    <label>Số Căn Cước Công Dân <span className="required">*</span></label>
                    <input type="text" name="cccdNumber" value={formData.cccdNumber} onChange={handleNumericInputChange} placeholder="Nhập số CCCD 12 số" maxLength={12} />
                  </div>
                  <div className="upload-grid">
                    <div className="upload-box">
                      <input type="file" id="front" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
                      <label htmlFor="front" className={previews.front ? 'has-preview' : ''}>
                        {previews.front ? <img src={previews.front} alt="Front" /> : <><FaCloudUploadAlt /><span>Mặt trước CCCD</span></>}
                      </label>
                    </div>
                    <div className="upload-box">
                      <input type="file" id="back" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
                      <label htmlFor="back" className={previews.back ? 'has-preview' : ''}>
                        {previews.back ? <img src={previews.back} alt="Back" /> : <><FaCloudUploadAlt /><span>Mặt sau CCCD</span></>}
                      </label>
                    </div>
                  </div>
                  <div className="step-actions">
                    <button className="btn-prev" onClick={() => setStep(1)}><FaArrowLeft /> Quay lại</button>
                    <button className={`btn-next ${!isStepValid() ? 'disabled' : ''}`} onClick={handleNext}>
                      Tiếp theo <FaArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SHOP INFO */}
              {step === 3 && (
                <div className="form-step">
                  <h3><span className="step-indicator">|</span> Thông tin Cửa hàng</h3>
                  <div className="input-group">
                    <label>Tên Shop <span className="required">*</span></label>
                    <input type="text" name="shopName" value={formData.shopName} onChange={handleInputChange} placeholder="Ví dụ: My Fashion Store" />
                  </div>
                  <div className="input-group">
                    <label>Địa chỉ lấy hàng <span className="required">*</span></label>
                    <textarea name="shopAddress" value={formData.shopAddress} onChange={handleInputChange} placeholder="Số nhà, Tên đường..." />
                  </div>
                  <div className="input-group">
                    <label><FaFileInvoice /> Mã số thuế (Nếu có)</label>
                    <input type="text" name="taxCode" value={formData.taxCode} onChange={handleInputChange} placeholder="Nhập mã số thuế" />
                  </div>
                  <div className="step-actions">
                    <button className="btn-prev" onClick={() => setStep(2)}><FaArrowLeft /> Quay lại</button>
                    <button className={`btn-next ${!isStepValid() ? 'disabled' : ''}`} onClick={handleNext}>
                      Tiếp theo <FaArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: BANK INFO */}
              {step === 4 && (
                <div className="form-step">
                  <h3><span className="step-indicator">|</span> Thông tin Thanh toán</h3>
                  <div className="input-group">
                    <label>Tên ngân hàng <span className="required">*</span></label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="Ví dụ: Vietcombank" />
                  </div>
                  <div className="input-group">
                    <label>Số tài khoản <span className="required">*</span></label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleNumericInputChange} placeholder="Số tài khoản" />
                  </div>
                  <div className="input-group">
                    <label>Tên chủ tài khoản <span className="required">*</span></label>
                    <input type="text" name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} placeholder="Ví dụ: NGUYEN VAN A" />
                  </div>
                  <div className="step-actions">
                    <button className="btn-prev" onClick={() => setStep(3)}><FaArrowLeft /> Quay lại</button>
                    <button className={`btn-next ${!isStepValid() ? 'disabled' : ''}`} onClick={handleNext}>
                      Kiểm tra lại <FaEye />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: FINAL REVIEW */}
              {step === 5 && (
                <div className="form-step review-step">
                  <h3><span className="step-indicator">|</span> Xác nhận thông tin</h3>
                  <div className="review-box">
                    <div className="review-row"><strong>SĐT:</strong> {formData.phone}</div>
                    <div className="review-row"><strong>CCCD:</strong> {formData.cccdNumber}</div>
                    <div className="review-row"><strong>Shop:</strong> {formData.shopName}</div>
                    <div className="review-row"><strong>Địa chỉ:</strong> {formData.shopAddress}</div>
                    <div className="review-row"><strong>Ngân hàng:</strong> {formData.bankName} - {formData.accountNumber}</div>
                  </div>
                  
                  <div className="review-images">
                    <div className="review-img-item">
                      <span>Mặt trước</span>
                      <img src={previews.front} alt="Front Review" />
                    </div>
                    <div className="review-img-item">
                      <span>Mặt sau</span>
                      <img src={previews.back} alt="Back Review" />
                    </div>
                  </div>

                  <div className="step-actions">
                    <button className="btn-prev" onClick={() => setStep(4)}><FaArrowLeft /> Quay lại</button>
                    <button className="btn-submit" onClick={handleUpgrade} disabled={isUpgrading}>
                      {isUpgrading ? "Đang gửi..." : "Xác nhận & Gửi yêu cầu"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerRegister;