import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, FaCheckDouble, FaExclamationCircle, FaShoppingBag, 
  FaInfoCircle, FaStore, FaTrashAlt, FaEllipsisV 
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../../services/notificationService';
import { useNotification } from '../../context/NotificationContext';
import { toast } from 'react-hot-toast';
import './NotificationPage.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshNotificationCount } = useNotification();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getMyNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load notifications", error);
      toast.error("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    document.title = "Thông báo của tôi | AiNetsoft";
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      refreshNotificationCount();
    } catch (error) {
      console.error("Mark read failed", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshNotificationCount();
      toast.success("Đã đánh dấu đọc tất cả.");
    } catch (error) {
      toast.error("Thao tác thất bại.");
    }
  };

  /**
   * 🛠️ FIXED NAVIGATION LOGIC:
   * Maps each notification type to its logical destination.
   */
  const handleNotificationClick = (noti: Notification) => {
    // 1. Mark as read first
    if (!noti.isRead) {
      handleMarkRead(noti.id);
    }

    // 2. Route based on Type
    switch (noti.type) {
      case 'SYSTEM_WARNING':
        // For "Email không hợp lệ" -> Go to Profile to fix it
        navigate('/user/profile');
        break;
      
      case 'SELLER_APPROVAL':
        // For "Nâng cấp Shop thành công" -> Go to Seller Dashboard
        navigate('/seller/dashboard');
        break;

      case 'SELLER_REJECTION':
        // For "Hồ sơ bị từ chối" -> Go back to Register to see why
        navigate('/seller/register');
        break;

      case 'ORDER':
        // For Order updates -> Go to the specific Purchase Detail
        if (noti.relatedId) {
          navigate(`/user/purchase/${noti.relatedId}`);
        } else {
          navigate('/user/purchase');
        }
        break;

      case 'SYSTEM':
      default:
        // Do nothing or stay on page for generic system info
        break;
    }
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case 'ORDER': return 'order';
      case 'SELLER_APPROVAL': return 'seller';
      case 'SYSTEM_WARNING': return 'warning';
      default: return 'system';
    }
  };

  return (
    <div className="notification-layout">
      <div className="container notification-container">
        <AccountSidebar />
        
        <main className="notification-main">
          <div className="noti-header">
            <div className="noti-header-left">
              <h3>Thông báo mới nhận</h3>
              <p>Cập nhật trạng thái đơn hàng và hệ thống</p>
            </div>
            {notifications.some(n => !n.isRead) && (
              <button className="btn-mark-all" onClick={handleMarkAllRead}>
                <FaCheckDouble /> Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          <div className="noti-list">
            {loading ? (
              <div className="noti-loading-box">
                <div className="spinner"></div>
                <p>Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="noti-empty">
                <FaBell className="empty-icon" />
                <p>Bạn chưa có thông báo nào.</p>
                <button className="btn-ainetsoft-lite" onClick={() => navigate('/')}>
                  Quay lại trang chủ
                </button>
              </div>
            ) : (
              notifications.map((noti) => (
                <div 
                  key={noti.id} 
                  className={`noti-item ${noti.isRead ? 'read' : 'unread'} ${noti.type === 'SYSTEM_WARNING' ? 'critical' : ''}`}
                  onClick={() => handleNotificationClick(noti)}
                >
                  <div className="noti-icon-box">
                    <FaExclamationCircle className={`type-icon ${getIconClass(noti.type)}`} />
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