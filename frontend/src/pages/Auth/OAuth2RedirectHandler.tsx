import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserProfile } from '../../services/authService';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const finalizeLogin = async () => {
            try {
                // 1. Extract the JWT token sent from the backend Success Handler
                const params = new URLSearchParams(location.search);
                const token = params.get('token');

                if (!token) {
                    throw new Error("Không tìm thấy mã xác thực (Token missing)");
                }

                // 2. Save the token immediately so the interceptor can use it
                localStorage.setItem('jwt_token', token);
                localStorage.setItem('isAuthenticated', 'true');

                // 3. 🚀 CRITICAL SYNC: Trigger the profile update event.
                // This tells your Navbar/Header to refresh data *before* we even redirect.
                window.dispatchEvent(new Event('profileUpdate'));

                // 4. Fetch the profile to ensure local state (Facebook Name/Avatar) is fresh
                const profile = await getUserProfile();
                
                if (profile && (profile.fullName || profile.email)) {
                    // Success: Clear the URL and land on Home
                    navigate('/', { replace: true });
                } else {
                    throw new Error("Dữ liệu hồ sơ không hợp lệ");
                }
            } catch (error: any) {
                console.error("OAuth2 Sync Error:", error);
                
                // Fail-safe: Clean up auth data if something went wrong
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('isAuthenticated');
                window.dispatchEvent(new Event('profileUpdate'));
                
                navigate('/login', { 
                    replace: true, 
                    state: { error: error.message || "Xác thực tài khoản thất bại." } 
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
                
                <style>{`
                    .loading-spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #1890ff;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .auth-subtitle { color: #8c8c8c; margin-top: 10px; }
                `}</style>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;