import React, { useState, useEffect } from 'react';
import { FaStar, FaTrash, FaSync } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllReviews();
      setReviews(Array.isArray(res) ? res : (res?.content || []));
    } catch (err) { toast.error("Lỗi tải đánh giá."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  return (
    <div className="admin-dashboard-wrapper">
      <header className="admin-page-header">
        <div className="header-left"><h1><FaStar /> Quản lý Đánh giá</h1></div>
        <button className="btn-refresh" onClick={fetchReviews}><FaSync /></button>
      </header>
      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr><th>Người dùng</th><th>Sản phẩm</th><th>Đánh giá</th><th>Nội dung</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {reviews.map(rev => (
              <tr key={rev.id}>
                <td>{rev.userName}</td>
                <td>{rev.productName}</td>
                <td>{rev.rating} <FaStar color="orange" size={12}/></td>
                <td>{rev.comment}</td>
                <td><button className="mod-btn reject" onClick={() => adminService.deleteReview(rev.id).then(fetchReviews)}><FaTrash /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReviews;