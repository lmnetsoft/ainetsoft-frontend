import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/authService';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const finalizeLogin = async () => {
            try {
                // Trigger backend profile fetch. 
                // Because we are using cookies, the browser automatically sends JSESSIONID.
                const profile = await getUserProfile();
                
                if (profile && profile.fullName) {
                    // Success: Redirect to Home
                    navigate('/', { replace: true });
                } else {
                    throw new Error("Invalid session data");
                }
            } catch (error) {
                console.error("OAuth2 Sync Error:", error);
                localStorage.clear();
                navigate('/login', { 
                    replace: true, 
                    state: { error: "Xác thực tài khoản thất bại. Vui lòng thử lại." } 
                });
            }
        };

        finalizeLogin();
    }, [navigate]);

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