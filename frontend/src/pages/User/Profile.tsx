import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification'; 
import { getUserProfile, updateProfile } from '../../services/authService';
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
        if (error.message?.includes('401') || error.message?.includes('hết hạn')) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    document.title = "Hồ sơ của tôi | AiNetsoft";
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
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
    // 1. Mandatory Validations
    if (!formData.fullName.trim()) {
      setToastMessage("Vui lòng nhập Họ và Tên.");
      setShowToast(true);
      return;
    }

    if (!formData.phone || formData.phone.length <= 3) {
      setToastMessage("Vui lòng nhập số điện thoại.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);

      // 2. BIDIRECTIONAL SYNC LOGIC
      // Update all saved addresses to use the new profile phone number
      const synchronizedAddresses = formData.addresses.map(addr => ({
        ...addr,
        phone: formData.phone // Syncing Profile Phone -> Address Phone
      }));

      const payload = {
        ...formData,
        addresses: synchronizedAddresses
      };

      const message = await updateProfile(payload);
      
      localStorage.setItem('userName', formData.fullName);
      localStorage.setItem('userAvatar', formData.avatarUrl);
      
      setToastMessage(message || "Cập nhật hồ sơ và địa chỉ thành công!");
      setShowToast(true);
      window.dispatchEvent(new Event('profileUpdate'));
      
    } catch (error: any) {
      // 3. FIX: Extract actual message to avoid [object Object]
      const errorData = error.response?.data;
      const finalMsg = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || "Cập nhật hồ sơ thất bại.");
      
      setToastMessage(finalMsg);
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
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Thiết lập địa chỉ email"
                  className={!formData.email ? "input-highlight" : ""}
                />
              </div>

              <div className="form-row">
                <label>Họ và Tên</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Nhập họ và tên (Bắt buộc)"
                />
              </div>

              {/* GLOBAL PHONE INPUT: DEFAULT VIETNAM */}
              <div className="form-row">
                <label>Số điện thoại</label>
                <div className="phone-input-wrapper">
                  <PhoneInput
                    country={'vn'} 
                    preferredCountries={['vn']}
                    value={formData.phone}
                    onChange={(phone) => setFormData({...formData, phone})}
                    placeholder="Nhập số điện thoại"
                    inputStyle={{ width: '100%', height: '40px', fontSize: '14px' }}
                    containerStyle={{ display: 'block' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <label>Giới tính</label>
                <div className="radio-group">
                  {[
                    { val: 'male', label: 'Nam' },
                    { val: 'female', label: 'Nữ' },
                    { val: 'other', label: 'Khác' }
                  ].map((g) => (
                    <label key={g.val}>
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g.val} 
                        checked={formData.gender === g.val} 
                        onChange={(e) => setFormData({...formData, gender: e.target.value})} 
                      /> {g.label}
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
                      onClick={() => navigate('/user/seller-register')}
                    >
                      Trở thành Người bán
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="profile-avatar-section">
              <div className="avatar-preview">
                <img src={formData.avatarUrl || "/logo.svg"} alt="Avatar" />
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