import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, FaBox, FaCheckCircle, FaExclamationCircle, 
  FaStore, FaTrashAlt, FaEnvelopeOpen 
} from 'react-icons/fa';
import api from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './NotificationPage.css';

// Base URL for image resolution
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // ORDER, SYSTEM, PROMOTION, SELLER_APPROVAL
  relatedId: string;
  thumbnailUrl?: string; // NEW: Optional icon/product image
  isRead: boolean;
  createdAt: string;
}

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  /**
   * BITNAMILEGACY IMAGE FIX: Resolves relative paths to full server URLs.
   */
  const formatMediaUrl = (url?: string) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      // Don't show toast if it's a 401 (interceptor handles that)
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    document.title = "Thông báo của tôi | AiNetsoft";
  }, []);

  const handleMarkAsRead = async (id: string, type: string, relatedId: string) => {
    try {
      // Update local state immediately for a responsive feel
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      
      await api.put(`/notifications/${id}/read`);

      // SMART NAVIGATION
      if (type === 'ORDER' && relatedId) {
        navigate(`/user/order/${relatedId}`);
      } else if (type === 'SELLER_APPROVAL') {
        navigate('/seller/dashboard');
      } else if (type === 'PROMOTION' && relatedId) {
        navigate(`/product/${relatedId}`);
      }
    } catch (err) {
      console.error("Failed to mark read");
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic Update
    const previousState = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await api.put('/notifications/read-all');
      setToastMessage("Đã đánh dấu tất cả là đã đọc.");
      setShowToast(true);
    } catch (err) {
      // Rollback if server fails
      setNotifications(previousState);
      setToastMessage("Lỗi khi cập nhật trạng thái.");
      setShowToast(true);
    }
  };

  const getIcon = (noti: Notification) => {
    // If backend provides a specific image (like a product thumbnail), show it
    if (noti.thumbnailUrl) {
        return (
            <img 
                src={formatMediaUrl(noti.thumbnailUrl)!} 
                alt="noti-thumb" 
                className="noti-thumbnail"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
        );
    }

    switch (noti.type) {
      case 'ORDER': return <FaBox className="type-icon order" />;
      case 'SELLER_APPROVAL': return <FaStore className="type-icon seller" />;
      case 'SYSTEM': return <FaExclamationCircle className="type-icon system" />;
      default: return <FaBell className="type-icon" />;
    }
  };

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="notification-main">
          <div className="noti-header">
            <h3>Thông báo mới nhận</h3>
            {notifications.some(n => !n.isRead) && (
              <button className="btn-mark-all" onClick={handleMarkAllRead}>
                <FaEnvelopeOpen /> Đánh dấu tất cả là đã đọc
              </button>
            )}
          </div>

          <div className="noti-list">
            {loading ? (
              <div className="noti-loading-wrapper">
                <div className="loading-spinner"></div>
                <p>Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="noti-empty">
                <FaBell className="empty-icon" />
                <p>Bạn chưa có thông báo nào.</p>
                <button className="go-home-btn" onClick={() => navigate('/')}>Quay lại trang chủ</button>
              </div>
            ) : (
              notifications.map(noti => (
                <div 
                  key={noti.id} 
                  className={`noti-item ${!noti.isRead ? 'unread' : ''}`}
                  onClick={() => handleMarkAsRead(noti.id, noti.type, noti.relatedId)}
                >
                  <div className="noti-icon-box">
                    {getIcon(noti)}
                  </div>
                  <div className="noti-content">
                    <h4 className="noti-title">{noti.title}</h4>
                    <p className="noti-message">{noti.message}</p>
                    <span className="noti-time">
                      {noti.createdAt ? new Date(noti.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                    </span>
                  </div>
                  {!noti.isRead && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationPage;