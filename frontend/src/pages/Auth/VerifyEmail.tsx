import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { FaCheckCircle, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const token = searchParams.get('token');
    
    // 🚀 LOCK: Prevents React Strict Mode from calling the API twice
    const hasCalled = useRef(false);

    useEffect(() => {
        const verify = async () => {
            // If already called, stop here
            if (hasCalled.current) return;
            hasCalled.current = true;

            if (!token) {
                setStatus('error');
                setMessage('Mã xác thực không tìm thấy trong liên kết.');
                return;
            }

            try {
                // Call the public backend endpoint
                const response = await api.get('/auth/verify-email', {
                    params: { token }
                });
                
                setStatus('success');
                setMessage(response.data); 
            } catch (err: any) {
                // Handle the error state
                setStatus('error');
                setMessage(err.response?.data?.message || 'Xác thực thất bại hoặc liên kết đã hết hạn.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="verify-page" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
            <div className="verify-card" style={{ maxWidth: '500px', margin: 'auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                
                {status === 'loading' && (
                    <div className="loading-state">
                        <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #1890ff', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                        <p>Đang xác thực tài khoản của bạn...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="status-content">
                        <FaCheckCircle style={{ fontSize: '70px', color: '#52c41a', marginBottom: '20px' }} />
                        <h2 style={{ color: '#262626', marginBottom: '16px' }}>Kích hoạt thành công!</h2>
                        <p style={{ color: '#8c8c8c', marginBottom: '32px', lineHeight: '1.6' }}>{message}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{ background: '#1890ff', color: 'white', padding: '14px 40px', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            Đăng nhập ngay <FaArrowRight />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="status-content">
                        <FaExclamationTriangle style={{ fontSize: '70px', color: '#ff4d4f', marginBottom: '20px' }} />
                        <h2 style={{ color: '#262626', marginBottom: '16px' }}>Lỗi xác thực</h2>
                        <p style={{ color: '#8c8c8c', marginBottom: '32px', lineHeight: '1.6' }}>{message}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{ background: '#f5f5f5', color: '#595959', padding: '12px 30px', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Quay lại Đăng nhập
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default VerifyEmail;