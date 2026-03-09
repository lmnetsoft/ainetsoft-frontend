import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaTruck, FaRegClock, FaUser, FaPhoneAlt } from 'react-icons/fa';
import api from '../../services/api'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './SellerOrders.css';

const SellerOrders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const tabs = [
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  useEffect(() => {
    fetchOrders();
    document.title = "Quản lý đơn hàng | AiNetsoft Seller";
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Backend: Calls a filtered list of orders belonging to THIS seller
      const res = await api.get(`/orders/seller?status=${activeTab}`);
      setOrders(res.data);
    } catch (err: any) {
      setToastMessage("Không thể tải danh sách đơn hàng.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.put(`/orders/seller/update-status/${orderId}`, { status: nextStatus });
      setToastMessage(`Đã cập nhật trạng thái: ${nextStatus}`);
      setShowToast(true);
      fetchOrders(); // Refresh
    } catch (err: any) {
      setToastMessage("Lỗi khi cập nhật trạng thái.");
      setShowToast(true);
    }
  };

  return (
    <div className="seller-orders-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container seller-container">
        <AccountSidebar />
        
        <main className="seller-main-content">
          <div className="seller-header">
            <h1>Quản lý Đơn hàng</h1>
            <p>Xử lý và vận chuyển các đơn hàng từ khách hàng của bạn.</p>
          </div>

          {/* STATUS TABS */}
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

          <div className="order-list-section">
            {loading ? (
              <div className="loading-box">Đang tải đơn hàng...</div>
            ) : orders.length === 0 ? (
              <div className="empty-orders-box">
                <FaBox className="empty-icon" />
                <p>Chưa có đơn hàng nào trong mục này.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="seller-order-card">
                  <div className="card-header">
                    <span className="order-id">Mã đơn: #{order.id.slice(-8).toUpperCase()}</span>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>
                      {order.status === 'PENDING' ? 'Chờ xác nhận' : order.status}
                    </span>
                  </div>

                  {/* CUSTOMER INFO */}
                  <div className="customer-info-row">
                    <div className="info-block">
                      <FaUser /> <span>{order.shippingAddress.receiverName}</span>
                    </div>
                    <div className="info-block">
                      <FaPhoneAlt /> <span>{order.shippingAddress.phone}</span>
                    </div>
                  </div>

                  {/* ITEMS LIST */}
                  <div className="order-items">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="order-item-detail">
                        <img src={item.productImage} alt="" />
                        <div className="item-meta">
                          <p className="name">{item.productName}</p>
                          <p className="qty">Số lượng: x{item.quantity}</p>
                        </div>
                        <div className="price">₫{item.price.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  <div className="card-footer">
                    <div className="total-box">
                      <span>Tổng doanh thu:</span>
                      <span className="total-amount">₫{order.totalAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="action-buttons">
                      {order.status === 'PENDING' && (
                        <button 
                          className="btn-confirm"
                          onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}
                        >
                          <FaTruck /> Xác nhận & Giao hàng
                        </button>
                      )}
                      <button className="btn-detail" onClick={() => navigate(`/seller/order/${order.id}`)}>
                        Chi tiết
                      </button>
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

export default SellerOrders;