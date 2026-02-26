import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [error, setError] = useState('');

  const [contactData, setContactData] = useState({
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate Phone format if in phone mode
    if (inputMode === 'phone') {
      if (!contactData.phone || !isValidPhoneNumber(contactData.phone)) {
        setError("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại!");
        return;
      }
    }

    const contactValue = inputMode === 'phone' ? contactData.phone : contactData.email;
    console.log("Requesting recovery for:", contactValue);
    
    // Future step: Call Java 24 backend API
    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {!submitted ? (
          <>
            <h2>Khôi Phục Mật Khẩu</h2>
            <p className="auth-subtitle">Nhập Email hoặc Số điện thoại bạn đã đăng ký để nhận mã xác thực.</p>
            
            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Tab Switcher */}
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
              <button type="submit" className="auth-submit-btn">Gửi yêu cầu</button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Yêu cầu đã được gửi!</h3>
            <p>Vui lòng kiểm tra tin nhắn SMS hoặc Email của bạn để lấy mã khôi phục.</p>
            <button onClick={() => navigate('/login')} className="auth-submit-btn">Quay lại Đăng nhập</button>
          </div>
        )}
        
        <div className="auth-footer">
          <button className="link-btn" onClick={() => navigate('/register')}>Quay lại Đăng ký</button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;