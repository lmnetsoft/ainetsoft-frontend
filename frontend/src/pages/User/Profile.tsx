import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    avatarUrl: ''
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
          avatarUrl: data.avatarUrl || ''
        });

        // Dynamic Role Check: Trusting the API data over localStorage for security
        if (data.roles && data.roles.includes('SELLER')) {
          setIsSeller(true);
          localStorage.setItem('userRoles', JSON.stringify(data.roles));
        }

      } catch (error: any) {
        console.error("Profile load error:", error);
        if (error.message.includes('401') || error.message.includes('403')) {
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
    localStorage.clear(); // Clean sweep of all old data
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
    try {
      setIsSaving(true);
      const message = await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender,
        birthDate: formData.birthDate,
        avatarUrl: formData.avatarUrl
      });
      
      // Update local storage for immediate header/sidebar sync
      localStorage.setItem('userName', formData.fullName);
      localStorage.setItem('userAvatar', formData.avatarUrl);
      
      setToastMessage(message || "Cập nhật hồ sơ thành công!");
      setShowToast(true);

      // Trigger global event for Header/Sidebar to update immediately
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
        <div className="container profile-container" style={{justifyContent: 'center', alignItems: 'center', height: '400px'}}>
          <div className="loading-spinner"></div>
          <p style={{marginLeft: '15px', color: '#666'}}>Đang tải dữ liệu hồ sơ...</p>
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
            <form className="profile-info-form">
              <div className="form-row">
                <label>Email</label>
                <div className="form-value">
                  {formData.email || "Chưa thiết lập"}
                </div>
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
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Nhập số điện thoại"
                />
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
                  <button 
                    type="button" 
                    className="save-btn" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
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
                <img 
                  src={formData.avatarUrl || "/src/assets/images/logo_without_text.png"} 
                  alt="Avatar" 
                />
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept=".jpg,.jpeg,.png" 
                style={{ display: 'none' }} 
              />
              
              <button 
                className="upload-btn" 
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn ảnh
              </button>
              
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