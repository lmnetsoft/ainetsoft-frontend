import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import ToastNotification from '../../components/Toast/ToastNotification'; 
import { getUserProfile, updateProfile, logoutUser, initiateEmailChange, confirmEmailChange, sendOtp } from '../../services/authService';
import { FaGoogle, FaFacebook, FaExclamationTriangle, FaClock, FaTimes } from 'react-icons/fa';
import logoImg from '../../assets/images/logo.png';
import './Profile.css';
import OtpVerification from '../../components/OtpVerification/OtpVerification';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];

  const normalizeForDisplay = (phoneStr: string) => {
    if (!phoneStr) return '84';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('084')) return digits.slice(1);
    if (digits.startsWith('0')) return '84' + digits.slice(1);
    return digits;
  };

  const getInitialData = () => {
    const cached = localStorage.getItem('user');
    if (cached) {
      const data = JSON.parse(cached);
      return {
        email: data.email || '',
        phone: normalizeForDisplay(data.phone),
        fullName: data.fullName || '',
        gender: data.gender || 'other',
        birthDate: data.birthDate || '',
        avatarUrl: data.avatarUrl || '',
        provider: data.provider || 'LOCAL', 
        addresses: data.addresses || [],
        bankAccounts: data.bankAccounts || []
      };
    }
    return {
      email: '', phone: '84', fullName: '', gender: 'other',
      birthDate: '', avatarUrl: '', provider: 'LOCAL',
      addresses: [], bankAccounts: []
    };
  };

  const [formData, setFormData] = useState(getInitialData());
  const [originalData, setOriginalData] = useState(getInitialData()); 
  const [originalEmail, setOriginalEmail] = useState(getInitialData().email); 
  const [loading, setLoading] = useState(!localStorage.getItem('user')); 
  const [isSaving, setIsSaving] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpType, setOtpType] = useState<'email' | 'phone' | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState({
    status: 'NONE', 
    rejectionReason: ''
  });

  const isSocialUser = formData.provider !== 'LOCAL' && formData.provider !== null;
  const registeredByEmail = originalEmail && (!originalData.phone || originalData.phone === '84' || originalData.phone === '');
  const emailMandatory = isSocialUser || registeredByEmail;

  const hasChanges = JSON.stringify({
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    gender: formData.gender,
    birthDate: formData.birthDate,
    avatarUrl: formData.avatarUrl
  }) !== JSON.stringify({
    fullName: originalData.fullName,
    email: originalData.email,
    phone: originalData.phone,
    gender: originalData.gender,
    birthDate: originalData.birthDate,
    avatarUrl: originalData.avatarUrl
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        const profileData = {
          email: data.email || '',
          phone: normalizeForDisplay(data.phone),
          fullName: data.fullName || '',
          gender: data.gender || 'other',
          birthDate: data.birthDate || '',
          avatarUrl: data.avatarUrl || '',
          provider: data.provider || 'LOCAL', 
          addresses: data.addresses || [],
          bankAccounts: data.bankAccounts || []
        };

        setFormData(profileData);
        setOriginalData(profileData); 
        setOriginalEmail(data.email || '');

        const roles = data.roles || [];
        setIsSeller(roles.includes('SELLER') || data.sellerVerification === 'VERIFIED');
        setVerificationStatus({
          status: data.sellerVerification || 'NONE',
          rejectionReason: data.rejectionReason || ''
        });

      } catch (error: any) {
        console.error("Profile load error:", error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    document.title = "Hồ sơ của tôi | AiNetsoft";
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setToastMessage("File quá lớn! Vui lòng chọn ảnh dưới 1MB.");
        setShowToast(true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone || phone === '84') return false;
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.startsWith('0') || digitsOnly.startsWith('84')) {
        const normalized = digitsOnly.startsWith('84') ? '0' + digitsOnly.slice(2) : digitsOnly;
        const vnRegex = /^(03[2-9]|086|09[6-8]|070|07[6-9]|089|090|093|08[1-5]|088|091|094|052|05[68]|092|059|099)\d{7}$/;
        return vnRegex.test(normalized) && normalized.length === 10;
    }
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setToastMessage("Vui lòng nhập Họ và Tên.");
      setShowToast(true);
      return;
    }
    if (formData.birthDate && formData.birthDate > maxBirthDate) {
      setToastMessage("Bạn phải ít nhất 16 tuổi để sử dụng dịch vụ này.");
      setShowToast(true);
      return;
    }
    
    if (!formData.phone || formData.phone === '84') {
      setToastMessage("Vui lòng nhập số điện thoại.");
      setShowToast(true);
      return;
    }
    if (!validatePhone(formData.phone)) {
      setToastMessage("Số điện thoại không hợp lệ hoặc nhà mạng không hỗ trợ.");
      setShowToast(true);
      return;
    }

    if (emailMandatory && !formData.email.trim()) {
      setToastMessage("Vui lòng cung cấp Email để duy trì đăng nhập bảo mật.");
      setShowToast(true);
      return;
    }

    const emailChanged = formData.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
    const phoneChanged = formData.phone !== originalData.phone;

    if (emailChanged && phoneChanged) {
      setToastMessage("Vì lý do bảo mật, bạn chỉ có thể thay đổi Email HOẶC Số điện thoại cùng một lúc. Vui lòng thực hiện từng bước.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);

      if (phoneChanged) {
        await sendOtp(formData.phone);
        setOtpType('phone');
        setShowOtpModal(true);
        setToastMessage("Mã xác minh đã được gửi đến số điện thoại mới.");
        setShowToast(true);
        setIsSaving(false);
        return;
      }

      if (emailChanged && !isSocialUser) {
        try {
          await initiateEmailChange(originalEmail, formData.email);
        } catch (initErr: any) {
          if (initErr.message?.includes("Timeout") || initErr.message?.includes("timeout")) {
            console.warn("Email verification initiated but Azure response timed out. Proceeding.");
          } else {
            throw initErr; 
          }
        }
        setOtpType('email');
        setShowOtpModal(true);
        setToastMessage("Mã xác minh đã được gửi. Vui lòng kiểm tra Email mới.");
        setShowToast(true);
        setIsSaving(false);
        return; 
      }

      await performFinalUpdate();
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật thất bại.");
      setShowToast(true);
      setIsSaving(false);
    }
  };

  const performFinalUpdate = async (otpCode?: string) => {
    const finalPhone = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;
    const synchronizedAddresses = (formData.addresses || []).map(addr => ({
      ...addr,
      phone: finalPhone 
    }));

    const payload = {
      ...formData,
      phone: finalPhone,
      otpCode: otpCode, 
      addresses: synchronizedAddresses
    };

    const message = await updateProfile(payload);
    setToastMessage(message || "Cập nhật hồ sơ thành công!");
    setShowToast(true);
    
    const freshData = await getUserProfile();
    const freshProfile = {
      ...freshData,
      phone: normalizeForDisplay(freshData.phone),
      fullName: freshData.fullName,
      avatarUrl: freshData.avatarUrl,
      addresses: freshData.addresses || [],
      bankAccounts: freshData.bankAccounts || []
    };

    setFormData(freshProfile);
    setOriginalData(freshProfile); 
    setOriginalEmail(freshData.email || '');

    window.dispatchEvent(new Event('profileUpdate'));
    setIsSaving(false);
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      setIsVerifyingOtp(true);
      if (otpType === 'email') {
        await confirmEmailChange(originalEmail, formData.email, code);
        setShowOtpModal(false);
        setToastMessage("Email đã đổi thành công. Vui lòng đăng nhập lại.");
        setShowToast(true);
        setTimeout(async () => { await logoutUser(); navigate('/login'); }, 2500);
      } else {
        await performFinalUpdate(code);
        setShowOtpModal(false);
      }
    } catch (error: any) {
      setToastMessage(error.message || "Mã xác thực không chính xác.");
      setShowToast(true);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="user-profile-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      {loading && <div className="supreme-loading-overlay">Đang tải hồ sơ...</div>}

      {showOtpModal && (
        <div className="admin-modal-overlay">
          <div className="seller-review-modal" style={{ maxWidth: '480px', height: 'auto', padding: '10px' }}>
             <OtpVerification 
               phoneNumber={otpType === 'phone' ? formData.phone : formData.email}
               onBack={() => setShowOtpModal(false)}
               onVerify={handleVerifyOtp}
               onResend={() => sendOtp(formData.phone)}
             />
          </div>
        </div>
      )}

      <div className="profile-content-header centered-header">
        <h1>Hồ sơ của tôi</h1>
        <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      <hr className="supreme-divider" />

      {verificationStatus.status === 'REJECTED' && (
        <div className="status-banner error-banner">
          <FaExclamationTriangle className="banner-icon" />
          <div className="warning-text">
            <strong>Yêu cầu nâng cấp Shop bị từ chối</strong>
            <p><strong>Lý do:</strong> {verificationStatus.rejectionReason}</p>
          </div>
        </div>
      )}

      {verificationStatus.status === 'PENDING' && (
        <div className="status-banner info-banner">
          <FaClock className="banner-icon" />
          <div className="info-text">
            <strong>Hồ sơ đang chờ phê duyệt</strong>
            <p>Yêu cầu đăng ký Người bán của bạn đã được tiếp nhận. Đội ngũ kiểm duyệt sẽ phản hồi sớm nhất.</p>
          </div>
        </div>
      )}

      <div className="profile-main-grid">
        <form className="profile-data-form" onSubmit={(e) => e.preventDefault()}>
          <div className="supreme-form-row">
            <label>Email {emailMandatory && <span className="req">*</span>}</label>
            <div className="input-group-container">
              <input 
                type="email" 
                value={formData.email} 
                readOnly={isSocialUser} 
                className={`${isSocialUser ? "input-field input-locked" : "input-field"}`} 
                onChange={(e) => !isSocialUser && setFormData({...formData, email: e.target.value})} 
              />
              {isSocialUser && (
                <div className={`lock-badge badge-${formData.provider.toLowerCase()}`}>
                  {formData.provider === 'GOOGLE' && <FaGoogle className="provider-icon" />}
                  {formData.provider === 'FACEBOOK' && <FaFacebook className="provider-icon" />}
                  <span>Liên kết với {formData.provider}</span>
                </div>
              )}
            </div>
          </div>

          <div className="supreme-form-row">
            <label>Họ và Tên <span className="req">*</span></label>
            <div className="input-group-container">
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            </div>
          </div>

          <div className="supreme-form-row">
            <label>Số điện thoại <span className="req">*</span></label>
            <div className="input-group-container">
              <PhoneInput
                country={'vn'} 
                preferredCountries={['vn']}
                value={formData.phone}
                onChange={(phone) => setFormData({...formData, phone})}
                enableSearch={true}
                searchPlaceholder="Tìm kiếm quốc gia..."
                searchNotFound="Không tìm thấy kết quả"
                containerClass="supreme-phone-container"
                inputStyle={{ width: '100%', height: '45px', paddingLeft: '48px', fontSize: '16px' }} 
                specialLabel={""}
                forceDialCode={true}
                countryCodeEditable={false}
              />
            </div>
          </div>

          <div className="supreme-form-row">
            <label>Giới tính</label>
            <div className="input-group-container">
              <div className="gender-options">
                {['male', 'female', 'other'].map((g) => (
                  <label key={g}><input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => setFormData({...formData, gender: e.target.value})} /> {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}</label>
                ))}
              </div>
            </div>
          </div>

          <div className="supreme-form-row">
            <label>Ngày sinh</label>
            <div className="input-group-container"><input type="date" value={formData.birthDate} max={maxBirthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} /></div>
          </div>

          <div className="form-actions">
            <button type="button" className="save-btn-supreme" onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
            
            {!isSeller && verificationStatus.status !== 'PENDING' && (
              <button type="button" className="become-seller-btn" onClick={() => navigate('/seller/register')}>Trở thành Người bán</button>
            )}
            {isSeller && (
              <button type="button" className="become-seller-btn status-active" onClick={() => navigate('/seller/dashboard')}>Vào Kênh Người Bán</button>
            )}
          </div>
        </form>

        <div className="profile-avatar-column">
          <div className="avatar-preview-box">
            <img src={formData.avatarUrl || logoImg} alt="Avatar" />
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept=".jpg,.jpeg,.png" style={{ display: 'none' }} />
          <button className="upload-btn-supreme" onClick={() => fileInputRef.current?.click()}>Chọn ảnh</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;