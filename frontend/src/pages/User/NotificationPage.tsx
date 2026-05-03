import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, FaCheckDouble, FaExclamationCircle, FaRegClock, FaArrowLeft
} from 'react-icons/fa';
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
  
  // 🚀 LẤY THÊM latestNotification TỪ CONTEXT ĐỂ LÀM "TAI NGHE" THỜI GIAN THỰC
  const { refreshNotificationCount, latestNotification } = useNotification();

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
    document.title = "Thông báo hệ thống | AiNetsoft Admin";
  }, []);

  // 🚀 PHÉP MÀU NẰM Ở ĐÂY: TỰ ĐỘNG CHÈN THÔNG BÁO MỚI LÊN ĐẦU DANH SÁCH KHÔNG CẦN F5
  useEffect(() => {
    if (latestNotification) {
        setNotifications(prev => {
            // Tránh chèn trùng lặp nếu API đã lỡ fetch
            if (prev.some(n => n.id === latestNotification.id)) return prev;
            return [latestNotification, ...prev]; 
        });
    }
  }, [latestNotification]);

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

  const handleNotificationClick = (noti: Notification) => {
    if (!noti.isRead) {
      handleMarkRead(noti.id);
    }

    switch (noti.type) {
      case 'WITHDRAWAL':
        navigate('/admin/withdrawals');
        break;
      case 'SYSTEM_WARNING':
        navigate('/user/profile');
        break;
      case 'SELLER_APPROVAL':
        navigate('/seller/dashboard');
        break;
      case 'SELLER_REJECTION':
        navigate('/seller/register');
        break;
      case 'ORDER':
        if (noti.relatedId) {
          // 🚀 BẢN VÁ: Đã sửa 'purchase' thành 'order' để trỏ đúng vào file OrderDetail.tsx
          navigate(`/user/order/${noti.relatedId}`);
        } else {
          navigate('/user/purchase');
        }
        break;
      default:
        break;
    }
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case 'ORDER': return 'order';
      case 'WITHDRAWAL': return 'warning'; 
      case 'SELLER_APPROVAL': return 'seller';
      case 'SYSTEM_WARNING': return 'warning';
      default: return 'system';
    }
  };

  return (
    <div className="admin-withdrawal-container">
      <div className="admin-page-header">
          <h1>THÔNG BÁO HỆ THỐNG</h1>
          <p>Cập nhật trạng thái giao dịch và hoạt động toàn sàn 2026</p>
      </div>

      <main className="notification-content-card">
        <div className="noti-header-elite">
          <div className="noti-header-left">
            <h3>Thông báo mới nhận</h3>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button className="btn-mark-all-elite" onClick={handleMarkAllRead}>
              <FaCheckDouble /> Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>

        <div className="noti-list-elite">
          {loading ? (
            <div className="no-data-msg">
              <div className="spinner"></div>
              <p>Đang kiểm tra thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state-elite">
              <div className="empty-icon-circle">
                <FaBell />
              </div>
              <h3>Bạn chưa có thông báo nào</h3>
              <p>Mọi cập nhật quan trọng về hệ thống sẽ xuất hiện tại đây.</p>
              <button className="btn-confirm-modal" onClick={() => navigate('/')}>
                <FaArrowLeft style={{marginRight: '8px'}} /> Quay lại trang chủ
              </button>
            </div>
          ) : (
            notifications.map((noti) => (
              <div 
                key={noti.id} 
                className={`notification-item-elite ${noti.isRead ? 'read' : 'unread'} ${noti.type === 'WITHDRAWAL' ? 'critical' : ''}`}
                onClick={() => handleNotificationClick(noti)}
              >
                <div className="noti-icon-box">
                  <FaExclamationCircle className={`type-icon ${getIconClass(noti.type)}`} />
                </div>
                
                <div className="noti-text-box">
                  <div className="noti-top-flex">
                    <span className="noti-title-bold">{noti.title}</span>
                    <span className="noti-time-muted">
                      <FaRegClock /> {new Date(noti.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="noti-message-text">{noti.message}</p>
                </div>

                {!noti.isRead && <div className="unread-dot"></div>}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationPage;