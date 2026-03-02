import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Use our centralized API instance
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './MyProducts.css';

interface Product {
  id: string; // MongoDB IDs are strings
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  status: string;
}

const MyProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
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
      // Matches @GetMapping("/seller/my-items") in ProductController
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.")) return;

    try {
      // Matches @DeleteMapping("/seller/delete/{id}") in ProductController
      await api.delete(`/products/seller/delete/${productId}`);
      setToastMessage("Xóa sản phẩm thành công!");
      setShowToast(true);
      // Refresh the list locally
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      setToastMessage(error.response?.data || "Không thể xóa sản phẩm.");
      setShowToast(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return <span className="status-badge active">Đang bán</span>;
      case 'PENDING': return <span className="status-badge pending">Chờ duyệt</span>;
      case 'REJECTED': return <span className="status-badge rejected">Bị từ chối</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

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
              <p>Quản lý và theo dõi các mặt hàng đang kinh doanh</p>
            </div>
            <button 
              className="add-product-btn"
              onClick={() => navigate('/seller/add-product')}
            >
              + Thêm sản phẩm mới
            </button>
          </div>

          <div className="product-filter-tabs">
            <div className="tab active">Tất cả</div>
            <div className="tab">Đang bán</div>
            <div className="tab">Hết hàng</div>
          </div>

          <div className="product-table-container">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <img src="/logo.svg" alt="No products" style={{ opacity: 0.5 }} />
                <p>Bạn chưa có sản phẩm nào.</p>
                <button onClick={() => navigate('/seller/add-product')}>Đăng bán ngay</button>
              </div>
            ) : (
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th>Phân loại</th>
                    <th>Giá</th>
                    <th>Kho hàng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <img src={product.images[0] || "/placeholder.png"} alt={product.name} />
                          <span className="product-name-text">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>₫{product.price.toLocaleString()}</td>
                      <td className={product.stock < 5 ? "low-stock" : ""}>{product.stock}</td>
                      <td>{getStatusBadge(product.status)}</td>
                      <td>
                        <div className="action-links">
                          <button 
                            className="edit-btn" 
                            onClick={() => navigate(`/seller/edit-product/${product.id}`)}
                          >
                            Sửa
                          </button>
                          <button 
                            className="del-btn" 
                            onClick={() => handleDelete(product.id)}
                          >
                            Xóa
                          </button>
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