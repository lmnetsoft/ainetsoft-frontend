import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaTruck, FaMapMarkerAlt, FaStar, FaCommentDots, FaCheckCircle, FaClipboardList, FaUndoAlt, FaBox, FaTimes, FaCamera } from 'react-icons/fa';
import { getMyOrders, cancelOrder, requestReturnOrder } from '../../services/orderService';
import { confirmOrderReceived } from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext';
import './Profile.css';
import './Purchase.css'; 

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const Purchase = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [allOrders, setAllOrders] = useState<any[]>([]); // 🚀 CHỨA TẤT CẢ ĐƠN HÀNG
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([]); // 🚀 CHỨA ĐƠN HÀNG CỦA TAB HIỆN TẠI
  const [loading, setLoading] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { setIsChatOpen } = useChat();

  // 🚀 STATE CHO TRẢ HÀNG
  const [stepReturn, setStepReturn] = useState(0); // 0: Đóng, 1: Chọn Tình Huống, 2: Nhập Form
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDesc, setReturnDesc] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
    { id: 'RETURN', label: 'Trả hàng/Hoàn tiền' } // 🚀 Tab Mới
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
    } else if (activeTab === 'RETURN') {
      // 🚀 Nhóm cả đơn đang yêu cầu trả và đơn đã được hoàn tiền vào 1 tab
      setDisplayedOrders(allOrders.filter(order => ['RETURNING', 'RETURNED'].includes(order.status?.toString().trim().toUpperCase())));
    } else {
      setDisplayedOrders(allOrders.filter(order => {
        const s = order.status ? order.status.toString().trim().toUpperCase() : '';
        return s === activeTab;
      }));
    }
  }, [activeTab, allOrders]);

  const getTabCount = (tabId: string) => {
    if (tabId === 'ALL') return allOrders.length;
    if (tabId === 'RETURN') return allOrders.filter(order => ['RETURNING', 'RETURNED'].includes(order.status?.toString().trim().toUpperCase())).length;
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
      case 'RETURNING': return 'ĐANG YÊU CẦU TRẢ HÀNG';
      case 'RETURNED': return 'ĐÃ HOÀN TIỀN';
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

  // 🚀 XỬ LÝ TRẢ HÀNG
  const handleOpenReturnModal = (order: any) => {
      setSelectedReturnOrder(order);
      setStepReturn(1); 
  };

  const submitReturnRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!returnReason || !returnDesc) return;
      try {
          setIsSubmittingReturn(true);
          await requestReturnOrder(selectedReturnOrder.id, { reason: returnReason, description: returnDesc, images: returnImages });
          setToastMessage("Yêu cầu trả hàng của bạn đã được gửi tới Người bán.");
          setShowToast(true);
          setStepReturn(0);
          fetchAllOrders();
      } catch (err: any) {
          setToastMessage(err.message);
          setShowToast(true);
      } finally {
          setIsSubmittingReturn(false);
      }
  };

  // Giả lập upload ảnh (Vì chưa có API upload ảnh riêng)
  const handleImageMockUpload = () => {
      setReturnImages([...returnImages, "/logo.svg"]); 
  };

  return (
    <div className="user-page-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* 🚀 MODAL 1: CHỌN TÌNH HUỐNG */}
      {stepReturn === 1 && (
         <div className="return-modal-overlay">
            <div className="return-modal-card">
               <div className="rm-header">
                  <h3>Tình huống bạn đang gặp?</h3>
                  <button onClick={() => setStepReturn(0)}><FaTimes/></button>
               </div>
               <div className="rm-body situation-list">
                  <div className="situation-card" onClick={() => setStepReturn(2)}>
                     <FaUndoAlt className="sit-icon" />
                     <div>
                        <strong>Tôi đã nhận hàng nhưng hàng có vấn đề</strong>
                        <p>Bể vỡ, sai mẫu, hàng lỗi, khác mô tả...</p>
                     </div>
                  </div>
                  <div className="situation-card" onClick={() => setStepReturn(2)}>
                     <FaBox className="sit-icon" />
                     <div>
                        <strong>Tôi chưa nhận hàng / nhận thiếu hàng</strong>
                        <p>Shopee Xu, Voucher sẽ được hoàn lại nếu yêu cầu hợp lệ.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* 🚀 MODAL 2: ĐIỀN FORM HOÀN TIỀN */}
      {stepReturn === 2 && (
         <div className="return-modal-overlay">
            <div className="return-modal-card large">
               <div className="rm-header">
                  <h3><FaUndoAlt/> Chọn sản phẩm cần Trả hàng và Hoàn tiền</h3>
                  <button onClick={() => setStepReturn(0)}><FaTimes/></button>
               </div>
               <form onSubmit={submitReturnRequest} className="rm-body form-body">
                  <div className="form-group">
                     <label>Lý do *</label>
                     <select value={returnReason} onChange={e => setReturnReason(e.target.value)} required>
                        <option value="">Chọn Lý Do</option>
                        <option value="Hàng lỗi, không hoạt động">Hàng lỗi, không hoạt động</option>
                        <option value="Khác với mô tả">Khác với mô tả</option>
                        <option value="Thiếu hàng/Phụ kiện">Thiếu hàng/Phụ kiện</option>
                        <option value="Hàng bể vỡ">Hàng bể vỡ do vận chuyển</option>
                     </select>
                  </div>
                  <div className="form-group">
                     <label>Mô tả chi tiết *</label>
                     <textarea value={returnDesc} onChange={e => setReturnDesc(e.target.value)} placeholder="Chi tiết vấn đề bạn gặp phải..." required rows={4}></textarea>
                  </div>
                  <div className="form-group">
                     <label>Thêm hình ảnh (Bằng chứng)</label>
                     <div className="upload-box" onClick={handleImageMockUpload}>
                        <FaCamera size={24} color="#ee4d2d" />
                        <span>Thêm ảnh ({returnImages.length}/5)</span>
                     </div>
                  </div>
                  
                  <div className="refund-summary-box">
                     <p>Số tiền hoàn lại tối đa: <strong>₫{selectedReturnOrder?.finalTotalAmount?.toLocaleString()}</strong></p>
                     <p>Hoàn tiền vào: Tài khoản/Ví hệ thống</p>
                  </div>

                  <div className="rm-footer">
                     <button type="button" className="btn-cancel" onClick={() => setStepReturn(1)}>Trở lại</button>
                     <button type="submit" className="btn-submit" disabled={isSubmittingReturn}>Hoàn thành</button>
                  </div>
               </form>
            </div>
         </div>
      )}

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
                // 🚀 HIỆN NÚT TRẢ HÀNG KHI HÀNG VỪA GIAO HOẶC MỚI HOÀN THÀNH
                const canReturn = (rawStatus === 'SHIPPING' && order.carrierStatus === 'DELIVERED') || rawStatus === 'COMPLETED';

                return (
                  <div key={order.id} className="order-card-item" style={{ border: (rawStatus === 'RETURNING' || rawStatus === 'RETURNED') ? '1px solid #ffccc7' : '1px solid #e5e5e5', marginBottom: '15px', background: '#fff' }}>
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
                        {rawStatus === 'RETURNED' || rawStatus === 'RETURNING' ? '' : <FaTruck style={{ marginRight: '5px' }}/>} 
                        {getStatusText(rawStatus)}
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
                          <span style={{ fontSize: '14px', color: '#555' }}>
                              {rawStatus === 'RETURNED' ? 'Tổng tiền hoàn:' : 'Thành tiền:'} 
                          </span>
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

                          {/* 🚀 NÚT TRẢ HÀNG / HOÀN TIỀN */}
                          {canReturn && (
                             <button 
                                className="purchase-btn btn-outline" 
                                onClick={() => handleOpenReturnModal(order)}
                             >
                                 <FaUndoAlt style={{ marginRight: '6px' }}/> Trả hàng/Hoàn tiền
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