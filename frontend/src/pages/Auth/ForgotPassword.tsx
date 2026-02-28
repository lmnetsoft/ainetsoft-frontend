import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import './Auth.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { requestPasswordReset, resetPassword } from '../../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [timer, setTimer] = useState(0);

  const [contactData, setContactData] = useState({
    email: '',
    phone: '',
    otp: '',
    newPassword: ''
  });

  // OTP Timer Logic: Kept this useEffect as it is required for the countdown
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    
    const finalContact = inputMode === 'phone' ? contactData.phone : contactData.email;

    if (inputMode === 'phone' && (!finalContact || !isValidPhoneNumber(finalContact))) {
      setError("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại!");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(finalContact);
      setStep(2);
      setTimer(60); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalContact = inputMode === 'phone' ? contactData.phone : contactData.email;

    try {
      await resetPassword({
        contactInfo: finalContact,
        otp: contactData.otp,
        newPassword: contactData.newPassword
      });
      alert("Mật khẩu đã được thay đổi thành công!");
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {step === 1 ? (
          <>
            <h2>Khôi Phục Mật Khẩu</h2>
            <p className="auth-subtitle">Nhập Email hoặc Số điện thoại bạn đã đăng ký để nhận mã xác thực.</p>
            
            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleRequestSubmit}>
              <div className="contact-type-selector">
                <button 
                  type="button" 
                  className={inputMode === 'phone' ? 'active' : ''} 
                  onClick={() => { setInputMode('phone'); setError(''); }}
                >
                  Số điện thoại
                </button>
                <button 
                  type="button" 
                  className={inputMode === 'email' ? 'active' : ''} 
                  onClick={() => { setInputMode('email'); setError(''); }}
                >
                  Email
                </button>
              </div>

              <div className="form-group">
                {inputMode === 'phone' ? (
                  <>
                    <label>Số điện thoại (Vietnam +84)</label>
                    <PhoneInput
                      international
                      defaultCountry="VN"
                      value={contactData.phone}
                      onChange={(val) => setContactData({...contactData, phone: val || ''})}
                      placeholder="Nhập số điện thoại"
                      className="custom-phone-input"
                    />
                  </>
                ) : (
                  <>
                    <label>Địa chỉ Email</label>
                    <input 
                      type="email" 
                      placeholder="example@gmail.com"
                      value={contactData.email}
                      onChange={(e) => setContactData({...contactData, email: e.target.value})}
                      required 
                    />
                  </>
                )}
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Thiết Lập Mật Khẩu Mới</h2>
            <p className="auth-subtitle">Vui lòng nhập mã OTP đã được gửi và mật khẩu mới của bạn.</p>
            
            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label>Mã xác thực (OTP)</label>
                <input 
                  type="text" 
                  placeholder="Nhập 6 chữ số" 
                  value={contactData.otp}
                  onChange={(e) => setContactData({...contactData, otp: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={contactData.newPassword}
                    onChange={(e) => setContactData({...contactData, newPassword: e.target.value})}
                    required 
                  />
                  <button 
                    type="button" 
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>

              <div className="resend-section" style={{ textAlign: 'center', marginTop: '15px' }}>
                {timer > 0 ? (
                  <p className="auth-subtitle">Gửi lại mã sau <b>{timer}s</b></p>
                ) : (
                  <button 
                    type="button" 
                    className="link-btn" 
                    onClick={() => handleRequestSubmit()}
                    style={{ color: '#5b67f1', fontWeight: 'bold' }}
                  >
                    Gửi lại mã xác thực
                  </button>
                )}
              </div>
            </form>
          </>
        )}
        
        <div className="auth-footer">
          <button className="link-btn" onClick={() => navigate('/login')}>Quay lại Đăng nhập</button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;