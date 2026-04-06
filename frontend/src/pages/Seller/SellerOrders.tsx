import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaUser, FaPhoneAlt, FaClipboardList } from 'react-icons/fa';
import api from '../../services/api'; 
// 🚀 REMOVED: AccountSidebar to fix the "Double Menu" issue
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
      // 🚀 SUPREME LOGIC: Replacing the generic message with descriptive errors
      let message = "Không thể kết nối đến máy chủ.";

      if (err.response) {
        // Server responded with an error (401, 403, 500, etc.)
        message = err.response.data?.message || `Lỗi hệ thống (${err.response.status})`;
        
        if (err.response.status === 401) {
          message = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
        }
      } else if (err.request) {
        // Request made but no response (Internet/Network issues)
        message = "Lỗi mạng! Vui lòng kiểm tra kết nối internet của bạn.";
      }

      setToastMessage(message);
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
      // 🚀 SUPREME LOGIC applied here too
      const errMsg = err.response?.data?.message || "Lỗi khi cập nhật trạng thái.";
      setToastMessage(errMsg);
      setShowToast(true);
    }
  };

  return (
    /* 🚀 MASTER WRAPPER: Matches fixed Profile/Bank/Dashboard pages for perfect alignment */
    <div className="seller-orders-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

        <main className="seller-main-content">
          {/* 🚀 SUPREME HEADER: Centered & Red */}
          <div className="seller-header">
            <h1><FaClipboardList style={{verticalAlign: 'middle', marginRight: '10px'}} /> Quản lý Đơn hàng</h1>
            <p>Xử lý và vận chuyển các đơn hàng từ khách hàng của bạn.</p>
          </div>

          {/* Tab bar matching the horizontal Supreme style */}
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
              <div className="loading-box">Đang tải đơn hàng...</div>
            ) : orders.length === 0 ? (
              <div className="empty-orders-box">
                <FaBox style={{fontSize: '3rem', marginBottom: '15px', opacity: 0.2}} />
                <p>Chưa có đơn hàng nào trong mục này.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="seller-order-item-card">
                  <div className="order-item-header">
                    <span className="order-id">Mã đơn: #{order.id.slice(-8).toUpperCase()}</span>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>
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
                        <div className="revenue-total">₫{item.price.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  <div className="order-item-footer">
                    <div className="total-amount">
                      Tổng thu: <span>₫{order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="action-buttons">
                      {order.status === 'PENDING' && (
                        <button className="confirm-btn-seller" onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}>
                          Xác nhận giao hàng
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
  );
};

export default SellerOrders;