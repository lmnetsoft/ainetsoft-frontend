import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaTruck, FaMapMarkerAlt, FaStar, FaCommentDots } from 'react-icons/fa';
import { getMyOrders, cancelOrder } from '../../services/orderService';
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext';
import './Profile.css';
import './Purchase.css'; 

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const Purchase = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { setIsChatOpen } = useChat();

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  const bitnamilegacy = (url?: string) => {
    if (!url || url === "/placeholder.png") return "/placeholder.png";
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  };

  const fetchOrders = async (status: string) => {
    try {
      setLoading(true);
      const data = await getMyOrders(status);
      setOrders(data);
    } catch (err: any) {
      if (err.message !== "Unauthorized") {
          setToastMessage(err.message || "Không thể tải danh sách đơn hàng.");
          setShowToast(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders(activeTab);
    }, 100);

    document.title = "Đơn mua của tôi | AiNetsoft";
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  const getStatusText = (status: string) => {
    const s = status ? status.toString().trim().toUpperCase() : '';
    switch (s) {
      case 'PENDING': return 'CHỜ XÁC NHẬN';
      case 'CONFIRMED': return 'ĐÃ XÁC NHẬN';
      case 'PROCESSING': return 'ĐANG XỬ LÝ';
      case 'SHIPPING': return 'ĐANG GIAO HÀNG';
      case 'COMPLETED': return 'HOÀN THÀNH';
      case 'CANCELLED': return 'ĐÃ HỦY';
      default: return status || 'CHỜ XÁC NHẬN';
    }
  };

  const handleChatWithSeller = (sellerId: string) => {
    if (sellerId) {
      localStorage.setItem('currentChatRecipient', sellerId);
      setIsChatOpen(true);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Toàn bộ Xu và Voucher sẽ được hoàn trả.')) {
      return;
    }
    try {
      await cancelOrder(orderId);
      setToastMessage("Hủy đơn hàng thành công! Xu và Voucher đã được hoàn trả.");
      setShowToast(true);
      fetchOrders(activeTab); 
    } catch (err: any) {
      setToastMessage(err.message || "Không thể hủy đơn hàng.");
      setShowToast(true);
    }
  };

  return (
    <div className="user-page-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <main className="purchase-main-view" style={{ width: '100%' }}>
        <div className="purchase-tabs-container">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`purchase-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        <div className="purchase-list-content">
          {loading ? (
            <div className="profile-container-loading">
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '15px' }}>Đang tìm kiếm đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="purchase-empty-state" style={{ background: '#fff', padding: '100px 0', textAlign: 'center' }}>
              <img src="/logo.svg" alt="Empty" style={{ opacity: 0.1, width: '100px', marginBottom: '20px' }} />
              <p>Chưa có đơn hàng nào trong mục này.</p>
              <button className="go-shopping-btn" onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '12px 30px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                Mua sắm ngay
              </button>
            </div>
          ) : (
            <div className="order-cards-wrapper">
              {orders.map(order => {
                const rawStatus = order.status ? order.status.toString().trim().toUpperCase() : '';
                const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING', 'UNPAID', ''].includes(rawStatus);

                return (
                  <div key={order.id} className="order-card-item">
                    <div className="order-item-header">
                      <div className="shop-name-group">
                        <FaStore className="icon-orange" />
                        <strong>{order.items?.[0]?.shopName || 'Cửa hàng'}</strong>
                        <button 
                          className="chat-btn" 
                          onClick={() => handleChatWithSeller(order.items?.[0]?.sellerId)}
                          style={{ marginLeft: '10px', padding: '4px 10px', fontSize: '12px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FaCommentDots /> Chat
                        </button>
                      </div>
                      <div className="status-tag">
                        <FaTruck /> {getStatusText(order.status)}
                      </div>
                    </div>

                    <div className="order-item-body">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="item-row" onClick={() => navigate(`/product/${item.productId}`)}>
                           <img 
                              src={bitnamilegacy(item.imageUrl)} 
                              alt={item.productName} 
                              className="item-thumb" 
                              onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                           />
                           <div className="item-info">
                              <p className="item-title">{item.productName}</p>
                              <p className="item-count">x{item.quantity}</p>
                           </div>
                           <div className="item-price-info">
                              <span className="current-price">₫{item.price?.toLocaleString()}</span>
                           </div>
                        </div>
                      ))}

                      {order.shippingAddress && (
                        <div className="order-shipping-summary">
                          <FaMapMarkerAlt className="icon-orange" />
                          <div className="shipping-text">
                            <strong>Giao đến: {order.shippingAddress.receiverName} ({order.shippingAddress.phone})</strong>
                            <p>{order.shippingAddress.detail}, {order.shippingAddress.ward}, {order.shippingAddress.province}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="order-item-footer">
                        <div className="total-display">
                          <span style={{ fontSize: '0.9rem' }}>Thành tiền: </span>
                          <span className="grand-total">₫{order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="footer-actions">
                          {rawStatus === 'COMPLETED' ? (
                            <>
                              <button 
                                onClick={() => navigate(`/product/${order.items[0]?.productId}?review=true&orderId=${order.id}`)}
                                style={{ background: '#fff', color: '#ee4d2d', border: '1px solid #ee4d2d', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                <FaStar /> Đánh giá sản phẩm
                              </button>
                              <button 
                                className="buy-again-btn" 
                                onClick={() => navigate(`/product/${order.items[0]?.productId}`)}
                                style={{ background: '#ee4d2d', color: '#fff', border: 'none', cursor: 'pointer' }}
                              >
                                Mua lại
                              </button>
                            </>
                          ) : (
                            <button className="contact-seller-btn" onClick={() => handleChatWithSeller(order.items?.[0]?.sellerId)}>
                               Liên hệ người bán
                            </button>
                          )}
                          
                          {canCancel && (
                            <button 
                              className="cancel-order-btn"
                              onClick={() => handleCancelOrder(order.id)}
                              style={{ background: '#fff', color: '#ee4d2d', border: '1px solid #ee4d2d', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Hủy đơn
                            </button>
                          )}

                          <button className="view-detail-btn" onClick={() => navigate(`/user/order/${order.id}`)}>
                              Xem chi tiết
                          </button>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Purchase;