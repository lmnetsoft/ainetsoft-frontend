import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import './Auth.css';
import { loginUser } from '../../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    // 1. Validate Phone format if in phone mode
    if (inputMode === 'phone') {
      if (!loginData.phone || !isValidPhoneNumber(loginData.phone)) {
        setError("Số điện thoại không hợp lệ!");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        contactInfo: inputMode === 'phone' ? loginData.phone : loginData.email,
        password: loginData.password
      };

      // 2. Call the new login service
      const responseMessage = await loginUser(payload);
      
      // 3. Handle Success
      alert(responseMessage);
      navigate('/'); // Redirect to home on success

    } catch (err: any) {
      // 4. Handle Errors (e.g., Wrong password, User not found)
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Đăng Nhập</h2>
        <p className="auth-subtitle">Chào mừng bạn quay lại với AiNetsoft</p>

        {/* Success Message from Registration */}
        {successMessage && (
          <div className="success-alert" style={{color: 'green', backgroundColor: '#e6fffa', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #38b2ac'}}>
            {successMessage}
          </div>
        )}
        
        {/* Error Message from Backend */}
        {error && (
          <div className="error-alert" style={{color: 'red', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #feb2b2'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="contact-type-selector">
            <button 
              type="button" 
              className={inputMode === 'phone' ? 'active' : ''} 
              onClick={() => { setInputMode('phone'); setError(''); setSuccessMessage(''); }}
            >
              Số điện thoại
            </button>
            <button 
              type="button" 
              className={inputMode === 'email' ? 'active' : ''} 
              onClick={() => { setInputMode('email'); setError(''); setSuccessMessage(''); }}
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
                  value={loginData.phone}
                  onChange={(val) => setLoginData({...loginData, phone: val || ''})}
                  placeholder="Nhập số điện thoại"
                  className="custom-phone-input"
                />
              </>
            ) : (
              <>
                <label>Địa chỉ Email</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="example@gmail.com" 
                  onChange={handleInputChange} 
                  required 
                />
              </>
            )}
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              name="password" 
              placeholder="••••••••" 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="auth-footer">
          <div className="footer-item">
            Chưa có tài khoản? &nbsp; 
            <button className="link-btn" onClick={() => navigate('/register')}>
              Đăng ký ngay
            </button>
          </div>
          <div className="footer-item" style={{ marginTop: '10px' }}>
            <button className="link-btn" onClick={() => navigate('/forgot-password')}>
              Quên mật khẩu?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;