import React, { useState, useEffect } from 'react';
import { FaTimes, FaShieldAlt, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { adminService } from '../../services/admin.service';
import './AdminDashboard.css'; // Uses the styles we just created

interface UserPromotionModalProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    permissions?: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

const UserPromotionModal: React.FC<UserPromotionModalProps> = ({ user, onClose, onSuccess }) => {
  // 1. Map Backend Enums to User-Friendly Labels
  const availablePermissions = [
    { id: 'MANAGE_PRODUCTS', label: 'Duyệt & Quản lý Sản phẩm', desc: 'Cho phép duyệt, từ chối hoặc xóa sản phẩm của người bán.' },
    { id: 'MANAGE_CATEGORIES', label: 'Quản lý Danh mục', desc: 'Cho phép thêm mới, chỉnh sửa hoặc ẩn các danh mục hàng hóa.' },
    { id: 'MANAGE_SELLERS', label: 'Duyệt Người bán (Sellers)', desc: 'Cho phép xác minh hồ sơ và cấp quyền kinh doanh cho Shop.' },
    { id: 'VIEW_STATS', label: 'Xem Báo cáo & Doanh thu', desc: 'Truy cập vào các biểu đồ thống kê và dữ liệu kinh doanh.' },
    { id: 'CUSTOMER_SUPPORT', label: 'Hỗ trợ Khách hàng', desc: 'Cho phép trả lời hỗ trợ và quản lý khiếu nại.' }
  ];

  // 2. State Management
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initial load: If user already has permissions, check them
  useEffect(() => {
    if (user.permissions) {
      setSelectedPermissions(user.permissions);
    }
  }, [user.permissions]);

  // 3. Logic Handlers
  const handleToggle = (permId: string) => {
    setErrorMessage('');
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  const handleSubmit = async () => {
    if (selectedPermissions.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một quyền hạn để thăng cấp Admin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.promoteToAdmin(user.id, selectedPermissions);
      onSuccess(); // Triggers table refresh in AdminUsers.tsx
    } catch (error: any) {
      console.error("Promotion Error:", error);
      setErrorMessage(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật quyền hạn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content promotion-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="header-title">
            <FaShieldAlt className="header-icon-shield" />
            <div>
              <h3>Phân quyền Admin</h3>
              <p className="user-target">Cấp quyền cho: <strong>{user.fullName}</strong></p>
            </div>
          </div>
          <button className="close-x-btn" onClick={onClose}><FaTimes /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="permission-notice">
            <FaInfoCircle />
            <span>Người dùng này sẽ được cấp vai trò <strong>ADMIN</strong> cùng với các quyền hạn cụ thể bên dưới.</span>
          </div>

          {errorMessage && <div className="modal-error-alert">{errorMessage}</div>}

          <div className="permission-list-scroll">
            {availablePermissions.map((perm) => (
              <label 
                key={perm.id} 
                className={`permission-card ${selectedPermissions.includes(perm.id) ? 'selected' : ''}`}
              >
                <div className="perm-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => handleToggle(perm.id)}
                  />
                  <div className="custom-checkbox">
                    {selectedPermissions.includes(perm.id) && <FaCheckCircle />}
                  </div>
                </div>
                <div className="perm-text">
                  <span className="perm-label">{perm.label}</span>
                  <span className="perm-desc">{perm.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Hủy bỏ
          </button>
          <button 
            className="btn-confirm-promotion" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận cấp quyền'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserPromotionModal;