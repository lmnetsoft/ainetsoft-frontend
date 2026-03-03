import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/authService';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const finalizeLogin = async () => {
            try {
                // This triggers the backend session check and syncs localStorage
                await getUserProfile();
                
                // Redirect to home page after successful sync
                navigate('/', { replace: true });
            } catch (error) {
                console.error("Social login sync failed", error);
                navigate('/login', { state: { error: "Không thể xác thực tài khoản mạng xã hội." } });
            }
        };

        finalizeLogin();
    }, [navigate]);

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center', padding: '50px' }}>
                <div className="loading-spinner"></div>
                <p>Đang xác thực tài khoản...</p>
                <p className="auth-subtitle">Vui lòng chờ trong giây lát</p>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;