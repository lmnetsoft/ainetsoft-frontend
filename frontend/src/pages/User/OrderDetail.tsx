import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkerAlt, FaReceipt, FaBoxOpen } from 'react-icons/fa';
import api from '../../services/api';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (err: any) {
        console.error("Failed to fetch order details", err);
        setError("Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrderDetail();
  }, [id]);

  // 🚀 FIXED: Hàm xử lý Object địa chỉ thành chuỗi văn bản để React không bị chết
  const formatAddress = (addr: any) => {
    if (!addr) return "Đang cập nhật địa chỉ...";
    // Nếu nó đã là string sẵn (đề phòng data cũ) thì in ra luôn
    if (typeof addr === 'string') return addr;
    
    // Nếu nó là Object, ghép các thành phần lại với nhau
    const parts = [addr.detail, addr.hamlet, addr.ward, addr.province].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : "Đang cập nhật địa chỉ...";
  };

  if (loading) return <div className="loading-detail">Đang tải thông tin đơn hàng...</div>;
  if (error || !order) return <div className="loading-detail"><h3>Lỗi 404</h3><p>{error}</p><button onClick={() => navigate('/user/purchase')} className="back-btn"><FaArrowLeft /> Quay lại danh sách</button></div>;

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <button className="back-btn" onClick={() => navigate('/user/purchase')}>
          <FaArrowLeft /> TRỞ LẠI
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{color: '#636e72'}}>MÃ ĐƠN HÀNG: <strong>#{order.orderId || order.id}</strong></span>
          <span className="order-status-badge">{order.status}</span>
        </div>
      </div>

      <div className="order-info-grid">
        <div className="info-card">
          <h4><FaMapMarkerAlt /> Địa chỉ nhận hàng</h4>
          {/* 🚀 FIXED: Lấy thông tin từ bên trong Object shippingAddress */}
          <p><strong>{order.shippingAddress?.receiverName || order.receiverName || "Khách hàng"}</strong></p>
          <p>{order.shippingAddress?.phone || order.receiverPhone || order.userPhone || "Chưa cập nhật SĐT"}</p>
          <p>{formatAddress(order.shippingAddress)}</p>
        </div>
        <div className="info-card">
          <h4><FaReceipt /> Thông tin thanh toán</h4>
          <p>Phương thức: <strong>{order.paymentMethod || "COD (Thanh toán khi nhận hàng)"}</strong></p>
          <p>Trạng thái thanh toán: <strong>{order.paymentStatus || "Chưa thanh toán"}</strong></p>
          <p>Ngày đặt: {new Date(order.createdAt || order.orderDate).toLocaleString('vi-VN')}</p>
        </div>
      </div>

      <div className="order-items-list">
        <h4><FaBoxOpen /> Sản phẩm đã đặt</h4>
        {(order.orderItems && order.orderItems.length > 0) ? (
          order.orderItems.map((item: any, idx: number) => (
            <div className="order-item-row" key={idx}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <img src={item.imageUrl ? `http://localhost:8080/api/chat/file/${item.imageUrl}` : "https://via.placeholder.com/60"} alt="product" style={{width: 60, height: 60, borderRadius: 4, objectFit: 'cover'}} />
                <div>
                  <div style={{fontWeight: 600}}>{item.productName}</div>
                  <div style={{color: '#636e72', fontSize: '0.85rem'}}>x{item.quantity}</div>
                </div>
              </div>
              <div style={{fontWeight: 'bold', color: '#ee4d2d'}}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
              </div>
            </div>
          ))
        ) : (
          <div className="order-item-row">
             <p style={{color: '#636e72'}}><i>Đơn hàng này không có danh sách sản phẩm chi tiết.</i></p>
          </div>
        )}
      </div>

      <div className="order-total-section">
        Thành tiền: 
        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount || order.total)}</span>
      </div>
    </div>
  );
};

export default OrderDetail;