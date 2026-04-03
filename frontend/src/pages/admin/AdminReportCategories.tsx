import React, { useState, useEffect } from 'react';
import { FaTags, FaPlus, FaTrash, FaSync } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminReportCategories = () => {
  const [reasons, setReasons] = useState<any[]>([]);
  const [newReasonName, setNewReasonName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchReasons = async (showToast = false) => {
    try {
      setLoading(true);
      const response = await adminService.getViolationReasons();
      const data = response.data || response;
      
      // Sort to keep "Other" at the bottom if it exists
      const mainList = data.filter((r: any) => r.name !== "Lý do khác...");
      const otherItem = data.filter((r: any) => r.name === "Lý do khác...");
      setReasons([...mainList, ...otherItem]);
      
      if (showToast) toast.success("Đã cập nhật danh sách");
    } catch (err) {
      console.error("Reasons Fetch Error:", err);
      toast.error("Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReason = async () => {
    if (!newReasonName.trim()) {
      toast.error("Vui lòng nhập tên lý do");
      return;
    }
    try {
      await adminService.saveViolationReason({ name: newReasonName.trim(), active: true });
      setNewReasonName("");
      toast.success("Đã thêm danh mục mới!");
      fetchReasons(); 
    } catch (err) {
      toast.error("Không thể thêm lý do.");
    }
  };

  const handleDeleteReason = async (id: string) => {
    if (!window.confirm("Xóa danh mục vi phạm này? Người dùng sẽ không thể chọn lý do này khi báo cáo.")) return;
    try {
      await adminService.deleteViolationReason(id);
      toast.success("Đã xóa danh mục.");
      fetchReasons();
    } catch (err) {
      toast.error("Không thể xóa");
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  return (
    <div className="admin-dashboard-wrapper">
      <header className="admin-page-header">
        <div className="header-left">
          <h1><FaTags /> Danh mục báo cáo</h1>
          <p className="subtitle">Quản lý các lý do vi phạm hiển thị khi người dùng gửi báo cáo.</p>
        </div>
        <button className="btn-refresh" onClick={() => fetchReasons(true)} disabled={loading}>
          <FaSync className={loading ? 'spin' : ''} /> <span>Làm mới</span>
        </button>
      </header>

      <div className="reasons-header" style={{ marginBottom: '25px', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Nhập tên lý do vi phạm mới..." 
          value={newReasonName}
          onChange={e => setNewReasonName(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9' }}
        />
        <button className="btn-add-reason" onClick={handleAddReason}>
          <FaPlus /> Thêm mới
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Tên lý do vi phạm</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="empty-row">Đang tải...</td></tr>
            ) : reasons.length === 0 ? (
              <tr><td colSpan={4} className="empty-row">Chưa có danh mục nào.</td></tr>
            ) : (
              reasons.map(reason => (
                <tr key={reason.id}>
                  <td><strong>{reason.name}</strong></td>
                  <td><span className="status-badge active">Đang hiển thị</span></td>
                  <td>{new Date(reason.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="action-btns">
                    <button className="mod-btn reject" onClick={() => handleDeleteReason(reason.id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReportCategories;