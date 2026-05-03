import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaUser, FaPhoneAlt, FaClipboardList, FaTimes } from 'react-icons/fa';
import api from '../../services/api'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import './SellerOrders.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';
const bitnamilegacy = '/logo.svg';

const SellerOrders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // 🚀 TÍNH NĂNG MỚI: State lưu trữ số lượng đơn hàng của từng Tab
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    PENDING: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0
  });

  const tabs = [
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  useEffect(() => {
    fetchOrders();
    fetchTabCounts(); // 🚀 Gọi đếm số lượng mỗi khi chuyển Tab để dữ liệu luôn mới nhất
    document.title = "Quản lý đơn hàng | AiNetsoft Seller";
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/seller?status=${activeTab}`);
      setOrders(res.data);
    } catch (err: any) {
      let message = "Không thể kết nối đến máy chủ.";

      if (err.response) {
        message = err.response.data?.message || `Lỗi hệ thống (${err.response.status})`;
        if (err.response.status === 401) {
          message = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
        }
      } else if (err.request) {
        message = "Lỗi mạng! Vui lòng kiểm tra kết nối internet của bạn.";
      }

      setToastMessage(message);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 TÍNH NĂNG MỚI: Hàm chạy ngầm đếm số lượng tất cả các Tab
  const fetchTabCounts = async () => {
    try {
      const statuses = ['PENDING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
      // Gọi API song song cho tất cả các trạng thái để lấy độ dài (số lượng)
      const promises = statuses.map(status => api.get(`/orders/seller?status=${status}`));
      const results = await Promise.all(promises);

      const newCounts: Record<string, number> = {};
      statuses.forEach((status, index) => {
        newCounts[status] = results[index].data.length;
      });
      setTabCounts(newCounts);
    } catch (err) {
      console.warn("Không thể lấy số lượng tóm tắt cho các tab", err);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.put(`/orders/seller/update-status/${orderId}`, { status: nextStatus });
      setToastMessage(`Đã cập nhật trạng thái thành công!`);
      setShowToast(true);
      fetchOrders(); 
      fetchTabCounts(); // 🚀 Cập nhật lại số lượng ngay khi thao tác duyệt đơn xong
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Lỗi khi cập nhật trạng thái.";
      setToastMessage(errMsg);
      setShowToast(true);
    }
  };

  const formatMediaUrl = (media: any) => {
    if (!media) return bitnamilegacy;
    
    let url = '';
    if (typeof media === 'string') {
        url = media;
    } else if (typeof media === 'object') {
        url = media.url || media.preview || media.filepath || '';
        if (!url && media instanceof File) {
            url = URL.createObjectURL(media);
        }
    }

    if (!url || url === 'undefined' || url === 'null' || url.trim() === '') return bitnamilegacy;
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}${cleanPath}`;
  };

  return (
    <div className="seller-orders-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="seller-review-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '20px', borderRadius: '12px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Chi tiết đơn hàng #{selectedOrder.id.slice(-8).toUpperCase()}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}><FaTimes /></button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#334155' }}>Thông tin giao hàng</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Người nhận:</strong> {selectedOrder.shippingAddress?.receiverName}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Số điện thoại:</strong> {selectedOrder.shippingAddress?.phone}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress?.detail}, {selectedOrder.shippingAddress?.ward}, {selectedOrder.shippingAddress?.province}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#334155' }}>Sản phẩm đã đặt</h4>
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <img 
                      src={formatMediaUrl(item.productImage || item.imageUrl)} 
                      alt={item.productName} 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = bitnamilegacy; }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{item.productName}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Số lượng: x{item.quantity}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#ee4d2d', fontSize: '15px' }}>
                      ₫{item.price?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', padding: '15px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Tổng thu (Khách đã trả):</strong>
                <strong style={{ fontSize: '18px', color: '#ee4d2d' }}>₫{selectedOrder.totalAmount?.toLocaleString()}</strong>
              </div>
            </div>
            
            <div className="modal-footer" style={{ marginTop: '20px', textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
               <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 24px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#475569', transition: 'background 0.2s' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      <main className="seller-main-content">
        <div className="seller-header">
          <h1><FaClipboardList style={{verticalAlign: 'middle', marginRight: '10px'}} /> Quản lý Đơn hàng</h1>
          <p>Xử lý và vận chuyển các đơn hàng từ khách hàng của bạn.</p>
        </div>

        <div className="purchase-tabs-container">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`tab-item-seller ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              
              {/* 🚀 GIAO DIỆN HIỂN THỊ BADGE SỐ LƯỢNG */}
              <span style={{
                marginLeft: '8px',
                backgroundColor: tabCounts[tab.id] > 0 
                  ? (tab.id === 'PENDING' ? '#ee4d2d' : '#3b82f6') 
                  : '#e2e8f0',
                color: tabCounts[tab.id] > 0 ? '#ffffff' : '#64748b',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                transition: 'all 0.3s'
              }}>
                {tabCounts[tab.id]}
              </span>
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
                      <img 
                        src={formatMediaUrl(item.productImage || item.imageUrl)} 
                        alt={item.productName} 
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = bitnamilegacy; }}
                      />
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
                    <button className="btn-detail" onClick={() => setSelectedOrder(order)}>
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