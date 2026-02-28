import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import './Profile.css';

const Profile = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: 'other',
    birthDate: ''
  });

  useEffect(() => {
    // Simulated fetching of user data
    const storedName = localStorage.getItem('userName') || '';
    setFormData(prev => ({ 
      ...prev, 
      username: 'ainetsoft_dev', 
      fullName: storedName,
      email: 'user@ainetsoft.com' 
    }));
    document.title = "Hồ sơ của tôi | AiNetsoft";
  }, []);

  return (
    <div className="profile-wrapper">
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
                <label>Tên đăng nhập</label>
                <div className="form-value">{formData.username}</div>
              </div>

              <div className="form-row">
                <label>Tên</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="form-row">
                <label>Email</label>
                <div className="form-value">
                  {formData.email} <a href="#" className="change-link">Thay đổi</a>
                </div>
              </div>

              <div className="form-row">
                <label>Số điện thoại</label>
                <div className="form-value">
                  *********88 <a href="#" className="change-link">Thay đổi</a>
                </div>
              </div>

              <div className="form-row">
                <label>Giới tính</label>
                <div className="radio-group">
                  <label><input type="radio" name="gender" value="male" /> Nam</label>
                  <label><input type="radio" name="gender" value="female" /> Nữ</label>
                  <label><input type="radio" name="gender" value="other" defaultChecked /> Khác</label>
                </div>
              </div>

              <div className="form-row">
                <label>Ngày sinh</label>
                <input type="date" value={formData.birthDate} />
              </div>

              <div className="form-row">
                <label></label>
                <button type="button" className="save-btn">Lưu</button>
              </div>
            </form>

            <div className="profile-avatar-section">
              <div className="avatar-preview">
                <img src="/src/assets/images/logo_without_text.png" alt="Avatar" />
              </div>
              <button className="upload-btn">Chọn ảnh</button>
              <div className="upload-requirements">
                <p>Dụng lượng file tối đa 1 MB</p>
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