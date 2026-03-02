import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaBoxOpen, FaTruck, FaMapMarkerAlt } from 'react-icons/fa'; // Added FaMapMarkerAlt
// Centralized Service
import { getMyOrders } from '../../services/orderService';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './Profile.css';
import './Purchase.css'; 

const Purchase = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  const fetchOrders = async (status: string) => {
    try {
      setLoading(true);
      // Fetching from our session-aware service
      const data = await getMyOrders(status);
      setOrders(data);
    } catch (err: any) {
      setToastMessage(err.message || "Không thể tải danh sách đơn hàng.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
    document.title = "Đơn mua của tôi | AiNetsoft";
  }, [activeTab]);

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'CHỜ XÁC NHẬN';
      case 'SHIPPING': return 'ĐANG GIAO HÀNG';
      case 'COMPLETED': return 'HOÀN THÀNH';
      case 'CANCELLED': return 'ĐÃ HỦY';
      default: return status;
    }
  };

  return (
    <div className="profile-wrapper">
      <ToastNotification 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="profile-main-content">
          {/* NAVIGATION TABS */}
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
              <div className="purchase-loading">
                 <div className="loading-spinner"></div>
                 <p>Đang tìm kiếm đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="purchase-empty-state">
                <img 
                  src="/logo.svg" 
                  alt="Empty" 
                  className="purchase-empty-img" 
                  style={{ opacity: 0.3, width: '100px' }}
                />
                <p>Chưa có đơn hàng nào trong mục này.</p>
                <button 
                  className="go-shopping-btn" 
                  onClick={() => navigate('/')}
                  style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Mua sắm ngay
                </button>
              </div>
            ) : (
              <div className="order-cards-wrapper">
                {orders.map(order => (
                  <div key={order.id} className="order-card-item">
                    {/* Header: Shop name & Status */}
                    <div className="order-item-header">
                      <div className="shop-name-group">
                        <FaStore className="icon-orange" />
                        <strong>{order.items?.[0]?.shopName || 'Cửa hàng'}</strong>
                        <button className="chat-btn">Chat</button>
                      </div>
                      <div className="status-tag">
                        <FaTruck /> {getStatusText(order.status)}
                      </div>
                    </div>

                    <hr className="order-divider" />

                    {/* Body: Products in this order */}
                    <div className="order-item-body">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="item-row" onClick={() => navigate(`/product/${item.productId}`)}>
                           <img src={item.imageUrl || "/placeholder.png"} alt={item.productName} className="item-thumb" />
                           <div className="item-info">
                              <p className="item-title">{item.productName}</p>
                              <p className="item-count">x{item.quantity}</p>
                           </div>
                           <div className="item-price-info">
                              <span className="current-price">₫{item.price?.toLocaleString()}</span>
                           </div>
                        </div>
                      ))}

                      {/* NEW: Shipping Summary Block */}
                      {order.shippingAddress && (
                        <div className="order-shipping-summary">
                          <FaMapMarkerAlt className="icon-orange" style={{ fontSize: '1.1rem', marginTop: '3px' }} />
                          <div className="shipping-text">
                            <strong>Giao đến: {order.shippingAddress.receiverName} ({order.shippingAddress.phone})</strong>
                            <p>{order.shippingAddress.detail}, {order.shippingAddress.ward}, {order.shippingAddress.province}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <hr className="order-divider" />

                    {/* Footer: Total and Actions */}
                    <div className="order-item-footer">
                        <div className="total-display">
                          <span>Thành tiền: </span>
                          <span className="grand-total">₫{order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="footer-actions">
                          {order.status === 'COMPLETED' ? (
                            <button className="buy-again-btn">Mua lại</button>
                          ) : (
                            <button className="contact-seller-btn">Liên hệ người bán</button>
                          )}
                          <button className="view-detail-btn" onClick={() => navigate(`/user/order/${order.id}`)}>
                              Xem chi tiết đơn hàng
                          </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Purchase;