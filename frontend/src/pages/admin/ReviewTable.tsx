import React, { useState, useMemo } from 'react';
import { 
  FaStar, FaTrash, FaSearch, FaTimesCircle, 
  FaChevronLeft, FaChevronRight, FaUserCircle 
} from 'react-icons/fa';

interface ReviewTableProps {
  allReviews: any[];
  handleDeleteReview: (id: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const ReviewTable: React.FC<ReviewTableProps> = ({ 
  allReviews, handleDeleteReview, 
  currentPage, pageSize, onPageChange, onPageSizeChange 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReviews = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allReviews;
    return allReviews.filter(rev => 
      (rev.productName || "").toLowerCase().includes(term) ||
      (rev.comment || "").toLowerCase().includes(term) ||
      (rev.userName || "").toLowerCase().includes(term)
    );
  }, [allReviews, searchTerm]);

  const paginatedReviews = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;

  return (
    <div className="admin-table-container-supreme">
      <div className="table-controls-row-elite">
        <div className="admin-search-box-supreme">
          <FaSearch className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Tìm theo sản phẩm, nội dung hoặc khách hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}><FaTimesCircle /></button>
          )}
        </div>
      </div>

      <table className="admin-data-table-supreme">
        <thead>
          <tr>
            <th>SẢN PHẨM</th>
            <th>ĐÁNH GIÁ</th>
            <th>NỘI DUNG</th>
            <th>NGƯỜI DÙNG</th>
            <th>NGÀY</th>
            <th style={{ textAlign: 'right' }}>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {paginatedReviews.length === 0 ? (
            <tr><td colSpan={6} className="empty-row-visual">Không có đánh giá nào.</td></tr>
          ) : (
            paginatedReviews.map(rev => (
              <tr key={rev.id}>
                <td><strong>{rev.productName || 'N/A'}</strong></td>
                <td>
                  <div style={{color: '#ffc107', display: 'flex', gap: '2px'}}>
                    {[...Array(rev.rating)].map((_, i) => <FaStar key={i} size={12}/>)}
                  </div>
                </td>
                <td className="comment-cell">"{rev.comment}"</td>
                <td>
                  <div className="user-meta-info">
                    <span className="user-full-name"><FaUserCircle style={{marginRight: '6px'}}/> {rev.userName}</span>
                  </div>
                </td>
                <td>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-action-inspect ban-btn" onClick={() => handleDeleteReview(rev.id)} title="Xóa đánh giá"><FaTrash /></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="admin-table-pagination-footer-wrapper">
        <div className="pagination-left-info">
          Hiển thị <strong>{paginatedReviews.length}</strong> / <strong>{filteredReviews.length}</strong> đánh giá
        </div>
        <div className="pagination-right-controls">
          <div className="size-selector">
            <span>Hiển thị:</span>
            <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
              <option value={10}>10 dòng</option>
              <option value={30}>30 dòng</option>
            </select>
          </div>
          <div className="nav-buttons">
            <button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)} className="btn-pg"><FaChevronLeft /> Trước</button>
            <span className="page-num">Trang <strong>{currentPage + 1}</strong> / {totalPages}</span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} className="btn-pg">Sau <FaChevronRight /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewTable;