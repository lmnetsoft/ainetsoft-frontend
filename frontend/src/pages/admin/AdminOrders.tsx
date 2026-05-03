import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaEye, FaBoxOpen, FaCheckCircle, FaTimesCircle, FaTruck } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminOrders = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mặc định là ALL, nhưng nếu click từ Dashboard sang có thể truyền state
  const [filterStatus, setFilterStatus] = useState<string>(
    location.state?.initialFilter || 'ALL'
  );

  useEffect(() => {
    fetchAllOrders();
    document.title = "Quản lý Đơn hàng | AiNetsoft Admin";
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      // Gọi API lấy toàn bộ đơn hàng của hệ thống
      const response = await api.get('/orders/admin/all');
      setOrders(response.data || []);
    } catch (err: any) {
      console.error("Fetch orders error:", err);
      toast.error("Không thể tải dữ liệu đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  // Logic Lọc & Tìm kiếm
  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus === 'ALL' || order.status === filterStatus;
    const matchSearch = !searchTerm || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.buyerName && order.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.shopName && order.shopName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return <span style={{ padding: '4px 8px', background: '#fff7ed', color: '#ea580c', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}><FaBoxOpen /> Chờ xác nhận</span>;
      case 'SHIPPING': return <span style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}><FaTruck /> Đang giao</span>;
      case 'DELIVERED': 
      case 'COMPLETED': return <span style={{ padding: '4px 8px', background: '#f0fdf4', color: '#16a34a', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}><FaCheckCircle /> Thành công</span>;
      case 'CANCELLED': return <span style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}><FaTimesCircle /> Đã hủy</span>;
      default: return <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="moderation-container">
      <div className="moderation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>Quản lý Đơn hàng Toàn hệ thống</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Giám sát và theo dõi luồng giao dịch của tất cả các shop.
          </p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Thanh tìm kiếm */}
        <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Tìm theo Mã đơn, Người mua, Tên Shop..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
        </div>

        {/* Tabs Lọc Trạng thái */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ xác nhận' },
            { id: 'SHIPPING', label: 'Đang giao' },
            { id: 'COMPLETED', label: 'Thành công' },
            { id: 'CANCELLED', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: filterStatus === tab.id ? '#ee4d2d' : '#f1f5f9',
                color: filterStatus === tab.id ? '#fff' : '#475569',
                fontWeight: filterStatus === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>MÃ ĐƠN HÀNG</th>
              <th style={{ textAlign: 'left' }}>NGƯỜI MUA</th>
              <th style={{ textAlign: 'left' }}>NGƯỜI BÁN (SHOP)</th>
              <th style={{ textAlign: 'right' }}>TỔNG TIỀN</th>
              <th style={{ textAlign: 'center' }}>NGÀY ĐẶT</th>
              <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu đơn hàng...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={7} className="empty-row" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Không tìm thấy đơn hàng nào phù hợp.</td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>#{order.id.substring(0, 8).toUpperCase()}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{order.buyerName || 'Khách hàng'}</div>
                  </td>
                  <td><span className="admin-shop-badge" style={{ fontWeight: 500 }}>{order.shopName || 'N/A'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#e74c3c' }}>
                    {order.totalAmount?.toLocaleString('vi-VN')}₫
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>{formatDate(order.createdAt)}</td>
                  <td style={{ textAlign: 'center' }}>{getStatusBadge(order.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      title="Xem chi tiết" 
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      style={{ padding: '6px 12px', backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    >
                      <FaEye size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;