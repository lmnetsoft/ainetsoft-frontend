import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FaTimes, FaMinus, FaPlus, FaExclamationCircle, FaPaperPlane,
  FaRegSmile, FaRegImage, FaRegPlayCircle, FaShoppingBag, FaRegFileAlt,
  FaTrashAlt
} from 'react-icons/fa';
import EmojiPicker, { Theme } from 'emoji-picker-react'; 
import api from '../../services/api';
import { getChatHistory } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import './ChatPage.css';

const ChatPage = () => {
  const { recipientId } = useParams();
  const { messages, sendMessage, clearUnread, setRecipientMessages, connected, setIsChatOpen } = useChat();

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'emoji' | 'sticker'>('emoji');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null); 
  const pickerRef = useRef<HTMLDivElement>(null);

  /**
   * IDENTITY SYNC:
   * Normalizes IDs so Admin and User can talk to each other correctly.
   */
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isCurrentUserAdmin = Array.isArray(roles) && (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'));
  
  const myId = isCurrentUserAdmin ? 'admin' : (localStorage.getItem('userEmail') || localStorage.getItem('userPhone'));
  const targetId = isCurrentUserAdmin ? recipientId : 'admin';

  const customStickers = [
    { id: 1, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274543.png' },
    { id: 2, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274550.png' },
    { id: 3, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274556.png' },
    { id: 4, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274547.png' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!myId || !targetId) return;
    const loadData = async () => {
      try {
        const history = await getChatHistory(myId, targetId);
        setRecipientMessages(history);
        clearUnread();
      } catch (err) { console.error("History load error:", err); }
    };
    loadData();
  }, [targetId, myId, setRecipientMessages, clearUnread]);

  useEffect(() => {
    if (!isMinimized) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isMinimized]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !connected || !myId || !targetId) return;
    sendMessage({
      senderId: myId,
      recipientId: targetId,
      content: inputText,
      type: 'TEXT',
      timestamp: new Date().toISOString()
    });
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleSendSticker = (url: string) => {
    if (!connected || !myId || !targetId) return;
    sendMessage({
      senderId: myId,
      recipientId: targetId,
      content: url,
      type: 'IMAGE',
      timestamp: new Date().toISOString()
    });
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData: any) => {
    setInputText(prev => prev + emojiData.emoji);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  /**
   * ROCK SOLID UPLOAD: 
   * Extracts the 'url' key from the JSON response.
   */
  const handleUploadAndSend = async () => {
    if (!selectedFile || !myId || !targetId) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile); 
      
      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }); 
      
      // FIXED: Extract the URL from the JSON object { "url": "..." }
      const uploadedUrl = res.data.url;

      sendMessage({
        senderId: myId,
        recipientId: targetId,
        content: uploadedUrl, 
        type: 'IMAGE', 
        timestamp: new Date().toISOString()
      });
      
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (err: any) { 
      console.error("Upload Error:", err.response?.data || err.message);
      alert("Lỗi tải ảnh! Kiểm tra kết nối server."); 
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myId || !targetId) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      sendMessage({
        senderId: myId,
        recipientId: targetId,
        content: res.data.url, // FIXED: JSON extraction
        type: 'VIDEO',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      alert("Lỗi tải video!");
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const isImageUrl = (url: string) => {
    if (typeof url !== 'string') return false;
    return (url.match(/\.(jpeg|jpg|gif|png|webp|JPG)$/i) != null || url.includes('/uploads/')) && url.startsWith('http');
  };

  if (!myId) return null;

  return (
    <div className={`chat-box-master ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-box-header" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="chat-header-left">
          <span className="dot-online"></span>
          <span className="chat-title">
            {isCurrentUserAdmin ? `Đang hỗ trợ: ${targetId}` : 'Hỗ trợ: AiNetsoft'}
          </span>
        </div>
        <div className="chat-header-right">
          <button className="chat-btn" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            {isMinimized ? <FaPlus /> : <FaMinus />}
          </button>
          {!isCurrentUserAdmin && (
             <button className="chat-btn" onClick={(e) => { e.stopPropagation(); setIsChatOpen(false); }}>
               <FaTimes />
             </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="chat-box-body">
          <div className="chat-scroll-area">
            <div className="chat-alert-box">
              <FaExclamationCircle />
              <span>LƯU Ý: Không giao dịch ngoài hệ thống để tránh lừa đảo.</span>
            </div>
            
            {messages
              .filter(m => (m.senderId === myId && m.recipientId === targetId) || (m.senderId === targetId && m.recipientId === myId))
              .map((msg, index) => {
                const isMe = msg.senderId === myId;
                const showAsImage = msg.type === 'IMAGE' || isImageUrl(msg.content);

                return (
                  <div key={index} className={`chat-line ${isMe ? 'line-me' : 'line-them'}`}>
                    <div className="chat-bubble-new">
                      {showAsImage ? (
                        <img 
                          src={msg.content} 
                          className="chat-sent-image" 
                          alt="chat-attachment"
                          onLoad={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })} 
                        />
                      ) : msg.type === 'VIDEO' ? (
                        <video controls className="chat-sent-video">
                          <source src={msg.content} type="video/mp4" />
                          Trình duyệt không hỗ trợ video.
                        </video>
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

          <div className="chat-box-footer">
            <div className="chat-input-container">
              
              {showEmojiPicker && (
                <div className="emoji-picker-wrapper" ref={pickerRef}>
                  <div className="picker-header-tabs">
                    <button className={activeTab === 'emoji' ? 'active' : ''} onClick={() => setActiveTab('emoji')}>Emoji</button>
                    <button className={activeTab === 'sticker' ? 'active' : ''} onClick={() => setActiveTab('sticker')}>Stickers</button>
                  </div>
                  <div className="picker-content">
                    {activeTab === 'emoji' ? (
                      <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} width="100%" height={350} autoFocusSearch={false} />
                    ) : (
                      <div className="stickers-grid">
                        {customStickers.map(s => (
                          <img key={s.id} src={s.url} alt="sticker" onClick={() => handleSendSticker(s.url)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {previewImage && (
                <div className="image-pre-send-overlay">
                   <div className="preview-container">
                      <img src={previewImage} alt="Preview" />
                      <div className="preview-actions">
                        <button className="cancel-preview-btn-v2" onClick={() => {setPreviewImage(null); setSelectedFile(null);}}>
                          <FaTrashAlt /> Bỏ
                        </button>
                        <button className="confirm-upload-btn" onClick={handleUploadAndSend} disabled={uploading}>
                          {uploading ? "Đang gửi..." : "Gửi ảnh"}
                        </button>
                      </div>
                   </div>
                </div>
              )}

              <div className="chat-toolbar-horizontal">
                <button type="button" className={showEmojiPicker ? 'active-tool' : ''} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <FaRegSmile />
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                   {uploading ? "..." : <FaRegImage />}
                </button>
                <input type="file" ref={videoInputRef} onChange={handleVideoUpload} hidden accept="video/*" />
                <button type="button" title="Video" onClick={() => videoInputRef.current?.click()}>
                  <FaRegPlayCircle />
                </button>
                <button type="button" title="Sản phẩm"><FaShoppingBag /></button>
                <button type="button" title="Tệp tin"><FaRegFileAlt /></button>
              </div>

              <div className="chat-input-row">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} hidden accept="image/*" />
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