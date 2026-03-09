import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTimes, FaMinus, FaPlus, FaExclamationCircle, FaPaperPlane } from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getChatHistory } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import type { ChatMessage } from '../../services/chatService';
import './ChatPage.css';

const ChatPage = () => {

  const { recipientId } = useParams();
  const navigate = useNavigate();

  const {
    messages,
    sendMessage,
    clearUnread,
    setRecipientMessages,
    connected
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const myId =
    localStorage.getItem('userEmail') ||
    localStorage.getItem('userPhone') ||
    'guest';

  const targetId = recipientId || 'admin';

  useEffect(() => {

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

    if (!inputText.trim() || !connected) return;

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


  return (

    <div className="profile-wrapper">

      <div className="container profile-container">

        <AccountSidebar />

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
                  navigate('/');
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

                    /* determine message side correctly */

                    const isMe =
                      msg.senderId === myId &&
                      msg.recipientId === targetId;

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

      </div>

    </div>

  );

};

export default ChatPage;