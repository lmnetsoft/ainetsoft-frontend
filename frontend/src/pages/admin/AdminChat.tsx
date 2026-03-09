import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { FaUserCircle, FaInbox, FaReply } from 'react-icons/fa';
import '../Chat/ChatPage.css'; 

const AdminChat = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/chat/admin/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error("Lỗi tải danh sách hội thoại admin.");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
    document.title = "Quản lý Chat | Admin";
  }, []);

  return (
    <div className="profile-wrapper">
      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="profile-main-content">
          <div className="content-header">
            <h1><FaInbox /> Trung tâm Hỗ trợ Admin</h1>
            <p>Quản lý và phản hồi tất cả các yêu cầu từ khách hàng và người bán.</p>
          </div>
          
          <hr className="divider" />

          <div className="admin-chat-layout">
            {loading ? (
              <div className="loading-placeholder">Đang tải danh sách hội thoại...</div>
            ) : conversations.length === 0 ? (
              <div className="empty-chat-state">
                <FaInbox className="empty-icon" />
                <p>Hiện không có tin nhắn hỗ trợ nào cần xử lý.</p>
              </div>
            ) : (
              <div className="admin-conversation-grid">
                {conversations.map((userId) => (
                  <div 
                    key={userId} 
                    className="admin-conv-card"
                    onClick={() => navigate(`/chat/${userId}`)}
                  >
                    <div className="user-info-flex">
                      <FaUserCircle className="user-icon-placeholder" />
                      <div className="user-meta">
                        <span className="user-id-text">{userId}</span>
                        <span className="status-tag">Yêu cầu hỗ trợ</span>
                      </div>
                    </div>
                    <button className="reply-btn">
                      <FaReply /> Trả lời
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminChat;