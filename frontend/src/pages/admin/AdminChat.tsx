import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import ChatPage from '../Chat/ChatPage'; 
import { 
  FaInbox, FaReply, FaSearch, FaSyncAlt, FaVolumeUp, 
  FaVolumeMute, FaClock, FaBolt, FaStickyNote, 
  FaSave, FaCheckCircle, FaPlus, FaUserSecret, FaTimes
} from 'react-icons/fa';
import { useChat } from '../../context/ChatContext';
import './AdminChat.css'; 

interface Conversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessageAt: string;
  lastMessageContent: string;
  unreadCount: number;
  tags?: string[];
  lastActiveAt: string;
}

const AdminChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipientId } = useParams();
  const { sendMessage, connected, setUnreadCount } = useChat(); 

  const isAdminRoute = location.pathname.startsWith('/admin');
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isCurrentUserAdmin = Array.isArray(roles) && (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'));
  
  // Lấy chính xác Email của bản thân
  const myId = isCurrentUserAdmin ? 'admin' : (localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || 'unknown');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  
  const [note, setNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(isAdminRoute); 
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const allAvailableTags = ['VIP', 'Blacklist', 'New', 'Customer'];
  const quickReplies = [
    "Chào bạn! Shop có thể giúp gì cho bạn ạ?",
    "Sản phẩm này hiện đang còn hàng, bạn có muốn đặt ngay không?",
    "Đơn hàng của bạn đang được xử lý và sẽ giao trong 2-3 ngày tới.",
    "Bạn vui lòng cung cấp mã đơn hàng để mình kiểm tra nhé.",
    "Cảm ơn bạn đã quan tâm! Chúc bạn một ngày tốt lành."
    
  ];

  useLayoutEffect(() => {
    const chatContainer = document.querySelector('.chat-content-embedded');
    if (chatContainer) chatContainer.scrollTop = 0;
  }, [recipientId]);

  const getDisplayIdentity = (conv: Conversation) => {
    if (conv.userId.startsWith('visitor_')) {
      const shortId = conv.userId.split('_')[1] || 'Guest';
      return { name: `Khách vãng lai (${shortId})`, isVisitor: true };
    }
    return { name: conv.userName || conv.userId, isVisitor: false };
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '...';
    const past = new Date(dateString);
    const diff = Math.floor((new Date().getTime() - past.getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
    return past.toLocaleDateString('vi-VN');
  };

  const fetchConversations = async (query = '') => {
    try {
      setLoading(true);
      // 🚀 CHUYỂN MẠCH THÔNG MINH: Admin gọi /admin/conversations, Seller gọi /conversations
      const endpoint = isAdminRoute ? '/chat/admin/conversations' : '/chat/conversations';
      const res = await api.get(`${endpoint}?search=${encodeURIComponent(query)}`);
      setConversations(res.data);
      const totalUnread = res.data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (recipientId) {
      const initChat = async () => {
        try {
          // Gửi đúng ID của mình để đánh dấu đã đọc
          await api.post(`/chat/read/${recipientId}/${myId}`);
          setConversations(prev => prev.map(c => c.userId === recipientId ? { ...c, unreadCount: 0 } : c));
          if (isAdminRoute) {
            const noteRes = await api.get(`/chat/admin/notes/${recipientId}`);
            setNote(noteRes.data.content || '');
          }
        } catch (err) { console.error(err); }
      };
      initChat();
    }
  }, [recipientId, isAdminRoute, myId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchConversations(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleToggleTag = async (tag: string) => {
    if (!recipientId || !isAdminRoute) return;
    try {
      const res = await api.post(`/chat/admin/tags/toggle`, { userId: recipientId, tag });
      setConversations(prev => prev.map(c => c.userId === recipientId ? { ...c, tags: res.data.tags } : c));
    } catch (err: any) { alert(err.response?.data?.message || "Lỗi cập nhật tag"); }
  };

  const handleSaveNote = async () => {
    if (!recipientId || !isAdminRoute) return;
    setSaveStatus('saving');
    try {
      await api.post(`/chat/admin/notes`, { userId: recipientId, content: note });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) { 
      setSaveStatus('idle'); 
      alert(err.response?.data?.message || "Không thể lưu ghi chú");
    }
  };

  const currentConv = conversations.find(c => c.userId === recipientId);

  return (
    <div className="admin-chat-layout">
      <div className="admin-chat-header">
        <h1><FaInbox /> {isAdminRoute ? 'TRUNG TÂM HỖ TRỢ KHÁCH HÀNG' : 'QUẢN LÝ TIN NHẮN SHOP'}</h1>
      </div>

      <div className="admin-chat-content-box">
        <div className="admin-chat-top-actions">
           <div className="support-status-info">
             {recipientId ? (
                <div className="supporting-label">
                  Đang chat với: <strong>{currentConv ? getDisplayIdentity(currentConv).name : recipientId}</strong>
                </div>
             ) : (
                <p>Quản lý và phản hồi các yêu cầu từ người dùng.</p>
             )}
           </div>

           <div className="header-button-group">
              <button className="refresh-btn" onClick={() => fetchConversations(searchTerm)}>
                <FaSyncAlt /> <span>Làm mới</span>
              </button>
              
              {recipientId && (
                <>
                  {isAdminRoute && (
                    <button className={`note-toggle-btn ${isNoteOpen ? 'active' : ''}`} onClick={() => setIsNoteOpen(!isNoteOpen)}>
                      <FaStickyNote /> {isNoteOpen ? 'Đóng Ghi chú' : 'Mở Ghi chú'}
                    </button>
                  )}
                  <button className={`quick-reply-toggle ${showQuickReplies ? 'active' : ''}`} onClick={() => setShowQuickReplies(!showQuickReplies)}>
                    <FaBolt /> Trả lời nhanh
                  </button>
                  <button className="close-chat-btn" onClick={() => navigate(isAdminRoute ? '/admin/chat' : '/seller/chat')}>
                    <FaTimes /> Đóng
                  </button>
                </>
              )}
           </div>
        </div>

        <div className={`admin-chat-main-grid ${(isNoteOpen && isAdminRoute && recipientId) ? 'with-notes' : ''}`}>
          {/* COLUMN 1: SIDEBAR */}
          <div className="admin-inbox-sidebar">
            <div className="search-bar-wrapper">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Tìm tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="conversations-list">
              {loading ? (
                <div className="loading-state">Đang tải...</div>
              ) : conversations.length === 0 ? (
                <div className="loading-state" style={{fontSize: '0.9rem', color: '#a4b0be'}}>Chưa có tin nhắn nào.</div>
              ) : conversations.map((conv) => {
                const identity = getDisplayIdentity(conv);
                const isActive = recipientId === conv.userId;
                return (
                  <div key={conv.userId} className={`admin-conv-item ${isActive ? 'is-active' : ''}`} onClick={() => navigate(`${isAdminRoute ? '/admin/chat' : '/seller/chat'}/${conv.userId}`)}>
                    <div className="user-avatar-circle">
                      {conv.userId.startsWith('visitor_') ? <FaUserSecret /> : (conv.userAvatar ? <img src={conv.userAvatar} className="user-item-photo" alt="" /> : identity.name.charAt(0).toUpperCase())}
                      {conv.unreadCount > 0 && <span className="unread-dot">{conv.unreadCount}</span>}
                    </div>
                    <div className="conv-details">
                      <div className="conv-name-row">
                        <span className="conv-user-id">{identity.name}</span>
                        <span className="conv-time">{formatTimeAgo(conv.lastActiveAt)}</span>
                      </div>
                      {isAdminRoute && conv.tags && conv.tags.length > 0 && (
                        <div className="sidebar-tag-container">
                          {conv.tags.map(tag => (
                            <span key={tag} className={`sidebar-tag-pill tag-${tag.toLowerCase()}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="conv-preview">{conv.lastMessageContent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: CHAT AREA */}
          <div className="admin-chat-view-area">
            {recipientId ? (
              <div className="chat-window-main">
                <div className="chat-content-embedded">
                  {showQuickReplies && (
                    <div className="quick-reply-drawer">
                      {quickReplies.map((reply, i) => (
                        <button key={i} onClick={() => sendMessage({ senderId: myId, recipientId, content: reply, type: 'TEXT' })} className="quick-reply-item">
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                  <ChatPage />
                </div>
              </div>
            ) : (
              <div className="admin-chat-placeholder">
                <FaInbox size={60} style={{ opacity: 0.05, marginBottom: '20px' }} />
                <h3>Hộp thư hỗ trợ trực tuyến</h3>
                <p>Chọn một khách hàng ở danh sách bên trái để bắt đầu chat.</p>
              </div>
            )}
          </div>

          {/* COLUMN 3: NOTES PANEL */}
          {isNoteOpen && isAdminRoute && recipientId && (
            <div className="admin-internal-notes">
              <div className="notes-header">
                <h3><FaStickyNote /> GHI CHÚ & NHÃN</h3>
              </div>
              <div className="notes-section-content">
                <div className="section-label">NHÃN PHÂN LOẠI</div>
                <div className="tag-edit-row">
                  {allAvailableTags.map(tag => {
                    const hasTag = currentConv?.tags?.includes(tag);
                    return (
                      <button key={tag} className={`tag-chip-btn ${hasTag ? 'active' : ''}`} onClick={() => handleToggleTag(tag)}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <div className="note-divider"></div>
                <div className="section-label">GHI CHÚ CHI TIẾT</div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhập ghi chú quan trọng về khách hàng này..." />
                <button className={`save-note-btn ${saveStatus}`} onClick={handleSaveNote}>
                  {saveStatus === 'saved' ? 'ĐÃ LƯU THÀNH CÔNG' : 'LƯU LẠI GHI CHÚ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;