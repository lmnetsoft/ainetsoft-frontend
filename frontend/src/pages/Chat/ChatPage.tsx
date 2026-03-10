import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FaTimes, FaMinus, FaPlus, FaExclamationCircle, FaPaperPlane,
  FaRegSmile, FaRegImage, FaRegPlayCircle, FaShoppingBag, FaRegFileAlt 
} from 'react-icons/fa';
import api from '../../services/api';
import { getChatHistory } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import type { ChatMessage } from '../../services/chatService';
import './ChatPage.css';

const ChatPage = () => {
  const { recipientId } = useParams();
  const { messages, sendMessage, clearUnread, setRecipientMessages, connected, setIsChatOpen } = useChat();

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * IDENTITY NORMALIZATION:
   * Checks if current user is Admin. If so, myId = 'admin'.
   * This ensures messages sent to 'admin' are visible in the Admin Dashboard.
   */
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isCurrentUserAdmin = Array.isArray(roles) && roles.includes('ADMIN');

  const myId = isCurrentUserAdmin 
    ? 'admin' 
    : (localStorage.getItem('userEmail') || localStorage.getItem('userPhone'));
    
  const targetId = recipientId || 'admin';

  // Load chat history when recipient or myId changes
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isMinimized]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !connected || !myId) return;
    sendMessage({
      senderId: myId,
      recipientId: targetId,
      content: inputText,
      type: 'TEXT',
      timestamp: new Date().toISOString()
    });
    setInputText('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myId) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/chat/upload', formData); 
      sendMessage({
        senderId: myId,
        recipientId: targetId,
        content: res.data,
        type: 'IMAGE',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      alert("Lỗi tải ảnh!");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!myId) return null;

  return (
    <div className={`chat-box-master ${isMinimized ? 'minimized' : ''}`}>
      {/* HEADER */}
      <div className="chat-box-header" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="chat-header-left">
          <span className="dot-online"></span>
          <span className="chat-title">
            {targetId === 'admin' ? 'Hỗ trợ: AiNetsoft' : `Chat với: ${targetId}`}
          </span>
        </div>
        <div className="chat-header-right">
          <button className="chat-btn" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            {isMinimized ? <FaPlus /> : <FaMinus />}
          </button>
          <button className="chat-btn" onClick={(e) => { e.stopPropagation(); setIsChatOpen(false); }}>
            <FaTimes />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="chat-box-body">
          {/* BODY / MESSAGES AREA */}
          <div className="chat-scroll-area">
            <div className="chat-alert-box">
              <FaExclamationCircle />
              <span>LƯU Ý: Không giao dịch ngoài hệ thống để tránh lừa đảo.</span>
            </div>
            
            {messages
              .filter(m => (m.senderId === myId && m.recipientId === targetId) || (m.senderId === targetId && m.recipientId === myId))
              .map((msg, index) => {
                const isMe = msg.senderId === myId;
                return (
                  <div key={index} className={`chat-line ${isMe ? 'line-me' : 'line-them'}`}>
                    <div className="chat-bubble-new">
                      {msg.type === 'IMAGE' ? (
                        <img src={msg.content} className="chat-sent-image" alt="upload" />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      <span className="chat-timestamp">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            <div ref={scrollRef} />
          </div>

          {/* FOOTER AREA */}
          <div className="chat-box-footer">
            <div className="chat-input-container">
              {/* HORIZONTAL TOOLBAR - Icons now in a neat row */}
              <div className="chat-toolbar-horizontal">
                <button type="button" title="Stickers"><FaRegSmile /></button>
                <button type="button" title="Hình ảnh" onClick={() => fileInputRef.current?.click()}>
                  {uploading ? "..." : <FaRegImage />}
                </button>
                <button type="button" title="Video"><FaRegPlayCircle /></button>
                <button type="button" title="Sản phẩm"><FaShoppingBag /></button>
                <button type="button" title="Tệp tin"><FaRegFileAlt /></button>
              </div>

              {/* INPUT ROW - Text field takes full remaining width */}
              <div className="chat-input-row">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept="image/*" />
                <input 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                  placeholder="Nhập tin nhắn..." 
                />
                <button 
                  onClick={handleSendMessage} 
                  className={inputText.trim() && connected ? 'send-btn-active' : 'send-btn'}
                  disabled={!inputText.trim() || !connected}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;