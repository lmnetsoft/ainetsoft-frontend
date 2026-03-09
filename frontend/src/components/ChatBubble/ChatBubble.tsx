import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaComments } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext'; // Consume our single connection context
import './ChatBubble.css';

const ChatBubble = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Access state from the Unified Chat Context
  const { unreadCount, connected, clearUnread } = useChat();

  // Hide the bubble if the user is already inside the chat interface
  const isChatPage = location.pathname.startsWith('/chat');

  // Automatically clear unread status when the user navigates to any chat route
  useEffect(() => {
    if (isChatPage) {
      clearUnread();
    }
  }, [isChatPage, clearUnread]);

  // If we are on the chat page or the WebSocket isn't connected, don't show the bubble
  if (isChatPage || !connected) return null;

  return (
    <div 
      className={`chat-bubble-container ${unreadCount > 0 ? 'ping-animation' : ''}`}
      onClick={() => navigate('/chat/admin')} // Default to admin support
    >
      {unreadCount > 0 && (
        <span className="unread-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      <div className="bubble-icon-wrapper">
        <FaComments />
      </div>
      <div className="bubble-tooltip">Hỗ trợ trực tuyến</div>
    </div>
  );
};

export default ChatBubble;