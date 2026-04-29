import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaEye, FaEdit, FaTrashAlt, FaChevronLeft, FaChevronRight, FaSearch, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../services/api'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile } from '../../services/authService'; 
import './MyProducts.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

interface Product {
  id: string; 
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrls: string[]; 
  status: string;
  sellerId?: string;
}

const MyProducts = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dashboard Link States
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>(
    (location.state?.initialFilter as any) || 'ALL'
  );
  
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(
    location.state?.filterLowStock || false
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10); 

  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(5); 

  useEffect(() => {
    if (location.state?.initialFilter || location.state?.filterLowStock) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [filter, searchTerm, showLowStockOnly]);

  const formatMediaUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null' || url === '') return "/placeholder.png";
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
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

  const filteredProducts = products.filter(p => {
    const statusMatch = filter === 'ALL' || p.status === filter;
    const searchMatch = !searchTerm || 
                        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const stockMatch = !showLowStockOnly || p.stock < lowStockThreshold;
    
    return statusMatch && searchMatch && stockMatch;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
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
      setToastMessage("Đã xóa sản phẩm thành công!");
      setShowToast(true);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedIds(prev => prev.filter(id => id !== productId));
    } catch (error: any) {
      setToastMessage("Lỗi khi xóa sản phẩm.");
      setShowToast(true);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn?`)) return;
    try {
      await api.post('/products/seller/delete-bulk', selectedIds);
      setToastMessage(`Đã xóa ${selectedIds.length} sản phẩm thành công!`);
      setShowToast(true);
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (error: any) {
      setToastMessage("Lỗi khi xóa hàng loạt.");
      setShowToast(true);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(0); 
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return <span className="badge-status approved">Đang bán</span>;
      case 'PENDING': return <span className="badge-status pending">Chờ duyệt</span>;
      case 'REJECTED': return <span className="badge-status rejected">Bị từ chối</span>;
      default: return <span className="badge-status">{status}</span>;
    }
  };

  return (
    <div className="my-products-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      
      <main className="my-products-main-view">
        <div className="supreme-content-header centered-header">
          <h1>Sản phẩm của tôi</h1>
          <p>Quản lý và dọn dẹp kho hàng của bạn</p>
        </div>

        <div className="product-actions-toolbar">
          <div className="toolbar-left">
            {selectedIds.length > 0 && (
              <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                <FaTrashAlt /> Xóa {selectedIds.length} mục
              </button>
            )}
          </div>
          <button className="supreme-add-btn" onClick={() => navigate('/seller/add')}>
            <FaPlus /> Thêm sản phẩm mới
          </button>
        </div>

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

        <div style={{ padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%', maxWidth: '500px' }}>
            <FaSearch style={{ position: 'absolute', left: '14px', color: '#ee4d2d', fontSize: '15px' }} />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm hoặc danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '14px',
                color: '#1e293b',
                transition: 'border-color 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ee4d2d'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            {searchTerm && (
              <FaTimesCircle
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '14px', color: '#94a3b8', cursor: 'pointer', fontSize: '15px' }}
              />
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: showLowStockOnly ? '#e74c3c' : '#475569', fontWeight: showLowStockOnly ? '600' : '500', transition: 'color 0.2s' }}>
            <input 
              type="checkbox" 
              checked={showLowStockOnly} 
              onChange={(e) => setShowLowStockOnly(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: '#e74c3c', cursor: 'pointer' }}
            />
            <FaExclamationTriangle style={{ color: showLowStockOnly ? '#e74c3c' : '#94a3b8' }} /> 
            Chỉ hiện sản phẩm sắp hết hàng (&lt; {lowStockThreshold})
          </label>
        </div>

        <div className="table-wrapper-seller">
          {loading ? (
            <div className="loading-placeholder-seller">Đang tải dữ liệu...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-placeholder-seller">Không tìm thấy sản phẩm nào phù hợp.</div>
          ) : (
            <>
              <table className="seller-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll} 
                        checked={selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0} 
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
                  {paginatedProducts.map(p => (
                    <tr key={p.id} className={selectedIds.includes(p.id) ? "row-selected" : ""}>
                      <td>
                        <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelectItem(p.id)} />
                      </td>
                      <td>
                        <div className="table-prod-info">
                          <img 
                            src={formatMediaUrl(p.imageUrls?.[0])} 
                            alt={p.name} 
                            onError={(e) => { 
                                e.currentTarget.onerror = null; 
                                e.currentTarget.src = "/placeholder.png"; 
                            }}
                          />
                          <span style={{fontWeight: selectedIds.includes(p.id) ? '700' : '500'}}>{p.name}</span>
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
                        <div className="action-btns-group">
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

              <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #edf2f7', background: '#f8fafc' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  Hiển thị {paginatedProducts.length} / {filteredProducts.length} sản phẩm
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>Hiển thị:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value={10}>10 dòng</option>
                      <option value={20}>20 dòng</option>
                      <option value={50}>50 dòng</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === 0 ? '#f1f5f9' : '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <FaChevronLeft size={12} style={{marginRight: '5px'}}/> Trước
                  </button>
                  
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                    Trang {currentPage + 1} / {totalPages || 1}
                  </span>
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage >= totalPages - 1}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage >= totalPages - 1 ? '#f1f5f9' : '#fff', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    Sau <FaChevronRight size={12} style={{marginLeft: '5px'}}/>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyProducts;