import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './MyProducts.css';

interface Product {
  id: string; 
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  status: string; // PENDING, APPROVED, REJECTED
}

const MyProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchMyProducts();
    document.title = "Quản lý sản phẩm | AiNetsoft Seller";
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/seller/my-items');
      setProducts(response.data);
    } catch (error: any) {
      setToastMessage(error.response?.data || "Không thể tải danh sách sản phẩm.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await api.delete(`/products/seller/delete/${productId}`);
      setToastMessage("Xóa sản phẩm thành công!");
      setShowToast(true);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      setToastMessage(error.response?.data || "Không thể xóa sản phẩm.");
      setShowToast(true);
    }
  };

  // --- UPDATED STATUS BADGES ---
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': 
        return <span className="status-badge approved">Đang hiển thị</span>;
      case 'PENDING': 
        return <span className="status-badge pending">Đang chờ duyệt</span>;
      case 'REJECTED': 
        return <span className="status-badge rejected">Bị từ chối</span>;
      default: 
        return <span className="status-badge">{status}</span>;
    }
  };

  // Logic to filter the list based on the selected tab
  const filteredProducts = products.filter(p => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  return (
    <div className="seller-products-wrapper">
      <ToastNotification 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

      <div className="container seller-container">
        <AccountSidebar />
        
        <main className="seller-main-content">
          <div className="seller-header">
            <div>
              <h1>Sản phẩm của tôi</h1>
              <p>Theo dõi trạng thái kiểm duyệt và quản lý tồn kho</p>
            </div>
            <button className="add-product-btn" onClick={() => navigate('/seller/add-product')}>
              + Đêm sản phẩm mới
            </button>
          </div>

          {/* --- ACTIVE FILTER TABS --- */}
          <div className="product-filter-tabs">
            <div 
              className={`tab ${filter === 'ALL' ? 'active' : ''}`} 
              onClick={() => setFilter('ALL')}
            >
              Tất cả ({products.length})
            </div>
            <div 
              className={`tab ${filter === 'APPROVED' ? 'active' : ''}`} 
              onClick={() => setFilter('APPROVED')}
            >
              Đang bán
            </div>
            <div 
              className={`tab ${filter === 'PENDING' ? 'active' : ''}`} 
              onClick={() => setFilter('PENDING')}
            >
              Chờ duyệt
            </div>
            <div 
              className={`tab ${filter === 'REJECTED' ? 'active' : ''}`} 
              onClick={() => setFilter('REJECTED')}
            >
              Bị từ chối
            </div>
          </div>

          <div className="product-table-container">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu từ hệ thống...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>Không có sản phẩm nào trong danh mục này.</p>
                {filter === 'ALL' && <button onClick={() => navigate('/seller/add-product')}>Đăng bán ngay</button>}
              </div>
            ) : (
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Giá bán</th>
                    <th>Kho</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <img src={product.images[0] || "/placeholder.png"} alt="" />
                          <span className="product-name-text">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>₫{product.price.toLocaleString()}</td>
                      <td className={product.stock < 5 ? "low-stock" : ""}>{product.stock}</td>
                      <td>{getStatusBadge(product.status)}</td>
                      <td>
                        <div className="action-links">
                          <button onClick={() => navigate(`/seller/edit-product/${product.id}`)}>Sửa</button>
                          <button onClick={() => handleDelete(product.id)} className="del-text">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyProducts;