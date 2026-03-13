import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserProfile } from '../../services/authService';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Used to read the URL query parameters from the backend

    useEffect(() => {
        const finalizeLogin = async () => {
            try {
                // 1. Extract the JWT token from the URL sent by the backend
                const params = new URLSearchParams(location.search);
                const token = params.get('token');

                if (!token) {
                    throw new Error("Không tìm thấy mã xác thực (Token missing)");
                }

                // 2. CRITICAL: Save the token to localStorage immediately
                // We use selective removeItem instead of clear() to protect visitor IDs
                localStorage.setItem('jwt_token', token);
                localStorage.setItem('isAuthenticated', 'true');

                // 3. Trigger backend profile fetch to sync local state (Name, Avatar, Roles)
                const profile = await getUserProfile();
                
                if (profile && (profile.fullName || profile.email)) {
                    // Success: Redirect to Home
                    navigate('/', { replace: true });
                } else {
                    throw new Error("Dữ liệu hồ sơ không hợp lệ");
                }
            } catch (error: any) {
                console.error("OAuth2 Sync Error:", error);
                
                // Fail-safe: Only remove auth data, leave other settings (like visitor IDs) alone
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('isAuthenticated');
                
                navigate('/login', { 
                    replace: true, 
                    state: { error: error.message || "Xác thực tài khoản thất bại. Vui lòng thử lại." } 
                });
            }
        };

        finalizeLogin();
    }, [navigate, location]);

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center', padding: '60px' }}>
                <div className="loading-spinner"></div>
                <h3 style={{ marginTop: '20px' }}>Đang kết nối...</h3>
                <p className="auth-subtitle">Chúng tôi đang đồng bộ hóa tài khoản của bạn</p>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;