import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import './Profile.css';
import './Purchase.css'; // We'll add this for the new tab styles

const Purchase = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dynamic Tabs matching standard e-commerce flow
  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ thanh toán' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  useEffect(() => {
    document.title = "Đơn mua của tôi | AiNetsoft";
    // Later, this is where we will call: const data = await getMyOrders(activeTab);
  }, [activeTab]);

  return (
    <div className="profile-wrapper">
      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="profile-main-content">
          {/* DYNAMIC: Navigation Tabs for Order Status */}
          <div className="purchase-tabs-container">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`purchase-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="purchase-list-content">
            {loading ? (
              <div className="purchase-loading">
                 <div className="loading-spinner"></div>
                 <p>Đang tìm kiếm đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              /* DYNAMIC: Empty State UI */
              <div className="purchase-empty-state">
                <img 
                  src="/src/assets/images/logo_without_text.png" 
                  alt="Empty" 
                  className="purchase-empty-img" 
                />
                <p>Chưa có đơn hàng nào trong mục này.</p>
              </div>
            ) : (
              <div className="order-cards-wrapper">
                {/* Real order items will map here */}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Purchase;