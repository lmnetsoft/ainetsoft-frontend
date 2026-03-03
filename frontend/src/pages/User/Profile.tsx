import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification'; 
import { getUserProfile, updateProfile, logoutUser } from '../../services/authService'; // UPDATED: Added logoutUser
import { FaUserCircle } from 'react-icons/fa'; // NEW: For fallback icon
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
    addresses: [] as any[],
    bankAccounts: [] as any[]
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
          addresses: data.addresses || [],
          bankAccounts: data.bankAccounts || []
        });

        if (data.roles && data.roles.includes('SELLER')) {
          setIsSeller(true);
        }
      } catch (error: any) {
        console.error("Profile load error:", error);
        // If session expired, the authService already clears storage, 
        // we just need to send them to login.
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    document.title = "Hồ sơ của tôi | AiNetsoft";
  }, [navigate]);

  const handleLogout = async () => {
    await logoutUser(); // Cleanly invalidates JSESSIONID on backend
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

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setToastMessage("Vui lòng nhập Họ và Tên.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      
      // Syncing Profile Phone -> Address Phone for data consistency
      const synchronizedAddresses = formData.addresses.map(addr => ({
        ...addr,
        phone: formData.phone 
      }));

      const payload = {
        ...formData,
        addresses: synchronizedAddresses
      };

      // updateProfile in authService.ts already handles localStorage and profileUpdate event
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
      <ToastNotification 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

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
                <label>Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  disabled // Recommended: Keep email locked for social users
                  className="input-disabled"
                />
              </div>

              <div className="form-row">
                <label>Họ và Tên</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-row">
                <label>Số điện thoại</label>
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
                    <button 
                      type="button" 
                      className="become-seller-btn"
                      onClick={() => navigate('/seller/register')}
                    >
                      Trở thành Người bán
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="profile-avatar-section">
              <div className="avatar-preview">
                {formData.avatarUrl ? (
                   <img 
                    src={formData.avatarUrl} 
                    alt="Avatar" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = ""; 
                      setFormData(prev => ({ ...prev, avatarUrl: "" }));
                    }}
                   />
                ) : (
                  <FaUserCircle className="avatar-fallback-icon" />
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept=".jpg,.jpeg,.png" style={{ display: 'none' }} />
              <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>Chọn ảnh</button>
              <div className="upload-requirements">
                <p>Dung lượng file tối đa 1 MB</p>
                <p>Định dạng: .JPEG, .PNG</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;