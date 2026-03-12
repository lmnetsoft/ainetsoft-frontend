import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ChatPage from '../Chat/ChatPage'; 
import { 
  FaInbox, FaReply, FaSearch, FaSyncAlt, FaVolumeUp, 
  FaVolumeMute, FaClock, FaBolt, FaStickyNote, 
  FaSave, FaCheckCircle, FaPlus, FaUserSecret 
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
  const { sendMessage, connected, isMuted, setIsMuted, setUnreadCount } = useChat(); 

  // --- States ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  
  const [note, setNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const testAudio = new Audio(alarmSound);
  const allAvailableTags = ['VIP', 'Blacklist', 'New', 'Customer'];
  const quickReplies = [
    "Chào bạn! AiNetsoft có thể giúp gì cho bạn ạ?",
    "Sản phẩm này hiện đang còn hàng, bạn có muốn đặt ngay không?",
    "Đơn hàng của bạn đang được xử lý và sẽ giao trong 2-3 ngày tới.",
    "Bạn vui lòng cung cấp mã đơn hàng để mình kiểm tra nhé.",
    "Cảm ơn bạn đã quan tâm! Chúc bạn một ngày tốt lành."
  ];

  // --- IDENTITY HELPERS ---
  const getDisplayIdentity = (conv: Conversation) => {
    if (conv.userId.startsWith('visitor_')) {
      const shortId = conv.userId.split('_')[1] || 'Guest';
      return {
        name: `Khách vãng lai (${shortId})`,
        isVisitor: true,
        avatar: null
      };
    }
    return {
      name: conv.userName || conv.userId,
      isVisitor: false,
      avatar: conv.userAvatar
    };
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '...';
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 84000) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    return past.toLocaleDateString('vi-VN');
  };

  const isOnline = (lastActiveAt: string) => {
    if (!lastActiveAt) return false;
    const activeDate = new Date(lastActiveAt).getTime();
    const now = new Date().getTime();
    return (now - activeDate) / (1000 * 60) < 5;
  };

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <mark key={i} className="search-highlight">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  const getTagClass = (tag: string) => {
    const t = tag.toUpperCase();
    if (t === 'VIP') return 'tag-vip';
    if (t === 'BLACKLIST') return 'tag-danger';
    if (t === 'NEW') return 'tag-success';
    return 'tag-default';
  };

  const userHasTag = (tag: string) => {
    const user = conversations.find(c => c.userId === recipientId);
    return user?.tags?.includes(tag) || false;
  };

  // --- Data Logic ---
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

  const handleSaveNote = async () => {
    if (!recipientId) return;
    setSaveStatus('saving');
    try {
      await api.post(`/chat/admin/notes`, { userId: recipientId, content: note });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch { setSaveStatus('idle'); }
  };

  const handleToggleTag = async (tag: string) => {
    if (!recipientId) return;
    try {
      const res = await api.post(`/chat/admin/tags/toggle`, { userId: recipientId, tag });
      setConversations(prev => prev.map(c => c.userId === recipientId ? { ...c, tags: res.data.tags } : c));
    } catch (err) { alert("Lỗi cập nhật tag"); }
  };

  const handleSendQuickReply = (text: string) => {
    if (!connected || !recipientId) return;
    sendMessage({ senderId: 'admin', recipientId, content: text, type: 'TEXT', timestamp: new Date().toISOString() });
    setShowQuickReplies(false);
  };

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
               <p>Quản lý và phản hồi các yêu cầu từ người dùng và khách vãng lai.</p>
               <div className="header-actions">
                  <button className={`mute-toggle-btn ${isMuted ? 'muted' : ''}`} onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />} <span>{isMuted ? "Đã tắt" : "Âm thanh"}</span>
                  </button>
                  <button className="test-sound-btn" onClick={() => testAudio.play()}>Thử chuông</button>
                  <button className="refresh-btn" onClick={() => fetchConversations(searchTerm)}><FaSyncAlt /></button>
               </div>
            </div>

            <div className="admin-chat-main-grid">
              <div className="admin-inbox-sidebar">
                <div className="search-bar-wrapper">
                  <FaSearch className="search-icon" />
                  <input type="text" placeholder="Tìm ID hoặc tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="conversations-list">
                  {loading ? <div className="admin-chat-loading">Đang tải...</div> : conversations.map((conv) => {
                    const identity = getDisplayIdentity(conv);
                    return (
                      <div key={conv.userId} className={`admin-conv-item ${recipientId === conv.userId ? 'is-active' : ''} ${identity.isVisitor ? 'visitor-item' : ''}`} onClick={() => navigate(`/admin/chat/${conv.userId}`)}>
                        <div className="user-avatar-circle">
                          {identity.isVisitor ? (
                            <div className="visitor-avatar-icon"><FaUserSecret /></div>
                          ) : (
                            conv.userAvatar ? <img src={conv.userAvatar} className="user-item-photo" alt="" /> : (conv.userName || conv.userId).charAt(0).toUpperCase()
                          )}
                          <span className={`status-indicator ${isOnline(conv.lastActiveAt) ? 'online' : 'offline'}`}></span>
                          {conv.unreadCount > 0 && <span className="admin-unread-badge">{conv.unreadCount}</span>}
                        </div>

                        <div className="conv-details">
                          <div className="conv-top-row">
                            <span className="conv-user-id">
                              {getHighlightedText(identity.name, searchTerm)}
                              <div className="tag-container">
                                {identity.isVisitor && <span className="user-pill tag-visitor">GUEST</span>}
                                {conv.tags?.map((tag, idx) => <span key={idx} className={`user-pill ${getTagClass(tag)}`}>{tag}</span>)}
                              </div>
                            </span>
                            <span className="conv-status-text">
                              {isOnline(conv.lastActiveAt) ? <span className="text-online">Online</span> : formatTimeAgo(conv.lastActiveAt)}
                            </span>
                          </div>
                          <span className="conv-preview">{conv.lastMessageContent}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="admin-chat-view-area">
                {recipientId ? (
                  <div className="admin-active-chat-wrapper">
                    <div className="chat-instructions-bar">
                      <p>Hỗ trợ cho: <strong>{getDisplayIdentity(conversations.find(c => c.userId === recipientId) || {userId: recipientId, userName: recipientId} as any).name}</strong></p>
                      <div className="instruction-actions">
                        <button className={`note-toggle-btn ${isNoteOpen ? 'active' : ''}`} onClick={() => setIsNoteOpen(!isNoteOpen)}>
                          <FaStickyNote /> {isNoteOpen ? 'Đóng Note' : 'Note nội bộ'}
                        </button>
                        <button className={`quick-reply-toggle ${showQuickReplies ? 'active' : ''}`} onClick={() => setShowQuickReplies(!showQuickReplies)}>
                          <FaBolt /> Trả lời nhanh
                        </button>
                        <button onClick={() => navigate('/admin/chat')}>Đóng</button>
                      </div>
                    </div>

                    <div className="admin-main-chat-split">
                      <div className="chat-content-embedded">
                        {showQuickReplies && (
                          <div className="quick-reply-drawer">
                            {quickReplies.map((reply, i) => <button key={i} onClick={() => handleSendQuickReply(reply)} className="quick-reply-item">{reply}</button>)}
                          </div>
                        )}
                        <ChatPage />
                      </div>

                      {isNoteOpen && (
                        <div className="admin-internal-notes">
                          <h3><FaStickyNote /> Ghi chú & Nhãn</h3>
                          <div className="manage-tags-section">
                            <div className="tag-edit-row">
                              {allAvailableTags.map(tag => (
                                <button 
                                  key={tag} 
                                  className={`tag-chip-btn ${userHasTag(tag) ? 'active ' + getTagClass(tag) : ''}`} 
                                  onClick={() => handleToggleTag(tag)}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                          <hr className="note-divider" />
                          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú khách hàng..." />
                          <button className={`save-note-btn ${saveStatus}`} onClick={handleSaveNote}>
                            {saveStatus === 'saved' ? 'Đã lưu' : 'Lưu Note'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="admin-chat-placeholder">
                    <FaInbox size={50} style={{ opacity: 0.1, marginBottom: '15px' }} />
                    <h3>Chọn một hội thoại để bắt đầu</h3>
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