import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaBoxOpen, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';
import { getMyOrders } from '../../services/orderService';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './OrderHistory.css';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      setToastMessage(err.message || "Không thể tải danh sách đơn hàng.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
    document.title = "Đơn mua | AiNetsoft";
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
    <div className="order-history-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container order-history-container">
        <AccountSidebar />

        <main className="order-history-main">
          <div className="order-tabs">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="orders-content">
            {loading ? (
              <div className="order-empty-state">
                <div className="loading-spinner"></div>
                <p>Đang tải đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="order-empty-state">
                <FaBoxOpen size={60} color="#ddd" />
                <p>Chưa có đơn hàng nào trong mục này</p>
                <button className="go-shopping-btn" onClick={() => navigate('/')}>Mua sắm ngay</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="shop-info">
                      <FaStore />
                      <span className="shop-name">{order.items?.[0]?.shopName || 'Cửa hàng'}</span>
                    </div>
                    <div className="order-status-text">
                      <FaTruck /> {getStatusText(order.status)}
                    </div>
                  </div>

                  <div className="order-card-body">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="order-item-row" onClick={() => navigate(`/product/${item.productId}`)}>
                        <img src={item.imageUrl || "/placeholder.png"} alt={item.productName} />
                        <div className="item-details">
                          <p className="item-name">{item.productName}</p>
                          <p className="item-qty">x{item.quantity}</p>
                        </div>
                        <div className="item-price">₫{item.price?.toLocaleString()}</div>
                      </div>
                    ))}

                    {/* NEW: Shipping Summary to confirm simplified address */}
                    {order.shippingAddress && (
                      <div className="order-shipping-summary">
                        <FaMapMarkerAlt className="icon-map" />
                        <div className="shipping-text">
                          <strong>Giao đến: {order.shippingAddress.receiverName} ({order.shippingAddress.phone})</strong>
                          <p>{order.shippingAddress.detail}, {order.shippingAddress.ward}, {order.shippingAddress.province}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="order-card-footer">
                    <div className="total-row">
                      <span>Thành tiền:</span>
                      <span className="total-amount">₫{order.totalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="action-buttons">
                      {order.status === 'COMPLETED' ? (
                        <button className="btn-primary" onClick={() => navigate('/')}>Mua lại</button>
                      ) : (
                        <button className="btn-secondary">Liên hệ người bán</button>
                      )}
                      <button className="btn-outline">Xem chi tiết</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderHistory;