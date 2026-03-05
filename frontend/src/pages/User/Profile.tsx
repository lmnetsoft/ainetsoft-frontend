import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification'; 
import { getUserProfile, updateProfile, logoutUser } from '../../services/authService';
import { FaLock, FaGoogle, FaFacebook } from 'react-icons/fa';
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

        if (data.roles && data.roles.includes('SELLER')) {
          setIsSeller(true);
        }
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

  /**
   * UPDATED: Global-Friendly Phone Validation
   */
  const validatePhone = (phone: string) => {
    if (!phone) return false;
    
    // 1. Strip all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    // 2. Identify region (Vietnam)
    if (digitsOnly.startsWith('0') || digitsOnly.startsWith('84')) {
        const normalized = digitsOnly.startsWith('84') ? '0' + digitsOnly.slice(2) : digitsOnly;
        const vnRegex = /^(03[2-9]|086|09[6-8]|070|07[6-9]|089|090|093|08[1-5]|088|091|094|052|05[68]|092|059|099)\d{7}$/;
        return vnRegex.test(normalized) && normalized.length === 10;
    }

    // 3. International fallback
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setToastMessage("Vui lòng nhập Họ và Tên.");
      setShowToast(true);
      return;
    }

    // UPDATED: Global logic
    if (!formData.phone || !validatePhone(formData.phone)) {
      setToastMessage("Số điện thoại không hợp lệ hoặc nhà mạng không hỗ trợ.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      
      const synchronizedAddresses = formData.addresses.map(addr => ({
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
                    className={isSocialUser ? "input-field input-locked" : "input-field"}
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
                  {!isSeller && (
                    <button type="button" className="become-seller-btn" onClick={() => navigate('/seller/register')}>
                      Trở thành Người bán
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