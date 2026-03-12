import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FaTimes, FaMinus, FaPlus, FaExclamationCircle, FaPaperPlane,
  FaRegSmile, FaRegImage, FaRegPlayCircle, FaShoppingBag, FaClipboardList, 
  FaTrashAlt, FaSearch, FaRegFileAlt, FaCloudDownloadAlt
} from 'react-icons/fa';
import EmojiPicker, { Theme } from 'emoji-picker-react'; 
import api from '../../services/api';
import { getChatHistory } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import './ChatPage.css';

const ChatPage = () => {
  const { recipientId } = useParams();
  const { messages, sendMessage, clearUnread, setRecipientMessages, connected, setIsChatOpen } = useChat();

  // --- STATE MANAGEMENT ---
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'emoji' | 'sticker'>('emoji');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- MODAL STATES ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // --- MEDIA POPUP STATE (LIGHTBOX) ---
  const [mediaPopup, setMediaPopup] = useState<{ url: string; type: 'IMAGE' | 'VIDEO' } | null>(null);

  // --- REFS ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genericFileInputRef = useRef<HTMLInputElement>(null); 
  const videoInputRef = useRef<HTMLInputElement>(null); 
  const pickerRef = useRef<HTMLDivElement>(null);

  // --- IDENTITY & ROLE LOGIC ---
  const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
  const isCurrentUserAdmin = Array.isArray(roles) && (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'));
  
  const myId = isCurrentUserAdmin 
    ? 'admin' 
    : (localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || 'guest');
    
  const targetId = isCurrentUserAdmin ? recipientId : 'admin';

  // --- CUSTOM STICKERS ---
  const customStickers = [
    { id: 1, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274543.png' },
    { id: 2, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274550.png' },
    { id: 3, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274556.png' },
    { id: 4, url: 'https://cdn-icons-png.flaticon.com/512/2274/2274547.png' },
  ];

  // --- HANDLER: DOWNLOAD ALL MEDIA ---
  const handleDownloadAllMedia = () => {
    const mediaFiles = messages.filter(m => m.type === 'IMAGE' || m.type === 'VIDEO' || isImageUrl(m.content));
    if (mediaFiles.length === 0) {
      alert("Không tìm thấy tệp phương tiện nào để tải.");
      return;
    }
    
    mediaFiles.forEach((msg, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = msg.content;
        link.setAttribute('download', `chat_media_${idx}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 500);
    });
  };

  // --- EFFECT: CLICK OUTSIDE PICKER ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- EFFECT: LOAD HISTORY & CLEAR UNREAD ---
  useEffect(() => {
    if (!myId || !targetId) return;
    const loadData = async () => {
      try {
        const history = await getChatHistory(myId, targetId);
        setRecipientMessages(history);
        clearUnread();
      } catch (err) {
        console.error("History load error:", err);
      }
    };
    loadData();
  }, [targetId, myId, setRecipientMessages, clearUnread]);

  // --- EFFECT: SCROLL TO BOTTOM ---
  useEffect(() => {
    if (!isMinimized) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isMinimized]);

  // --- PRODUCT MODAL HANDLERS ---
  const handleOpenProductModal = async () => {
    try {
      const res = await api.get('/api/products');
      setAvailableProducts(res.data);
      setShowProductModal(true);
    } catch (err) {
      alert("Không thể tải danh sách sản phẩm.");
    }
  };

  const handleSendProduct = (product: any) => {
    if (!connected || !myId || !targetId) return;
    const productData = JSON.stringify({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || (product.images && product.images[0])
    });
    sendMessage({ 
      senderId: myId, 
      recipientId: targetId, 
      content: productData, 
      type: 'PRODUCT', 
      timestamp: new Date().toISOString() 
    });
    setShowProductModal(false);
  };

  // --- ORDER MODAL HANDLERS ---
  const handleOpenOrderModal = async () => {
    try {
      const res = await api.get('/api/orders/user'); 
      setUserOrders(res.data);
      setShowOrderModal(true);
    } catch (err) {
      alert("Không thể tải danh sách đơn hàng.");
    }
  };

  const handleSendOrder = (order: any) => {
    if (!connected || !myId || !targetId) return;
    const orderData = JSON.stringify({
      orderId: order.orderId || order.id,
      status: order.status,
      total: order.totalAmount || order.total,
      date: order.createdAt || order.orderDate
    });
    sendMessage({ 
      senderId: myId, 
      recipientId: targetId, 
      content: orderData, 
      type: 'ORDER', 
      timestamp: new Date().toISOString() 
    });
    setShowOrderModal(false);
  };

  const handleDownloadFile = (fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MESSAGE SEND HANDLERS ---
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

  // --- UPLOAD HANDLERS (CRITICAL MEMORY FIX) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
          setSelectedFile(file);
        };
        reader.readAsDataURL(file);
    } else {
        // Videos just store file ref to prevent memory crash
        setSelectedFile(file);
        setPreviewImage(null); 
    }
  };

  const handleUploadAndSend = async () => {
    if (!selectedFile || !myId || !targetId) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', selectedFile); 
      
      const res = await api.post('chat/upload', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || selectedFile.size));
          setUploadProgress(percent);
        }
      }); 
      
      sendMessage({ 
        senderId: myId, 
        recipientId: targetId, 
        content: res.data.url, 
        type: 'IMAGE', 
        timestamp: new Date().toISOString() 
      });
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert("Lỗi tải tệp!");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myId || !targetId) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Video quá lớn! Vui lòng chọn tệp dưới 50MB.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });
      
      sendMessage({ 
        senderId: myId, 
        recipientId: targetId, 
        content: res.data.url, 
        type: 'VIDEO', 
        timestamp: new Date().toISOString() 
      });
    } catch (err) {
      console.error("Video upload error", err);
      alert("Không thể tải video. Vui lòng kiểm tra dung lượng và kết nối."); 
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const isImageUrl = (url: string) => {
    if (typeof url !== 'string') return false;
    const isExtension = /\.(jpeg|jpg|gif|png|webp|JPG|heic|HEIC)$/i.test(url);
    const isPathMatch = url.includes('/uploads/') || url.includes('/download/');
    return (isExtension || isPathMatch) && url.startsWith('http');
  };

  if (!myId) return null;

  return (
    <div className={`chat-box-master ${isMinimized ? 'minimized' : ''}`}>
      {/* --- HEADER --- */}
      <div className="chat-box-header" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="chat-header-left">
          <span className="dot-online"></span>
          <span className="chat-title">
            {isCurrentUserAdmin ? `Đang hỗ trợ: ${targetId}` : 'Hỗ trợ: AiNetsoft'}
          </span>
        </div>
        <div className="chat-header-right">
          <button className="chat-btn" title="Tải tất cả media" onClick={(e) => { e.stopPropagation(); handleDownloadAllMedia(); }}>
             <FaCloudDownloadAlt />
          </button>
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
          {/* --- FIXED MEDIA LIGHTBOX POPUP --- */}
          {mediaPopup && (
            <div className="media-lightbox-overlay" onClick={() => setMediaPopup(null)}>
              {/* EXTERNAL OVERLAY BUTTON (Ensures user can always close) */}
              <button className="screen-close-btn" onClick={() => setMediaPopup(null)}>
                <FaTimes /> <span>Đóng</span>
              </button>

              <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                {mediaPopup.type === 'IMAGE' ? (
                  <img src={mediaPopup.url} alt="View" />
                ) : (
                  <video controls autoPlay>
                    <source src={mediaPopup.url} type="video/mp4" />
                  </video>
                )}
              </div>
            </div>
          )}

          {showProductModal && (
            <div className="product-modal-overlay">
              <div className="product-modal-content">
                <div className="product-modal-header">
                  <h3>Chọn sản phẩm chia sẻ</h3>
                  <button onClick={() => setShowProductModal(false)}><FaTimes /></button>
                </div>
                <div className="product-modal-search">
                  <FaSearch />
                  <input placeholder="Tìm theo tên..." onChange={(e) => setProductSearch(e.target.value)} />
                </div>
                <div className="product-grid">
                  {availableProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                    <div key={p.id} className="product-item" onClick={() => handleSendProduct(p)}>
                      <img src={p.imageUrl || (p.images && p.images[0])} alt="" />
                      <div className="product-item-info">
                        <p>{p.name}</p>
                        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showOrderModal && (
            <div className="product-modal-overlay">
              <div className="product-modal-content">
                <div className="product-modal-header">
                  <h3>Chọn đơn hàng cần hỗ trợ</h3>
                  <button onClick={() => setShowOrderModal(false)}><FaTimes /></button>
                </div>
                <div className="order-list-container">
                  {userOrders.length > 0 ? userOrders.map(order => (
                    <div key={order.id} className="order-selection-item" onClick={() => handleSendOrder(order)}>
                      <div className="order-item-main">
                        <span className="order-id-label">Mã đơn: #{order.orderId || order.id}</span>
                        <span className={`order-status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                      </div>
                      <div className="order-item-footer">
                        <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span className="order-total">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount || order.total)}</span>
                      </div>
                    </div>
                  )) : <p className="no-data-msg">Bạn chưa có đơn hàng nào.</p>}
                </div>
              </div>
            </div>
          )}

          <div className="chat-scroll-area">
            <div className="chat-alert-box">
              <FaExclamationCircle />
              <span>LƯU Ý: Không giao dịch ngoài hệ thống để tránh lừa đảo.</span>
            </div>
            
            {messages
              .filter(m => (m.senderId === myId && m.recipientId === targetId) || (m.senderId === targetId && m.recipientId === myId))
              .map((msg, index) => {
                const isMe = msg.senderId === myId;
                
                if (msg.type === 'PRODUCT') {
                    try {
                        const p = JSON.parse(msg.content);
                        return (
                            <div key={index} className={`chat-line ${isMe ? 'line-me' : 'line-them'}`}>
                                <div className="product-share-card">
                                    <img src={p.imageUrl} alt="" />
                                    <div className="product-card-body">
                                        <h4>{p.name}</h4>
                                        <p>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</p>
                                        <button onClick={() => window.open(`/product/${p.id}`, '_blank')}>Xem chi tiết</button>
                                    </div>
                                </div>
                                <span className="chat-timestamp">{new Date(msg.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        );
                    } catch(e) { return null; }
                }

                if (msg.type === 'ORDER') {
                  try {
                    const o = JSON.parse(msg.content);
                    return (
                      <div key={index} className={`chat-line ${isMe ? 'line-me' : 'line-them'}`}>
                        <div className="order-share-card">
                          <div className="order-card-header"><FaClipboardList /> <span>Thông tin đơn hàng</span></div>
                          <div className="order-card-body">
                            <div className="order-row"><span>Mã:</span> <strong>#{o.orderId}</strong></div>
                            <div className="order-row"><span>Trạng thái:</span> <span className="status-text">{o.status}</span></div>
                            <div className="order-row :has(strong)"><span>Tổng:</span> <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.total)}</strong></div>
                          </div>
                          <button className="order-view-btn" onClick={() => window.open(`/profile/orders/${o.orderId}`, '_blank')}>Xem chi tiết</button>
                        </div>
                        <span className="chat-timestamp">{new Date(msg.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  } catch (e) { return null; }
                }

                const isImage = msg.type === 'IMAGE' || isImageUrl(msg.content);
                const isVideo = msg.type === 'VIDEO' || (typeof msg.content === 'string' && /\.(mp4|webm|ogg|mov)$/i.test(msg.content));

                return (
                  <div key={index} className={`chat-line ${isMe ? 'line-me' : 'line-them'}`}>
                    <div className="chat-bubble-new">
                      {isImage && !isVideo ? (
                        <img 
                          src={msg.content} 
                          className="chat-sent-image clickable-media" 
                          alt="" 
                          onClick={() => setMediaPopup({url: msg.content, type: 'IMAGE'})}
                          onLoad={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })} 
                        />
                      ) : isVideo ? (
                        /* SMART VIDEO THUMBNAIL LOGIC (REAL SNAPSHOT PREVIEW) */
                        <div className="video-thumb-container" onClick={() => setMediaPopup({url: msg.content, type: 'VIDEO'})}>
                           <div className="video-preview-wrapper">
                              {/* preload metadata ensures we get a snapshot without a Broken Pipe error */}
                              <video src={`${msg.content}#t=0.1`} preload="metadata" className="video-real-thumbnail" />
                              <div className="video-overlay-play">
                                <FaRegPlayCircle className="play-icon-pro" />
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="chat-text-wrapper">
                          <p>{msg.content}</p>
                          {msg.content.includes('/download/') && (
                            <button className="download-msg-btn" onClick={() => handleDownloadFile(msg.content)}><FaRegFileAlt /> Tải tệp tin</button>
                          )}
                        </div>
                      )}
                      <span className="chat-timestamp">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  </div>
                );
              })}
            <div ref={scrollRef} />
          </div>

          <div className="chat-box-footer">
            {/* REAL-TIME PROGRESS BAR */}
            {uploading && (
              <div className="upload-progress-container">
                <div className="upload-progress-track">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <span className="upload-progress-text">Đang tải: {uploadProgress}%</span>
              </div>
            )}

            <div className="chat-input-container">
              {showEmojiPicker && (
                <div className="emoji-picker-wrapper" ref={pickerRef}>
                  <div className="picker-header-tabs">
                    <button className={activeTab === 'emoji' ? 'active' : ''} onClick={() => setActiveTab('emoji')}>Emoji</button>
                    <button className={activeTab === 'sticker' ? 'active' : ''} onClick={() => setActiveTab('sticker')}>Stickers</button>
                  </div>
                  <div className="picker-content">
                    {activeTab === 'emoji' ? (
                      <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} width="100%" height={350} />
                    ) : (
                      <div className="stickers-grid">
                        {customStickers.map(s => <img key={s.id} src={s.url} alt="" onClick={() => handleSendSticker(s.url)} />)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COMPACT MINI PREVIEW (SMALLER VERSION FIX) */}
              {previewImage && (
                <div className="image-pre-send-compact">
                   <div className="preview-mini-card">
                      <img src={previewImage} alt="Preview" />
                      <div className="preview-mini-info">
                        <button className="mini-cancel" title="Bỏ" onClick={() => {setPreviewImage(null); setSelectedFile(null);}}><FaTrashAlt /></button>
                        <button className="mini-send" onClick={handleUploadAndSend} disabled={uploading}>{uploading ? "..." : "Gửi"}</button>
                      </div>
                   </div>
                </div>
              )}

              <div className="chat-toolbar-horizontal">
                <button type="button" title="Cảm xúc" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FaRegSmile /></button>
                <button type="button" title="Hình ảnh" onClick={() => fileInputRef.current?.click()}><FaRegImage /></button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} hidden accept="image/*" />
                <input type="file" ref={videoInputRef} onChange={handleVideoUpload} hidden accept="video/*" />
                <input type="file" ref={genericFileInputRef} onChange={handleFileSelect} hidden />

                <button type="button" title="Video" onClick={() => videoInputRef.current?.click()}><FaRegPlayCircle /></button>
                <button type="button" title="Sản phẩm" onClick={handleOpenProductModal}><FaShoppingBag /></button>
                <button type="button" title="Đơn hàng" onClick={handleOpenOrderModal}><FaClipboardList /></button>
              </div>

              <div className="chat-input-row">
                <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Nhập tin nhắn..." />
                <button onClick={handleSendMessage} className={inputText.trim() && connected ? 'send-btn-active' : 'send-btn'} disabled={!inputText.trim() || !connected}><FaPaperPlane /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;