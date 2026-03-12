import React, { useEffect, useState } from 'react';
import { FaComments } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext'; 
import './ChatBubble.css';

const ChatBubble = () => {
  const { unreadCount, connected, isChatOpen, setIsChatOpen, clearUnread } = useChat();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jwt_token'));

  const checkUserStatus = () => {
    const token = localStorage.getItem('jwt_token');
    setIsAuthenticated(!!token);
    
    try {
      const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      setIsAdmin(Array.isArray(storedRoles) && (storedRoles.includes('ADMIN') || storedRoles.includes('ROLE_ADMIN')));
    } catch (err) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
    window.addEventListener('profileUpdate', checkUserStatus);
    window.addEventListener('storage', checkUserStatus);
    return () => {
      window.removeEventListener('profileUpdate', checkUserStatus);
      window.removeEventListener('storage', checkUserStatus);
    };
  }, []);

  // If chat is open or user is an admin/guest, don't show the bubble
  if (!isAuthenticated || isChatOpen || isAdmin) return null;

  const handleOpenChat = () => {
    // We allow opening even if not connected; ChatPage will show the connecting state
    setIsChatOpen(true);
    clearUnread();
  };

  return (
    <div 
      className={`chat-bubble-container ${unreadCount > 0 ? 'ping-animation' : ''}`}
      onClick={handleOpenChat}
    >
      {/* 1. Unread Notification Badge */}
      {unreadCount > 0 && (
        <span className="unread-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* 2. Brand Icon Wrapper */}
      <div className="bubble-icon-wrapper">
        <FaComments />
        
        {/* 3. NEW: Connectivity Status Dot on the bubble itself */}
        <span className={`status-indicator ${connected ? 'online' : 'connecting'}`}></span>
      </div>

      {/* 4. Tooltip */}
      <div className="bubble-tooltip">
        {connected ? 'Hỗ trợ trực tuyến' : 'Đang kết nối...'}
      </div>
    </div>
  );
};

export default ChatBubble;