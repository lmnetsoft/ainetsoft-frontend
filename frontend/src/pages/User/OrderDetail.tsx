import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaReceipt, FaCreditCard, FaTruck, FaBoxOpen, FaStar, FaStore, FaCommentDots, FaExclamationCircle, FaLink, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { cancelOrder } from '../../services/orderService';
import ToastNotification from '../../components/Toast/ToastNotification';
import { useChat } from '../../context/ChatContext';
import './OrderDetail.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isViewCancelDetail = searchParams.get('view') === 'cancel_detail';

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const { setIsChatOpen } = useChat();

    const bitnamilegacy = (url?: string) => {
        if (!url || url === "/placeholder.png") return "/placeholder.png";
        return url.startsWith('http') ? url : `${BASE_URL}${url}`;
    };

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
        } catch (err: any) {
            setToastMessage("Không thể tải chi tiết đơn hàng.");
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchOrder();
        document.title = "Chi tiết đơn hàng | AiNetsoft";
    }, [id]);

    const handleChat = (sellerId: string) => {
        if (sellerId) {
            localStorage.setItem('currentChatRecipient', sellerId);
            setIsChatOpen(true);
        }
    };

    const handleCancelOrderAction = async () => {
        const reason = window.prompt('Vui lòng nhập lý do hủy đơn hàng (hoặc để trống):');
        if (reason === null) return; 

        try {
            await api.put(`/orders/${order.id}/cancel`, { cancelReason: reason });
            setToastMessage("Hủy đơn hàng thành công!");
            setShowToast(true);
            fetchOrder(); 
        } catch (err: any) {
            setToastMessage(err.response?.data?.message || err.message || "Không thể hủy đơn hàng.");
            setShowToast(true);
        }
    };

    // 🚀 HÀM MUA LẠI: KIỂM TRA TỒN KHO TRƯỚC KHI CHUYỂN TRANG
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

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}><div className="loading-spinner"></div></div>;
    if (!order) return <div style={{ padding: '50px', textAlign: 'center' }}>Không tìm thấy đơn hàng!</div>;

    const rawStatus = (order.status || '').toUpperCase();
    const carrierStatus = (order.carrierStatus || '').toUpperCase();
    
    // --- Xác định Stepper logic ---
    const isStep2 = !['PENDING', 'CANCELLED'].includes(rawStatus) || (rawStatus === 'CANCELLED' && order.paymentMethod !== 'COD');
    const isStep3 = ['SHIPPING', 'COMPLETED', 'RETURNING', 'RETURNED'].includes(rawStatus) || ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(carrierStatus);
    const isStep4 = ['COMPLETED', 'RETURNING', 'RETURNED'].includes(rawStatus) || carrierStatus === 'DELIVERED';
    const isStep5 = rawStatus === 'COMPLETED' && order.isReviewed;

    // GIAO DIỆN 1: XEM CHI TIẾT HỦY ĐƠN (KHÔNG STEPPER)
    if (rawStatus === 'CANCELLED' && isViewCancelDetail) {
        return (
            <div className="order-detail-page-wrapper">
                <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
                
                <div className="od-header-top" style={{ justifyContent: 'space-between' }}>
                    <button className="od-back-btn" onClick={() => navigate('/user/purchase')}><FaChevronLeft/> TRỞ LẠI</button>
                    <span style={{ fontSize: '13px', color: '#888' }}>Yêu cầu vào: {new Date(order.updatedAt).toLocaleString('vi-VN')}</span>
                </div>

                <div className="od-cancelled-banner" style={{ padding: '30px 24px', background: '#fff', borderBottom: '1px solid #f1f5f9', marginBottom: '15px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ color: '#ee4d2d', margin: '0 0 8px 0', fontSize: '22px', fontWeight: 500 }}>Đã hủy đơn hàng</h2>
                    <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>vào {new Date(order.updatedAt).toLocaleString('vi-VN')}</p>
                </div>

                <div className="od-product-box">
                    <div className="od-shop-header">
                        <span className="od-shop-name"><FaStore color="#555"/> {order.items[0]?.shopName || 'Gian Hàng'}</span>
                        <div style={{display: 'flex', gap: '8px'}}>
                            <button className="od-btn-chat" onClick={() => handleChat(order.items[0]?.sellerId)}><FaCommentDots/> Chat</button>
                            <button className="od-btn-shop" onClick={() => navigate(`/shop/${order.items[0]?.sellerId}`)}>Xem Shop</button>
                        </div>
                    </div>

                    {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="od-item-row" onClick={() => navigate(`/product/${item.productId}`)} style={{cursor: 'pointer'}}>
                            <img src={bitnamilegacy(item.imageUrl)} className="od-item-img" alt="sp" />
                            <div className="od-item-info">
                                <h4 className="od-item-name">{item.productName}</h4>
                                <p className="od-item-qty" style={{ margin: 0 }}>x{item.quantity}</p>
                            </div>
                            <div className="od-item-price">
                                <span className="od-price-old">₫{(item.price * 1.2).toLocaleString()}</span>
                                <span className="od-price-new">₫{item.price?.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}

                    <div style={{ background: '#fafafa', padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderTop: '1px solid #eee' }}>
                        <div style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '14px', color: '#555' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Yêu cầu bởi</span>
                                <strong style={{ color: '#333' }}>
                                    {order.cancelledBy === 'SYSTEM' ? 'Hệ thống AiNetsoft' : 
                                     order.cancelledBy === 'SELLER' ? 'Người bán' : 'Bạn (Người mua)'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Phương thức thanh toán</span>
                                <strong style={{ color: '#333' }}>
                                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán Online'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Mã đơn hàng</span>
                                <strong 
                                    style={{ color: '#ee4d2d', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                    onClick={() => setSearchParams({})}
                                >
                                    {order.id.toUpperCase()} <FaLink size={12}/>
                                </strong>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ background: '#fffcf5', padding: '20px 24px', borderTop: '1px solid #fdf2d9', color: '#333', fontSize: '14px', display: 'flex', gap: '8px' }}>
                        <span>Lý do:</span> <strong>{order.cancelReason || 'Người mua thay đổi ý định'}</strong>
                    </div>
                </div>
            </div>
        );
    }

    // GIAO DIỆN 2: LỘ TRÌNH ĐƠN HÀNG (CÓ STEPPER)
    return (
        <div className="order-detail-page-wrapper">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

            {/* HEADER */}
            <div className="od-header-top">
                <button className="od-back-btn" onClick={() => navigate('/user/purchase')}><FaChevronLeft/> TRỞ LẠI</button>
                <div className="od-header-info">
                    <span className="od-id">MÃ ĐƠN HÀNG. {order.id.toUpperCase()}</span>
                    <span className="divider">|</span>
                    <span className="od-status-red">
                        {rawStatus === 'PENDING' ? 'CHỜ XÁC NHẬN' :
                         rawStatus === 'SHIPPING' ? 'ĐANG GIAO HÀNG' :
                         rawStatus === 'COMPLETED' ? 'ĐƠN HÀNG ĐÃ HOÀN THÀNH' :
                         rawStatus === 'CANCELLED' ? 'ĐƠN HÀNG ĐÃ HỦY' :
                         rawStatus === 'RETURNING' ? 'ĐANG YÊU CẦU TRẢ HÀNG' :
                         rawStatus === 'RETURNED' ? 'ĐÃ HOÀN TIỀN' : rawStatus}
                    </span>
                </div>
            </div>

            {/* STEPPER MỚI: Truyền data-steps để CSS tính toán đường kẻ */}
            <div className="od-stepper-box" data-steps={rawStatus === 'CANCELLED' ? "3" : "5"}>
                <div className="od-step-item active">
                    <div className="od-step-icon"><FaReceipt/></div>
                    <div className="od-step-text">Đơn Hàng Đã Đặt<br/><span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span></div>
                </div>

                {rawStatus === 'CANCELLED' ? (
                    // Nếu hủy, chỉ hiện 3 bước và ép màu xanh nối tiếp màu đỏ
                    <>
                        <div className="od-step-item active">
                            <div className="od-step-icon"><FaCreditCard/></div>
                            <div className="od-step-text">Đã Xác Nhận Thông Tin Thanh Toán<br/><span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span></div>
                        </div>
                        <div className="od-step-item cancelled">
                            <div className="od-step-icon"><FaTimes size={20}/></div>
                            <div className="od-step-text">Đơn Hàng Đã Hủy<br/><span>{new Date(order.updatedAt).toLocaleDateString('vi-VN')}</span></div>
                        </div>
                    </>
                ) : (
                    // Logic giao hàng bình thường 5 bước
                    <>
                        <div className={`od-step-item ${isStep2 ? 'active' : ''}`}>
                            <div className="od-step-icon"><FaCreditCard/></div>
                            <div className="od-step-text">Đã Xác Nhận Thông Tin Thanh Toán</div>
                        </div>
                        <div className={`od-step-item ${isStep3 ? 'active' : ''}`}>
                            <div className="od-step-icon"><FaTruck/></div>
                            <div className="od-step-text">Đã Giao Cho ĐVVC</div>
                        </div>
                        <div className={`od-step-item ${isStep4 ? 'active' : ''}`}>
                            <div className="od-step-icon"><FaBoxOpen/></div>
                            <div className="od-step-text">{rawStatus === 'RETURNED' ? 'Trả Hàng / Hoàn Tiền Thành Công' : 'Giao Hàng Thành Công'}</div>
                        </div>
                        <div className={`od-step-item ${isStep5 ? 'active' : ''}`}>
                            <div className="od-step-icon"><FaStar/></div>
                            <div className="od-step-text">Đánh Giá</div>
                        </div>
                    </>
                )}
            </div>

            {/* ACTION BANNER */}
            <div className="od-action-banner" style={{ background: rawStatus === 'CANCELLED' ? '#fffcf5' : '#fffaf9' }}>
                <p style={{ color: '#555' }}>
                    {rawStatus === 'PENDING' ? 'Đơn hàng đang chờ người bán xác nhận.' :
                     rawStatus === 'SHIPPING' ? 'Đơn hàng đang được giao đến bạn.' :
                     rawStatus === 'COMPLETED' ? 'Cảm ơn bạn đã mua sắm tại AiNetsoft!' :
                     rawStatus === 'CANCELLED' ? 'Chi tiết tại mục \'Xem chi tiết Hủy đơn\'.' :
                     ['RETURNING', 'RETURNED'].includes(rawStatus) ? 'Đơn hàng đang trong quá trình Trả hàng/Hoàn tiền.' :
                     'Cảm ơn bạn đã mua sắm tại AiNetsoft!'}
                </p>
                <div className="od-action-buttons">
                    {['PENDING', 'CONFIRMED', 'PROCESSING', 'UNPAID'].includes(rawStatus) && (
                        <button className="od-btn od-btn-outline" onClick={handleCancelOrderAction}>Hủy Đơn Hàng</button>
                    )}

                    {['COMPLETED', 'CANCELLED', 'RETURNED'].includes(rawStatus) && (
                        <button className="od-btn od-btn-primary" onClick={(e) => handleBuyAgain(e, order.items[0]?.productId)}>Mua Lại</button>
                    )}

                    {rawStatus === 'CANCELLED' && (
                        <button className="od-btn od-btn-outline" onClick={() => setSearchParams({view: 'cancel_detail'})}>Xem Chi Tiết Hủy Đơn</button>
                    )}

                    <button 
                        className={`od-btn ${['PENDING', 'CONFIRMED', 'PROCESSING', 'UNPAID'].includes(rawStatus) ? 'od-btn-primary' : 'od-btn-outline'}`} 
                        onClick={() => handleChat(order.items[0]?.sellerId)}
                    >
                        Liên Hệ Người Bán
                    </button>
                </div>
            </div>

            <div className="envelope-border"></div>

            {/* TỌA ĐỘ VÀ LỘ TRÌNH */}
            <div className="od-logistics-box">
                <div className="od-address-col" style={rawStatus === 'CANCELLED' ? { borderRight: 'none', flex: 'none', width: '50%' } : {}}>
                    <h3>Địa Chỉ Nhận Hàng</h3>
                    <div className="od-addr-name">{order.shippingAddress?.receiverName}</div>
                    <div className="od-addr-phone">(+84) {order.shippingAddress?.phone?.replace(/^0/, '')}</div>
                    <div className="od-addr-detail">{order.shippingAddress?.detail}, {order.shippingAddress?.ward}, {order.shippingAddress?.province}</div>
                </div>
                
                {rawStatus !== 'CANCELLED' && (
                    <div className="od-timeline-col">
                        <div className="od-carrier-info">
                            Đơn vị vận chuyển: <strong>{order.shippingProvider || 'Đang cập nhật'}</strong><br/>
                            Mã vận đơn: <strong>{order.trackingCode || 'Chưa có'}</strong>
                        </div>
                        
                        <div className="od-timeline">
                            {carrierStatus === 'DELIVERED' && (
                                <div className="od-tl-item active">
                                    <div className="od-tl-time">{new Date(order.updatedAt).toLocaleString('vi-VN')}</div>
                                    <div className="od-tl-title">Đã giao</div>
                                    <div className="od-tl-desc">Giao hàng thành công</div>
                                </div>
                            )}
                            {['IN_TRANSIT', 'DELIVERED'].includes(carrierStatus) && (
                                <div className="od-tl-item">
                                    <div className="od-tl-time">{new Date(order.updatedAt).toLocaleString('vi-VN')}</div>
                                    <div className="od-tl-title">Đang vận chuyển</div>
                                    <div className="od-tl-desc">Đơn hàng đang trên đường giao đến bạn</div>
                                </div>
                            )}
                            {['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(carrierStatus) && (
                                <div className="od-tl-item">
                                    <div className="od-tl-time">{new Date(order.updatedAt).toLocaleString('vi-VN')}</div>
                                    <div className="od-tl-title">Đã lấy hàng</div>
                                    <div className="od-tl-desc">Đơn vị vận chuyển đã lấy hàng thành công</div>
                                </div>
                            )}
                            <div className="od-tl-item">
                                <div className="od-tl-time">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                                <div className="od-tl-title">Đặt hàng thành công</div>
                                <div className="od-tl-desc">Đơn hàng đã được đặt</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SẢN PHẨM VÀ THANH TOÁN */}
            <div className="od-product-box">
                <div className="od-shop-header">
                    <span className="od-tag-mall">Yêu thích</span>
                    <span className="od-shop-name">{order.items[0]?.shopName || 'Gian Hàng'}</span>
                    <button className="od-btn-chat" onClick={() => handleChat(order.items[0]?.sellerId)}><FaCommentDots/> Chat</button>
                    <button className="od-btn-shop" onClick={() => navigate(`/shop/${order.items[0]?.sellerId}`)}><FaStore/> Xem Shop</button>
                </div>

                {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="od-item-row" onClick={() => navigate(`/product/${item.productId}`)} style={{cursor: 'pointer'}}>
                        <img src={bitnamilegacy(item.imageUrl)} className="od-item-img" alt="sp" />
                        <div className="od-item-info">
                            <h4 className="od-item-name">{item.productName}</h4>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                <p className="od-item-var" style={{ margin: 0 }}>Phân loại hàng: Mặc định</p>
                                {['RETURNING', 'RETURNED'].includes(rawStatus) && (
                                    <span style={{ color: '#ee4d2d', border: '1px solid #ee4d2d', padding: '1px 6px', fontSize: '10px', borderRadius: '2px', fontWeight: 'bold' }}>
                                        TRẢ HÀNG/ HOÀN TIỀN
                                    </span>
                                )}
                            </div>
                            
                            <p className="od-item-qty" style={{ margin: 0 }}>x{item.quantity}</p>
                        </div>
                        <div className="od-item-price">
                            <span className="od-price-new">₫{item.price?.toLocaleString()}</span>
                        </div>
                    </div>
                ))}

                {rawStatus === 'CANCELLED' && (
                    <div className="od-cancelled-reason-box" style={{ background: '#fafafa', marginTop: '15px', borderTop: '1px solid #eee' }}>
                        <div style={{ padding: '15px 24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#555' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Yêu cầu bởi</span>
                                <strong style={{ color: '#333' }}>
                                    {order.cancelledBy === 'SYSTEM' ? 'Hệ thống AiNetsoft' : 
                                     order.cancelledBy === 'SELLER' ? 'Người bán' : 'Bạn (Người mua)'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Phương thức thanh toán</span>
                                <strong style={{ color: '#333' }}>
                                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán Online'}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Mã đơn hàng</span>
                                <strong style={{ color: '#ee4d2d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {order.id.toUpperCase()} <FaLink size={10}/>
                                </strong>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #f1f5f9', fontSize: '14px', color: '#333' }}>
                            Lý do: {order.cancelReason || 'Người mua thay đổi ý định'}
                        </div>
                    </div>
                )}

                <div className="od-summary-section">
                    <div className="od-summary-grid">
                        <div className="od-sum-row">
                            <span className="lbl">Tổng tiền hàng</span>
                            <span className="val">₫{order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="od-sum-row">
                            <span className="lbl">Phí vận chuyển</span>
                            <span className="val">₫0</span>
                        </div>
                        {(order.voucherDiscountAmount > 0) && (
                            <div className="od-sum-row">
                                <span className="lbl">Voucher từ Shop</span>
                                <span className="val">-₫{order.voucherDiscountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {(order.coinDiscountAmount > 0) && (
                            <div className="od-sum-row">
                                <span className="lbl">AiNetsoft Xu</span>
                                <span className="val">-₫{order.coinDiscountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="od-sum-row total">
                            <span className="lbl">Thành tiền</span>
                            <span className="val">₫{order.finalTotalAmount?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {order.paymentMethod === 'COD' && !['COMPLETED', 'RETURNING', 'RETURNED', 'CANCELLED'].includes(rawStatus) && (
                    <div className="od-payment-warning">
                        <div className="od-warning-text"><FaExclamationCircle/> Vui lòng thanh toán <strong>₫{order.finalTotalAmount?.toLocaleString()}</strong> khi nhận hàng.</div>
                    </div>
                )}

                {rawStatus !== 'CANCELLED' && (
                    <div className="od-payment-method-row">
                        <span className="lbl">Phương thức Thanh toán</span>
                        <span className="val">{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán Online'}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetail;
