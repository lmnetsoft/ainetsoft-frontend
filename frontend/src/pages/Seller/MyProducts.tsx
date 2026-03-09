import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaPlus } from 'react-icons/fa';
import api from '../../services/api'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile } from '../../services/authService'; // NEW: Import this to get the threshold
import './MyProducts.css';

interface Product {
  id: string; 
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
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // NEW: State for dynamic low stock threshold
  const [lowStockThreshold, setLowStockThreshold] = useState(5); 

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await Promise.all([
        fetchMyProducts(),
        fetchThreshold() // NEW: Get the threshold on load
      ]);
      setLoading(false);
    };

    initPage();
    document.title = "Sản phẩm của tôi | AiNetsoft";
  }, []);

  // NEW: Fetch user threshold from backend
  const fetchThreshold = async () => {
    try {
      const profile = await getUserProfile();
      if (profile?.shopProfile?.lowStockThreshold) {
        setLowStockThreshold(profile.shopProfile.lowStockThreshold);
      }
    } catch (error) {
      console.warn("Could not load shop settings, using default threshold.");
    }
  };

  const fetchMyProducts = async () => {
    try {
      const response = await api.get('/products/seller/my-items');
      setProducts(response.data);
    } catch (error: any) {
      setToastMessage("Không thể tải danh sách sản phẩm.");
      setShowToast(true);
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
      setToastMessage("Không thể xóa sản phẩm.");
      setShowToast(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return <span className="badge-status approved">Đang bán</span>;
      case 'PENDING': return <span className="badge-status pending">Chờ duyệt</span>;
      case 'REJECTED': return <span className="badge-status rejected">Bị từ chối</span>;
      default: return <span className="badge-status">{status}</span>;
    }
  };

  const filteredProducts = products.filter(p => filter === 'ALL' || p.status === filter);

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="profile-main-content">
          <div className="content-header-seller">
            <div>
              <h1>Sản phẩm của tôi</h1>
              <p>Quản lý danh sách sản phẩm và theo dõi trạng thái kiểm duyệt</p>
            </div>
            <button className="save-btn" onClick={() => navigate('/seller/add-product')}>
              <FaPlus /> Thêm sản phẩm
            </button>
          </div>

          <hr className="divider" />

          <div className="purchase-tabs-container">
            {[
              { id: 'ALL', label: `Tất cả (${products.length})` },
              { id: 'APPROVED', label: 'Đang bán' },
              { id: 'PENDING', label: 'Chờ duyệt' },
              { id: 'REJECTED', label: 'Bị từ chối' }
            ].map((tab) => (
              <div 
                key={tab.id}
                className={`tab-item-seller ${filter === tab.id ? 'active' : ''}`}
                onClick={() => setFilter(tab.id as any)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="table-wrapper-seller">
            {loading ? (
              <div className="loading-placeholder-seller">Đang tải dữ liệu...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-placeholder-seller">Không tìm thấy sản phẩm nào.</div>
            ) : (
              <table className="seller-data-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Kho</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-prod-info">
                          <img src={p.images[0] || "/placeholder.png"} alt={p.name} />
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>₫{p.price.toLocaleString()}</td>
                      {/* UPDATED: Dynamic stock threshold logic */}
                      <td className={p.stock < lowStockThreshold ? "low-stock" : ""}>
                        {p.stock}
                        {p.stock < lowStockThreshold && <span className="stock-warning"> !</span>}
                      </td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-btns">
                           <button className="edit-text-btn" onClick={() => navigate(`/seller/edit-product/${p.id}`)}>Sửa</button>
                           <button className="del-text-btn" onClick={() => handleDelete(p.id)}>Xóa</button>
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