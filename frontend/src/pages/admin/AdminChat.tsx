import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import ChatPage from '../Chat/ChatPage'; 
import { 
  FaInbox, FaReply, FaSearch, FaSyncAlt, FaVolumeUp, 
  FaVolumeMute, FaClock, FaBolt, FaStickyNote, 
  FaSave, FaCheckCircle, FaPlus, FaUserSecret, FaTimes
} from 'react-icons/fa';
import { useChat } from '../../context/ChatContext';

import alarmSound from '../../assets/sounds/Alarm01.wav';
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
  const { recipientId } = useParams();
  const { sendMessage, connected, setUnreadCount } = useChat(); 

  // --- States ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  
  const [note, setNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(true); 
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const allAvailableTags = ['VIP', 'Blacklist', 'New', 'Customer'];
  const quickReplies = [
    "Chào bạn! AiNetsoft có thể giúp gì cho bạn ạ?",
    "Sản phẩm này hiện đang còn hàng, bạn có muốn đặt ngay không?",
    "Đơn hàng của bạn đang được xử lý và sẽ giao trong 2-3 ngày tới.",
    "Bạn vui lòng cung cấp mã đơn hàng để mình kiểm tra nhé.",
    "Cảm ơn bạn đã quan tâm! Chúc bạn một ngày tốt lành."
  ];

  // 🚀 STABILITY FIX: Prevents Sidebar Vibration and Navigation Jumps
  useLayoutEffect(() => {
    const chatContainer = document.querySelector('.chat-content-embedded');
    if (chatContainer) chatContainer.scrollTop = 0;
  }, [recipientId]);

  // --- Identity Helpers ---
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

  // --- Handlers ---
  const fetchConversations = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/chat/admin/conversations?search=${encodeURIComponent(query)}`);
      setConversations(res.data);
      const totalUnread = res.data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (recipientId) {
      const initChat = async () => {
        try {
          await api.post(`/chat/read/${recipientId}/admin`);
          setConversations(prev => prev.map(c => c.userId === recipientId ? { ...c, unreadCount: 0 } : c));
          const noteRes = await api.get(`/chat/admin/notes/${recipientId}`);
          setNote(noteRes.data.content || '');
        } catch (err) { console.error(err); }
      };
      initChat();
    }
  }, [recipientId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchConversations(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * 🚀 APPENDED PRO LOGIC: 
   * Catches the 404 response and displays the friendly message from the backend 
   * if the user does not have an official profile.
   */
  const handleToggleTag = async (tag: string) => {
    if (!recipientId) return;
    try {
      const res = await api.post(`/chat/admin/tags/toggle`, { userId: recipientId, tag });
      setConversations(prev => prev.map(c => c.userId === recipientId ? { ...c, tags: res.data.tags } : c));
    } catch (err: any) { 
      const friendlyMsg = err.response?.data?.message || "Lỗi cập nhật tag";
      alert(friendlyMsg); 
    }
  };

  /**
   * 🚀 APPENDED PRO LOGIC: 
   * Provides informative feedback when attempting to save notes for non-existent users.
   */
  const handleSaveNote = async () => {
    if (!recipientId) return;
    setSaveStatus('saving');
    try {
      await api.post(`/chat/admin/notes`, { userId: recipientId, content: note });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) { 
      setSaveStatus('idle'); 
      const friendlyMsg = err.response?.data?.message || "Không thể lưu ghi chú";
      alert(friendlyMsg);
    }
  };

  const currentConv = conversations.find(c => c.userId === recipientId);

  return (
    <div className="admin-chat-layout">
      <div className="admin-chat-header">
        <h1><FaInbox /> TRUNG TÂM HỖ TRỢ KHÁCH HÀNG</h1>
      </div>

      <div className="admin-chat-content-box">
        <div className="admin-chat-top-actions">
           <div className="support-status-info">
             {recipientId ? (
                <div className="supporting-label">
                  Đang hỗ trợ: <strong>{currentConv ? getDisplayIdentity(currentConv).name : recipientId}</strong>
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
                  <button className={`note-toggle-btn ${isNoteOpen ? 'active' : ''}`} onClick={() => setIsNoteOpen(!isNoteOpen)}>
                    <FaStickyNote /> {isNoteOpen ? 'Đóng Ghi chú' : 'Mở Ghi chú'}
                  </button>
                  <button className={`quick-reply-toggle ${showQuickReplies ? 'active' : ''}`} onClick={() => setShowQuickReplies(!showQuickReplies)}>
                    <FaBolt /> Trả lời nhanh
                  </button>
                  <button className="close-chat-btn" onClick={() => navigate('/admin/chat')}>
                    <FaTimes /> Đóng
                  </button>
                </>
              )}
           </div>
        </div>

        <div className={`admin-chat-main-grid ${isNoteOpen && recipientId ? 'with-notes' : ''}`}>
          {/* COLUMN 1: SIDEBAR */}
          <div className="admin-inbox-sidebar">
            <div className="search-bar-wrapper">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Tìm tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="conversations-list">
              {loading ? (
                <div className="loading-state">Đang tải...</div>
              ) : conversations.map((conv) => {
                const identity = getDisplayIdentity(conv);
                const isActive = recipientId === conv.userId;
                return (
                  <div key={conv.userId} className={`admin-conv-item ${isActive ? 'is-active' : ''}`} onClick={() => navigate(`/admin/chat/${conv.userId}`)}>
                    <div className="user-avatar-circle">
                      {conv.userId.startsWith('visitor_') ? <FaUserSecret /> : (conv.userAvatar ? <img src={conv.userAvatar} className="user-item-photo" alt="" /> : identity.name.charAt(0).toUpperCase())}
                      {conv.unreadCount > 0 && <span className="unread-dot">{conv.unreadCount}</span>}
                    </div>
                    <div className="conv-details">
                      <div className="conv-name-row">
                        <span className="conv-user-id">{identity.name}</span>
                        <span className="conv-time">{formatTimeAgo(conv.lastActiveAt)}</span>
                      </div>

                      {/* 🚀 SUPREME SIDEBAR TAGS: Display tags from DB */}
                      {conv.tags && conv.tags.length > 0 && (
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
                        <button key={i} onClick={() => sendMessage({ senderId: 'admin', recipientId, content: reply, type: 'TEXT' })} className="quick-reply-item">
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
          {isNoteOpen && recipientId && (
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