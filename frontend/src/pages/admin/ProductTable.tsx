import React, { useState, useMemo } from 'react';
import { FaSearch, FaTrash, FaTimesCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ProductTableProps {
  products: any[];
  onDelete: (id: string) => void;
  // 🚀 NEW: Pagination Props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  onDelete, 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Client-side filter for the current page's data
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(p => {
      const nameMatch = (p.name || "").toLowerCase().includes(term);
      const categoryMatch = (p.categoryName || "").toLowerCase().includes(term);
      const shopMatch = (p.shopName || p.sellerName || "").toLowerCase().includes(term);
      return nameMatch || categoryMatch || shopMatch;
    });
  }, [products, searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  return (
    <div className="admin-table-container">
      {/* --- SEARCH BAR SECTION --- */}
      <div className="table-filter-header">
        <div className="search-box-wrapper">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm, danh mục hoặc tên shop..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")} title="Xóa tìm kiếm">
              <FaTimesCircle />
            </button>
          )}
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <table className="admin-data-table">
        <thead>
          <tr>
            <th>Hình ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá bán</th>
            <th>Kho hàng</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr><td colSpan={7} className="empty-row">Không tìm thấy sản phẩm nào ở trang này.</td></tr>
          ) : (
            filteredProducts.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="admin-prod-thumb">
                    <img src={p.imageUrls?.[0] || '/placeholder.png'} alt="thumb" onError={(e) => (e.currentTarget.src = "/placeholder.png")} />
                  </div>
                </td>
                <td>
                  <div className="user-meta-info">
                    <span className="user-full-name">{p.name}</span>
                    <small className="user-uid-text">Shop: <strong>{p.shopName || p.sellerName || "Chưa xác định"}</strong></small>
                  </div>
                </td>
                <td>{p.categoryName || "N/A"}</td>
                <td><strong style={{color: 'var(--orange)'}}>{formatPrice(p.price)}</strong></td>
                <td>{p.stock}</td>
                <td>
                  <span className={`status-badge ${p.status?.toLowerCase() === 'approved' ? 'active' : 'pending'}`}>
                    {p.status === 'APPROVED' ? 'Đang bán' : 'Chờ duyệt'}
                  </span>
                </td>
                <td className="action-btns">
                  <button className="mod-btn delete-grey" onClick={() => onDelete(p.id)} title="Xóa sản phẩm">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 🚀 NEW: PAGINATION CONTROLS FOOTER */}
      {totalPages > 1 && (
        <div className="table-pagination-footer">
          <div className="pagination-info">
            Hiển thị trang <strong>{currentPage + 1}</strong> trên <strong>{totalPages}</strong>
          </div>
          <div className="pagination-controls">
            <button 
              className="page-nav-btn" 
              disabled={currentPage === 0} 
              onClick={() => onPageChange(currentPage - 1)}
            >
              <FaChevronLeft /> Trước
            </button>
            <button 
              className="page-nav-btn" 
              disabled={currentPage >= totalPages - 1} 
              onClick={() => onPageChange(currentPage + 1)}
            >
              Sau <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;