import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaTruck, FaMapMarkerAlt, FaStar, FaCommentDots, FaCheckCircle, FaClipboardList } from 'react-icons/fa';
import { getMyOrders, cancelOrder } from '../../services/orderService';
import { confirmOrderReceived } from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext';
import './Profile.css';
import './Purchase.css'; 

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const Purchase = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [allOrders, setAllOrders] = useState<any[]>([]); 
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([]); 
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

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders('ALL');
      setAllOrders(data);
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
    fetchAllOrders();
    document.title = "Đơn mua của tôi | AiNetsoft";
  }, []);

  useEffect(() => {
    if (activeTab === 'ALL') {
      setDisplayedOrders(allOrders);
    } else {
      setDisplayedOrders(allOrders.filter(order => {
        const s = order.status ? order.status.toString().trim().toUpperCase() : '';
        return s === activeTab;
      }));
    }
  }, [activeTab, allOrders]);

  const getTabCount = (tabId: string) => {
    if (tabId === 'ALL') return allOrders.length;
    return allOrders.filter(order => {
       const s = order.status ? order.status.toString().trim().toUpperCase() : '';
       return s === tabId;
    }).length;
  };

  const getStatusText = (status: string) => {
    const s = status ? status.toString().trim().toUpperCase() : '';
    switch (s) {
      case 'PENDING': return 'CHỜ XÁC NHẬN';
      case 'CONFIRMED': return 'ĐÃ XÁC NHẬN';
      case 'PROCESSING': return 'ĐANG XỬ LÝ';
      case 'SHIPPING': return 'ĐANG GIAO HÀNG';
      case 'COMPLETED': return 'HOÀN THÀNH';
      case 'CANCELLED': return 'Đã HỦY';
      default: return status || 'CHỜ XÁC NHẬN';
    }
  };

  const getCarrierStatusText = (carrierStatus: string) => {
    if (!carrierStatus) return "Đang cập nhật...";
    switch(carrierStatus.toUpperCase()) {
      case 'PICKED_UP': return "Đã lấy hàng";
      case 'IN_TRANSIT': return "Đang trung chuyển";
      case 'DELIVERED': return "Đã giao thành công";
      default: return carrierStatus;
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
      fetchAllOrders(); 
    } catch (err: any) {
      setToastMessage(err.message || "Không thể hủy đơn hàng.");
      setShowToast(true);
    }
  };

  const handleConfirmReceipt = async (orderId: string) => {
    if (!window.confirm('Xác nhận bạn đã nhận được hàng và sản phẩm không có vấn đề gì? Tiền sẽ được chuyển cho người bán.')) {
      return;
    }
    try {
      await confirmOrderReceived(orderId);
      setToastMessage("🎉 Xác nhận thành công! Bạn đã được nhận Xu và có thể Đánh giá sản phẩm.");
      setShowToast(true);
      fetchAllOrders(); 
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || err.message || "Có lỗi xảy ra khi xác nhận.");
      setShowToast(true);
    }
  };

  return (
    <div className="user-page-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <main className="purchase-main-view" style={{ width: '100%' }}>
        <div className="purchase-tabs-container">
          {tabs.map(tab => {
            const count = getTabCount(tab.id); 
            return (
              <div 
                key={tab.id}
                className={`purchase-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label} {count > 0 && <span style={{ marginLeft: '6px', fontSize: '13px', color: activeTab === tab.id ? '#ee4d2d' : '#888' }}>({count})</span>}
              </div>
            );
          })}
        </div>

        <div className="purchase-list-content">
          {loading ? (
            <div className="profile-container-loading">
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '15px' }}>Đang tìm kiếm đơn hàng...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="purchase-empty-state" style={{ background: '#fff', padding: '100px 0', textAlign: 'center' }}>
              <img src="/logo.svg" alt="Empty" style={{ opacity: 0.1, width: '100px', marginBottom: '20px' }} />
              <p>Chưa có đơn hàng nào trong mục này.</p>
              <button className="go-shopping-btn" onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '12px 30px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>
                Mua sắm ngay
              </button>
            </div>
          ) : (
            <div className="order-cards-wrapper">
              {displayedOrders.map(order => { 
                const rawStatus = order.status ? order.status.toString().trim().toUpperCase() : '';
                const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING', 'UNPAID', ''].includes(rawStatus);

                return (
                  <div key={order.id} className="order-card-item" style={{ border: '1px solid #e5e5e5', marginBottom: '15px', background: '#fff' }}>
                    <div className="order-item-header" style={{ padding: '15px', borderBottom: '1px solid #f1f1f1', display: 'flex', justifyContent: 'space-between' }}>
                      <div className="shop-name-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaStore className="icon-orange" color="#ee4d2d" />
                        <strong>{order.items?.[0]?.shopName || 'Cửa hàng AiNetsoft'}</strong>
                        <button 
                          className="chat-btn" 
                          onClick={() => handleChatWithSeller(order.items?.[0]?.sellerId)}
                          style={{ padding: '4px 8px', fontSize: '12px', background: 'none', color: '#ee4d2d', border: '1px solid #ee4d2d', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FaCommentDots /> Chat
                        </button>
                      </div>
                      <div className="status-tag" style={{ color: '#ee4d2d', fontWeight: 'bold' }}>
                        <FaTruck style={{ marginRight: '5px' }}/> {getStatusText(order.status)}
                      </div>
                    </div>

                    <div className="order-item-body" style={{ padding: '15px' }}>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="item-row" onClick={() => navigate(`/product/${item.productId}`)} style={{ display: 'flex', marginBottom: '15px', cursor: 'pointer' }}>
                           <img 
                              src={bitnamilegacy(item.imageUrl)} 
                              alt={item.productName} 
                              className="item-thumb" 
                              style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #eee' }}
                              onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                           />
                           <div className="item-info" style={{ marginLeft: '15px', flex: 1 }}>
                              <p className="item-title" style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{item.productName}</p>
                              <p className="item-count" style={{ color: '#757575', margin: 0 }}>x{item.quantity}</p>
                           </div>
                           <div className="item-price-info" style={{ textAlign: 'right' }}>
                              <span className="current-price" style={{ color: '#ee4d2d', fontWeight: 'bold' }}>₫{item.price?.toLocaleString()}</span>
                           </div>
                        </div>
                      ))}

                      {order.shippingAddress && (
                        <div className="order-shipping-summary" style={{ background: '#fcfcfc', padding: '10px', marginTop: '10px', fontSize: '13px', color: '#555', borderLeft: '3px solid #ee4d2d' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <FaMapMarkerAlt color="#ee4d2d" />
                            <strong>Giao đến: {order.shippingAddress.receiverName} ({order.shippingAddress.phone})</strong>
                          </div>
                          <p style={{ margin: '0 0 10px 24px' }}>{order.shippingAddress.detail}, {order.shippingAddress.ward}, {order.shippingAddress.province}</p>
                          
                          {(order.trackingCode || rawStatus === 'SHIPPING') && (
                            <div style={{ borderTop: '1px dashed #ddd', paddingTop: '10px', marginTop: '10px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00bfa5', fontWeight: 'bold' }}>
                                 <FaClipboardList /> Thông tin Vận chuyển:
                               </div>
                               <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                 <span>Đơn vị: <strong>{order.shippingProvider || 'Đang cập nhật'}</strong></span><br/>
                                 <span>Mã vận đơn: <strong>{order.trackingCode || 'Đang chờ điều phối'}</strong></span><br/>
                                 <span>Trạng thái: <strong style={{ color: order.carrierStatus === 'DELIVERED' ? '#ee4d2d' : '#00bfa5' }}>{getCarrierStatusText(order.carrierStatus)}</strong></span>
                               </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="order-item-footer" style={{ borderTop: '1px solid #f1f1f1', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="total-display" style={{ alignSelf: 'flex-end', fontSize: '18px' }}>
                          <span style={{ fontSize: '14px', color: '#555' }}>Thành tiền: </span>
                          <span className="grand-total" style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '20px' }}>₫{order.finalTotalAmount?.toLocaleString() || order.totalAmount?.toLocaleString()}</span>
                        </div>
                        
                        <div className="footer-actions purchase-action-buttons">
                          {rawStatus === 'SHIPPING' && (
                            <button 
                                className={`purchase-btn btn-primary ${order.carrierStatus !== 'DELIVERED' ? 'disabled' : ''}`}
                                disabled={order.carrierStatus !== 'DELIVERED'}
                                onClick={() => handleConfirmReceipt(order.id)}
                                title={order.carrierStatus !== 'DELIVERED' ? 'Chỉ có thể xác nhận khi đơn vị vận chuyển đã giao hàng' : ''}>
                                <FaCheckCircle style={{ marginRight: '6px' }} /> Đã nhận được hàng
                            </button>
                          )}

                          {rawStatus === 'COMPLETED' ? (
                            <>
                              <button 
                                onClick={() => navigate(`/product/${order.items[0]?.productId}?review=true&orderId=${order.id}`)}
                                className="purchase-btn btn-outline"
                              >
                                <FaStar style={{ marginRight: '6px' }} /> Đánh giá sản phẩm
                              </button>
                              <button 
                                className="purchase-btn btn-primary" 
                                onClick={() => navigate(`/product/${order.items[0]?.productId}`)}
                              >
                                Mua lại
                              </button>
                            </>
                          ) : (
                            <button 
                              className="purchase-btn btn-secondary" 
                              onClick={() => handleChatWithSeller(order.items?.[0]?.sellerId)}
                            >
                               Liên hệ người bán
                            </button>
                          )}
                          
                          {canCancel && (
                            <button 
                              className="purchase-btn btn-secondary"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              Hủy đơn
                            </button>
                          )}

                          <button 
                             className="purchase-btn btn-secondary" 
                             onClick={() => navigate(`/user/order/${order.id}`)}
                          >
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