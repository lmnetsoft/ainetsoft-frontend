import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { 
  FaMoneyCheckAlt, FaCheck, FaTimes, FaInfoCircle, FaSearch, 
  FaFilter, FaUniversity, FaUserAlt, FaClock 
} from 'react-icons/fa';
import './AdminWithdrawals.css';

const AdminWithdrawals = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Processing States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');

  useEffect(() => {
    fetchRequests();
    document.title = "Quản lý Rút tiền | AiNetsoft Admin";
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/withdrawals/admin/all');
      setRequests(res.data);
    } catch (err) {
      setToastMessage("Không thể tải danh sách yêu cầu.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string, status: 'COMPLETED' | 'REJECTED') => {
    if (status === 'REJECTED' && !adminNote.trim()) {
      setToastMessage("Vui lòng nhập lý do từ chối.");
      setShowToast(true);
      return;
    }

    try {
      await api.put(`/withdrawals/admin/process/${id}`, {
        status: status,
        adminNote: adminNote
      });
      setToastMessage(status === 'COMPLETED' ? "Đã phê duyệt thanh toán!" : "Đã từ chối yêu cầu.");
      setShowToast(true);
      setProcessingId(null);
      setAdminNote('');
      fetchRequests(); // Refresh list
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || "Lỗi xử lý yêu cầu.");
      setShowToast(true);
    }
  };

  const filteredData = filterStatus === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  if (loading) return <div className="admin-loading">Đang tải dữ liệu tài chính...</div>;

  return (
    <div className="admin-dashboard-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      
      <div className="admin-stats-header" style={{ marginBottom: '20px' }}>
        <div className="header-main">
          <h1>QUẢN LÝ RÚT TIỀN</h1>
          <p>Đối soát và phê duyệt yêu cầu thanh toán cho Người bán</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="COMPLETED">Đã hoàn tất</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
        <div className="stats-mini">
           Tổng yêu cầu: <strong>{requests.length}</strong>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-custom-table">
          <thead>
            <tr>
              <th>Người bán</th>
              <th>Số tiền</th>
              <th>Thông tin Ngân hàng</th>
              <th>Ngày yêu cầu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div className="seller-cell">
                      <FaUserAlt className="user-icon-mini" />
                      <span>{req.sellerId}</span>
                    </div>
                  </td>
                  <td>
                    <strong className="amount-text">₫{req.amount.toLocaleString()}</strong>
                  </td>
                  <td>
                    <div className="bank-info-cell">
                      <p><strong>{req.bankName}</strong></p>
                      <p className="sub-text">{req.accountNumber}</p>
                      <p className="sub-text">{req.accountHolder}</p>
                    </div>
                  </td>
                  <td>{new Date(req.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge ${req.status.toLowerCase()}`}>
                      {req.status === 'PENDING' ? 'Chờ duyệt' : req.status === 'COMPLETED' ? 'Thành công' : 'Từ chối'}
                    </span>
                  </td>
                  <td>
                    {req.status === 'PENDING' ? (
                      <div className="action-buttons">
                        <button className="btn-approve" onClick={() => setProcessingId(req.id)}>
                          <FaCheck /> Xử lý
                        </button>
                      </div>
                    ) : (
                      <span className="processed-date">
                        <FaClock /> {req.processedAt ? new Date(req.processedAt).toLocaleDateString() : '--'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-row">Không có yêu cầu nào phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Processing Modal */}
      {processingId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <h3>Phê duyệt thanh toán</h3>
              <FaTimes className="close-btn" onClick={() => setProcessingId(null)} />
            </div>
            <div className="modal-body">
              <p className="modal-hint">Vui lòng thực hiện chuyển khoản ngân hàng trước khi bấm "Hoàn tất".</p>
              <div className="form-group">
                <label>Ghi chú (Lý do nếu từ chối)</label>
                <textarea 
                  value={adminNote} 
                  onChange={(e) => setAdminNote(e.target.value)} 
                  placeholder="Nhập ghi chú cho người bán..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-reject-outline" onClick={() => handleProcess(processingId, 'REJECTED')}>
                Từ chối yêu cầu
              </button>
              <button className="btn-approve-solid" onClick={() => handleProcess(processingId, 'COMPLETED')}>
                Xác nhận Đã chuyển tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;