import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';
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
      const data = await getMyOrders(status);
      setOrders(data);
    } catch (err: any) {
      // If refresh happens, we ignore "Unauthorized" briefly until App.tsx syncs
      if (err.message !== "Unauthorized") {
          setToastMessage(err.message || "Không thể tải danh sách đơn hàng.");
          setShowToast(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a tiny delay to ensure App.tsx initApp() has finished its session check
    const timeoutId = setTimeout(() => {
      fetchOrders(activeTab);
    }, 100);

    document.title = "Đơn mua của tôi | AiNetsoft";
    return () => clearTimeout(timeoutId);
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
        
        <main className="profile-main-content" style={{ padding: '0', background: 'transparent', boxShadow: 'none' }}>
          {/* NAVIGATION TABS - Now horizontal via CSS */}
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
                <img 
                  src="/logo.svg" 
                  alt="Empty" 
                  style={{ opacity: 0.1, width: '100px', marginBottom: '20px' }} 
                />
                <p>Chưa có đơn hàng nào trong mục này.</p>
                <button 
                  className="go-shopping-btn" 
                  onClick={() => navigate('/')}
                  style={{ marginTop: '20px', padding: '12px 30px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
                >
                  Mua sắm ngay
                </button>
              </div>
            ) : (
              <div className="order-cards-wrapper">
                {orders.map(order => (
                  <div key={order.id} className="order-card-item">
                    <div className="order-item-header">
                      <div className="shop-name-group">
                        <FaStore className="icon-orange" />
                        <strong>{order.items?.[0]?.shopName || 'Cửa hàng'}</strong>
                        <button className="chat-btn" style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '12px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '2px' }}>Chat</button>
                      </div>
                      <div className="status-tag">
                        <FaTruck /> {getStatusText(order.status)}
                      </div>
                    </div>

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
                          {order.status === 'COMPLETED' ? (
                            <button className="buy-again-btn" style={{ background: '#ee4d2d', color: '#fff', border: 'none' }}>Mua lại</button>
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