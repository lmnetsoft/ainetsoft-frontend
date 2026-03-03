import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './Auth.css';
import { loginUser, getUserProfile } from '../../services/authService';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [successMessage] = useState(location.state?.successMessage || '');
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  /**
   * FIXED LOGIN FLOW:
   * 1. loginUser: Authenticates and sets the session cookie.
   * 2. getUserProfile: Fetches the avatar immediately while still on the Login page.
   * 3. Navigate: Move to Home only when localStorage is fully populated.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (inputMode === 'phone') {
      if (!loginData.phone || !isValidPhoneNumber(loginData.phone)) {
        setError('Số điện thoại không hợp lệ!');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        contactInfo: inputMode === 'phone' ? loginData.phone : loginData.email,
        password: loginData.password
      };

      // Step 1: Login creates the JSESSIONID session
      await loginUser(payload);

      // Step 2: Immediately fetch full profile to get the avatar URL
      // This function MUST dispatch the 'profileUpdate' event as we discussed.
      await getUserProfile();

      // Step 3: Navigate after profile and avatar are synced
      navigate('/');

    } catch (err: any) {
      // Handles [object Object] by using the standardized error message from service
      setError(err?.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Đăng Nhập</h2>
        <p className="auth-subtitle">Chào mừng bạn quay lại với AiNetsoft</p>

        {successMessage && <div className="success-alert">{successMessage}</div>}
        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="contact-type-selector">
            <button
              type="button"
              className={inputMode === 'phone' ? 'active' : ''}
              onClick={() => setInputMode('phone')}
            >
              Số điện thoại
            </button>
            <button
              type="button"
              className={inputMode === 'email' ? 'active' : ''}
              onClick={() => setInputMode('email')}
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
                  onChange={(val) =>
                    setLoginData({ ...loginData, phone: val || '' })
                  }
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                onChange={handleInputChange}
                required
                className="password-input"
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
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;