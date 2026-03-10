import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ChatPage from '../Chat/ChatPage'; 
import { FaInbox, FaReply, FaSearch, FaSyncAlt, FaVolumeUp, FaVolumeMute, FaClock } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext';

import alarmSound from '../../assets/sounds/Alarm01.wav';
import './AdminChat.css'; 

interface Conversation {
  userId: string;
  userName: string;
  userAvatar?: string; // NEW: Added support for user photos
  lastMessageAt: string;
  lastMessageContent: string;
  unreadCount: number;
}

const AdminChat = () => {
  const navigate = useNavigate();
  const { recipientId } = useParams();
  const { isMuted, setIsMuted, setUnreadCount } = useChat(); 
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const testAudio = new Audio(alarmSound);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    return past.toLocaleDateString('vi-VN');
  };

  const fetchConversations = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/admin/conversations?search=${encodeURIComponent(query)}`);
      const data = res.data;
      setConversations(data);

      const totalUnread = data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("Lỗi tải hội thoại:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleTestSound = () => {
    testAudio.currentTime = 0;
    testAudio.play().catch(() => alert("Vui lòng click vào trang web trước khi thử chuông!"));
  };

  useEffect(() => {
    document.title = "Quản lý Chat | AiNetsoft";
  }, []);

  return (
    <div className="profile-wrapper">
      <div className="container profile-container admin-chat-layout">
        <AccountSidebar />
        
        <main className="profile-main-content">
          <div className="admin-chat-header">
            <h1><FaInbox /> Trung tâm Hỗ trợ Khách hàng</h1>
          </div>

          <div className="admin-chat-content-box">
            <div className="admin-chat-top-actions">
               <p>Quản lý và phản hồi các yêu cầu từ người dùng hệ thống AiNetsoft.</p>
               <div className="header-actions">
                  <button 
                    className={`mute-toggle-btn ${isMuted ? 'muted' : ''}`} 
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    <span>{isMuted ? "Đã tắt" : "Âm thanh"}</span>
                  </button>

                  <button className="test-sound-btn" onClick={handleTestSound}>Thử chuông</button>

                  <button className="refresh-btn" onClick={() => fetchConversations(searchTerm)}>
                    <FaSyncAlt />
                  </button>
               </div>
            </div>

            <div className="admin-chat-main-grid">
              <div className="admin-inbox-sidebar">
                <div className="search-bar-wrapper">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm User ID hoặc tên..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="conversations-list">
                  {loading ? (
                    <div className="admin-chat-loading">Đang tải...</div>
                  ) : conversations.length === 0 ? (
                    <div className="admin-chat-empty">Không tìm thấy người dùng.</div>
                  ) : (
                    conversations.map((conv) => (
                      <div 
                        key={conv.userId} 
                        className={`admin-conv-item ${recipientId === conv.userId ? 'is-active' : ''}`}
                        onClick={() => navigate(`/admin/chat/${conv.userId}`)}
                      >
                        <div className="user-avatar-circle">
                          {/* SHOW PHOTO IF EXISTS, ELSE SHOW INITIAL */}
                          {conv.userAvatar ? (
                            <img src={conv.userAvatar} alt="" className="user-item-photo" />
                          ) : (
                            (conv.userName || conv.userId).charAt(0).toUpperCase()
                          )}
                          
                          {conv.unreadCount > 0 && (
                            <span className="admin-unread-badge">{conv.unreadCount}</span>
                          )}
                        </div>

                        <div className="conv-details">
                          <div className="conv-top-row">
                            <span className="conv-user-id">{conv.userName || conv.userId}</span>
                            <span className="conv-time">
                              <FaClock size={10} /> {formatTimeAgo(conv.lastMessageAt)}
                            </span>
                          </div>
                          <span className="conv-preview">{conv.lastMessageContent}</span>
                        </div>
                        <FaReply className="reply-arrow" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-chat-view-area">
                {recipientId ? (
                  <div className="admin-active-chat-wrapper">
                    <div className="chat-instructions-bar">
                      <p>Hỗ trợ cho: <strong>{recipientId}</strong></p>
                      <button onClick={() => navigate('/admin/chat')}>Đóng</button>
                    </div>
                    <div className="chat-content-embedded">
                      {/* EMBEDDED CHAT: Uses Nuclear Fix CSS to stay inside this box */}
                      <ChatPage />
                    </div>
                  </div>
                ) : (
                  <div className="admin-chat-placeholder">
                    <FaInbox size={50} style={{ opacity: 0.1, marginBottom: '15px' }} />
                    <h3>Chọn một hội thoại</h3>
                    <p>Tin nhắn mới sẽ xuất hiện ở danh sách bên trái.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminChat;