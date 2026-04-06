import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import ToastNotification from '../../components/Toast/ToastNotification'; 
import { getUserProfile, updateProfile, logoutUser } from '../../services/authService';
import { FaGoogle, FaFacebook, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import logoImg from '../../assets/images/logo.png';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];

  // 🚀 SYNC FIX: Load initial state from cache immediately to stop the "Page Flash"
  const getInitialData = () => {
    const cached = localStorage.getItem('user');
    if (cached) {
      const data = JSON.parse(cached);
      return {
        email: data.email || '',
        phone: data.phone?.replace(/\D/g, '').replace(/^084/, '84') || '84',
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
  const [loading, setLoading] = useState(!localStorage.getItem('user')); 
  const [isSaving, setIsSaving] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [verificationStatus, setVerificationStatus] = useState({
    status: 'NONE', 
    rejectionReason: ''
  });

  const isSocialUser = formData.provider !== 'LOCAL' && formData.provider !== null;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        
        let normalizedPhone = '84';
        if (data.phone) {
            const digits = data.phone.replace(/\D/g, '');
            if (digits.startsWith('084')) {
                normalizedPhone = digits.slice(1);
            } else if (digits.startsWith('0')) {
                normalizedPhone = '84' + digits.slice(1);
            } else {
                normalizedPhone = digits;
            }
        }

        setFormData({
          email: data.email || '',
          phone: normalizedPhone,
          fullName: data.fullName || '',
          gender: data.gender || 'other',
          birthDate: data.birthDate || '',
          avatarUrl: data.avatarUrl || '',
          provider: data.provider || 'LOCAL', 
          addresses: data.addresses || [],
          bankAccounts: data.bankAccounts || []
        });

        const roles = data.roles || [];
        const isVerifiedSeller = roles.includes('SELLER') || data.sellerVerification === 'VERIFIED';
        setIsSeller(isVerifiedSeller);

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

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

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

    if (!formData.phone || !validatePhone(formData.phone)) {
      setToastMessage("Số điện thoại không hợp lệ hoặc nhà mạng không hỗ trợ.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      const finalPhone = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;

      const synchronizedAddresses = (formData.addresses || []).map(addr => ({
        ...addr,
        phone: finalPhone 
      }));

      const payload = {
        ...formData,
        phone: finalPhone,
        addresses: synchronizedAddresses
      };

      const message = await updateProfile(payload);
      setToastMessage(message || "Cập nhật hồ sơ thành công!");
      setShowToast(true);
      
      const freshData = await getUserProfile();
      setFormData(prev => ({
        ...prev,
        phone: freshData.phone ? freshData.phone.replace(/\D/g, '').replace(/^084/, '84') : '84',
        fullName: freshData.fullName,
        avatarUrl: freshData.avatarUrl,
        addresses: freshData.addresses || [],
        bankAccounts: freshData.bankAccounts || []
      }));

      window.dispatchEvent(new Event('profileUpdate'));
      
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật hồ sơ thất bại.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 VIBRATION FIX: We no longer unmount the whole component during loading.
  // This keeps the right column width stable so the Sidebar doesn't jump.

  return (
    <div className="user-profile-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* 🚀 Internal overlay instead of full-page reload */}
      {loading && <div className="supreme-loading-overlay">Đang tải hồ sơ...</div>}

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
            <p className="hint">Vui lòng cập nhật lại thông tin chính xác và gửi lại yêu cầu.</p>
          </div>
        </div>
      )}

      {verificationStatus.status === 'PENDING' && (
        <div className="status-banner info-banner">
          <FaClock className="banner-icon" />
          <div className="info-text">
            <strong>Hồ sơ đang chờ phê duyệt</strong>
            <p>Yêu cầu đăng ký Người bán của bạn đã được tiếp nhận. Đội ngũ kiểm duyệt sẽ phản hồi trong vòng 24 giờ làm việc.</p>
          </div>
        </div>
      )}

      <div className="profile-main-grid">
        <form className="profile-data-form" onSubmit={(e) => e.preventDefault()}>
          <div className="supreme-form-row">
            <label>Email <span className="req">*</span></label>
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
              <input 
                type="text" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Nhập họ và tên"
              />
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
                inputStyle={{ width: '100%', height: '45px', paddingLeft: '48px', fontSize: '0.9375rem' }} 
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
                  <label key={g}>
                    <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={(e) => setFormData({...formData, gender: e.target.value})} /> {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="supreme-form-row">
            <label>Ngày sinh</label>
            <div className="input-group-container">
              <input 
                type="date" 
                value={formData.birthDate} 
                max={maxBirthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="save-btn-supreme" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            
            {!isSeller && verificationStatus.status !== 'PENDING' && (
              <button type="button" className="become-seller-btn" onClick={() => navigate('/seller/register')}>
                Trở thành Người bán
              </button>
            )}

            {verificationStatus.status === 'PENDING' && (
              <button type="button" className="become-seller-btn status-pending" disabled>
                Đang thẩm định...
              </button>
            )}
            
            {isSeller && (
              <button type="button" className="become-seller-btn status-active" onClick={() => navigate('/seller/dashboard')}>
                Vào Kênh Người Bán
              </button>
            )}
          </div>
        </form>

        <div className="profile-avatar-column">
          <div className="avatar-preview-box">
            <img src={formData.avatarUrl || logoImg} alt="Avatar" onError={(e) => { (e.target as HTMLImageElement).src = logoImg; }} />
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept=".jpg,.jpeg,.png" style={{ display: 'none' }} />
          <button className="upload-btn-supreme" onClick={() => fileInputRef.current?.click()}>Chọn ảnh</button>
          <p className="upload-hint">Dung lượng tối đa 1MB<br/>Định dạng: .JPG, .PNG</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;