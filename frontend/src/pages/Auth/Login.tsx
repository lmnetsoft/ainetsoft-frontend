import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import './Auth.css';
import { loginUser, getUserProfile } from '../../services/authService'; 
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Capture parameters
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect') || location.state?.from?.pathname || '/';
    const isSessionUpdate = searchParams.get('message') === 'session_updated';

    // 2. STATE: This is the key to preventing the "pop-up" flash
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
    const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
    const [error, setError] = useState(location.state?.error || '');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [loginData, setLoginData] = useState({
        email: '',
        phone: '',
        password: ''
    });

    /**
     * SILENT AUTH GUARD:
     * This logic runs before the user sees anything.
     */
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        const isAuth = localStorage.getItem('isAuthenticated') === 'true';

        // Case A: User is already logged in and it's NOT a session refresh
        if (isAuth && token && !isSessionUpdate) {
            navigate(redirectPath, { replace: true });
        } 
        // Case B: User needs to see the login screen
        else {
            if (isSessionUpdate) {
                setSuccessMessage("Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại để cập nhật.");
            }
            // NOW we stop the "loading" and show the static login form
            setCheckingAuth(false);
        }
    }, [navigate, redirectPath, isSessionUpdate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    const handleFacebookLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/facebook';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

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

            const userData = await loginUser(payload);
            localStorage.setItem('isAuthenticated', 'true');
            
            // Sync profile roles
            await getUserProfile();

            navigate(redirectPath, { replace: true });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER CONTROL: Prevents the "flash" ---
    if (checkingAuth) {
        return (
            <div className="auth-page-loading">
                {/* You can put a logo or a spinner here */}
                <div className="spinner"></div>
            </div>
        );
    }

    // --- ONLY RENDERS IF AUTH CHECK IS FINISHED ---
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
                        <div className="password-input-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"} 
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

                <div className="social-divider">
                    <span>Hoặc đăng nhập bằng</span>
                </div>

                <div className="social-login-group">
                    <button type="button" className="social-btn google" onClick={handleGoogleLogin}>
                        <FaGoogle /> Google
                    </button>
                    <button type="button" className="social-btn facebook" onClick={handleFacebookLogin}>
                        <FaFacebook /> Facebook
                    </button>
                </div>

                <div className="auth-footer">
                    <div className="footer-item">
                        Chưa có tài khoản? &nbsp; 
                        <button className="link-btn" onClick={() => navigate('/register')}>Đăng ký ngay</button>
                    </div>
                    <div className="footer-item" style={{ marginTop: '10px' }}>
                        <button className="link-btn" onClick={() => navigate('/forgot-password')}>Quên mật khẩu?</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;