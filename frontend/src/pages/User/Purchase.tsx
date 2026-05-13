import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaStore, FaTruck, FaMapMarkerAlt, FaStar, FaCommentDots, FaCheckCircle, FaClipboardList, FaUndoAlt, FaBox, FaTimes, FaCamera, FaExclamationCircle, FaChevronRight, FaChevronLeft, FaSync, FaPlay, FaLink, FaCopy, FaRegCircle } from 'react-icons/fa';
import { getMyOrders, requestReturnOrder } from '../../services/orderService';
import { confirmOrderReceived } from '../../services/api';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext';
import './Profile.css';
import './Purchase.css'; 

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const Purchase = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // 🚀 Dùng để lấy param từ URL
  const [activeTab, setActiveTab] = useState('ALL');
  const [allOrders, setAllOrders] = useState<any[]>([]); 
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { setIsChatOpen } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stepReturn, setStepReturn] = useState(0); 
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<any>(null);
  const [showReturnDetail, setShowReturnDetail] = useState(false);
  
  const [showBankDetails, setShowBankDetails] = useState(false);

  const [returnReason, setReturnReason] = useState('');
  const [returnDesc, setReturnDesc] = useState('');
  
  const [returnImages, setReturnImages] = useState<File[]>([]); 
  const [returnVideo, setReturnVideo] = useState<File | null>(null); 
  const [previewMedia, setPreviewMedia] = useState<{ url: string, isVideo: boolean } | null>(null);
  
  const [userEmail, setUserEmail] = useState('');
  const [userBank, setUserBank] = useState<any>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const [showEditAmountModal, setShowEditAmountModal] = useState(false);
  const [customRefundAmount, setCustomRefundAmount] = useState(0); 
  const [inputAmount, setInputAmount] = useState(''); 

  const [showPriceBreakdown, setShowPriceBreakdown] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(5); 

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
    { id: 'RETURN', label: 'Trả hàng/Hoàn tiền' } 
  ];

  const bitnamilegacy = (url?: string) => {
    if (!url || url === "/placeholder.png") return url;
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

  const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
          const data = await getMyOrders('ALL');
          setAllOrders(data);
      } catch (err) {
          console.error(err);
      } finally {
          setTimeout(() => setIsRefreshing(false), 500); 
      }
  };

  const fetchUserProfileAndBank = async () => {
    try {
      const profileRes = await api.get('/auth/me');
      if (profileRes.data) {
          setUserEmail(profileRes.data.email || '');
          const bankRes = await api.get(`/bank-accounts/user/${profileRes.data.id}`);
          if (bankRes.data && bankRes.data.length > 0) {
              const defaultBank = bankRes.data.find((b: any) => b.isDefault) || bankRes.data[0];
              setUserBank(defaultBank);
          }
      }
    } catch (e) {
      console.warn("Không thể tải thông tin hồ sơ/ngân hàng bổ trợ.");
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchUserProfileAndBank();
    document.title = "Đơn mua của tôi | AiNetsoft";
  }, []);

  // 🚀 LOGIC XỬ LÝ PAYMENT CALLBACK (WEBHOOK TỪ VNPAY)
  useEffect(() => {
      const responseCode = searchParams.get('vnp_ResponseCode');
      const orderId = searchParams.get('vnp_TxnRef');
      const transactionNo = searchParams.get('vnp_TransactionNo');

      if (responseCode && orderId) {
          const processPaymentCallback = async () => {
              try {
                  // Gọi API báo Backend cập nhật trạng thái đơn hàng
                  await api.post('/orders/payment-callback', {
                      orderId: orderId,
                      responseCode: responseCode,
                      transactionNo: transactionNo || ''
                  });

                  if (responseCode === '00') {
                      setToastMessage("🎉 Thanh toán thành công! Người bán đang chuẩn bị hàng cho bạn.");
                  } else {
                      setToastMessage("❌ Thanh toán thất bại hoặc đã bị hủy.");
                  }
                  setShowToast(true);

                  // Dọn dẹp URL sạch sẽ để chống F5 lặp lại request
                  const paramsToRemove = ['vnp_ResponseCode', 'vnp_TxnRef', 'vnp_TransactionNo', 'vnp_Amount', 'vnp_BankCode', 'vnp_OrderInfo', 'vnp_PayDate', 'vnp_TmnCode'];
                  paramsToRemove.forEach(param => searchParams.delete(param));
                  setSearchParams(searchParams, { replace: true });

                  // Làm mới danh sách đơn hàng để thấy trạng thái PENDING
                  fetchAllOrders();

              } catch (err: any) {
                  setToastMessage(err.response?.data?.message || "Lỗi cập nhật giao dịch.");
                  setShowToast(true);
              }
          };

          processPaymentCallback();
      }
  }, []); // Chỉ chạy 1 lần khi load component

  useEffect(() => {
    setCurrentPage(1); 
    const sortedOrders = [...allOrders].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
    });

    if (activeTab === 'ALL') {
      setDisplayedOrders(sortedOrders);
    } else if (activeTab === 'RETURN') {
      setDisplayedOrders(sortedOrders.filter(order => ['RETURNING', 'RETURNED'].includes(order.status?.toString().trim().toUpperCase())));
    } else {
      setDisplayedOrders(sortedOrders.filter(order => {
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
      case 'PENDING_PAYMENT': return 'CHỜ THANH TOÁN';
      case 'PENDING': return 'CHỜ XÁC NHẬN';
      case 'CONFIRMED': return 'ĐÃ XÁC NHẬN';
      case 'PROCESSING': return 'ĐANG XỬ LÝ';
      case 'SHIPPING': return 'ĐANG GIAO HÀNG';
      case 'COMPLETED': return 'HOÀN THÀNH';
      case 'CANCELLED': return 'ĐÃ HỦY';
      case 'RETURNING': return 'ĐANG YÊU CẦU TRẢ HÀNG';
      case 'RETURNED': return 'ĐÃ HOÀN TIỀN';
      default: return status || 'CHỜ XÁC NHẬN';
    }
  };

  const handleChatWithSeller = (sellerId: string) => {
    if (sellerId) {
      localStorage.setItem('currentChatRecipient', sellerId);
      setIsChatOpen(true);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Vui lòng nhập lý do hủy đơn hàng (hoặc để trống):');
    if (reason === null) return; 

    try {
      await api.put(`/orders/${orderId}/cancel`, { cancelReason: reason });
      setToastMessage("Hủy đơn hàng thành công!");
      setShowToast(true);
      fetchAllOrders(); 
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || err.message || "Không thể hủy đơn hàng.");
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

  const handleOpenReturnModal = (order: any) => {
      setSelectedReturnOrder(order);
      setCustomRefundAmount(order.finalTotalAmount || order.totalAmount); 
      setReturnReason('');
      setReturnDesc('');
      setReturnImages([]);
      setReturnVideo(null);
      setStepReturn(1); 
  };

  const handleOpenReturnDetail = (order: any) => {
      setSelectedReturnOrder(order);
      setShowReturnDetail(true);
  };

  const handleBuyAgain = async (e: React.MouseEvent, productId: string) => {
      if (e) e.stopPropagation();
      try {
          const res = await api.get(`/products/${productId}`);
          if (res.data && res.data.stock > 0 && res.data.status !== 'INACTIVE') {
              navigate(`/product/${productId}`);
          } else {
              setToastMessage("Xin lỗi, các sản phẩm của đơn hàng đã không còn bán/ hết hàng nên không thể mua lại.");
              setShowToast(true);
          }
      } catch (err) {
          setToastMessage("Xin lỗi, các sản phẩm của đơn hàng đã không còn bán/ hết hàng nên không thể mua lại.");
          setShowToast(true);
      }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      let newVideo = returnVideo;
      const newImages: File[] = [];

      files.forEach(file => {
          if (file.type.startsWith('video/')) {
              if (file.size > 50 * 1024 * 1024) {
                  alert(`Video ${file.name} quá lớn. Vui lòng tải video dưới 50MB.`);
                  return;
              }
              if (newVideo) {
                  alert("Chỉ được phép tải lên tối đa 1 Video bằng chứng.");
              } else {
                  newVideo = file;
              }
          } else if (file.type.startsWith('image/')) {
              newImages.push(file);
          }
      });

      if (returnImages.length + newImages.length > 5) {
          alert("Hệ thống chỉ cho phép tải lên tối đa 5 hình ảnh bằng chứng!");
          const allowedSpace = 5 - returnImages.length;
          setReturnImages(prev => [...prev, ...newImages.slice(0, allowedSpace)]);
      } else {
          setReturnImages(prev => [...prev, ...newImages]);
      }

      setReturnVideo(newVideo);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
      setReturnImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenEditAmount = () => {
      setInputAmount(customRefundAmount.toString());
      setShowEditAmountModal(true);
  };

  const handleConfirmCustomAmount = () => {
      const val = Number(inputAmount);
      if (isNaN(val) || val <= 0) {
          alert("Vui lòng nhập số tiền hợp lệ!");
          return;
      }
      if (val > (selectedReturnOrder?.finalTotalAmount || selectedReturnOrder?.totalAmount)) {
          alert(`Số tiền yêu cầu hoàn lại không được vượt quá tối đa ₫${(selectedReturnOrder?.finalTotalAmount || selectedReturnOrder?.totalAmount).toLocaleString()}`);
          return;
      }
      setCustomRefundAmount(val);
      setShowEditAmountModal(false);
  };

  const submitReturnRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!returnReason.trim()) { alert("Vui lòng chọn lý do hoàn trả hàng!"); return; }
      if (!returnDesc.trim()) { alert("Vui lòng cung cấp mô tả chi tiết!"); return; }
      if (returnImages.length === 0 && !returnVideo) { alert("Vui lòng tải lên ít nhất 1 ảnh hoặc video bằng chứng!"); return; }

      try {
          setIsSubmittingReturn(true);
          await requestReturnOrder(selectedReturnOrder.id, { 
              reason: returnReason, 
              description: returnDesc, 
              refundAmount: customRefundAmount,
              email: userEmail,
              images: returnImages,
              video: returnVideo
          });
          
          setToastMessage("Yêu cầu Trả hàng / Hoàn tiền của bạn đã được gửi tới Shop.");
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

  const isVideoUrl = (url: string) => url.toLowerCase().match(/\.(mp4|mov|webm|ogg)$/);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrdersList = displayedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(displayedOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber: number) => {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrdersPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOrdersPerPage(Number(e.target.value));
      setCurrentPage(1); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="user-page-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {showBankDetails && userBank && (
         <div className="shopee-refund-overlay-supreme sub-modal-zindex">
            <div className="bank-detail-modal animate-scale-up">
               <div className="bank-verified-header">
                   <FaCheckCircle size={18} /> VERIFIED
               </div>
               <div className="bank-info-list">
                   <div className="bank-info-item">
                       <label>Số CMND/CCCD</label>
                       <span>{userBank.identityNumber || 'Đã xác minh'}</span>
                   </div>
                   <div className="bank-info-item">
                       <label>Tên ngân hàng</label>
                       <span>{userBank.bankName}</span>
                   </div>
                   <div className="bank-info-item">
                       <label>Tên chi nhánh ngân hàng</label>
                       <span>{userBank.branchName || `CN ${userBank.bankName}`}</span>
                   </div>
                   <div className="bank-info-item">
                       <label>Account Number</label>
                       <span>{userBank.accountNumber ? `*********${userBank.accountNumber.slice(-4)}` : 'Đang cập nhật'}</span>
                   </div>
                   <div className="bank-info-item">
                       <label>Tên chủ tài khoản</label>
                       <span style={{ textTransform: 'uppercase' }}>
                           {userBank.accountName || userBank.accountHolder || userBank.ownerName || 'ĐANG CẬP NHẬT'}
                       </span>
                   </div>
               </div>
               <div className="bank-modal-footer">
                   <button onClick={() => setShowBankDetails(false)}>Trở lại</button>
               </div>
            </div>
         </div>
      )}

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

      {showReturnDetail && selectedReturnOrder && (
         <div className="shopee-refund-overlay-supreme scrollable-overlay">
            <div className="shopee-full-form-card animate-scale-up return-detail-page" style={{ maxWidth: '800px', margin: '20px auto' }}>
               <div className="detail-header-shopee" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 24px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                  <div className="request-id-shopee" style={{ fontSize: '13px', color: '#555', display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span>Mã Yêu Cầu. {selectedReturnOrder.id.toUpperCase()}</span>
                      <span style={{ color: '#ccc' }}>|</span>
                      <span>Hoàn Tiền Vào: {new Date(selectedReturnOrder.updatedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <button className="close-btn-x" onClick={() => setShowReturnDetail(false)}><FaTimes/></button>
               </div>

               <div className="stepper-shopee-container" style={{ display: 'flex', justifyContent: 'space-around', padding: '30px 0', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                  <div className="step-item active">
                      <div className="step-icon-wrapper"><FaCheckCircle /></div>
                      <span>Trả hàng</span>
                  </div>
                  <div className={`step-item ${['APPROVED', 'REJECTED', 'RETURNED'].includes(selectedReturnOrder.returnStatus) ? 'active' : ''}`}>
                      <div className="step-icon-wrapper">{['APPROVED', 'REJECTED', 'RETURNED'].includes(selectedReturnOrder.returnStatus) ? <FaCheckCircle /> : <FaRegCircle />}</div>
                      <span>Kiểm tra hàng hoàn</span>
                  </div>
                  <div className={`step-item ${selectedReturnOrder.status === 'RETURNED' ? 'active' : ''}`}>
                      <div className="step-icon-wrapper">{selectedReturnOrder.status === 'RETURNED' ? <FaCheckCircle /> : <FaRegCircle />}</div>
                      <span>Hoàn tiền</span>
                  </div>
               </div>

               <div className="refund-status-banner" style={{ padding: '24px', background: '#fffcf5', borderBottom: '1px solid #fdf2d9' }}>
                  <h3 style={{ color: '#ee4d2d', margin: '0 0 8px 0', fontSize: '18px' }}>{selectedReturnOrder.status === 'RETURNED' ? 'Đã hoàn tiền' : 'Đang xử lý khiếu nại'}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      Số tiền ₫{selectedReturnOrder.requestedRefundAmount?.toLocaleString()} sẽ được hoàn vào {userBank ? `Tài khoản ngân hàng của bạn` : 'Ví điện tử AiNetsoft'} trong vòng 5 ngày làm việc.
                  </p>
               </div>

               <div className="shopee-box-container" style={{ padding: '0', border: 'none', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '20px 24px' }}>
                      <div className="shop-info-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                         <FaStore color="#ee4d2d"/> 
                         <strong>{selectedReturnOrder.items[0]?.shopName}</strong>
                         <button className="shopee-btn-solid-orange-mini" onClick={(e) => { e.stopPropagation(); handleChatWithSeller(selectedReturnOrder.items[0]?.sellerId); }}><FaCommentDots /> Trao Đổi Thêm</button>
                         <button className="shopee-btn-outline-mini" onClick={() => navigate(`/shop/${selectedReturnOrder.items[0]?.sellerId}`)}>Xem Shop</button>
                      </div>
                      
                      {selectedReturnOrder.items.map((item: any, i: number) => (
                         <div key={i} className="product-mini-row-shopee" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0' }}>
                            <img src={bitnamilegacy(item.imageUrl)} alt="p" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #eee' }} />
                            <div className="p-meta" style={{ flex: 1 }}>
                               <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 400, color: 'rgba(0,0,0,0.87)', lineHeight: '1.4' }}>{item.productName}</h4>
                               <p style={{ margin: 0, fontSize: '13px', color: 'rgba(0,0,0,0.54)' }}>x{item.quantity}</p>
                            </div>
                            <span className="p-price" style={{ color: 'rgba(0,0,0,0.87)', fontSize: '14px' }}>₫{item.price?.toLocaleString()}</span>
                         </div>
                      ))}
                  </div>

                  <div style={{ background: '#fafafa', padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                      
                      {showPriceBreakdown && (
                          <div style={{ width: '100%', borderBottom: '1px dotted #ccc', paddingBottom: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
                                  <span>Số tiền đề xuất hoàn</span>
                                  <span>₫{selectedReturnOrder.totalAmount?.toLocaleString()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
                                  <span>Phí vận chuyển</span>
                                  <span>₫0</span>
                              </div>
                          </div>
                      )}
                      
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#555' }}>Số tiền hoàn nhận được</span>
                              <strong style={{ color: '#ee4d2d', fontSize: '22px', fontWeight: 500 }}>₫{selectedReturnOrder.requestedRefundAmount?.toLocaleString()}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#555' }}>Hoàn tiền vào</span>
                              <span 
                                  className="shopee-link-text" 
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ee4d2d', fontSize: '14px', cursor: 'pointer' }}
                                  onClick={() => setShowBankDetails(true)}
                              >
                                  {userBank ? `${userBank.bankName} [**${userBank.accountNumber.slice(-4)}]` : 'Ví AiNetsoft'} <FaLink size={12}/>
                              </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#555' }}>Mã đơn hàng</span>
                              <span 
                                  className="shopee-link-text" 
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ee4d2d', fontSize: '14px', cursor: 'pointer' }}
                                  onClick={() => { setShowReturnDetail(false); navigate(`/user/order/${selectedReturnOrder.id}`); }}
                              >
                                  {selectedReturnOrder.id.toUpperCase()} <FaChevronRight size={12}/>
                              </span>
                          </div>
                      </div>

                      <div style={{ width: '100%', textAlign: 'center', marginTop: '25px' }}>
                          <span 
                             onClick={() => setShowPriceBreakdown(!showPriceBreakdown)} 
                             style={{ color: '#888', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                             {showPriceBreakdown ? 'Rút Gọn' : 'Xem Chi Tiết'} 
                             <FaChevronRight style={{ transform: showPriceBreakdown ? 'rotate(-90deg)' : 'rotate(90deg)', fontSize: '10px', transition: 'transform 0.2s' }}/>
                          </span>
                      </div>
                  </div>
               </div>

               <div className="shopee-box-container" style={{ padding: '24px', borderTop: 'none' }}>
                  <span style={{ fontSize: '16px', fontWeight: 500, color: '#333', marginBottom: '15px', display: 'block' }}>Lý do: {selectedReturnOrder.returnReason}</span>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedReturnOrder.returnDescription}</p>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                     {selectedReturnOrder.returnImages?.map((url: string, idx: number) => {
                         const mediaUrl = bitnamilegacy(url);
                         const isVid = isVideoUrl(mediaUrl);
                         return (
                             <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', cursor: 'pointer', borderRadius: '2px', overflow: 'hidden', border: '1px solid #eee' }} onClick={() => setPreviewMedia({ url: mediaUrl, isVideo: !!isVid })}>
                                 {isVid ? (
                                     <>
                                        <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FaPlay color="#fff" fontSize="18px" />
                                        </div>
                                     </>
                                 ) : (
                                     <img src={mediaUrl} alt="ev" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                 )}
                             </div>
                         )
                     })}
                  </div>
               </div>
            </div>
         </div>
      )}

      {stepReturn === 1 && !showReturnDetail && (
         <div className="shopee-refund-overlay-supreme">
            <div className="shopee-situation-card animate-scale-up">
               <div className="sit-header" style={{ display: 'flex', justifyContent: 'center', position: 'relative', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, textAlign: 'center' }}>Tình huống bạn đang gặp?</h3>
                  <button className="close-btn-x" style={{ position: 'absolute', right: '20px' }} onClick={() => setStepReturn(0)}><FaTimes/></button>
               </div>
               <div className="sit-body">
                  <div className="sit-option-row" onClick={() => setStepReturn(2)}>
                     <div className="sit-icon-wrapper orange"><FaUndoAlt/></div>
                     <div className="sit-text-meta">
                        <strong>Tôi đã nhận hàng nhưng hàng có vấn đề (bể vỡ, sai mẫu, hàng lỗi...)</strong>
                        <p>Lưu ý: Nếu được chấp nhận Trả hàng, Voucher có thể sẽ không được hoàn lại</p>
                     </div>
                  </div>
                  <div className="sit-option-row" onClick={() => setStepReturn(2)}>
                     <div className="sit-icon-wrapper red"><FaBox/></div>
                     <div className="sit-text-meta">
                        <strong>Tôi chưa nhận hàng/nhận thiếu hàng</strong>
                        <p>AiNetsoft Xu, Voucher sẽ được hoàn lại nếu yêu cầu hợp lệ</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {stepReturn === 2 && !showReturnDetail && selectedReturnOrder && (
         <div className="shopee-refund-overlay-supreme scrollable-overlay">
            <div className="shopee-full-form-card animate-scale-up">
               <div className="form-supreme-header" style={{ display: 'flex', justifyContent: 'center', position: 'relative', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUndoAlt/> Yêu cầu Trả hàng/Hoàn tiền</h2>
                  <button className="close-btn-x" style={{ position: 'absolute', right: '20px' }} onClick={() => setStepReturn(0)}><FaTimes/></button>
               </div>

               <form onSubmit={submitReturnRequest} className="form-supreme-content">
                  <div className="shopee-box-container">
                     <span className="section-title-shopee">Sản phẩm cần Trả hàng và Hoàn tiền</span>
                     {selectedReturnOrder.items?.map((item: any, i: number) => (
                        <div 
                            key={i} 
                            className="product-mini-row-shopee" 
                            onClick={() => navigate(`/product/${item.productId}`)}
                            style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '12px', borderRadius: '4px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fcfdfe'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                           <img src={bitnamilegacy(item.imageUrl)} alt="product" onError={(e)=>{e.currentTarget.src="/placeholder.png"}} />
                           <div className="p-meta">
                              <h4 style={{ color: '#0055aa' }}>{item.productName}</h4>
                              <p className="p-shop-tag"><FaStore/> {item.shopName || 'AiNetsoft Shop'}</p>
                           </div>
                           <span className="p-qty" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                               x{item.quantity}
                               <FaChevronRight color="#ccc" />
                           </span>
                        </div>
                     ))}
                  </div>

                  <div className="shopee-box-container">
                     <div className="input-field-shopee">
                        <label className="required-label">Lý do *</label>
                        <select value={returnReason} onChange={e => setReturnReason(e.target.value)} required>
                           <option value="">Chọn Lý Do</option>
                           <option value="Hàng lỗi, không hoạt động">Hàng lỗi kỹ thuật, không hoạt động</option>
                           <option value="Khác với mô tả">Khác với mô tả</option>
                           <option value="Thiếu hàng/Phụ kiện">Thiếu hàng/Phụ kiện</option>
                           <option value="Bể vỡ, móp méo do vận chuyển">Bể vỡ, móp méo do vận chuyển</option>
                           <option value="Giao sai mẫu mã/kích thước">Giao sai mẫu mã/kích thước</option>
                        </select>
                     </div>

                     <div className="input-field-shopee" style={{ marginTop: '15px' }}>
                        <label className="required-label">Mô tả chi tiết *</label>
                        <div className="textarea-wrapper">
                           <textarea 
                              maxLength={2000} 
                              value={returnDesc} 
                              onChange={e => setReturnDesc(e.target.value)}
                              placeholder="Mô tả chi tiết vấn đề để Shop đối chiếu..." 
                              required 
                              rows={4}
                           />
                           <span className="char-counter">{returnDesc.length}/2000</span>
                        </div>
                     </div>
                  </div>

                  <div className="shopee-box-container">
                     <label className="required-label" style={{ fontWeight: 500, fontSize: '14px', color: '#555', marginBottom: '10px', display: 'block' }}>
                        Thêm hình ảnh / Video (Bằng chứng) *
                     </label>
                     <div className="shopee-image-upload-grid">
                        {returnVideo && (
                           <div className="shopee-image-preview-box">
                              <video 
                                 src={URL.createObjectURL(returnVideo)} 
                                 style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', backgroundColor: '#000' }} 
                                 onClick={() => setPreviewMedia({ url: URL.createObjectURL(returnVideo), isVideo: true })}
                              />
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', pointerEvents: 'none' }}><FaPlay /></div>
                              <button type="button" className="remove-img-btn" onClick={() => setReturnVideo(null)}><FaTimes/></button>
                           </div>
                        )}

                        {returnImages.map((file, index) => (
                           <div className="shopee-image-preview-box" key={index}>
                              <img 
                                 src={URL.createObjectURL(file)} 
                                 alt="proof" 
                                 style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                 onClick={() => setPreviewMedia({ url: URL.createObjectURL(file), isVideo: false })}
                              />
                              <button type="button" className="remove-img-btn" onClick={() => handleRemoveImage(index)}><FaTimes/></button>
                           </div>
                        ))}
                        
                        {(returnImages.length < 5 || !returnVideo) && (
                           <div className="shopee-upload-trigger-box" onClick={() => fileInputRef.current?.click()}>
                              <FaCamera size={22} color="#ee4d2d" />
                              <span>Thêm Ảnh ({returnImages.length}/5) / Video ({returnVideo ? 1 : 0}/1)</span>
                           </div>
                        )}
                     </div>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageFileChange} 
                        multiple 
                        accept="image/*,video/*" 
                        hidden 
                     />
                  </div>

                  <div className="shopee-box-container bg-white-border">
                     <span className="section-title-shopee">Thông tin hoàn tiền</span>
                     <div className="refund-meta-row-item">
                        <span className="lbl-left">Số tiền hoàn lại:</span>
                        <div className="val-right-edit">
                           <span className="amount-shopee-bold">₫{customRefundAmount.toLocaleString()}</span>
                           <button type="button" className="shopee-link-blue" onClick={handleOpenEditAmount}>CHỈNH SỬA</button>
                        </div>
                     </div>

                     <div className="refund-meta-row-item">
                        <span className="lbl-left">Hoàn tiền vào:</span>
                        <span className="val-right">
                           {userBank ? `Tài khoản ngân hàng [${userBank.bankName} **${userBank.accountNumber.slice(-4)}]` : 'Ví điện tử AiNetsoft'}
                        </span>
                     </div>

                     <div className="refund-meta-row-item">
                        <span className="lbl-left required-label">Email liên hệ</span>
                        <div className="val-right" style={{ width: '60%' }}>
                           <input 
                              type="email" 
                              className="shopee-email-input-box"
                              value={userEmail} 
                              onChange={e => setUserEmail(e.target.value)} 
                              placeholder="Email nhận thông báo..."
                              required 
                           />
                        </div>
                     </div>

                     <div className="shopee-price-breakdown-box">
                        <div className="b-row"><span className="b-lbl">Số tiền có thể hoàn lại tối đa</span><span className="b-val">₫{(selectedReturnOrder?.finalTotalAmount || selectedReturnOrder?.totalAmount)?.toLocaleString()}</span></div>
                        <div className="b-row"><span className="b-lbl">Phí vận chuyển dự kiến (nếu có)</span><span className="b-val">₫0</span></div>
                        <hr className="dashed-hr"/>
                        <div className="b-row final"><span className="b-lbl">Số tiền hoàn thực nhận</span><span className="b-val-orange">₫{customRefundAmount.toLocaleString()}</span></div>
                     </div>
                  </div>

                  <div className="form-action-shopee-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                     <button type="button" className="btn-cancel" style={{ marginRight: '10px' }} onClick={() => setStepReturn(1)}>Trở lại</button>
                     <button type="submit" className="shopee-submit-btn-orange" disabled={isSubmittingReturn || (returnImages.length === 0 && !returnVideo)}>
                        {isSubmittingReturn ? 'ĐANG GỬI...' : 'Hoàn thành'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showEditAmountModal && !showReturnDetail && selectedReturnOrder && (
         <div className="shopee-refund-overlay-supreme sub-modal-zindex">
            <div className="shopee-sub-amount-card animate-scale-up">
               <div className="sub-header" style={{ display: 'flex', justifyContent: 'center', position: 'relative', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, textAlign: 'center' }}>Đề xuất số tiền hoàn lại</h3>
               </div>
               <div className="sub-body">
                  <div className="sub-input-group">
                     <span className="currency-symbol">₫</span>
                     <input 
                        type="number" 
                        value={inputAmount} 
                        onChange={e => setInputAmount(e.target.value)} 
                        max={selectedReturnOrder.finalTotalAmount || selectedReturnOrder.totalAmount}
                        placeholder="Nhập số tiền..."
                     />
                  </div>
                  <p className="sub-tip-max">Số tiền hoàn lại tối đa: ₫{(selectedReturnOrder.finalTotalAmount || selectedReturnOrder.totalAmount)?.toLocaleString()}</p>
                  
                  <div className="sub-breakdown-box">
                     <div className="sub-b-row bold"><span>Số tiền hoàn nhận được</span><span className="color-orange">₫{Number(inputAmount).toLocaleString()}</span></div>
                  </div>
               </div>
               <div className="sub-footer-actions">
                  <button type="button" className="btn-sub-action cancel" onClick={() => setShowEditAmountModal(false)}>Hủy</button>
                  <button type="button" className="btn-sub-action confirm" onClick={handleConfirmCustomAmount}>Xác nhận</button>
               </div>
            </div>
         </div>
      )}

      <main className="purchase-main-view" style={{ width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '20px', padding: '20px 20px 25px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ 
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", 
                    fontSize: '28px', 
                    fontWeight: 800, 
                    color: '#ee4d2d', 
                    margin: '0 0 8px 0', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1.2px',
                    WebkitFontSmoothing: 'antialiased',
                    lineHeight: 1.2
                }}>
                    <FaClipboardList style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Đơn mua của tôi
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Quản lý và theo dõi các đơn hàng bạn đã đặt.</p>
            </div>
            
            <button 
               onClick={handleRefresh}
               disabled={isRefreshing}
               style={{ 
                   position: 'absolute', right: '20px', 
                   display: 'flex', alignItems: 'center', gap: '8px', 
                   padding: '8px 16px', background: '#fff', 
                   border: '1px solid #e2e8f0', borderRadius: '6px', 
                   cursor: isRefreshing ? 'wait' : 'pointer', 
                   color: '#ee4d2d', fontWeight: '600', fontSize: '14px',
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
              {currentOrdersList.map(order => { 
                const rawStatus = order.status ? order.status.toString().trim().toUpperCase() : '';
                const canCancel = ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'UNPAID', ''].includes(rawStatus);
                const canReturn = (rawStatus === 'SHIPPING' && order.carrierStatus === 'DELIVERED') || rawStatus === 'COMPLETED';
                const isReturnTab = activeTab === 'RETURN';

                return (
                  <div 
                      key={order.id} 
                      className={`order-card-item condensed`} 
                      onClick={() => {
                          if (isReturnTab) {
                              handleOpenReturnDetail(order);
                          } else {
                              navigate(`/user/order/${order.id}`);
                          }
                      }}
                      style={{ 
                          border: (rawStatus === 'RETURNING' || rawStatus === 'RETURNED') ? '1px solid #ffccc7' : '1px solid #e5e5e5', 
                          marginBottom: '15px', background: '#fff',
                          cursor: 'pointer',
                          padding: '12px 16px'
                      }}
                  >
                    <div className="order-item-header" style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f1f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="shop-name-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaStore className="icon-orange" color="#ee4d2d" />
                        <strong>{order.items?.[0]?.shopName || 'Cửa hàng AiNetsoft'}</strong>
                        
                        {(rawStatus === 'RETURNING' || rawStatus === 'RETURNED') && (
                            <button 
                                className="shopee-btn-solid-orange-mini" 
                                style={{ marginLeft: '10px' }} 
                                onClick={(e) => { e.stopPropagation(); handleChatWithSeller(order.items?.[0]?.sellerId); }}
                            >
                                <FaCommentDots /> Trao Đổi Thêm
                            </button>
                        )}
                        
                        <button 
                            className="shopee-btn-outline-mini" 
                            onClick={(e) => { e.stopPropagation(); navigate(`/shop/${order.items[0]?.sellerId}`); }}
                        >
                            Xem Shop
                        </button>

                      </div>
                      <div className="status-tag" style={{ color: '#ee4d2d', fontWeight: 'bold' }}>
                        {(rawStatus === 'RETURNED' || rawStatus === 'RETURNING') ? <FaExclamationCircle style={{ marginRight: '5px' }}/> : <FaTruck style={{ marginRight: '5px' }}/>} 
                        {getStatusText(rawStatus)}
                      </div>
                    </div>

                    <div className="order-item-body" style={{ padding: '10px 0' }}>
                      {order.items?.map((item: any, idx: number) => (
                        <div 
                           key={idx} 
                           className="item-row" 
                           style={{ display: 'flex', padding: '8px 0', borderBottom: 'none' }}
                        >
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
                    </div>

                    <div className="order-item-footer" style={{ borderTop: '1px dotted #eee', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0' }}>
                        <div className="total-display" style={{ alignSelf: 'flex-end', fontSize: '18px' }}>
                          <span style={{ fontSize: '14px', color: '#555' }}>
                              {rawStatus === 'RETURNED' || isReturnTab ? 'Tổng tiền hoàn:' : 'Thành tiền:'} 
                          </span>
                          <span className="grand-total" style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '20px' }}>₫{(order.finalTotalAmount || order.totalAmount)?.toLocaleString()}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '5px' }}>
                            <div className="cancel-info-left" style={{ fontSize: '13px', color: 'rgba(0,0,0,0.54)' }}>
                                {rawStatus === 'CANCELLED' && (
                                    <span>
                                        {order.cancelledBy === 'SYSTEM' ? 'Đã hủy tự động bởi hệ thống AiNetsoft' : 
                                         order.cancelledBy === 'SELLER' ? 'Đã hủy bởi Người bán' : 'Đã hủy bởi bạn'}
                                    </span>
                                )}
                            </div>

                            <div className="footer-actions purchase-action-buttons">
                              {rawStatus === 'CANCELLED' && (
                                  <>
                                      <button className="purchase-btn btn-primary" onClick={(e) => handleBuyAgain(e, order.items[0]?.productId)}>Mua Lại</button>
                                      <button className="purchase-btn btn-secondary" onClick={(e) => { e.stopPropagation(); navigate(`/user/order/${order.id}?view=cancel_detail`); }}>Xem Chi Tiết Hủy Đơn</button>
                                      <button className="purchase-btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleChatWithSeller(order.items?.[0]?.sellerId); }}>Liên Hệ Người Bán</button>
                                  </>
                              )}

                              {rawStatus === 'SHIPPING' && (
                                <button 
                                    className={`purchase-btn btn-primary ${order.carrierStatus !== 'DELIVERED' ? 'disabled' : ''}`}
                                    disabled={order.carrierStatus !== 'DELIVERED'}
                                    onClick={(e) => { e.stopPropagation(); handleConfirmReceipt(order.id); }}
                                    title={order.carrierStatus !== 'DELIVERED' ? 'Chỉ có thể xác nhận khi đơn vị vận chuyển đã giao hàng' : ''}>
                                    <FaCheckCircle style={{ marginRight: '6px' }} /> Đã nhận được hàng
                                </button>
                              )}

                              {canReturn && (
                                 <button 
                                    className="purchase-btn btn-outline" 
                                    onClick={(e) => { e.stopPropagation(); handleOpenReturnModal(order); }}
                                 >
                                     <FaUndoAlt style={{ marginRight: '6px' }}/> Yêu cầu Trả hàng/Hoàn tiền
                                 </button>
                              )}

                              {rawStatus === 'COMPLETED' && (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/product/${order.items[0]?.productId}?review=true&orderId=${order.id}`); }}
                                    className="purchase-btn btn-outline"
                                  >
                                    <FaStar style={{ marginRight: '6px' }} /> Đánh giá
                                  </button>
                                  <button 
                                    className="purchase-btn btn-primary" 
                                    onClick={(e) => handleBuyAgain(e, order.items[0]?.productId)}
                                  >
                                    Mua lại
                                  </button>
                                </>
                              )}

                              {!['CANCELLED', 'COMPLETED', 'RETURNING', 'RETURNED'].includes(rawStatus) && (
                                  <button 
                                    className="purchase-btn btn-secondary" 
                                    onClick={(e) => { e.stopPropagation(); handleChatWithSeller(order.items?.[0]?.sellerId); }}
                                  >
                                     Liên hệ người bán
                                  </button>
                              )}
                              
                              {canCancel && (
                                <button 
                                  className="purchase-btn btn-secondary"
                                  onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                                >
                                  Hủy đơn
                                </button>
                              )}
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 0 && (
              <div className="shopee-pagination-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '20px', padding: '20px 0', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555' }}>
                      <span>Hiển thị:</span>
                      <select 
                          value={ordersPerPage} 
                          onChange={handleOrdersPerPageChange}
                          style={{ padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}
                      >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={30}>30</option>
                          <option value={50}>50</option>
                      </select>
                      <span>/ trang</span>
                  </div>

                  <div className="shopee-pagination" style={{ margin: 0, padding: 0 }}>
                      <button 
                          className="shopee-page-btn" 
                          disabled={currentPage === 1} 
                          onClick={() => handlePageChange(currentPage - 1)}
                      >
                          <FaChevronLeft size={12}/>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button 
                              key={page} 
                              className={`shopee-page-btn ${currentPage === page ? 'active' : ''}`}
                              onClick={() => handlePageChange(page)}
                          >
                              {page}
                          </button>
                      ))}
                      <button 
                          className="shopee-page-btn" 
                          disabled={currentPage === totalPages} 
                          onClick={() => handlePageChange(currentPage + 1)}
                      >
                          <FaChevronRight size={12}/>
                      </button>
                  </div>
              </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Purchase;
