import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaUser, FaPhoneAlt, FaClipboardList, FaTimes, FaExclamationTriangle, FaCheck, FaBan, FaSync, FaPlay, FaChevronRight } from 'react-icons/fa';
import api from '../../services/api'; 
import { processReturnOrder } from '../../services/orderService';
import ToastNotification from '../../components/Toast/ToastNotification';
import './SellerOrders.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';
const bitnamilegacy = '/logo.svg';

const SellerOrders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 🚀 ĐÃ SỬA: Mặc định mở Tab Tất Cả
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [previewMedia, setPreviewMedia] = useState<{ url: string, isVideo: boolean } | null>(null);

  // 🚀 ĐÃ BỔ SUNG KEY "ALL"
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    ALL: 0, PENDING: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0, RETURNING: 0
  });

  // 🚀 ĐÃ BỔ SUNG TAB "TẤT CẢ"
  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
    { id: 'RETURNING', label: 'Trả hàng/Hoàn tiền' } 
  ];

  useEffect(() => {
    fetchOrders();
    fetchTabCounts(); 
    document.title = "Quản lý đơn hàng | AiNetsoft Seller";
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/seller?status=${(activeTab === 'RETURNING' || activeTab === 'ALL') ? 'ALL' : activeTab}`);
      let filtered = res.data;
      if (activeTab === 'RETURNING') {
          filtered = res.data.filter((o: any) => o.status === 'RETURNING' || o.status === 'RETURNED');
      }
      setOrders(filtered);
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

  // 🚀 ĐÃ TỐI ƯU HIỆU NĂNG: Chỉ gọi 1 API ALL và tự đếm số lượng cho các tab
  const fetchTabCounts = async () => {
    try {
      const res = await api.get(`/orders/seller?status=ALL`);
      const allData = res.data || [];

      setTabCounts({
        ALL: allData.length,
        PENDING: allData.filter((o: any) => o.status === 'PENDING').length,
        SHIPPING: allData.filter((o: any) => o.status === 'SHIPPING').length,
        COMPLETED: allData.filter((o: any) => o.status === 'COMPLETED').length,
        CANCELLED: allData.filter((o: any) => o.status === 'CANCELLED').length,
        RETURNING: allData.filter((o: any) => o.status === 'RETURNING' || o.status === 'RETURNED').length
      });
    } catch (err) {
      console.warn("Không thể lấy số lượng tóm tắt cho các tab", err);
    }
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await Promise.all([fetchOrders(), fetchTabCounts()]);
      setTimeout(() => setIsRefreshing(false), 500); 
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.put(`/orders/seller/update-status/${orderId}`, { status: nextStatus });
      setToastMessage(`Đã cập nhật trạng thái thành công!`);
      setShowToast(true);
      fetchOrders(); 
      fetchTabCounts(); 
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Lỗi khi cập nhật trạng thái.";
      setToastMessage(errMsg);
      setShowToast(true);
    }
  };

  const handleProcessReturn = async (orderId: string, isApproved: boolean) => {
      if(!window.confirm(`Bạn có chắc muốn ${isApproved ? 'CHẤP NHẬN hoàn tiền' : 'TỪ CHỐI trả hàng'} cho đơn này?`)) return;
      try {
          await processReturnOrder(orderId, isApproved);
          setToastMessage(isApproved ? "Đã chấp nhận hoàn tiền thành công!" : "Đã từ chối trả hàng.");
          setShowToast(true);
          fetchOrders();
          fetchTabCounts();
          setSelectedOrder(null);
      } catch (err: any) {
          setToastMessage(err.message);
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

  const isVideoFile = (url: string) => {
      return url.toLowerCase().match(/\.(mp4|mov|webm|ogg)$/);
  };

  return (
    <div className="seller-orders-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {previewMedia && (
          <div 
              style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100000,
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  backdropFilter: 'blur(5px)'
              }}
              onClick={() => setPreviewMedia(null)}
          >
              <button 
                  onClick={() => setPreviewMedia(null)}
                  style={{
                      position: 'absolute', top: '25px', right: '35px',
                      background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                      fontSize: '24px', cursor: 'pointer', borderRadius: '50%',
                      width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                  <FaTimes />
              </button>
              <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', display: 'flex', justifyContent: 'center' }}>
                  {previewMedia.isVideo ? (
                      <video src={previewMedia.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                  ) : (
                      <img src={previewMedia.url} alt="Phóng to" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                  )}
              </div>
          </div>
      )}

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="seller-review-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '20px', borderRadius: '12px' }}>
            
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', position: 'relative', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', textAlign: 'center' }}>Chi tiết đơn hàng #{selectedOrder.id.slice(-8).toUpperCase()}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', right: '0', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}><FaTimes /></button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
              
              {(selectedOrder.status === 'RETURNING' || selectedOrder.status === 'RETURNED') && (
                  <div style={{ marginBottom: '20px', background: '#fff1f0', padding: '15px', borderRadius: '8px', border: '1px solid #ffccc7' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#cf1322', display: 'flex', alignItems: 'center', gap: '8px' }}><FaExclamationTriangle/> Thông tin khiếu nại / Trả hàng</h4>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Lý do:</strong> {selectedOrder.returnReason}</p>
                      <p style={{ margin: '5px 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}><strong>Mô tả:</strong> {selectedOrder.returnDescription}</p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Số tiền khách yêu cầu hoàn:</strong> <span style={{ color: '#ee4d2d', fontWeight: 'bold' }}>₫{selectedOrder.requestedRefundAmount?.toLocaleString() || selectedOrder.totalAmount?.toLocaleString()}</span></p>
                      
                      {selectedOrder.returnImages && selectedOrder.returnImages.length > 0 && (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                              {selectedOrder.returnImages.map((img: string, i: number) => {
                                  const fileUrl = formatMediaUrl(img);
                                  const isVideo = isVideoFile(fileUrl);
                                  
                                  return (
                                      <div 
                                          key={i} 
                                          onClick={() => setPreviewMedia({ url: fileUrl, isVideo })}
                                          style={{ 
                                              position: 'relative', width: '100px', height: '100px', 
                                              borderRadius: '6px', border: '1px solid #ffa39e', 
                                              overflow: 'hidden', cursor: 'pointer', backgroundColor: '#000' 
                                          }}
                                          title="Click để phóng to"
                                      >
                                          {isVideo ? (
                                              <>
                                                  <video src={fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, pointerEvents: 'none' }} />
                                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>
                                                      <FaPlay />
                                                  </div>
                                              </>
                                          ) : (
                                              <img src={fileUrl} alt="Bằng chứng" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              )}

              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#334155' }}>Thông tin giao hàng</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Người nhận:</strong> {selectedOrder.shippingAddress?.receiverName}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Số điện thoại:</strong> {selectedOrder.shippingAddress?.phone}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress?.detail}, {selectedOrder.shippingAddress?.ward}, {selectedOrder.shippingAddress?.province}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#334155' }}>Sản phẩm đã đặt</h4>
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div 
                      key={idx} 
                      onClick={() => navigate(`/product/${item.productId}`)}
                      style={{ 
                          display: 'flex', gap: '15px', padding: '12px', 
                          borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                          transition: 'background 0.2s', borderRadius: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Click để xem chi tiết sản phẩm"
                  >
                    <img 
                      src={formatMediaUrl(item.productImage || item.imageUrl)} 
                      alt={item.productName} 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = bitnamilegacy; }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: '600', fontSize: '14px', color: '#0055aa' }}>{item.productName}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Số lượng: x{item.quantity}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: '#ee4d2d', fontSize: '15px' }}>₫{item.price?.toLocaleString()}</span>
                      <FaChevronRight color="#cbd5e1" />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedOrder.status === 'RETURNED' ? '#fff1f0' : '#fff5f5', padding: '15px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                <strong style={{ fontSize: '15px', color: '#1e293b' }}>{selectedOrder.status === 'RETURNED' ? 'Số tiền đã hoàn trả:' : 'Tổng thu (Khách đã trả):'}</strong>
                <strong style={{ fontSize: '18px', color: '#ee4d2d' }}>₫{selectedOrder.totalAmount?.toLocaleString()}</strong>
              </div>
            </div>
            
            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
               {selectedOrder.status === 'RETURNING' && (
                   <>
                       <button onClick={() => handleProcessReturn(selectedOrder.id, false)} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', color: '#cf1322', display: 'flex', alignItems: 'center', gap: '5px', transition: 'background 0.2s' }}><FaBan/> Từ chối</button>
                       <button onClick={() => handleProcessReturn(selectedOrder.id, true)} style={{ padding: '10px 20px', background: '#ee4d2d', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', transition: 'background 0.2s' }}><FaCheck/> Chấp nhận hoàn tiền</button>
                   </>
               )}
               <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 24px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#475569', transition: 'background 0.2s' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      <main className="seller-main-content">
        
        <div className="seller-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <h1><FaClipboardList style={{verticalAlign: 'middle', marginRight: '10px'}} /> Quản lý Đơn hàng</h1>
            <p>Xử lý và vận chuyển các đơn hàng từ khách hàng của bạn.</p>
          </div>
          <button 
             onClick={handleRefresh}
             disabled={isRefreshing}
             style={{ 
                 position: 'absolute', right: '0',
                 display: 'flex', alignItems: 'center', gap: '8px', 
                 padding: '8px 16px', background: '#fff', 
                 border: '1px solid #e2e8f0', borderRadius: '6px', 
                 cursor: isRefreshing ? 'wait' : 'pointer', 
                 color: '#ee4d2d', fontWeight: '600',
                 boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                 transition: 'all 0.2s'
             }}
             onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fffaf9'}
             onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
          >
             <FaSync style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }} />
             {isRefreshing ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </button>
        </div>

        <div className="purchase-tabs-container">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`tab-item-seller ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span style={{
                marginLeft: '8px',
                backgroundColor: tabCounts[tab.id] > 0 
                  ? (['PENDING', 'RETURNING'].includes(tab.id) ? '#ee4d2d' : (tab.id === 'ALL' ? '#64748b' : '#3b82f6')) 
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
              <div key={order.id} className="seller-order-item-card" style={{ border: order.status === 'RETURNING' ? '1px solid #ffa39e' : '' }}>
                <div className="order-item-header">
                  <span className="order-id">Mã đơn: #{order.id.slice(-8).toUpperCase()}</span>
                  <span className={`status-pill ${order.status.toLowerCase()}`}>
                     {order.status === 'PENDING' ? 'Chờ xác nhận' : order.status === 'RETURNING' ? 'Đang Y/C Trả hàng' : order.status === 'RETURNED' ? 'Đã Hoàn Tiền' : order.status}
                  </span>
                </div>

                <div className="seller-cust-info">
                  <span><FaUser /> {order.shippingAddress?.receiverName}</span>
                  <span><FaPhoneAlt /> {order.shippingAddress?.phone}</span>
                </div>

                <div className="order-product-list">
                  {order.items.map((item: any, idx: number) => (
                    <div 
                        key={idx} 
                        className="prod-row"
                        onClick={() => navigate(`/product/${item.productId}`)}
                        style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '10px', borderRadius: '6px' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Click để xem chi tiết sản phẩm"
                    >
                      <img 
                        src={formatMediaUrl(item.productImage || item.imageUrl)} 
                        alt={item.productName} 
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = bitnamilegacy; }}
                      />
                      <div className="prod-meta" style={{ flex: 1 }}>
                        <p className="name" style={{ color: '#0055aa' }}>{item.productName}</p>
                        <p className="qty">Số lượng: x{item.quantity}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="revenue-total">₫{item.price.toLocaleString()}</div>
                        <FaChevronRight color="#cbd5e1" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-item-footer">
                  <div className="total-amount">
                     {order.status === 'RETURNED' ? 'Đã Hoàn trả:' : 'Tổng thu:'} <span>₫{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="action-buttons">
                    {order.status === 'PENDING' && (
                      <button className="confirm-btn-seller" onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}>
                        Xác nhận giao hàng
                      </button>
                    )}
                    {order.status === 'RETURNING' && (
                      <button className="confirm-btn-seller" style={{background: '#cf1322'}} onClick={() => setSelectedOrder(order)}>
                        Xử lý Trả Hàng
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
