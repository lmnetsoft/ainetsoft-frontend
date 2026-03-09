import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaTruck, FaUser, FaPhoneAlt, FaClipboardList } from 'react-icons/fa';
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
      setToastMessage(`Đã cập nhật trạng thái thành công!`);
      setShowToast(true);
      fetchOrders(); 
    } catch (err: any) {
      setToastMessage("Lỗi khi cập nhật trạng thái.");
      setShowToast(true);
    }
  };

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="profile-main-content">
          <div className="content-header">
            <h1><FaClipboardList /> Quản lý Đơn hàng</h1>
            <p>Xử lý và vận chuyển các đơn hàng từ khách hàng của bạn.</p>
          </div>

          <hr className="divider" />

          {/* Tab bar matching the horizontal Profile style */}
          <div className="purchase-tabs-container">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`tab-item-seller ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="order-list-content">
            {loading ? (
              <div className="loading-state-placeholder">Đang tải đơn hàng...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state-seller">
                <FaBox className="empty-icon" />
                <p>Chưa có đơn hàng nào trong mục này.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="seller-order-item-card">
                  <div className="order-item-header">
                    <span className="order-id">Mã đơn: #{order.id.slice(-8).toUpperCase()}</span>
                    <span className={`status-tag ${order.status.toLowerCase()}`}>
                       {order.status === 'PENDING' ? 'Chờ xác nhận' : order.status}
                    </span>
                  </div>

                  <div className="seller-cust-info">
                    <span><FaUser /> {order.shippingAddress?.receiverName}</span>
                    <span><FaPhoneAlt /> {order.shippingAddress?.phone}</span>
                  </div>

                  <div className="order-product-list">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="prod-row">
                        <img src={item.productImage || "/placeholder.png"} alt={item.productName} />
                        <div className="prod-meta">
                          <p className="name">{item.productName}</p>
                          <p className="qty">Số lượng: x{item.quantity}</p>
                        </div>
                        <div className="price">₫{item.price.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  <div className="order-item-footer">
                    <div className="revenue-total">
                      Tổng thu: <span>₫{order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="btn-group">
                      {order.status === 'PENDING' && (
                        <button className="confirm-btn-seller" onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}>
                          Xác nhận giao hàng
                        </button>
                      )}
                      <button className="detail-btn-seller" onClick={() => navigate(`/seller/order/${order.id}`)}>
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