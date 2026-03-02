import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import '../Auth/Auth.css'; 
import { registerUser } from '../../services/authService';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, userAnswer: '' });
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');

  const [formData, setFormData] = useState({
    username: '', 
    email: '',
    phone: '', 
    password: '',
    confirmPassword: ''
  });

  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1,
      userAnswer: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // 1. Password Length Validation (NEW)
    if (formData.password.length < 8) {
      setFormError("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    // 2. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (inputMode === 'phone' && formData.phone) {
        if (!isValidPhoneNumber(formData.phone)) {
            setFormError("Số điện thoại không hợp lệ!");
            return;
        }
    }

    if (parseInt(captcha.userAnswer) !== (captcha.num1 + captcha.num2)) {
      setFormError("Kết quả phép tính xác thực không chính xác!");
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.username,
        email: inputMode === 'email' ? formData.email : '',
        phone: inputMode === 'phone' ? formData.phone : '',
        password: formData.password
      };

      const result = await registerUser(payload);
      navigate('/login', { state: { successMessage: result } });
      
    } catch (err: any) {
      setFormError(err.message);
      generateCaptcha(); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Đăng Ký Tài Khoản</h2>
        <p className="auth-subtitle">Sử dụng Email hoặc Số điện thoại để tham gia AiNetsoft</p>
        
        {formError && <div className="error-alert">{formError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên hiển thị</label>
            <input 
              type="text" 
              name="username" 
              placeholder="Nhập tên của bạn" 
              value={formData.username}
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="contact-type-selector">
            <button 
              type="button" 
              className={inputMode === 'phone' ? 'active' : ''} 
              onClick={() => { setInputMode('phone'); setFormError(''); }}
            >
              Số điện thoại
            </button>
            <button 
              type="button" 
              className={inputMode === 'email' ? 'active' : ''} 
              onClick={() => { setInputMode('email'); setFormError(''); }}
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
                  value={formData.phone}
                  onChange={(val) => setFormData({...formData, phone: val || ''})}
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
                  value={formData.email}
                  onChange={handleInputChange} 
                  required 
                />
              </>
            )}
          </div>

          <div className="form-group">
            <label>Mật khẩu (Tối thiểu 8 ký tự)</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleInputChange} 
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

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword" 
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleInputChange} 
                required 
              />
              <button 
                type="button" 
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="captcha-section">
            <label>Xác thực: <strong>{captcha.num1} + {captcha.num2} = ?</strong></label>
            <div className="captcha-input-wrapper">
              <input 
                type="number" 
                value={captcha.userAnswer} 
                onChange={(e) => setCaptcha({...captcha, userAnswer: e.target.value})} 
                required 
              />
              <button type="button" className="refresh-btn" onClick={generateCaptcha}>🔄</button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
          </button>
        </form>
        
        <div className="auth-footer">
          <div className="footer-item">
            Đã có tài khoản? &nbsp;
            {/* UNIFIED: Changed from button to a text link style */}
            <span className="blue-link-text" onClick={() => navigate('/login')}>Đăng nhập ngay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;