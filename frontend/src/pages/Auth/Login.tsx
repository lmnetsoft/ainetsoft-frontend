import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import './Auth.css';
// 🚀 UPDATED: Added sendPhoneOtp and verifyPhoneOtp
import { loginUser, getUserProfile, sendPhoneOtp, verifyPhoneOtp } from '../../services/authService'; 
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Ensure you have toast for feedback

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect') || location.state?.from?.pathname || '/';
    const isSessionUpdate = searchParams.get('message') === 'session_updated';

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
    const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
    
    /* -----------------------------------------------------------
     * 🚀 NEW: SMS OTP States
     * ----------------------------------------------------------- */
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [countdown, setCountdown] = useState(0);

    const [error, setError] = useState(location.state?.error || '');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [loginData, setLoginData] = useState({
        email: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        const isAuth = localStorage.getItem('isAuthenticated') === 'true';

        if (isAuth && token && !isSessionUpdate) {
            navigate(redirectPath, { replace: true });
        } 
        else {
            if (isSessionUpdate) {
                setSuccessMessage("Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại để cập nhật.");
            }
            setCheckingAuth(false);
        }
    }, [navigate, redirectPath, isSessionUpdate]);

    /* 🚀 NEW: Timer logic for Resend OTP */
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    const handleFacebookLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/facebook';
    };

    /* -----------------------------------------------------------
     * 🚀 NEW: SMS OTP Handlers
     * ----------------------------------------------------------- */
    const handleSendOtp = async () => {
        if (!loginData.phone || !isValidPhoneNumber(loginData.phone)) {
            setError("Số điện thoại không hợp lệ!");
            return;
        }

        setLoading(true);
        setError('');
        try {
            await sendPhoneOtp(loginData.phone);
            setOtpSent(true);
            setCountdown(60); // 1 minute cooldown
            setSuccessMessage("Mã OTP đã được gửi!");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        // Validation for Phone format
        if (inputMode === 'phone') {
            if (!loginData.phone || !isValidPhoneNumber(loginData.phone)) {
                setError("Số điện thoại không hợp lệ!");
                setLoading(false);
                return;
            }
        }

        try {
            /* 🚀 Logic Branch: OTP Verification vs Password Login */
            if (inputMode === 'phone' && loginMethod === 'otp') {
                if (!otpCode) {
                    setError("Vui lòng nhập mã OTP!");
                    setLoading(false);
                    return;
                }
                const result = await verifyPhoneOtp(loginData.phone, otpCode);
                // Note: If your backend returns a token in verifyPhoneOtp, handle it here.
                // For now, we follow your provided backend logic which returns a message.
                setSuccessMessage(result.message || "Xác thực thành công!");
                
                // If login was successful via OTP
                await getUserProfile();
                navigate(redirectPath, { replace: true });
            } 
            else {
                // Original Password Login Logic (Kept Intact)
                const payload = {
                    contactInfo: inputMode === 'phone' ? loginData.phone : loginData.email,
                    password: loginData.password
                };

                const userData = await loginUser(payload);
                localStorage.setItem('isAuthenticated', 'true');
                await getUserProfile();
                navigate(redirectPath, { replace: true });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="auth-page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

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
                            onClick={() => { setInputMode('phone'); setOtpSent(false); }}
                        >
                            Số điện thoại
                        </button>
                        <button 
                            type="button" 
                            className={inputMode === 'email' ? 'active' : ''} 
                            onClick={() => { setInputMode('email'); setLoginMethod('password'); }}
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
                                    disabled={otpSent}
                                />
                                
                                {/* 🚀 NEW: Login Method Toggle */}
                                <div className="method-toggle" style={{ marginTop: '10px' }}>
                                    <button 
                                        type="button" 
                                        className="link-btn"
                                        onClick={() => {
                                            setLoginMethod(loginMethod === 'password' ? 'otp' : 'password');
                                            setOtpSent(false);
                                        }}
                                    >
                                        {loginMethod === 'password' ? 'Đăng nhập bằng mã OTP' : 'Đăng nhập bằng mật khẩu'}
                                    </button>
                                </div>
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

                    {/* 🚀 Conditional Field: Password vs OTP Code */}
                    {loginMethod === 'password' || inputMode === 'email' ? (
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
                    ) : (
                        <div className="form-group">
                            <label>Mã xác thực OTP</label>
                            {!otpSent ? (
                                <button 
                                    type="button" 
                                    className="auth-submit-btn secondary" 
                                    onClick={handleSendOtp}
                                    disabled={loading || !loginData.phone}
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                </button>
                            ) : (
                                <>
                                    <input 
                                        type="text" 
                                        placeholder="Nhập 6 chữ số" 
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        className="otp-input"
                                        style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '20px' }}
                                    />
                                    <p style={{ fontSize: '12px', marginTop: '5px' }}>
                                        {countdown > 0 ? (
                                            `Gửi lại mã sau ${countdown}s`
                                        ) : (
                                            <button type="button" className="link-btn" onClick={handleSendOtp}>Gửi lại mã</button>
                                        )}
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="auth-submit-btn" 
                        disabled={loading || (loginMethod === 'otp' && !otpSent)}
                    >
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