import React, { useEffect, useState } from 'react';
import { FaComments } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext'; // Consume our unified context
import './ChatBubble.css';

const ChatBubble = () => {
  // Access global popup state and connection status from Context
  const { unreadCount, connected, isChatOpen, setIsChatOpen, clearUnread } = useChat();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jwt_token'));

  /**
   * FIX ISSUE #2: Sync visibility with login status
   * This ensures the icon appears immediately when the 'profileUpdate' event fires.
   */
  const checkUserStatus = () => {
    const token = localStorage.getItem('jwt_token');
    setIsAuthenticated(!!token);
    
    try {
      const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      setIsAdmin(Array.isArray(storedRoles) && storedRoles.includes('ADMIN'));
    } catch (err) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
    
    // Listen for custom login/logout and storage events
    window.addEventListener('profileUpdate', checkUserStatus);
    window.addEventListener('storage', checkUserStatus);
    
    return () => {
      window.removeEventListener('profileUpdate', checkUserStatus);
      window.removeEventListener('storage', checkUserStatus);
    };
  }, []);

  /**
   * HIDE LOGIC:
   * 1. Hide if the user is not logged in (Guest).
   * 2. Hide if the chat popup is already open (Don't overlap).
   * 3. Hide if the user is an ADMIN (Admins use the dedicated Admin Dashboard).
   * * NOTE: Removed '!connected' from this check so the icon appears 
   * instantly on Home refresh even if WebSocket is still connecting.
   */
  if (!isAuthenticated || isChatOpen || isAdmin) return null;

  const handleOpenChat = () => {
    // Only allow opening if the socket is ready
    if (connected) {
      setIsChatOpen(true);
      clearUnread();
    } else {
      console.warn("Chat connection is still initializing...");
    }
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
      </div>

      {/* 3. Original Tooltip (Restored) */}
      <div className="bubble-tooltip">Hỗ trợ trực tuyến</div>
    </div>
  );
};

export default ChatBubble;