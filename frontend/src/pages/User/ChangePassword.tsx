import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import ToastNotification from '../../components/Toast/ToastNotification'; 
import { changePasswordUser } from '../../services/authService';
// 🚀 Keeping Profile.css for shared form geometry and ChangePassword.css for eye-icon logic
import './Profile.css';
import './ChangePassword.css';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.title = "Đổi mật khẩu | AiNetsoft";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      setToastMessage("Mật khẩu mới phải có ít nhất 8 ký tự!");
      setShowToast(true);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setToastMessage("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const message = await changePasswordUser({
        currentPassword: formData.currentPassword.trim(),
        newPassword: formData.newPassword.trim()
      });

      setToastMessage(message || "Đổi mật khẩu thành công!");
      setShowToast(true);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setToastMessage(error.message || "Đổi mật khẩu thất bại.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile-supreme-layout">
      <ToastNotification 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

      {/* 🚀 FIXED: Centered Red Title Header */}
      <div className="profile-content-header centered-header">
        <h1>Đổi mật khẩu</h1>
        <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>
      
      <hr className="supreme-divider" />

      <div className="profile-main-grid">
        <form className="profile-data-form" onSubmit={handleSubmit}>
          
          <div className="supreme-form-row">
            <label>Mật khẩu hiện tại <span className="req">*</span></label>
            <div className="password-field-wrapper">
              <input 
                type={showCurrent ? "text" : "password"} 
                className="input-field"
                required
                autoComplete="off"
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
              />
              <div className="eye-trigger-box" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>

          <div className="supreme-form-row">
            <label>Mật khẩu mới <span className="req">*</span></label>
            <div className="password-field-wrapper">
              <input 
                type={showNew ? "text" : "password"} 
                className="input-field"
                required
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="off"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              />
              <div className="eye-trigger-box" onClick={() => setShowNew(!showNew)}>
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>

          <div className="supreme-form-row">
            <label>Xác nhận mật khẩu <span className="req">*</span></label>
            <div className="password-field-wrapper">
              <input 
                type={showConfirm ? "text" : "password"} 
                className="input-field"
                required
                autoComplete="off"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              <div className="eye-trigger-box" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn-supreme" disabled={loading}>
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </button>
            <a href="/forgot-password" style={{fontSize: '14px', color: '#ee4d2d', textDecoration: 'none', marginLeft: '15px'}}>Quên mật khẩu?</a>
          </div>
        </form>

        <div className="profile-avatar-column" style={{ border: 'none' }}></div>
      </div>
    </div>
  );
};

export default ChangePassword;