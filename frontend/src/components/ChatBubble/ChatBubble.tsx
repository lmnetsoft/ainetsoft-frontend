import React from 'react';
import './ChatBubble.css';

const ChatBubble = () => {
  return (
    <div className="sticky-chat-bubble" onClick={() => console.log("Open Chat")}>
      <div className="chat-icon">
        {/* Simple Message SVG Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div className="chat-label">
        <span>CHAT VỚI</span>
        <strong>ADMIN</strong>
      </div>
      <div className="online-indicator"></div>
    </div>
  );
};

export default ChatBubble;