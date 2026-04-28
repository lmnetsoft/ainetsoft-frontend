import React, { useState, useMemo } from 'react';
import { FaSearch, FaTrash, FaTimesCircle, FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface ProductTableProps {
  products: any[];
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
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
    <div className="admin-table-container-supreme" style={{ display: 'flex', flexDirection: 'column' }}>
      
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

      {/* 🚀 CHỐNG SẬP LAYOUT: Cố định chiều cao bảng */}
      <div style={{ minHeight: '650px', overflowX: 'auto', flex: 1 }}>
        <table className="admin-data-table-supreme">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '80px' }}>HÌNH ẢNH</th>
              <th style={{ textAlign: 'left' }}>TÊN SẢN PHẨM</th>
              <th style={{ textAlign: 'center' }}>DANH MỤC</th>
              <th style={{ textAlign: 'center' }}>GIÁ BÁN</th>
              <th style={{ textAlign: 'center' }}>KHO HÀNG</th>
              <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={7} className="empty-row-visual">Không tìm thấy sản phẩm nào ở trang này.</td></tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id}>
                  
                  {/* HÌNH ẢNH - Logic gốc của bạn */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="admin-prod-thumb" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <img 
                        src={p.imageUrls?.[0] || '/placeholder.png'} 
                        alt="thumb" 
                        onError={(e) => (e.currentTarget.src = "/placeholder.png")} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  </td>
                  
                  {/* TÊN VÀ SHOP LINK - Logic gốc của bạn */}
                  <td style={{ textAlign: 'left' }}>
                    <div className="user-meta-info" style={{ alignItems: 'flex-start' }}>
                      <span className="user-full-name">{p.name}</span>
                      <small className="user-uid-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        Shop: <strong>
                          {p.sellerSlug ? (
                            <Link to={`/${p.sellerSlug}`} className="admin-shop-nav-link" title="Xem trang bán hàng" style={{ color: '#3498db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                              {p.shopName || p.sellerName || "N/A"} <FaExternalLinkAlt size={10} style={{marginLeft: '4px'}} />
                            </Link>
                          ) : (
                            p.shopName || p.sellerName || "N/A"
                          )}
                        </strong>
                      </small>
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
                      {p.categoryName || "N/A"}
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: '#e74c3c', fontWeight: 700 }}>
                      {formatPrice(p.price)}
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: '#1e293b', fontWeight: 600 }}>
                      {p.stock}
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span className={`status-pill-colorful ${p.status?.toLowerCase() === 'approved' ? 'active' : 'pending'}`}>
                        {p.status === 'APPROVED' ? 'Đang bán' : 'Chờ duyệt'}
                      </span>
                    </div>
                  </td>
                  
                  {/* THAO TÁC - Đã Căn Giữa */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-button-group-supreme" style={{ justifyContent: 'center' }}>
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
      </div>

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
