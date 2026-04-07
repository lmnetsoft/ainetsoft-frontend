import React, { useState, useMemo } from 'react';
import { FaSearch, FaTrash } from 'react-icons/fa';

interface ProductTableProps {
  products: any[];
  onDelete: (id: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // 🔍 FIXED: Robust filtering logic using useMemo for performance
  // This handles null values and checks multiple fields (Name, Category, Shop)
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;

    return products.filter(p => {
      const nameMatch = (p.name || "").toLowerCase().includes(term);
      const categoryMatch = (p.categoryName || "").toLowerCase().includes(term);
      // Checks both shopName and sellerName as fallbacks
      const shopMatch = (p.shopName || p.sellerName || "").toLowerCase().includes(term);
      
      return nameMatch || categoryMatch || shopMatch;
    });
  }, [products, searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price || 0);
  };

  return (
    <div className="admin-table-container">
      {/* --- ENHANCED SEARCH BAR --- */}
      <div className="table-filter-header">
        <div className="search-box-wrapper">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm, danh mục hoặc tên shop..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
            <tr><td colSpan={7} className="empty-row">Không tìm thấy sản phẩm nào phù hợp.</td></tr>
          ) : (
            filteredProducts.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="admin-prod-thumb">
                    <img 
                      src={p.imageUrls?.[0] || '/placeholder.png'} 
                      alt="thumb" 
                      onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                    />
                  </div>
                </td>
                <td>
                  <div className="user-meta-info">
                    <span className="user-full-name">{p.name}</span>
                    {/* 🛠️ FIXED: Added multiple property checks for Shop Name */}
                    <small className="user-uid-text">
                      Shop: <strong>{p.shopName || p.sellerName || "Chưa xác định"}</strong>
                    </small>
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
                  <button 
                    className="mod-btn delete-grey" 
                    onClick={() => onDelete(p.id)} 
                    title="Xóa sản phẩm"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;