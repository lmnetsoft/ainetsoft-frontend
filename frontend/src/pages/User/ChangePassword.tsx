import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import './ChangePassword.css';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State to track visibility for each field
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Mật khẩu mới không khớp!");
      return;
    }
    console.log("Submitting password change...", formData);
  };

  return (
    <div className="password-page-wrapper">
      <div className="container password-main-container">
        <AccountSidebar />
        
        <main className="password-content-card">
          <div className="password-header">
            <h1>Đổi mật khẩu</h1>
            <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
          </div>
          <hr className="password-divider" />

          <form className="password-change-form" onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="password-form-row">
              <label>Mật khẩu hiện tại</label>
              <div className="password-input-wrapper">
                <input 
                  type={showCurrent ? "text" : "password"} 
                  required
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                />
                <span className="eye-icon" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* New Password */}
            <div className="password-form-row">
              <label>Mật khẩu mới</label>
              <div className="password-input-wrapper">
                <input 
                  type={showNew ? "text" : "password"} 
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                />
                <span className="eye-icon" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="password-form-row">
              <label>Xác nhận mật khẩu</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirm ? "text" : "password"} 
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="password-form-row">
              <label></label>
              <div className="button-group">
                <button type="submit" className="confirm-btn">Xác nhận</button>
                <a href="/forgot-password" className="forgot-link">Quên mật khẩu?</a>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default ChangePassword;