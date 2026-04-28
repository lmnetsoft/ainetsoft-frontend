import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaTimes, FaShieldAlt } from 'react-icons/fa';
import api from '../../services/api';
import ToastNotification from '../Toast/ToastNotification';

const FinancialSecurityGate = ({ children }: { children: React.ReactNode }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const navigate = useNavigate();
  const SESSION_DURATION = 15 * 60 * 1000; // 15 Phút bảo vệ

  useEffect(() => {
    const checkSession = () => {
      const expiry = sessionStorage.getItem('financial_session_expiry');
      if (expiry && parseInt(expiry, 10) > Date.now()) {
        setIsUnlocked(true); 
      } else {
        setIsUnlocked(false); 
      }
    };
    checkSession();
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      
      // 🚀 Hỗ trợ cả Email và Số điện thoại
      const contactInfo = userObj?.email || userObj?.phone || null;

      if (!contactInfo) throw new Error("Lỗi phiên đăng nhập.");

      // Gọi API login để xác thực lại mật khẩu
      await api.post('/auth/login', {
        contactInfo: contactInfo,
        password: password
      });

      // Mở khóa thành công
      sessionStorage.setItem('financial_session_expiry', (Date.now() + SESSION_DURATION).toString());
      setIsUnlocked(true);
      
    } catch (error: any) {
      setToastMessage("Mật khẩu không chính xác. Vui lòng thử lại.");
      setShowToast(true);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Quay lại trang trước đó an toàn
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      
      <div style={{
        background: '#fff', width: '420px', borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
      }}>
        <div style={{
          background: '#f8fafc', padding: '15px 20px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaShieldAlt style={{ color: '#ee4d2d' }} /> Xác minh bảo mật
          </h3>
          <FaTimes style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={handleCancel} />
        </div>

        <form onSubmit={handleUnlock} style={{ padding: '25px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '60px', height: '60px', background: '#fff1f0', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto'
            }}>
              <FaLock style={{ fontSize: '24px', color: '#ee4d2d' }} />
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
              Bạn đang truy cập vào <strong>trang thông tin nhạy cảm</strong>. Vui lòng nhập mật khẩu đăng nhập để tiếp tục.
            </p>
          </div>

          <input 
            type="password" 
            placeholder="Nhập mật khẩu của bạn..." 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1',
              fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleCancel} style={{
              flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '6px',
              color: '#475569', fontWeight: 600, cursor: 'pointer'
            }}>
              Quay lại
            </button>
            <button type="submit" disabled={loading || !password} style={{
              flex: 1, padding: '12px', background: '#ee4d2d', border: 'none', borderRadius: '6px',
              color: '#fff', fontWeight: 600, cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.7 : 1
            }}>
              {loading ? "Đang xác thực..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialSecurityGate;