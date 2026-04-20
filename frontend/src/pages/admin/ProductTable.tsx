import React, { useState, useMemo } from 'react';
import { FaSearch, FaTrash, FaTimesCircle, FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface ProductTableProps {
  products: any[];
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // APPENDED: New props for enhanced pagination
  pageSize: number;
  totalElements: number;
  onPageSizeChange: (size: number) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  onDelete, 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  totalElements,
  onPageSizeChange
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // ORIGINAL LOGIC PRESERVED: Local filtering within the current page
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
    <div className="admin-table-container-supreme">
      {/* ORIGINAL SEARCH BAR (PRESERVED) */}
      <div className="table-controls-row-elite">
        <div className="admin-search-box-supreme">
          <FaSearch className="search-icon-inside" />
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

      {/* ORIGINAL DATA TABLE (PRESERVED) */}
      <table className="admin-data-table-supreme">
        <thead>
          <tr>
            <th>HÌNH ẢNH</th>
            <th>TÊN SẢN PHẨM</th>
            <th>DANH MỤC</th>
            <th>GIÁ BÁN</th>
            <th>KHO HÀNG</th>
            <th>TRẠNG THÁI</th>
            <th style={{ textAlign: 'right' }}>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr><td colSpan={7} className="empty-row-visual">Không tìm thấy sản phẩm nào ở trang này.</td></tr>
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
                    <small className="user-uid-text">
                      Shop: <strong>
                        {p.sellerSlug ? (
                          <Link to={`/${p.sellerSlug}`} className="admin-shop-nav-link" title="Xem trang bán hàng">
                            {p.shopName || p.sellerName || "N/A"} <FaExternalLinkAlt size={10} style={{marginLeft: '4px'}} />
                          </Link>
                        ) : (
                          p.shopName || p.sellerName || "N/A"
                        )}
                      </strong>
                    </small>
                  </div>
                </td>
                <td>{p.categoryName || "N/A"}</td>
                <td><strong style={{color: 'var(--orange)'}}>{formatPrice(p.price)}</strong></td>
                <td>{p.stock}</td>
                <td>
                  <span className={`status-pill-colorful ${p.status?.toLowerCase() === 'approved' ? 'active' : 'pending'}`}>
                    {p.status === 'APPROVED' ? 'Đang bán' : 'Chờ duyệt'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-button-group-supreme">
                    <button className="btn-action-inspect ban-btn" onClick={() => onDelete(p.id)} title="Xóa sản phẩm">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* NEW: DYNAMIC PAGINATION FOOTER */}
      <div className="admin-table-pagination-footer-wrapper">
        <div className="pagination-left-info">
          Hiển thị <strong>{filteredProducts.length}</strong> / <strong>{totalElements}</strong> sản phẩm
        </div>

        <div className="pagination-right-controls">
          <div className="size-selector">
            <span>Hiển thị:</span>
            <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
              <option value={10}>10 dòng</option>
              <option value={30}>30 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>

          <div className="nav-buttons">
            <button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)} className="btn-pg">
              <FaChevronLeft /> Trước
            </button>
            <span className="page-num">Trang <strong>{currentPage + 1}</strong> / {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} className="btn-pg">
              Sau <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;