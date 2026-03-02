import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification'; // NEW IMPORT
import { changePasswordUser } from '../../services/authService';
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

  // NEW: Toast Notification States
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.title = "Đổi mật khẩu | AiNetsoft";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. VALIDATION: Check for 8-character minimum
    if (formData.newPassword.length < 8) {
      setToastMessage("Mật khẩu mới phải có ít nhất 8 ký tự!");
      setShowToast(true);
      return;
    }

    // 2. VALIDATION: Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setToastMessage("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      // Sending ONLY the fields defined in the Java ChangePasswordRequest DTO
      const message = await changePasswordUser({
        currentPassword: formData.currentPassword.trim(),
        newPassword: formData.newPassword.trim()
      });

      setToastMessage(message || "Đổi mật khẩu thành công!");
      setShowToast(true);
      
      // Reset form on success
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      // Catches errors like "Mật khẩu hiện tại không chính xác!" from AuthService.java
      setToastMessage(error.message || "Đổi mật khẩu thất bại.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-page-wrapper">
      {/* RENDER TOAST NOTIFICATION */}
      <ToastNotification 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

      <div className="container password-main-container">
        <AccountSidebar />
        
        <main className="password-content-card">
          <div className="password-header">
            <h1>Đổi mật khẩu</h1>
            <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
          </div>
          <hr className="password-divider" />

          <form className="password-change-form" onSubmit={handleSubmit}>
            
            <div className="password-form-row">
              <label>Mật khẩu hiện tại</label>
              <div className="password-input-wrapper">
                <input 
                  type={showCurrent ? "text" : "password"} 
                  required
                  autoComplete="off"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                />
                <div className="eye-icon-box" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <div className="password-form-row">
              <label>Mật khẩu mới (Tối thiểu 8 ký tự)</label>
              <div className="password-input-wrapper">
                <input 
                  type={showNew ? "text" : "password"} 
                  required
                  autoComplete="off"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                />
                <div className="eye-icon-box" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <div className="password-form-row">
              <label>Xác nhận mật khẩu</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirm ? "text" : "password"} 
                  required
                  autoComplete="off"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <div className="eye-icon-box" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <div className="password-form-row">
              <label></label>
              <div className="button-group">
                <button type="submit" className="confirm-btn" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Xác nhận"}
                </button>
                <a href="/forgot-password" style={{fontSize: '14px', color: '#5b67f1', textDecoration: 'none'}}>Quên mật khẩu?</a>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default ChangePassword;