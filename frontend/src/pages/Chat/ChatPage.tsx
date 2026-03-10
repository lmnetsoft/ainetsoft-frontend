import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FaTimes, FaMinus, FaPlus, FaExclamationCircle, FaPaperPlane } from 'react-icons/fa';
import { getChatHistory } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import type { ChatMessage } from '../../services/chatService';
import './ChatPage.css';

const ChatPage = () => {
  const { recipientId } = useParams();
  const {
    messages,
    sendMessage,
    clearUnread,
    setRecipientMessages,
    connected,
    setIsChatOpen // Added to control global state
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // FIX ISSUE #3 & #4: Use exact identity, no guest fallback to prevent history leaks
  const myId = localStorage.getItem('userEmail') || localStorage.getItem('userPhone');
  const targetId = recipientId || 'admin';

  useEffect(() => {
    if (!myId) return;

    const loadData = async () => {
      try {
        const history = await getChatHistory(myId, targetId);
        setRecipientMessages(history);
        clearUnread();
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    };
    loadData();
  }, [targetId, myId, setRecipientMessages, clearUnread]);

  useEffect(() => {
    if (!isMinimized && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isMinimized]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !connected || !myId) return;

    sendMessage({
      senderId: myId,
      recipientId: targetId,
      content: inputText,
      timestamp: new Date().toISOString()
    });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // If no valid user ID, don't render the chat at all
  if (!myId) return null;

  return (
    /* REMOVED: profile-wrapper and AccountSidebar to fix the layout for popup use */
    <div className={`chat-box-master ${isMinimized ? 'minimized' : ''}`}>
      {/* HEADER */}
      <div
        className="chat-box-header"
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className="chat-header-left">
          <span className="dot-online"></span>
          <span className="chat-title">
            Hỗ trợ: {targetId === 'admin' ? 'AiNetsoft' : targetId}
          </span>
        </div>

        <div className="chat-header-right">
          <button
            className="chat-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
          >
            {isMinimized ? <FaPlus /> : <FaMinus />}
          </button>

          <button
            className="chat-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsChatOpen(false); // Close the global popup state
            }}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* BODY */}
      {!isMinimized && (
        <div className="chat-box-body">
          <div className="chat-scroll-area">
            <div className="chat-alert-box">
              <FaExclamationCircle />
              <span>
                LƯU Ý: Không giao dịch ngoài hệ thống để tránh lừa đảo.
              </span>
            </div>

            {messages
              .filter(
                (m) =>
                  (m.senderId === myId && m.recipientId === targetId) ||
                  (m.senderId === targetId && m.recipientId === myId)
              )
              .map((msg: ChatMessage, index: number) => {
                const isMe = msg.senderId === myId;
                const key = `${msg.timestamp ?? 'msg'}-${index}`;

                return (
                  <div
                    key={key}
                    className={`chat-line ${isMe ? 'line-me' : 'line-them'}`}
                  >
                    <div className="chat-bubble-new">
                      <p>{msg.content}</p>
                      <span className="chat-timestamp">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            <div ref={scrollRef} />
          </div>

          {/* FOOTER */}
          <div className="chat-box-footer">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
            />
            <button
              onClick={handleSendMessage}
              className={
                inputText.trim() && connected ? 'btn-active' : ''
              }
              disabled={!inputText.trim() || !connected}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;