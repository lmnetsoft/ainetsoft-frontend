import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification'; 
import { getUserProfile, updateProfile, logoutUser } from '../../services/authService';
import { FaLock, FaGoogle, FaFacebook, FaExclamationTriangle, FaInfoCircle, FaClock } from 'react-icons/fa';
import logoImg from '../../assets/images/logo.png';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    fullName: '',
    gender: 'other',
    birthDate: '',
    avatarUrl: '',
    provider: 'LOCAL', 
    addresses: [] as any[],
    bankAccounts: [] as any[]
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 🚀 UPDATED: Track the actual verification status and admin feedback
  const [verificationStatus, setVerificationStatus] = useState({
    status: 'NONE', // NONE, PENDING, APPROVED, REJECTED
    rejectionReason: ''
  });

  const isSocialUser = formData.provider !== 'LOCAL' && formData.provider !== null;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        
        setFormData({
          email: data.email || '',
          phone: data.phone || '',
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

        // 🚀 SYNCED: Get status from backend (No more [Lỗi Email] string checking)
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
    if (!phone) return false;
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

    if (!formData.phone || !validatePhone(formData.phone)) {
      setToastMessage("Số điện thoại không hợp lệ hoặc nhà mạng không hỗ trợ.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      const synchronizedAddresses = (formData.addresses || []).map(addr => ({
        ...addr,
        phone: formData.phone 
      }));

      const payload = {
        ...formData,
        addresses: synchronizedAddresses
      };

      const message = await updateProfile(payload);
      setToastMessage(message || "Cập nhật hồ sơ thành công!");
      setShowToast(true);
      
      // Refresh logic
      const freshData = await getUserProfile();
      setFormData({
        ...formData,
        email: freshData.email,
        phone: freshData.phone,
        fullName: freshData.fullName,
        avatarUrl: freshData.avatarUrl,
        addresses: freshData.addresses || [],
        bankAccounts: freshData.bankAccounts || []
      });
      
      setVerificationStatus({
        status: freshData.sellerVerification || 'NONE',
        rejectionReason: freshData.rejectionReason || ''
      });

      window.dispatchEvent(new Event('profileUpdate'));
      
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật hồ sơ thất bại.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-wrapper">
        <div className="container profile-container-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="profile-main-content">
          <div className="content-header">
            <h1>Hồ sơ của tôi</h1>
            <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
          </div>
          <hr className="divider" />

          {/* 🚀 NEW: REJECTED BANNER (The Only Red Banner) */}
          {verificationStatus.status === 'REJECTED' && (
            <div className="profile-warning-banner" style={{
              background: '#fff1f0', border: '1px solid #ffa39e', padding: '15px', 
              borderRadius: '6px', marginBottom: '25px', display: 'flex', gap: '12px', alignItems: 'flex-start'
            }}>
              <FaExclamationTriangle style={{ color: '#ff4d4f', fontSize: '20px', marginTop: '2px' }} />
              <div className="warning-text">
                <strong style={{ color: '#cf1322', display: 'block', marginBottom: '4px' }}>Yêu cầu nâng cấp Shop bị từ chối</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#595959' }}>
                  <strong>Lý do:</strong> {verificationStatus.rejectionReason}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#8c8c8c' }}>
                  Vui lòng cập nhật lại thông tin chính xác và gửi lại yêu cầu.
                </p>
              </div>
            </div>
          )}

          {/* 🚀 NEW: PENDING INFO BANNER (Professional Blue Banner) */}
          {verificationStatus.status === 'PENDING' && (
            <div className="profile-info-banner" style={{
              background: '#e6f7ff', border: '1px solid #91d5ff', padding: '15px', 
              borderRadius: '6px', marginBottom: '25px', display: 'flex', gap: '12px', alignItems: 'flex-start'
            }}>
              <FaClock style={{ color: '#1890ff', fontSize: '20px', marginTop: '2px' }} />
              <div className="info-text">
                <strong style={{ color: '#0050b3', display: 'block', marginBottom: '4px' }}>Hồ sơ đang chờ phê duyệt</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#595959' }}>
                  Yêu cầu đăng ký Người bán của bạn đã được tiếp nhận. Đội ngũ kiểm duyệt sẽ phản hồi trong vòng 24 giờ làm việc.
                </p>
              </div>
            </div>
          )}

          <div className="profile-form-container">
            <form className="profile-info-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <label>Email <span className="required-star">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => !isSocialUser && setFormData({...formData, email: e.target.value})}
                    readOnly={isSocialUser} 
                    className={`${isSocialUser ? "input-field input-locked" : "input-field"}`}
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

              <div className="form-row">
                <label>Họ và Tên <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-row">
                <label>Số điện thoại <span className="required-star">*</span></label>
                <div className="phone-input-wrapper">
                  <PhoneInput
                    country={'vn'} 
                    preferredCountries={['vn']}
                    value={formData.phone}
                    onChange={(phone) => setFormData({...formData, phone})}
                    inputStyle={{ width: '100%', height: '40px' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <label>Giới tính</label>
                <div className="radio-group">
                  {['male', 'female', 'other'].map((g) => (
                    <label key={g}>
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g} 
                        checked={formData.gender === g} 
                        onChange={(e) => setFormData({...formData, gender: e.target.value})} 
                      /> {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label>Ngày sinh</label>
                <input 
                  type="date" 
                  value={formData.birthDate} 
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>

              <div className="form-row">
                <label></label>
                <div className="button-group-profile">
                  <button type="button" className="save-btn" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  
                  {!isSeller && verificationStatus.status !== 'PENDING' && (
                    <button type="button" className="become-seller-btn" onClick={() => navigate('/seller/register')}>
                      Trở thành Người bán
                    </button>
                  )}

                  {verificationStatus.status === 'PENDING' && (
                    <button type="button" className="become-seller-btn" style={{backgroundColor: '#faad14', cursor: 'default'}} disabled>
                      Đang thẩm định...
                    </button>
                  )}
                  
                  {isSeller && (
                    <button type="button" className="become-seller-btn" style={{backgroundColor: '#27ae60'}} onClick={() => navigate('/seller/dashboard')}>
                      Vào Kênh Người Bán
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="profile-avatar-section">
              <div className="avatar-preview">
                <img 
                  src={formData.avatarUrl || logoImg} 
                  alt="Avatar" 
                  onError={(e) => { (e.target as HTMLImageElement).src = logoImg; }}
                />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept=".jpg,.jpeg,.png" style={{ display: 'none' }} />
              <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>Chọn ảnh</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;