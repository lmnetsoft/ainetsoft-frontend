import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserProfile } from '../../services/authService';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Added to read the URL query parameters

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
                // This allows the getUserProfile() call below to use the token in its header
                localStorage.setItem('jwt_token', token);
                localStorage.setItem('isAuthenticated', 'true');

                // 3. Trigger backend profile fetch to sync local state (Name, Avatar, Roles)
                const profile = await getUserProfile();
                
                if (profile && profile.fullName) {
                    // Success: Redirect to Home
                    navigate('/', { replace: true });
                } else {
                    throw new Error("Dữ liệu hồ sơ không hợp lệ");
                }
            } catch (error: any) {
                console.error("OAuth2 Sync Error:", error);
                
                // Clear state if something goes wrong to prevent "Session Expired" loops
                localStorage.clear();
                
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