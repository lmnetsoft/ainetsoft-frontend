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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // ORDER, SYSTEM, PROMOTION, SELLER_APPROVAL
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      setToastMessage("Không thể tải thông báo.");
      setShowToast(true);
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
      await api.put(`/notifications/${id}/read`);
      
      // Update local state to show as read immediately
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

      // SMART NAVIGATION: Navigate based on notification type
      if (type === 'ORDER' && relatedId) {
        navigate(`/user/order/${relatedId}`);
      } else if (type === 'SELLER_APPROVAL') {
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error("Failed to mark read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setToastMessage("Đã đánh dấu tất cả là đã đọc.");
      setShowToast(true);
    } catch (err) {
      setToastMessage("Lỗi khi cập nhật.");
      setShowToast(true);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
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
              <div className="noti-loading">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="noti-empty">
                <FaBell className="empty-icon" />
                <p>Bạn chưa có thông báo nào.</p>
              </div>
            ) : (
              notifications.map(noti => (
                <div 
                  key={noti.id} 
                  className={`noti-item ${!noti.isRead ? 'unread' : ''}`}
                  onClick={() => handleMarkAsRead(noti.id, noti.type, noti.relatedId)}
                >
                  <div className="noti-icon-box">
                    {getIcon(noti.type)}
                  </div>
                  <div className="noti-content">
                    <h4 className="noti-title">{noti.title}</h4>
                    <p className="noti-message">{noti.message}</p>
                    <span className="noti-time">
                      {new Date(noti.createdAt).toLocaleString('vi-VN')}
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