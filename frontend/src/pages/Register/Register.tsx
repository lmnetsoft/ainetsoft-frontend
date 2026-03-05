import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import '../Auth/Auth.css'; 
import './Register.css'; 
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

  /**
   * UPDATED: Global-Friendly Phone Validation
   * Matches the "Smart Gatekeeper" logic in the backend.
   */
  const validatePhone = (phone: string) => {
    if (!phone) return false;
    
    // 1. Strip all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    // 2. Identify region
    if (digitsOnly.startsWith('0') || digitsOnly.startsWith('84')) {
        // Normalizing for VN carrier check
        const normalized = digitsOnly.startsWith('84') ? '0' + digitsOnly.slice(2) : digitsOnly;
        const vnRegex = /^(03[2-9]|086|09[6-8]|070|07[6-9]|089|090|093|08[1-5]|088|091|094|052|05[68]|092|059|099)\d{7}$/;
        return vnRegex.test(normalized) && normalized.length === 10;
    }

    // 3. Global Fallback: 7-15 digits for international users
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password.length < 8) {
      setFormError("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(formData.password);
    if (!hasLetter) {
      setFormError("Mật khẩu phải chứa ít nhất một chữ cái!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (inputMode === 'phone') {
        if (!formData.phone || !validatePhone(formData.phone)) {
            setFormError("Số điện thoại không hợp lệ hoặc nhà mạng không được hỗ trợ!");
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
            <label>Tên hiển thị <span className="required-star">*</span></label>
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
                <label>Số điện thoại <span className="required-star">*</span></label>
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
                <label>Địa chỉ Email <span className="required-star">*</span></label>
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
            <label>Mật khẩu <span className="required-star">*</span></label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Tối thiểu 8 ký tự, 1 chữ cái" 
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
            <label>Xác nhận mật khẩu <span className="required-star">*</span></label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword" 
                placeholder="Nhập lại mật khẩu" 
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
            <label>Xác thực: <strong>{captcha.num1} + {captcha.num2} = ?</strong> <span className="required-star">*</span></label>
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
            <span className="auth-link-highlight" onClick={() => navigate('/login')}>
                Đăng nhập ngay
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;