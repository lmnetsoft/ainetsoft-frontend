import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getMyOrders } from '../../services/orderService';
import { FaMapMarkerAlt, FaStore, FaTruck } from 'react-icons/fa'; // Added icons for consistency
import './PurchaseHistory.css';

const PurchaseHistory = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận' }, // Updated label for standard workflow
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getMyOrders(activeTab);
        setOrders(data);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    document.title = "Đơn mua | AiNetsoft";
  }, [activeTab]);

  return (
    <div className="purchase-wrapper">
      <div className="container purchase-container">
        <AccountSidebar />
        
        <main className="purchase-main-content">
          <div className="purchase-tabs">
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

          <div className="order-list">
            {loading ? (
              <div className="loading-state">
                 <div className="loading-spinner"></div>
                 <p>Đang tải đơn hàng...</p>
              </div>
            ) : orders.length > 0 ? (
              orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="shop-name">
                      <FaStore className="icon-orange" />
                      <span>{order.items?.[0]?.shopName || 'Cửa hàng'}</span>
                    </div>
                    <span className="order-status">
                      <FaTruck /> {order.status}
                    </span>
                  </div>

                  <div className="order-card-body">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="order-item">
                        <img src={item.imageUrl || '/logo.svg'} alt={item.productName} />
                        <div className="item-info">
                          <h3>{item.productName}</h3>
                          <p>x{item.quantity}</p>
                        </div>
                        <div className="item-price">
                          ₫{item.price.toLocaleString()}
                        </div>
                      </div>
                    ))}

                    {/* NEW: Shipping Summary Block to match simplified address */}
                    {order.shippingAddress && (
                      <div className="order-shipping-summary">
                        <FaMapMarkerAlt className="icon-orange" />
                        <div className="shipping-text">
                          <strong>Giao đến: {order.shippingAddress.receiverName} ({order.shippingAddress.phone})</strong>
                          <p>{order.shippingAddress.detail}, {order.shippingAddress.ward}, {order.shippingAddress.province}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="order-card-footer">
                    <div className="total-row">
                      <span className="total-label">Thành tiền:</span>
                      <span className="total-price">₫{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="order-empty">
                <p>Chưa có đơn hàng nào</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PurchaseHistory;