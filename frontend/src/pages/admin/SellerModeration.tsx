import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const SellerModeration = () => {
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/sellers/pending');
      setPendingSellers(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách duyệt.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    const reason = !approved ? window.prompt("Lý do từ chối:") : "";
    if (!approved && !reason) return;

    try {
      await api.post(`/admin/sellers/approve/${userId}`, {
        approved,
        adminNote: reason
      });
      toast.success(approved ? "Đã duyệt người bán!" : "Đã từ chối.");
      fetchPending();
    } catch (err) {
      toast.error("Thao tác thất bại.");
    }
  };

  useEffect(() => { fetchPending(); }, []);

  return (
    <div className="admin-moderation-page">
      <h2>Phê duyệt Người bán</h2>
      {loading ? <p>Đang tải...</p> : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Họ Tên</th>
              <th>Email</th>
              <th>Ngày yêu cầu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pendingSellers.map(seller => (
              <tr key={seller.id}>
                <td>{seller.fullName}</td>
                <td>{seller.email}</td>
                <td>{new Date(seller.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleApproval(seller.id, true)} className="btn-approve">Duyệt</button>
                  <button onClick={() => handleApproval(seller.id, false)} className="btn-reject">Từ chối</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SellerModeration;