import React from 'react';
import { FaStar, FaTrash } from 'react-icons/fa';

interface ReviewTableProps {
  allReviews: any[];
  handleDeleteReview: (id: string) => void;
}

const ReviewTable: React.FC<ReviewTableProps> = ({ allReviews, handleDeleteReview }) => (
  <div className="admin-table-container">
    <table className="admin-data-table">
      <thead>
        <tr>
          <th>Người dùng</th>
          <th>Sản phẩm</th>
          <th>Đánh giá</th>
          <th>Nội dung</th>
          <th>Ngày</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {allReviews.length === 0 ? (
          <tr><td colSpan={6} className="empty-row">Chưa có đánh giá nào.</td></tr>
        ) : (
          allReviews.map(rev => (
            <tr key={rev.id}>
              <td><strong>{rev.userName}</strong></td>
              <td>{rev.productName || 'N/A'}</td>
              <td><span className="rating-badge">{rev.rating} <FaStar size={10} /></span></td>
              <td className="comment-cell" title={rev.comment}>{rev.comment}</td>
              <td>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</td>
              <td className="action-btns">
                <button className="mod-btn reject" onClick={() => handleDeleteReview(rev.id)} title="Xóa đánh giá này"><FaTrash /></button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default ReviewTable;