import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaPlus, FaEye, FaEdit, FaTrashAlt, FaCheckSquare } from 'react-icons/fa';
import api from '../../services/api'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile } from '../../services/authService'; 
import './MyProducts.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

// FIX 1: Updated interface to use imageUrls to match backend Product.java
interface Product {
  id: string; 
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrls: string[]; // Changed from 'images' to 'imageUrls'
  status: string;
  sellerId?: string;
}

const MyProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(5); 

  const formatMediaUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null' || url === '') return "/placeholder.png";
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}${cleanPath}`;
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await Promise.all([fetchMyProducts(), fetchThreshold()]);
      setLoading(false);
    };
    initPage();
    document.title = "Sản phẩm của tôi | AiNetsoft";
  }, []);

  const fetchThreshold = async () => {
    try {
      const profile = await getUserProfile();
      if (profile?.shopProfile?.lowStockThreshold) {
        setLowStockThreshold(profile.shopProfile.lowStockThreshold);
      }
    } catch (error) { console.warn("Could not load shop settings."); }
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Xóa sản phẩm này sẽ xóa vĩnh viễn cả hình ảnh và video trên máy chủ. Bạn chắc chắn chứ?")) return;
    try {
      await api.delete(`/products/seller/delete/${productId}`);
      setToastMessage("Đã xóa sản phẩm và dữ liệu vật lý thành công!");
      setShowToast(true);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedIds(prev => prev.filter(id => id !== productId));
    } catch (error: any) {
      setToastMessage("Lỗi khi xóa sản phẩm.");
      setShowToast(true);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn? Thao tác này sẽ dọn sạch toàn bộ tệp đính kèm trên server.`)) return;
    try {
      await api.post('/products/seller/delete-bulk', selectedIds);
      setToastMessage(`Đã dọn dẹp và xóa ${selectedIds.length} sản phẩm thành công!`);
      setShowToast(true);
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (error: any) {
      setToastMessage("Lỗi khi thực hiện xóa hàng loạt.");
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
              <p>Quản lý và dọn dẹp kho hàng của bạn</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedIds.length > 0 && (
                <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                  <FaTrashAlt /> Xóa {selectedIds.length} mục
                </button>
              )}
              <button className="save-btn" onClick={() => navigate('/seller/add')}>
                <FaPlus /> Thêm sản phẩm
              </button>
            </div>
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
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll} 
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} 
                      />
                    </th>
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
                    <tr key={p.id} className={selectedIds.includes(p.id) ? "row-selected" : ""}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(p.id)} 
                          onChange={() => toggleSelectItem(p.id)} 
                        />
                      </td>
                      <td>
                        <div className="table-prod-info">
                          {/* FIX 2: Correctly map imageUrls to fix the white square issue */}
                          <img 
                            src={formatMediaUrl(p.imageUrls?.[0])} 
                            alt={p.name} 
                            onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                          />
                          <span style={{fontWeight: selectedIds.includes(p.id) ? '600' : '400'}}>{p.name}</span>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>₫{p.price.toLocaleString()}</td>
                      <td className={p.stock < lowStockThreshold ? "low-stock" : ""}>
                        {p.stock}
                        {p.stock < lowStockThreshold && <span className="stock-warning"> !</span>}
                      </td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-btns" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                           <button className="preview-text-btn" onClick={() => navigate(`/product/${p.id}`, { state: { productPreview: p } })}>
                             <FaEye /> Xem trước
                           </button>
                           <button className="edit-text-btn" onClick={() => navigate(`/seller/edit/${p.id}`)}>
                             <FaEdit /> Sửa
                           </button>
                           <button className="del-text-btn" onClick={() => handleDelete(p.id)}>
                             <FaTrashAlt /> Xóa
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