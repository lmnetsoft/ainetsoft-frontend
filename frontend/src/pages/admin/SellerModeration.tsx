import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';
import { 
  FaEye, FaCheck, FaTimes, FaIdCard, FaUniversity, 
  FaStore, FaFileInvoice, FaUserClock, FaHistory 
} from 'react-icons/fa';
import './AdminDashboard.css'; 

const SellerModeration = () => {
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Success Animation States
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // --- FETCH DATA ---
  const fetchPending = async () => {
    try {
      setLoading(true);
      // Calls @GetMapping("/admin/sellers/pending")
      const data = await adminService.getPendingSellers();
      
      // STABILITY FIX: Ensure Bestseller shows up even if data is wrapped
      if (Array.isArray(data)) {
        setPendingSellers(data);
      } else if (data && data.users) {
        setPendingSellers(data.users);
      } else {
        setPendingSellers([]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Không thể tải danh sách duyệt.");
    } finally {
      setLoading(false);
    }
  };

  // --- REVIEW MODAL LOGIC ---
  const openReview = async (userId: string) => {
    try {
      const details = await adminService.getSellerDetails(userId);
      setSelectedSeller(details);
      setShowModal(true);
    } catch (err) {
      toast.error("Không thể tải chi tiết hồ sơ.");
    }
  };

  const triggerSuccessAnimation = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  // --- APPROVAL / REJECTION LOGIC ---
  const handleAction = async (approved: boolean) => {
    if (!approved && !adminNote) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    try {
      setIsProcessing(true);
      // Synchronized with AdminController.java POST @/sellers/process/{userId}
      await adminService.approveSeller(selectedSeller.id, approved, adminNote);
      
      setShowModal(false);
      triggerSuccessAnimation(approved ? "Đã phê duyệt người bán!" : "Đã từ chối hồ sơ");
      
      setAdminNote('');
      fetchPending(); // Refresh list to remove the processed user
    } catch (err) {
      console.error("Action Error:", err);
      toast.error("Thao tác thất bại.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => { 
    fetchPending(); 
  }, []);

  return (
    <div className="admin-moderation-page">
      {/* --- SUCCESS ANIMATION OVERLAY --- */}
      {showSuccess && (
        <div className="success-animation-overlay">
          <div className="success-checkmark-card">
            <div className="check-icon-wrapper">
              <FaCheck />
            </div>
            <h3>Hoàn tất!</h3>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* --- PAGE HEADER --- */}
      <div className="admin-page-header">
        <div className="header-icon-wrap">
          <FaUserClock className="main-icon" />
        </div>
        <div className="header-text">
          <h2>Phê duyệt Người bán</h2>
          <p>Đối soát thông tin định danh, mã số thuế và tài khoản ngân hàng</p>
        </div>
      </div>

      {/* --- TABLE CONTENT --- */}
      {loading ? (
        <div className="loading-spinner-wrap">
          <div className="spinner"></div>
          <p>Đang tải danh sách chờ...</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Thông tin liên hệ</th>
                <th>Ngày yêu cầu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingSellers.length > 0 ? pendingSellers.map(seller => (
                <tr key={seller.id}>
                  <td>
                    <div className="user-info-cell">
                      <img src={seller.avatarUrl || '/default-avatar.png'} alt="avatar" />
                      <div className="name-box">
                        <strong className="full-name">{seller.fullName || 'Test User'}</strong>
                        <span className="user-id">UID: {seller.id?.substring(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info-cell">
                      <p className="email-text">{seller.email}</p>
                      <p className="phone-text">{seller.phone || 'N/A'}</p>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <FaHistory /> {new Date(seller.updatedAt || seller.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td><span className="status-badge-pending">Chờ duyệt</span></td>
                  <td>
                    <button onClick={() => openReview(seller.id)} className="btn-review-action">
                      <FaEye /> Xem chi tiết
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="empty-table-msg">
                    <p>Hiện không có yêu cầu nâng cấp nào cần xử lý.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MASTER REVIEW MODAL --- */}
      {showModal && selectedSeller && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content seller-review-modal">
            <div className="modal-header">
              <div className="header-title">
                 <FaStore className="title-icon" />
                 <h3>Thẩm định hồ sơ: {selectedSeller.fullName}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <div className="modal-body review-grid">
              {/* Identity Section */}
              <div className="review-section">
                <h4 className="section-title"><FaIdCard /> Hồ sơ Định danh</h4>
                <div className="review-data-card">
                  <div className="data-row">
                    <span className="label">Số CCCD:</span>
                    <span className="value highlight">{selectedSeller.identityInfo?.cccdNumber}</span>
                  </div>
                  <div className="id-images-container">
                    <div className="id-image-item">
                      <span className="img-label">Mặt trước</span>
                      <div className="img-wrapper">
                        <img src={selectedSeller.identityInfo?.frontImageUrl} alt="Front" />
                      </div>
                    </div>
                    <div className="id-image-item">
                      <span className="img-label">Mặt sau</span>
                      <div className="img-wrapper">
                        <img src={selectedSeller.identityInfo?.backImageUrl} alt="Back" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Section */}
              <div className="review-section">
                <h4 className="section-title"><FaStore /> Thông tin Kinh doanh</h4>
                <div className="review-data-card mb-20">
                  <div className="data-row">
                    <span className="label">Tên cửa hàng:</span>
                    <span className="value">{selectedSeller.shopProfile?.shopName}</span>
                  </div>
                  <div className="data-row">
                    <span className="label">Địa chỉ:</span>
                    <span className="value address">{selectedSeller.shopProfile?.shopAddress}</span>
                  </div>
                  <div className="data-row tax-row">
                    <span className="label"><FaFileInvoice /> Mã số thuế:</span>
                    <span className="value text-success">{selectedSeller.shopProfile?.taxCode || 'Không cung cấp'}</span>
                  </div>
                </div>

                {/* Bank Section */}
                <h4 className="section-title"><FaUniversity /> Tài khoản nhận tiền</h4>
                <div className="review-data-card bank-card">
                  <div className="data-row">
                    <span className="label">Ngân hàng:</span>
                    <span className="value">{selectedSeller.bankAccounts?.[0]?.bankName}</span>
                  </div>
                  <div className="data-row">
                    <span className="label">Số tài khoản:</span>
                    <span className="value mono">{selectedSeller.bankAccounts?.[0]?.accountNumber}</span>
                  </div>
                  <div className="data-row">
                    <span className="label">Chủ tài khoản:</span>
                    <span className="value uppercase">{selectedSeller.bankAccounts?.[0]?.accountHolder}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <div className="note-area">
                <label>Phản hồi cho người dùng:</label>
                <textarea 
                  placeholder="Ghi chú phản hồi (Bắt buộc nếu từ chối)..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
              <div className="button-group">
                <button className="btn-reject-modal" onClick={() => handleAction(false)} disabled={isProcessing}>
                  Từ chối
                </button>
                <button className="btn-approve-modal" onClick={() => handleAction(true)} disabled={isProcessing}>
                  Phê duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerModeration;